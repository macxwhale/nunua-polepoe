#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const inputPath = process.argv[2];
const outputPath = process.argv[3];

if (!inputPath || !outputPath) {
  console.error('Usage: node ua-arch-analyze.js <input.json> <output.json>');
  process.exit(1);
}

let input;
try {
  input = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
} catch (e) {
  console.error('Failed to read/parse input:', e.message);
  process.exit(1);
}

const { fileNodes, importEdges, allEdges } = input;

// A. Directory Grouping
function getFilePath(node) {
  return node.filePath || node.id.replace(/^[^:]+:/, '');
}

const allPaths = fileNodes.map(n => getFilePath(n));

// Find common prefix
function commonPrefix(paths) {
  if (!paths.length) return '';
  const parts = paths.map(p => p.split('/'));
  const minLen = Math.min(...parts.map(p => p.length));
  let prefix = [];
  for (let i = 0; i < minLen - 1; i++) {
    const seg = parts[0][i];
    if (parts.every(p => p[i] === seg)) {
      prefix.push(seg);
    } else {
      break;
    }
  }
  return prefix.join('/');
}

const commonPfx = commonPrefix(allPaths);
const prefixSegCount = commonPfx ? commonPfx.split('/').length : 0;

function getGroupKey(filePath) {
  const parts = filePath.split('/');
  const remaining = parts.slice(prefixSegCount);
  if (remaining.length === 0) return 'root';
  if (remaining.length === 1) return 'root';
  return remaining[0];
}

const directoryGroups = {};
for (const node of fileNodes) {
  const fp = getFilePath(node);
  const group = getGroupKey(fp);
  if (!directoryGroups[group]) directoryGroups[group] = [];
  directoryGroups[group].push(node.id);
}

// B. Node Type Grouping
const nodeTypeGroups = {};
for (const node of fileNodes) {
  const t = node.type || 'file';
  if (!nodeTypeGroups[t]) nodeTypeGroups[t] = [];
  nodeTypeGroups[t].push(node.id);
}

// C. Import adjacency + fan-in/fan-out
const fileNodeIds = new Set(fileNodes.map(n => n.id));
const fanIn = {};
const fanOut = {};
for (const node of fileNodes) {
  fanIn[node.id] = 0;
  fanOut[node.id] = 0;
}

const importEdgesFiltered = importEdges.filter(e => fileNodeIds.has(e.source) && fileNodeIds.has(e.target));
for (const edge of importEdgesFiltered) {
  fanOut[edge.source] = (fanOut[edge.source] || 0) + 1;
  fanIn[edge.target] = (fanIn[edge.target] || 0) + 1;
}

// Map node id to group
const nodeToGroup = {};
for (const [group, ids] of Object.entries(directoryGroups)) {
  for (const id of ids) {
    nodeToGroup[id] = group;
  }
}

// E. Inter-group import frequency
const interGroupImportsMap = {};
for (const edge of importEdgesFiltered) {
  const fromGroup = nodeToGroup[edge.source];
  const toGroup = nodeToGroup[edge.target];
  if (fromGroup && toGroup && fromGroup !== toGroup) {
    const key = `${fromGroup}|||${toGroup}`;
    interGroupImportsMap[key] = (interGroupImportsMap[key] || 0) + 1;
  }
}
const interGroupImports = Object.entries(interGroupImportsMap).map(([key, count]) => {
  const [from, to] = key.split('|||');
  return { from, to, count };
}).sort((a, b) => b.count - a.count);

// F. Intra-group import density
const intraGroupDensity = {};
for (const group of Object.keys(directoryGroups)) {
  const groupIds = new Set(directoryGroups[group]);
  let internalEdges = 0;
  let totalEdges = 0;
  for (const edge of importEdgesFiltered) {
    const srcInGroup = groupIds.has(edge.source);
    const tgtInGroup = groupIds.has(edge.target);
    if (srcInGroup || tgtInGroup) {
      totalEdges++;
      if (srcInGroup && tgtInGroup) internalEdges++;
    }
  }
  intraGroupDensity[group] = {
    internalEdges,
    totalEdges,
    density: totalEdges > 0 ? internalEdges / totalEdges : 0
  };
}

// G. Directory Pattern Matching
const dirPatterns = {
  routes: 'api', api: 'api', controllers: 'api', endpoints: 'api', handlers: 'api',
  services: 'service', core: 'service', lib: 'utility', domain: 'service', logic: 'service',
  models: 'data', db: 'data', data: 'data', persistence: 'data', repository: 'data', entities: 'data',
  components: 'ui', views: 'ui', pages: 'ui', ui: 'ui', layouts: 'ui', screens: 'ui',
  middleware: 'middleware', plugins: 'middleware', interceptors: 'middleware', guards: 'middleware',
  utils: 'utility', helpers: 'utility', common: 'utility', shared: 'utility', tools: 'utility',
  config: 'config', constants: 'config', env: 'config', settings: 'config',
  '__tests__': 'test', test: 'test', tests: 'test', spec: 'test', specs: 'test',
  types: 'types', interfaces: 'types', schemas: 'types', contracts: 'types', dtos: 'types',
  hooks: 'hooks', store: 'state', state: 'state', reducers: 'state', actions: 'state', slices: 'state',
  assets: 'assets', static: 'assets', public: 'assets',
  migrations: 'data', docs: 'documentation', documentation: 'documentation',
  deploy: 'infrastructure', infra: 'infrastructure', infrastructure: 'infrastructure',
  '.github': 'ci-cd', '.gitlab': 'ci-cd', '.circleci': 'ci-cd',
  k8s: 'infrastructure', kubernetes: 'infrastructure', helm: 'infrastructure',
  terraform: 'infrastructure', docker: 'infrastructure',
  sql: 'data', database: 'data', schema: 'data',
  integrations: 'service', supabase: 'service', contexts: 'service',
  cmd: 'entry', bin: 'entry',
};

const patternMatches = {};
for (const group of Object.keys(directoryGroups)) {
  patternMatches[group] = dirPatterns[group.toLowerCase()] || 'unknown';
}

// H. Deployment topology detection
const allFilePaths = fileNodes.map(n => getFilePath(n));
const deploymentTopology = {
  hasDockerfile: allFilePaths.some(p => /Dockerfile/.test(p)),
  hasCompose: allFilePaths.some(p => /docker-compose/.test(p)),
  hasK8s: allFilePaths.some(p => /k8s|kubernetes|\.yaml$/.test(p)),
  hasTerraform: allFilePaths.some(p => /\.tf$/.test(p)),
  hasCI: allFilePaths.some(p => /\.github|\.gitlab|Jenkinsfile/.test(p)),
  infraFiles: allFilePaths.filter(p => /Dockerfile|docker-compose|\.github|\.gitlab|Jenkinsfile|\.tf$|vercel\.json/.test(p))
};

// I. Data pipeline detection
const dataPipeline = {
  schemaFiles: allFilePaths.filter(p => /\.graphql$|\.gql$|\.proto$|schema\.sql/.test(p)),
  migrationFiles: allFilePaths.filter(p => /migrations\//.test(p)),
  dataModelFiles: allFilePaths.filter(p => /models\/|entities\//.test(p)),
  apiHandlerFiles: allFilePaths.filter(p => /api\/|routes\/|controllers\//.test(p))
};

// J. Documentation coverage
const docFiles = allFilePaths.filter(p => /\.md$|\.rst$/.test(p));
const groupsWithDocs = new Set();
for (const docPath of docFiles) {
  const group = getGroupKey(docPath);
  groupsWithDocs.add(group);
}
const allGroups = Object.keys(directoryGroups);
const docCoverage = {
  groupsWithDocs: groupsWithDocs.size,
  totalGroups: allGroups.length,
  coverageRatio: allGroups.length > 0 ? groupsWithDocs.size / allGroups.length : 0,
  undocumentedGroups: allGroups.filter(g => !groupsWithDocs.has(g))
};

// K. Dependency direction
const dependencyDirection = [];
const groupImportCounts = {};
for (const edge of importEdgesFiltered) {
  const fromGroup = nodeToGroup[edge.source];
  const toGroup = nodeToGroup[edge.target];
  if (fromGroup && toGroup && fromGroup !== toGroup) {
    const fwd = `${fromGroup}|||${toGroup}`;
    const bwd = `${toGroup}|||${fromGroup}`;
    groupImportCounts[fwd] = (groupImportCounts[fwd] || 0) + 1;
  }
}
const processed = new Set();
for (const [key, count] of Object.entries(groupImportCounts)) {
  const [a, b] = key.split('|||');
  const pairKey = [a, b].sort().join('|||');
  if (!processed.has(pairKey)) {
    processed.add(pairKey);
    const reverseCount = groupImportCounts[`${b}|||${a}`] || 0;
    if (count > reverseCount) {
      dependencyDirection.push({ dependent: a, dependsOn: b });
    } else if (reverseCount > count) {
      dependencyDirection.push({ dependent: b, dependsOn: a });
    }
  }
}

// D. Cross-category dependency analysis
const crossCategoryEdgesMap = {};
for (const edge of allEdges) {
  const srcNode = fileNodes.find(n => n.id === edge.source);
  const tgtNode = fileNodes.find(n => n.id === edge.target);
  if (srcNode && tgtNode) {
    const key = `${srcNode.type}|||${tgtNode.type}|||${edge.type}`;
    crossCategoryEdgesMap[key] = (crossCategoryEdgesMap[key] || 0) + 1;
  }
}
const crossCategoryEdges = Object.entries(crossCategoryEdgesMap).map(([key, count]) => {
  const [fromType, toType, edgeType] = key.split('|||');
  return { fromType, toType, edgeType, count };
});

// File stats
const filesPerGroup = {};
for (const [group, ids] of Object.entries(directoryGroups)) {
  filesPerGroup[group] = ids.length;
}
const nodeTypeCounts = {};
for (const node of fileNodes) {
  const t = node.type || 'file';
  nodeTypeCounts[t] = (nodeTypeCounts[t] || 0) + 1;
}

const fileFanIn = {};
const fileFanOut = {};
for (const node of fileNodes) {
  if (fanIn[node.id] > 3) fileFanIn[node.id] = fanIn[node.id];
  if (fanOut[node.id] > 3) fileFanOut[node.id] = fanOut[node.id];
}

const output = {
  scriptCompleted: true,
  directoryGroups,
  nodeTypeGroups,
  crossCategoryEdges,
  interGroupImports,
  intraGroupDensity,
  patternMatches,
  deploymentTopology,
  dataPipeline,
  docCoverage,
  dependencyDirection,
  fileStats: {
    totalFileNodes: fileNodes.length,
    filesPerGroup,
    nodeTypeCounts
  },
  fileFanIn,
  fileFanOut
};

try {
  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
  console.log('Analysis complete. Output written to', outputPath);
  process.exit(0);
} catch (e) {
  console.error('Failed to write output:', e.message);
  process.exit(1);
}
