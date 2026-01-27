import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    Activity,
    AlertCircle,
    ArrowUpRight,
    Building2,
    CheckCircle2,
    CreditCard,
    FileText,
    Loader2,
    Package,
    Power,
    PowerOff,
    Search,
    ShieldAlert,
    TrendingUp,
    Users
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const SuperAdmin = () => {
    const queryClient = useQueryClient();
    const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");

    // 1. Fetch ALL tenants (Platform Infrastructure)
    const { data: tenants, isLoading: tenantsLoading, error: tenantsError } = useQuery({
        queryKey: ["tenants-all"],
        queryFn: async () => {
            console.log("SuperAdmin Sync: Checking business nodes...");
            const { data, error } = await supabase
                .from("tenants")
                .select("*")
                .order("created_at", { ascending: false });

            if (error) {
                console.error("SuperAdmin Sync Error:", error);
                throw error;
            }
            return data as any[];
        },
    });

    // 2. Fetch Global Revenue Metrics
    const { data: globalStats, isLoading: statsLoading } = useQuery({
        queryKey: ["global-stats"],
        queryFn: async () => {
            const { data: txs, error } = await supabase
                .from("transactions")
                .select("amount, type")
                .eq("type", "payment");

            if (error) {
                console.warn("Global Stats restricted:", error);
                return { totalRevenue: 0, txCount: 0 };
            }

            const totalRevenue = txs.reduce((acc, tx) => acc + Number(tx.amount), 0);
            return { totalRevenue, txCount: txs.length };
        },
    });

    // 3. Drilldown Logic (Fetched only on selection)
    const { data: tenantDetails, isLoading: detailsLoading } = useQuery({
        queryKey: ["tenant-details", selectedTenantId],
        queryFn: async () => {
            if (!selectedTenantId) return null;

            console.log(`SuperAdmin Sync: Auditing business [${selectedTenantId}]`);

            const [profiles, clientsRes, products, invoices, transactions] = await Promise.all([
                supabase.from("profiles").select(`*, user_roles!inner(role)`).eq("tenant_id", selectedTenantId),
                supabase.from("clients").select("*").eq("tenant_id", selectedTenantId),
                supabase.from("products").select("id", { count: "exact", head: true }).eq("tenant_id", selectedTenantId),
                supabase.from("invoices").select("id", { count: "exact", head: true }).eq("tenant_id", selectedTenantId),
                supabase.from("transactions").select("amount, type").eq("tenant_id", selectedTenantId)
            ]);

            const revenue = transactions.data
                ?.filter(t => t.type === 'payment')
                .reduce((acc, t) => acc + Number(t.amount), 0) || 0;

            return {
                profiles: (profiles.data || []) as any[],
                clients: (clientsRes.data || []) as any[],
                stats: {
                    clients: clientsRes.data?.length || 0,
                    products: products.count || 0,
                    invoices: invoices.count || 0,
                    revenue
                }
            };
        },
        enabled: !!selectedTenantId
    });

    const toggleMutation = useMutation({
        mutationFn: async ({ id, is_active }: { id: string, is_active: boolean }) => {
            const { error } = await (supabase.from("tenants") as any).update({ is_active }).eq("id", id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["tenants-all"] });
            toast.success("Identity state modified");
        },
        onError: (error: any) => toast.error(`Handshake failed: ${error.message}`)
    });

    const tierMutation = useMutation({
        mutationFn: async ({ id, subscription_tier }: { id: string, subscription_tier: string }) => {
            const { error } = await (supabase.from("tenants") as any).update({ subscription_tier }).eq("id", id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["tenants-all"] });
            toast.success("Subscription tier updated");
        },
        onError: (error: any) => toast.error(`Update failed: ${error.message}`)
    });

    if (tenantsLoading || statsLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[500px] gap-8 animate-in fade-in duration-1000">
                <div className="relative h-16 w-16">
                    <div className="absolute inset-0 bg-primary/10 rounded-full blur-2xl animate-pulse" />
                    <Loader2 className="h-full w-full animate-spin text-primary relative z-10 opacity-60" />
                </div>
                <div className="space-y-2 text-center">
                    <p className="text-xl font-bold tracking-tight text-slate-900">Synchronizing Global Analytics</p>
                    <p className="text-sm font-medium text-slate-400 animate-pulse tracking-tight letters-spacing-tight">Establishing secure infrastructure tunnel...</p>
                </div>
            </div>
        );
    }

    if (tenantsError) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[500px] gap-8 text-center p-12 bg-white rounded-[40px] border border-border animate-in fade-in zoom-in duration-500 shadow-xl shadow-slate-200/50">
                <div className="p-6 bg-destructive text-white rounded-[32px] shadow-2xl shadow-destructive/40 transition-transform hover:scale-105">
                    <ShieldAlert className="h-10 w-10" />
                </div>
                <div className="space-y-3">
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">Federation Context Failed</h2>
                    <p className="text-slate-500 font-medium text-sm max-w-sm mx-auto leading-relaxed">
                        The security handshake was terminated by the API. This usually indicates a role-based permission mismatch.
                    </p>
                    <div className="mt-8 p-6 bg-slate-50 rounded-3xl border border-border text-left backdrop-blur-sm group">
                        <div className="flex items-center gap-2 mb-3">
                            <AlertCircle className="h-3.5 w-3.5 text-destructive" />
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">System Diagnostic Code</p>
                        </div>
                        <code className="text-xs font-mono text-destructive block bg-white p-4 rounded-xl border border-border break-all select-all shadow-inner">
                            {(tenantsError as any).message || "CORE_ACCESS_TIMEOUT"}
                        </code>
                    </div>
                </div>
                <Button
                    variant="outline"
                    onClick={() => window.location.reload()}
                    className="h-14 px-10 rounded-2xl border-border text-slate-600 bg-white hover:bg-slate-50 font-bold transition-all shadow-sm active:scale-95"
                >
                    Retry Protocol Sync
                </Button>
            </div>
        );
    }

    const filteredTenants = tenants?.filter(t => {
        const query = searchQuery.toLowerCase();
        return (t.business_name?.toLowerCase().includes(query) || t.id?.toLowerCase().includes(query));
    }) || [];

    const activeTenantsCount = tenants?.filter(t => t.is_active).length || 0;

    return (
        <div className="space-y-10 animate-in fade-in duration-700 max-w-[1600px] mx-auto">
            <div className="flex flex-col gap-2">
                <div className="flex items-center gap-3">
                    <h1 className="text-4xl font-black tracking-tighter text-slate-900">Platform Analytics</h1>
                    <Badge className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 transition-colors font-bold px-3 py-1 text-xs">Internal Access</Badge>
                </div>
                <p className="text-slate-500 font-medium ml-1 flex items-center gap-2.5">
                    Global infrastructure oversight and strategic tenant management
                </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {[
                    { label: 'Platform Revenue', val: `KES ${globalStats?.totalRevenue.toLocaleString()}`, icon: TrendingUp, color: 'text-primary', bg: 'bg-primary/5', border: 'border-primary/20' },
                    { label: 'Active Businesses', val: activeTenantsCount, icon: Building2, color: 'text-primary', bg: 'bg-primary/5', border: 'border-primary/20' },
                    { label: 'System Tx Load', val: globalStats?.txCount.toLocaleString(), icon: Activity, color: 'text-slate-600', bg: 'bg-slate-100/50', border: 'border-slate-200' },
                    { label: 'Avg Business yield', val: `KES ${(globalStats && activeTenantsCount > 0 ? (globalStats.totalRevenue / activeTenantsCount) : 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`, icon: CreditCard, color: 'text-slate-600', bg: 'bg-slate-100/50', border: 'border-slate-200' }
                ].map((stat, i) => (
                    <Card key={i} className={`border-none shadow-sm transition-all hover:shadow-md ${stat.bg} ${stat.border}`}>
                        <CardHeader className="flex flex-row items-center justify-between pb-3">
                            <CardTitle className="text-[10px] font-black tracking-widest uppercase opacity-60 text-slate-500">{stat.label}</CardTitle>
                            <stat.icon className={`h-4 w-4 ${stat.color} opacity-80`} />
                        </CardHeader>
                        <CardContent>
                            <div className={`text-3xl font-black tracking-tighter ${stat.color === 'text-primary' ? 'text-primary' : 'text-slate-900'}`}>{stat.val}</div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Card className="border-border/40 shadow-sm overflow-hidden rounded-[32px] border-b-4">
                <CardHeader className="bg-white border-b border-border/40 py-8 px-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-primary/10 rounded-2xl border border-primary/20">
                                <Building2 className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <CardTitle className="text-xl font-black tracking-tight text-slate-900">Strategic Infrastructure</CardTitle>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{tenants?.length || 0} Business Nodes Onboarded</p>
                            </div>
                        </div>
                        <div className="relative w-full md:w-96">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder="Search via Identifier..."
                                className="pl-12 h-14 bg-slate-50/50 border-border rounded-[20px] font-bold text-slate-700 focus-visible:ring-primary/20"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-slate-50/30">
                            <TableRow className="border-slate-100">
                                <TableHead className="font-black text-[10px] uppercase tracking-widest py-6 pl-10 text-slate-500">Business Identity</TableHead>
                                <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-500">Subscription Tier</TableHead>
                                <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-500">Node Status</TableHead>
                                <TableHead className="text-right font-black text-[10px] uppercase tracking-widest pr-10 text-slate-500">Governance Control</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredTenants.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="py-24 text-center">
                                        <div className="flex flex-col items-center gap-3 opacity-20">
                                            <Search className="h-10 w-10" />
                                            <p className="font-bold">Protocol found no matching infrastructure nodes.</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : filteredTenants.map((tenant) => (
                                <TableRow key={tenant.id} className="hover:bg-primary/[0.02] transition-colors border-slate-100">
                                    <TableCell className="font-bold text-slate-800 py-8 pl-10">
                                        <div className="flex flex-col">
                                            <span className="text-base tracking-tight mb-1">{tenant.business_name || "Unknown Entity"}</span>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">ID: {tenant.id?.slice(0, 8)}</span>
                                                <div className="h-1 w-1 rounded-full bg-slate-200" />
                                                <span className="text-[11px] font-bold text-slate-400">{tenant.phone_number}</span>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="w-[180px]">
                                            <Select
                                                defaultValue={tenant.subscription_tier || 'monthly'}
                                                onValueChange={(val) => tierMutation.mutate({ id: tenant.id, subscription_tier: val })}
                                                disabled={tierMutation.isPending}
                                            >
                                                <SelectTrigger className="h-10 bg-white border-slate-200 font-bold text-[10px] uppercase tracking-widest rounded-xl focus:ring-primary/20">
                                                    <SelectValue placeholder="Select Tier" />
                                                </SelectTrigger>
                                                <SelectContent className="rounded-xl border-slate-100 shadow-xl">
                                                    <SelectItem value="monthly" className="text-xs font-bold uppercase tracking-widest py-3">Monthly Plan</SelectItem>
                                                    <SelectItem value="semi-annual" className="text-xs font-bold uppercase tracking-widest py-3">6-Month Plan</SelectItem>
                                                    <SelectItem value="annual" className="text-xs font-bold uppercase tracking-widest py-3">Annual Plan</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2.5">
                                            <div className={`h-2.5 w-2.5 rounded-full ${tenant.is_active ? 'bg-primary shadow-[0_0_8px_rgba(16,185,129,0.3)]' : 'bg-slate-300'} transition-all`} />
                                            <span className={`text-[10px] font-black uppercase tracking-widest ${tenant.is_active ? 'text-primary' : 'text-slate-400'}`}>
                                                {tenant.is_active ? 'Active' : 'Suspended'}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right pr-10">
                                        <div className="flex items-center justify-end gap-3">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="h-10 px-6 rounded-xl font-bold text-xs gap-2 border-border hover:bg-primary/5 hover:text-primary transition-all active:scale-95 shadow-sm"
                                                onClick={() => setSelectedTenantId(tenant.id)}
                                            >
                                                Audit
                                                <ArrowUpRight className="h-3.5 w-3.5" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => toggleMutation.mutate({ id: tenant.id, is_active: !tenant.is_active })}
                                                disabled={toggleMutation.isPending}
                                                className={`h-10 w-10 rounded-xl transition-all border border-transparent hover:border-slate-100 ${tenant.is_active ? "text-destructive hover:bg-destructive/10" : "text-primary hover:bg-primary/10"} active:scale-90`}
                                            >
                                                {tenant.is_active ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Dialog open={!!selectedTenantId} onOpenChange={(open) => !open && setSelectedTenantId(null)}>
                <DialogContent className="max-w-5xl max-h-[95vh] p-0 overflow-hidden flex flex-col border-none shadow-3xl rounded-[32px]">
                    <DialogHeader className="p-10 border-b border-border bg-white rounded-t-[32px]">
                        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-8">
                            <div className="space-y-3">
                                <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary text-[10px] font-black uppercase tracking-[0.2em] rounded-full border border-primary/20">
                                    Infrastructure Audit
                                </div>
                                <DialogTitle className="text-4xl font-black tracking-tighter flex items-center gap-5">
                                    <div className="p-3.5 bg-primary/10 rounded-2xl border border-primary/20">
                                        <Building2 className="h-8 w-8 text-primary" />
                                    </div>
                                    <span className="text-slate-900">{tenants?.find(t => t.id === selectedTenantId)?.business_name}</span>
                                </DialogTitle>
                            </div>
                            <div className="flex flex-col items-end gap-1.5">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest opacity-60">System Identity Token</span>
                                <Badge variant="outline" className="text-slate-500 border-border bg-slate-50 font-bold px-3 py-1.5 rounded-xl text-xs tracking-tight">
                                    {selectedTenantId}
                                </Badge>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="flex-1 overflow-hidden bg-white">
                        <ScrollArea className="h-full">
                            <div className="p-10 space-y-12">
                                {/* Aggregated Stats Grid */}
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                    {[
                                        { label: 'Network Clients', val: tenantDetails?.stats.clients, icon: Users, color: 'text-primary' },
                                        { label: 'Products', val: tenantDetails?.stats.products, icon: Package, color: 'text-slate-600' },
                                        { label: 'Invoices', val: tenantDetails?.stats.invoices, icon: FileText, color: 'text-slate-600' },
                                        { label: 'Yield (KES)', val: tenantDetails?.stats.revenue.toLocaleString(), icon: TrendingUp, color: 'text-primary' }
                                    ].map((stat, i) => (
                                        <div key={i} className="p-6 rounded-2xl bg-white border border-border shadow-sm transition-all hover:border-primary/20 hover:shadow-md group">
                                            <div className="flex items-center gap-3 mb-4">
                                                <div className={`p-2 rounded-xl bg-slate-50 group-hover:bg-primary/5 transition-colors ${stat.color}`}>
                                                    <stat.icon className="h-4 w-4" />
                                                </div>
                                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{stat.label}</span>
                                            </div>
                                            <div className={`text-2xl font-black tracking-tighter ${stat.color === 'text-primary' ? 'text-primary' : 'text-slate-900'}`}>
                                                {detailsLoading ? <Loader2 className="h-5 w-5 animate-spin text-slate-200" /> : stat.val ?? '0'}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <Separator className="opacity-60" />

                                {/* Detailed Data Tabs */}
                                <Tabs defaultValue="personnel" className="w-full">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                                        <TabsList className="bg-slate-100/60 p-1.5 rounded-2xl border border-border inline-flex w-fit">
                                            <TabsTrigger value="personnel" className="rounded-xl px-6 py-2.5 text-xs font-black uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-primary transition-all">Authorized Staff</TabsTrigger>
                                            <TabsTrigger value="clients" className="rounded-xl px-6 py-2.5 text-xs font-black uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-primary transition-all">Client Directory</TabsTrigger>
                                        </TabsList>
                                        <div className="flex items-center gap-2 text-slate-400 font-bold text-[9px] tracking-widest uppercase px-3 py-1.5 bg-slate-50 border border-border rounded-full">
                                            <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                                            Data Stream Verified
                                        </div>
                                    </div>

                                    <TabsContent value="personnel" className="animate-in slide-in-from-bottom-2 duration-500">
                                        <div className="border border-border rounded-2xl overflow-hidden bg-white shadow-sm">
                                            <Table>
                                                <TableHeader className="bg-slate-50/50">
                                                    <TableRow className="border-slate-100">
                                                        <TableHead className="font-black text-[10px] uppercase tracking-widest py-5 pl-8 text-slate-400">Identity</TableHead>
                                                        <TableHead className="font-black text-[10px] uppercase tracking-widest text-center text-slate-400">Clearance</TableHead>
                                                        <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400 text-center">Contact</TableHead>
                                                        <TableHead className="font-black text-[10px] uppercase tracking-widest pr-8 text-right text-slate-400">Status</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {detailsLoading ? (
                                                        <TableRow><TableCell colSpan={4} className="py-24 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto text-primary opacity-10" /></TableCell></TableRow>
                                                    ) : tenantDetails?.profiles.length === 0 ? (
                                                        <TableRow><TableCell colSpan={4} className="py-16 text-center font-bold text-slate-300 text-sm italic">Operational personnel unlisted.</TableCell></TableRow>
                                                    ) : (
                                                        tenantDetails?.profiles.map((profile: any) => (
                                                            <TableRow key={profile.id} className="hover:bg-slate-50/30 transition-colors border-slate-50 group">
                                                                <TableCell className="py-6 pl-8">
                                                                    <div className="flex items-center gap-4">
                                                                        <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center font-black text-slate-600 text-sm border border-slate-200 group-hover:bg-primary group-hover:text-white group-hover:border-primary transition-all">
                                                                            {profile.full_name?.charAt(0) || "A"}
                                                                        </div>
                                                                        <div className="flex flex-col">
                                                                            <p className="font-black text-slate-900 text-sm tracking-tight">{profile.full_name}</p>
                                                                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest opacity-60">ID: {profile.user_id?.slice(0, 8)}</p>
                                                                        </div>
                                                                    </div>
                                                                </TableCell>
                                                                <TableCell className="text-center">
                                                                    <div className="flex justify-center flex-wrap gap-1">
                                                                        {profile.user_roles?.map((ur: any, idx: number) => (
                                                                            <Badge key={idx} className="text-[9px] font-black uppercase tracking-tighter bg-slate-100 text-slate-600 border-none px-2 py-0">
                                                                                {ur.role}
                                                                            </Badge>
                                                                        )) || <Badge variant="outline" className="text-[9px] opacity-30">pending</Badge>}
                                                                    </div>
                                                                </TableCell>
                                                                <TableCell className="text-center">
                                                                    <p className="text-xs font-bold text-slate-500">{profile.phone_number}</p>
                                                                </TableCell>
                                                                <TableCell className="text-right pr-8">
                                                                    <div className="flex items-center justify-end gap-2 text-primary text-[9px] font-black uppercase tracking-widest">
                                                                        Active
                                                                        <CheckCircle2 className="h-3 w-3" />
                                                                    </div>
                                                                </TableCell>
                                                            </TableRow>
                                                        ))
                                                    )}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    </TabsContent>

                                    <TabsContent value="clients" className="animate-in slide-in-from-bottom-2 duration-500">
                                        <div className="border border-border rounded-2xl overflow-hidden bg-white shadow-sm">
                                            <Table>
                                                <TableHeader className="bg-slate-50/50">
                                                    <TableRow className="border-slate-100">
                                                        <TableHead className="font-black text-[10px] uppercase tracking-widest py-5 pl-8 text-slate-400">Client Node</TableHead>
                                                        <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400 text-center">Identity</TableHead>
                                                        <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-400 text-center">Liability State</TableHead>
                                                        <TableHead className="font-black text-[10px] uppercase tracking-widest pr-8 text-right text-slate-400">Protocol</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {detailsLoading ? (
                                                        <TableRow><TableCell colSpan={4} className="py-24 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto text-primary opacity-10" /></TableCell></TableRow>
                                                    ) : tenantDetails?.clients.length === 0 ? (
                                                        <TableRow><TableCell colSpan={4} className="py-16 text-center font-bold text-slate-300 text-sm italic">Infrastructure contains no linked client nodes.</TableCell></TableRow>
                                                    ) : (
                                                        tenantDetails?.clients.map((client: any) => (
                                                            <TableRow key={client.id} className="hover:bg-slate-50/30 transition-colors border-slate-50 group">
                                                                <TableCell className="py-6 pl-8">
                                                                    <div className="flex flex-col">
                                                                        <p className="font-black text-slate-900 text-sm">{client.name}</p>
                                                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest opacity-60">ID: {client.id?.slice(0, 8)}</p>
                                                                    </div>
                                                                </TableCell>
                                                                <TableCell className="text-center">
                                                                    <div className="flex flex-col gap-0.5 items-center">
                                                                        <p className="text-xs font-bold text-slate-600">{client.phone_number || "---"}</p>
                                                                        <p className="text-[9px] font-medium text-slate-400">{client.email || "untracked"}</p>
                                                                    </div>
                                                                </TableCell>
                                                                <TableCell className="text-center">
                                                                    <div className="flex flex-col gap-0.5 items-center">
                                                                        <p className={`text-sm font-black ${Number(client.total_balance) > 0 ? 'text-orange-500' : 'text-primary'}`}>
                                                                            KES {Number(client.total_balance).toLocaleString()}
                                                                        </p>
                                                                        <p className="text-[8px] font-black uppercase text-slate-300 tracking-tighter">Outstanding Balance</p>
                                                                    </div>
                                                                </TableCell>
                                                                <TableCell className="text-right pr-8">
                                                                    <Badge variant="outline" className={`font-black uppercase text-[8px] tracking-widest border-slate-200 text-slate-400 px-2 py-0 bg-white`}>
                                                                        {client.status || "unlisted"}
                                                                    </Badge>
                                                                </TableCell>
                                                            </TableRow>
                                                        ))
                                                    )}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    </TabsContent>
                                </Tabs>
                            </div>
                        </ScrollArea>
                    </div>

                    <div className="p-8 bg-slate-50/50 border-t border-border flex justify-end">
                        <Button variant="ghost" className="font-black text-[10px] uppercase tracking-widest text-slate-400 hover:text-slate-900 hover:bg-slate-100 px-8 h-12 rounded-2xl transition-all" onClick={() => setSelectedTenantId(null)}>
                            Close Audit Review
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default SuperAdmin;
