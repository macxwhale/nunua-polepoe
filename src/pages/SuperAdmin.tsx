import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Building2, Calendar, Loader2, Phone } from "lucide-react";

import {
    Activity,
    CreditCard,
    TrendingUp
} from "lucide-react";
import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis
} from 'recharts';

const SuperAdmin = () => {
    // Fetch all tenants with their subscription info
    const { data: tenants, isLoading: tenantsLoading } = useQuery({
        queryKey: ["tenants-all"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("tenants")
                .select("*")
                .order("created_at", { ascending: false });

            if (error) throw error;
            return data as any[]; // Using any to handle new schema columns
        },
    });

    // Fetch global transaction stats for revenue tracking
    const { data: globalStats, isLoading: statsLoading } = useQuery({
        queryKey: ["global-stats"],
        queryFn: async () => {
            const { data: txs, error } = await supabase
                .from("transactions")
                .select("amount, type, created_at")
                .eq("type", "payment");

            if (error) throw error;

            const totalRevenue = txs.reduce((acc, tx) => acc + Number(tx.amount), 0);
            return { totalRevenue, txCount: txs.length };
        },
    });

    if (tenantsLoading || statsLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    // Tier calculation data
    const tierData = [
        { name: 'Monthly', count: tenants?.filter(t => t.subscription_tier === 'monthly').length || 0, color: '#3b82f6' },
        { name: '6-Month', count: tenants?.filter(t => t.subscription_tier === 'semi-annual').length || 0, color: '#8b5cf6' },
        { name: 'Annual', count: tenants?.filter(t => t.subscription_tier === 'annual').length || 0, color: '#10b981' },
    ];

    const activeTenants = tenants?.filter(t => t.is_active).length || 0;

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col gap-2">
                <h1 className="text-4xl font-black tracking-tight text-foreground">Platform Overview</h1>
                <p className="text-muted-foreground font-medium">Global analytics and tenant infrastructure management</p>
            </div>

            {/* Metric Cards */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <Card className="border-border/40 shadow-sm overflow-hidden group">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-bold tracking-wider uppercase text-muted-foreground">Total Revenue</CardTitle>
                        <TrendingUp className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black">KES {globalStats?.totalRevenue.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground mt-1">Overall platform collections</p>
                    </CardContent>
                    <div className="h-1 w-full bg-green-500/10 group-hover:bg-green-500/20 transition-colors" />
                </Card>

                <Card className="border-border/40 shadow-sm overflow-hidden group">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-bold tracking-wider uppercase text-muted-foreground">Active Tenants</CardTitle>
                        <Building2 className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black">{activeTenants}</div>
                        <p className="text-xs text-muted-foreground mt-1">Businesses currently onboarded</p>
                    </CardContent>
                    <div className="h-1 w-full bg-primary/10 group-hover:bg-primary/20 transition-colors" />
                </Card>

                <Card className="border-border/40 shadow-sm overflow-hidden group">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-bold tracking-wider uppercase text-muted-foreground">System Load</CardTitle>
                        <Activity className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black">{globalStats?.txCount.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground mt-1">Processed transactions</p>
                    </CardContent>
                    <div className="h-1 w-full bg-orange-500/10 group-hover:bg-orange-500/20 transition-colors" />
                </Card>

                <Card className="border-border/40 shadow-sm overflow-hidden group">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-bold tracking-wider uppercase text-muted-foreground">Avg. Rev / Business</CardTitle>
                        <CreditCard className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black">
                            KES {(globalStats && activeTenants > 0 ? (globalStats.totalRevenue / activeTenants) : 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Metric based on active users</p>
                    </CardContent>
                    <div className="h-1 w-full bg-blue-500/10 group-hover:bg-blue-500/20 transition-colors" />
                </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-7">
                {/* Subscription Chart */}
                <Card className="lg:col-span-4 border-border/40 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-lg font-bold">Subscription Tiers</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={tierData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 600 }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 600 }} />
                                    <Tooltip
                                        cursor={{ fill: 'transparent' }}
                                        content={({ active, payload }) => {
                                            if (active && payload && payload.length) {
                                                return (
                                                    <div className="bg-background border border-border shadow-lg p-3 rounded-lg">
                                                        <p className="text-sm font-bold">{payload[0].payload.name}</p>
                                                        <p className="text-xs font-medium text-primary">{payload[0].value} Businesses</p>
                                                    </div>
                                                );
                                            }
                                            return null;
                                        }}
                                    />
                                    <Bar dataKey="count" radius={[8, 8, 0, 0]} barSize={60}>
                                        {tierData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} fillOpacity={0.8} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Recent Registrations Info */}
                <Card className="lg:col-span-3 border-border/40 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-lg font-bold">Registration Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center justify-between p-4 rounded-2xl bg-muted/30 border border-border/40">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-xl bg-primary/10 text-primary">
                                    <Building2 className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">New this month</p>
                                    <p className="text-lg font-black text-foreground">
                                        {tenants?.filter(t => new Date(t.created_at) > new Date(new Date().getFullYear(), new Date().getMonth(), 1)).length || 0}
                                    </p>
                                </div>
                            </div>
                            <div className="text-xs font-bold text-green-600 bg-green-500/10 px-2 py-1 rounded-lg">+14%</div>
                        </div>

                        <div className="space-y-4">
                            <p className="text-sm font-bold tracking-tight">System Status</p>
                            <div className="grid gap-3">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground font-medium">Database Latency</span>
                                    <span className="text-foreground font-bold">14ms</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground font-medium">Storage Usage</span>
                                    <span className="text-foreground font-bold">2.4 GB</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground font-medium">API Requests (24h)</span>
                                    <span className="text-foreground font-bold">128.5k</span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card className="border-border/40 shadow-sm overflow-hidden">
                <CardHeader className="bg-muted/30 border-b border-border/40 py-4">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-lg font-bold">Tenant Infrastructure</CardTitle>
                        <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="font-bold">{tenants?.length || 0} Total</Badge>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-muted/10">
                            <TableRow>
                                <TableHead className="font-bold py-4">Business Name</TableHead>
                                <TableHead className="font-bold">Subscription Tier</TableHead>
                                <TableHead className="font-bold">Contact Info</TableHead>
                                <TableHead className="font-bold">Registered Date</TableHead>
                                <TableHead className="text-right font-bold">Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {tenants?.map((tenant) => (
                                <TableRow key={tenant.id} className="hover:bg-muted/5 transition-colors group">
                                    <TableCell className="font-bold text-foreground py-4">
                                        <div className="flex flex-col">
                                            <span>{tenant.business_name}</span>
                                            <span className="text-[10px] text-muted-foreground font-medium tracking-tight uppercase">ID: {tenant.id.slice(0, 8)}...</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            variant="secondary"
                                            className={`
                                                font-bold capitalize 
                                                ${tenant.subscription_tier === 'monthly' ? 'bg-blue-50 text-blue-700 border-blue-200' : ''}
                                                ${tenant.subscription_tier === 'semi-annual' ? 'bg-purple-50 text-purple-700 border-purple-200' : ''}
                                                ${tenant.subscription_tier === 'annual' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : ''}
                                            `}
                                        >
                                            {tenant.subscription_tier || 'Monthly'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2 font-medium text-muted-foreground text-sm group-hover:text-foreground transition-colors">
                                            <Phone className="h-3.5 w-3.5" />
                                            {tenant.phone_number}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2 font-medium text-muted-foreground text-sm">
                                            <Calendar className="h-3.5 w-3.5" />
                                            {new Date(tenant.created_at).toLocaleDateString()}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Badge
                                            variant="outline"
                                            className={`
                                                font-bold shadow-sm
                                                ${tenant.is_active ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}
                                            `}
                                        >
                                            {tenant.is_active ? 'Active' : 'Deactivated'}
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
};

export default SuperAdmin;
