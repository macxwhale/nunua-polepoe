#!/usr/bin/env node
// Tour graph analysis script
const fs = require('fs');

const inputPath = process.argv[2];
const outputPath = process.argv[3];

if (!inputPath || !outputPath) {
  console.error('Usage: node ua-tour-analyze.js <input.json> <output.json>');
  process.exit(1);
}

let data;
try {
  data = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
} catch (e) {
  console.error('Failed to parse input JSON:', e.message);
  process.exit(1);
}

const { nodes, edges, layers } = data;
const nodeMap = {};
for (const n of nodes) {
  nodeMap[n.id] = n;
}

// A. Fan-In: count edges pointing TO each node
const fanIn = {};
const fanOut = {};
for (const n of nodes) { fanIn[n.id] = 0; fanOut[n.id] = 0; }
for (const e of edges) {
  if (fanIn[e.target] !== undefined) fanIn[e.target]++;
  if (fanOut[e.source] !== undefined) fanOut[e.source]++;
}

const fanInRanking = Object.entries(fanIn)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 20)
  .map(([id, count]) => ({ id, fanIn: count, name: nodeMap[id]?.name || id }));

const fanOutRanking = Object.entries(fanOut)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 20)
  .map(([id, count]) => ({ id, fanOut: count, name: nodeMap[id]?.name || id }));

// Compute top 10% fan-out threshold
const fanOutValues = Object.values(fanOut).sort((a, b) => b - a);
const top10pct = fanOutValues[Math.floor(fanOutValues.length * 0.1)] || 0;
const bottom25pct = fanInValues => {
  const sorted = [...fanInValues].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length * 0.25)] || 0;
};
const fanInValues = Object.values(fanIn);
const fanInBottom25 = bottom25pct(fanInValues);

// Entry point patterns
const codeEntryPatterns = [
  'index.ts','index.js','main.ts','main.js','app.ts','app.js',
  'server.ts','server.js','mod.rs','main.go','main.py','main.rs',
  'manage.py','app.py','wsgi.py','asgi.py','run.py','__main__.py',
  'Application.java','Main.java','Program.cs','config.ru','index.php',
  'App.swift','Application.kt','main.cpp','main.c','main.tsx','app.tsx',
  'index.tsx'
];

// C. Entry Point Candidates
const entryScores = {};
for (const n of nodes) {
  let score = 0;
  const name = n.name || '';
  const filePath = n.filePath || '';
  const type = n.type;

  if (type === 'document') {
    if (name === 'README.md' && (filePath === 'README.md' || !filePath.includes('/'))) {
      score += 5;
    } else if (name.endsWith('.md') && !filePath.includes('/')) {
      score += 2;
    }
  } else {
    // Code files
    if (codeEntryPatterns.some(p => name.toLowerCase() === p.toLowerCase())) {
      score += 3;
    }
    // Root or one-level deep
    const depth = filePath.split('/').length - 1;
    if (depth <= 1) score += 1;
    // High fan-out (top 10%)
    if (fanOut[n.id] >= top10pct) score += 1;
    // Low fan-in (bottom 25%)
    if (fanIn[n.id] <= fanInBottom25) score += 1;
  }
  entryScores[n.id] = score;
}

const entryPointCandidates = Object.entries(entryScores)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 5)
  .map(([id, score]) => ({
    id,
    score,
    name: nodeMap[id]?.name || id,
    summary: nodeMap[id]?.summary || ''
  }));

// D. BFS from top code entry point (skip docs)
const topCodeEntry = entryPointCandidates.find(e => nodeMap[e.id]?.type !== 'document');
const bfsStart = topCodeEntry ? topCodeEntry.id : null;

// Build adjacency list for imports/calls
const adj = {};
for (const n of nodes) adj[n.id] = [];
for (const e of edges) {
  if ((e.type === 'imports' || e.type === 'calls') && adj[e.source] !== undefined) {
    adj[e.source].push(e.target);
  }
}

let bfsTraversal = null;
if (bfsStart) {
  const visited = new Set();
  const queue = [[bfsStart, 0]];
  const order = [];
  const depthMap = {};
  const byDepth = {};

  while (queue.length > 0) {
    const [nodeId, depth] = queue.shift();
    if (visited.has(nodeId)) continue;
    visited.add(nodeId);
    order.push(nodeId);
    depthMap[nodeId] = depth;
    if (!byDepth[depth]) byDepth[depth] = [];
    byDepth[depth].push(nodeId);

    for (const neighbor of (adj[nodeId] || [])) {
      if (!visited.has(neighbor) && nodeMap[neighbor]) {
        queue.push([neighbor, depth + 1]);
      }
    }
  }

  bfsTraversal = { startNode: bfsStart, order, depthMap, byDepth };
}

// E. Non-Code Files
const docTypes = new Set(['document']);
const infraTypes = new Set(['service', 'pipeline', 'resource']);
const dataTypes = new Set(['table', 'schema', 'endpoint']);
const configTypes = new Set(['config']);

const nonCodeFiles = { documentation: [], infrastructure: [], data: [], config: [] };
for (const n of nodes) {
  const entry = { id: n.id, name: n.name, type: n.type, summary: n.summary || '' };
  if (docTypes.has(n.type)) nonCodeFiles.documentation.push(entry);
  else if (infraTypes.has(n.type)) nonCodeFiles.infrastructure.push(entry);
  else if (dataTypes.has(n.type)) nonCodeFiles.data.push(entry);
  else if (configTypes.has(n.type)) nonCodeFiles.config.push(entry);
}

// F. Tightly Coupled Clusters
const edgeSet = new Set();
const bidirectional = [];
for (const e of edges) {
  const key = `${e.source}|||${e.target}`;
  edgeSet.add(key);
}
const seen = new Set();
for (const e of edges) {
  const reverseKey = `${e.target}|||${e.source}`;
  const pairKey = [e.source, e.target].sort().join('|||');
  if (edgeSet.has(reverseKey) && !seen.has(pairKey)) {
    seen.add(pairKey);
    bidirectional.push([e.source, e.target]);
  }
}

// Expand clusters
const clusterMap = {};
for (const [a, b] of bidirectional) {
  const key = [a, b].sort().join('|||');
  clusterMap[key] = { nodes: new Set([a, b]), edgeCount: 2 };
}

// Count edges within each cluster and expand
const clusters = Object.values(clusterMap).map(c => {
  const nodeList = [...c.nodes];
  let edgeCount = 0;
  for (const e of edges) {
    if (c.nodes.has(e.source) && c.nodes.has(e.target)) edgeCount++;
  }
  return { nodes: nodeList, edgeCount };
}).sort((a, b) => b.edgeCount - a.edgeCount).slice(0, 10);

// G. Layer List
const layerInfo = {
  count: layers.length,
  list: layers.map(l => ({ id: l.id, name: l.name, description: l.description }))
};

// H. Node Summary Index
const nodeSummaryIndex = {};
for (const n of nodes) {
  nodeSummaryIndex[n.id] = { name: n.name, type: n.type, summary: n.summary || '' };
}

const result = {
  scriptCompleted: true,
  entryPointCandidates,
  fanInRanking,
  fanOutRanking,
  bfsTraversal,
  nonCodeFiles,
  clusters,
  layers: layerInfo,
  nodeSummaryIndex,
  totalNodes: nodes.length,
  totalEdges: edges.length
};

try {
  fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
  console.log(`Analysis complete. Written to ${outputPath}`);
  process.exit(0);
} catch (e) {
  console.error('Failed to write output:', e.message);
  process.exit(1);
}
