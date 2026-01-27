import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import {
    Activity,
    ArrowUpRight,
    Building2,
    CreditCard,
    Loader2,
    ShieldCheck,
    TrendingUp,
    Users,
    Zap
} from "lucide-react";

const SuperAdmin = () => {
    const { data: globalStats, isLoading: statsLoading } = useQuery({
        queryKey: ["global-platform-stats"],
        queryFn: async () => {
            const [tenants, txs, clients] = await Promise.all([
                supabase.from("tenants").select("id, is_active"),
                supabase.from("transactions").select("amount, type").eq("type", "payment"),
                supabase.from("clients").select("id", { count: 'exact', head: true })
            ]);

            const activeTenants = tenants.data?.filter(t => t.is_active).length || 0;
            const totalRevenue = txs.data?.reduce((acc, tx) => acc + Number(tx.amount), 0) || 0;

            return {
                totalTenants: tenants.data?.length || 0,
                activeTenants,
                totalRevenue,
                txCount: txs.data?.length || 0,
                totalClients: clients.count || 0
            };
        },
    });

    if (statsLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[500px] gap-8 animate-in fade-in duration-1000">
                <Loader2 className="h-12 w-12 animate-spin text-primary opacity-60" />
                <p className="text-xl font-bold text-foreground tracking-tight">Intelligence Stream Synchronizing...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-700 max-w-[1600px] mx-auto pb-10">
            {/* Platform Header */}
            <div>
                <div className="flex items-center gap-3">
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Global Intelligence</h1>
                    <Badge className="bg-primary/10 text-primary border-primary/20 font-bold px-3 py-1 text-xs uppercase tracking-widest">Master Protocol</Badge>
                </div>
                <p className="text-muted-foreground mt-1">Real-time infrastructure performance and revenue flow analysis</p>
            </div>

            {/* Core Metrics Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="bg-primary border-0 shadow-lg hover:shadow-xl transition-all rounded-2xl overflow-hidden">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 pt-6 px-6">
                        <CardTitle className="text-[10px] font-black tracking-[0.2em] uppercase text-primary-foreground/70">Cumulative Revenue</CardTitle>
                        <TrendingUp className="h-4 w-4 text-primary-foreground/70" />
                    </CardHeader>
                    <CardContent className="pb-6 px-6">
                        <div className="text-2xl font-bold text-primary-foreground tracking-tight">
                            KES {globalStats?.totalRevenue.toLocaleString()}
                        </div>
                    </CardContent>
                </Card>

                {[
                    { label: 'Business Nodes', val: globalStats?.totalTenants, icon: Building2, color: 'text-primary' },
                    { label: 'Active End-Users', val: globalStats?.totalClients.toLocaleString(), icon: Users, color: 'text-primary' },
                    { label: 'Transaction Pulse', val: globalStats?.txCount.toLocaleString(), icon: Activity, color: 'text-primary' }
                ].map((stat, i) => (
                    <Card key={i} className="hover:bg-muted/50 shadow-md hover:shadow-lg transition-all rounded-2xl border-border/50">
                        <CardHeader className="flex flex-row items-center justify-between pb-2 pt-6 px-6">
                            <CardTitle className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground">{stat.label}</CardTitle>
                            <stat.icon className="h-4 w-4 text-primary" />
                        </CardHeader>
                        <CardContent className="pb-6 px-6">
                            <div className="text-2xl font-bold text-foreground tracking-tight">{stat.val}</div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Strategic Overview Section */}
            <div className="grid gap-6 lg:grid-cols-2">
                <Card className="border-border shadow-sm rounded-2xl bg-white overflow-hidden border-b-4 border-b-primary/10">
                    <CardHeader className="p-8 border-b border-neutral-100">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-primary/10 rounded-xl border border-primary/20">
                                <Zap className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <CardTitle className="text-xl font-bold text-foreground">Infrastructure Health</CardTitle>
                                <p className="text-xs text-muted-foreground">Platform stability and active business ratio</p>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-8 space-y-6">
                        <div className="flex justify-between items-end">
                            <div className="space-y-1">
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none">Operational Businesses</span>
                                <div className="text-4xl font-black text-foreground tracking-tighter">{globalStats?.activeTenants}</div>
                            </div>
                            <div className="text-right">
                                <div className="text-xs font-black text-primary bg-primary/10 px-3 py-1 rounded-full mb-1">
                                    {Math.round((globalStats?.activeTenants || 0) / (globalStats?.totalTenants || 1) * 100)}% Conversion
                                </div>
                                <span className="text-[10px] font-bold text-muted-foreground">Total Businesses: {globalStats?.totalTenants}</span>
                            </div>
                        </div>
                        <div className="h-3 bg-neutral-100 rounded-full overflow-hidden shadow-inner">
                            <div
                                className="h-full bg-primary shadow-lg shadow-primary/30 transition-all duration-1000 ease-out flex items-center justify-end px-2"
                                style={{ width: `${(globalStats?.activeTenants || 0) / (globalStats?.totalTenants || 1) * 100}%` }}
                            >
                                <div className="h-1 w-1 bg-white rounded-full animate-pulse" />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-5 bg-neutral-50 rounded-2xl border border-neutral-100">
                                <ShieldCheck className="h-5 w-5 text-primary mb-2" />
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Security Grid</p>
                                <p className="text-sm font-bold text-foreground">Encrypted Nodes Active</p>
                            </div>
                            <div className="p-5 bg-neutral-50 rounded-2xl border border-neutral-100">
                                <TrendingUp className="h-5 w-5 text-primary mb-2" />
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Growth Index</p>
                                <p className="text-sm font-bold text-foreground">+12% Monthly Scalability</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-border shadow-sm rounded-2xl bg-white overflow-hidden border-b-4 border-b-destructive/10">
                    <CardHeader className="p-8 border-b border-neutral-100">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-destructive/10 rounded-xl border border-destructive/20">
                                <CreditCard className="h-6 w-6 text-destructive" />
                            </div>
                            <div>
                                <CardTitle className="text-xl font-bold text-foreground tracking-tight">Revenue Breakdown</CardTitle>
                                <p className="text-xs text-muted-foreground">Strategic capital flow and yield analytics</p>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-8 space-y-8">
                        <div className="space-y-4">
                            {[
                                { label: 'Operational Yield', share: 75, color: 'bg-primary' },
                                { label: 'Platform Reserves', share: 15, color: 'bg-primary/60' },
                                { label: 'Infrastructure Cost', share: 10, color: 'bg-destructive' }
                            ].map((item, i) => (
                                <div key={i} className="space-y-1.5">
                                    <div className="flex justify-between items-center px-1">
                                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight">{item.label}</span>
                                        <span className="text-xs font-black text-foreground">{item.share}%</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-neutral-100 rounded-full overflow-hidden">
                                        <div className={`h-full ${item.color}`} style={{ width: `${item.share}%` }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="p-6 bg-primary text-white rounded-2xl shadow-xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-8 opacity-20 group-hover:scale-150 transition-transform duration-700">
                                <TrendingUp className="h-16 w-16" />
                            </div>
                            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/70 mb-1">Net Managed Capital</p>
                            <h3 className="text-3xl font-black tracking-tighter mb-4 text-white">KES {globalStats?.totalRevenue.toLocaleString()}</h3>
                            <button className="flex items-center gap-2 text-xs font-bold bg-white text-primary hover:bg-white/90 px-4 py-2 rounded-xl transition-all shadow-lg shadow-black/5">
                                Export Analytics <ArrowUpRight className="h-3.5 w-3.5" />
                            </button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default SuperAdmin;