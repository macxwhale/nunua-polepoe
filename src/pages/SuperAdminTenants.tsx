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
import { Switch } from "@/components/ui/switch";
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
    AlertCircle,
    Building2,
    CheckCircle2,
    ChevronRight,
    FileText,
    Loader2,
    Package,
    Search,
    ShieldAlert,
    Users,
    Zap,
    TrendingUp
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const SuperAdminTenants = () => {
    const queryClient = useQueryClient();
    const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");

    const { data: tenants, isLoading: tenantsLoading, error: tenantsError } = useQuery({
        queryKey: ["tenants-all"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("tenants")
                .select("*")
                .order("created_at", { ascending: false });

            if (error) throw error;
            return data as any[];
        },
    });

    const { data: tenantDetails, isLoading: detailsLoading } = useQuery({
        queryKey: ["tenant-details", selectedTenantId],
        queryFn: async () => {
            if (!selectedTenantId) return null;

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
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: ["tenants-all"] });
            toast.success(`Tenant ${variables.is_active ? 'activated' : 'deactivated'}`);
        },
        onError: (error: any) => toast.error(`State change failed: ${error.message}`)
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

    if (tenantsLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[500px] gap-8 animate-in fade-in duration-1000">
                <Loader2 className="h-10 w-10 animate-spin text-primary opacity-60" />
                <p className="text-xl font-bold text-foreground tracking-tight">Synchronizing Business Directory...</p>
            </div>
        );
    }

    if (tenantsError) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[500px] gap-8 text-center p-12 bg-white rounded-2xl border border-border">
                <ShieldAlert className="h-10 w-10 text-destructive" />
                <h2 className="text-2xl font-bold text-foreground">Directory Access Failed</h2>
                <Button onClick={() => window.location.reload()}>Retry Protocol Sync</Button>
            </div>
        );
    }

    const filteredTenants = tenants?.filter(t => {
        const query = searchQuery.toLowerCase();
        return (t.business_name?.toLowerCase().includes(query) || t.id?.toLowerCase().includes(query));
    }) || [];

    return (
        <div className="space-y-8 animate-in fade-in duration-700 max-w-[1600px] mx-auto pb-10">
            <div className="flex flex-col gap-2">
                <div className="flex items-center gap-3">
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Business Directory</h1>
                    <Badge className="bg-primary/10 text-primary border-primary/20 font-bold px-3 py-1 text-xs uppercase tracking-widest">Infrastructure Management</Badge>
                </div>
                <p className="text-muted-foreground mt-1 text-sm font-medium">Comprehensive oversight of all platform business entities</p>
            </div>

            <Card className="border-border shadow-md overflow-hidden rounded-2xl bg-white">
                <CardHeader className="bg-white border-b border-border py-5 px-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-center gap-4">
                            <div className="p-2.5 bg-primary/10 rounded-xl border border-primary/20">
                                <Building2 className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <CardTitle className="text-lg font-bold tracking-tight text-foreground uppercase tracking-tighter">Business Nodes</CardTitle>
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{tenants?.length || 0} Registered Entities</p>
                            </div>
                        </div>
                        <div className="relative w-full md:w-80">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
                            <Input
                                placeholder="Search via Identifier..."
                                className="pl-10 h-11 bg-neutral-50/50 border-border rounded-xl font-medium text-foreground"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-neutral-50/50">
                            <TableRow className="border-border">
                                <TableHead className="font-bold text-[10px] uppercase tracking-widest py-4 pl-8 text-muted-foreground">Business Identity</TableHead>
                                <TableHead className="font-bold text-[10px] uppercase tracking-widest text-muted-foreground">Tier</TableHead>
                                <TableHead className="font-bold text-[10px] uppercase tracking-widest text-muted-foreground">Status</TableHead>
                                <TableHead className="text-right font-bold text-[10px] uppercase tracking-widest pr-8 text-muted-foreground">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredTenants.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="py-20 text-center">
                                        <p className="text-sm text-muted-foreground font-medium">No matching business nodes found.</p>
                                    </TableCell>
                                </TableRow>
                            ) : filteredTenants.map((tenant) => (
                                <TableRow key={tenant.id} className="hover:bg-muted/30 transition-colors group border-border">
                                    <TableCell className="py-5 pl-8">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-foreground tracking-tight mb-1">{tenant.business_name || "Unknown Entity"}</span>
                                            <div className="flex items-center gap-2">
                                                <Badge variant="outline" className="text-[9px] font-bold tracking-tight text-muted-foreground px-1 bg-neutral-50">ID: {tenant.id?.slice(0, 8)}</Badge>
                                                <span className="text-[10px] text-muted-foreground font-medium">{tenant.phone_number}</span>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="w-[140px]">
                                            <Select
                                                defaultValue={tenant.subscription_tier || 'monthly'}
                                                onValueChange={(val) => tierMutation.mutate({ id: tenant.id, subscription_tier: val })}
                                                disabled={tierMutation.isPending}
                                            >
                                                <SelectTrigger className="h-8 bg-white border-border rounded-lg text-xs font-medium">
                                                    <SelectValue placeholder="Select Tier" />
                                                </SelectTrigger>
                                                <SelectContent className="rounded-xl border-border shadow-xl">
                                                    <SelectItem value="monthly" className="text-xs font-medium py-2">Monthly</SelectItem>
                                                    <SelectItem value="semi-annual" className="text-xs font-medium py-2">6-Month</SelectItem>
                                                    <SelectItem value="annual" className="text-xs font-medium py-2">Annual</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-3 text-xs">
                                            <Switch 
                                                checked={tenant.is_active}
                                                onCheckedChange={(checked) => toggleMutation.mutate({ id: tenant.id, is_active: checked })}
                                                disabled={toggleMutation.isPending}
                                                className="scale-90"
                                            />
                                            <div className="flex flex-col">
                                                <span className={`text-[10px] font-black uppercase tracking-widest ${tenant.is_active ? 'text-primary' : 'text-destructive'}`}>
                                                    {tenant.is_active ? 'Active' : 'Suspended'}
                                                </span>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right pr-8">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-8 px-4 rounded-lg font-bold text-[11px] gap-2 border-border hover:bg-neutral-50 transition-all active:scale-95"
                                            onClick={() => setSelectedTenantId(tenant.id)}
                                        >
                                            <ChevronRight className="h-3.5 w-3.5" />
                                            Audit
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Dialog open={!!selectedTenantId} onOpenChange={(open) => !open && setSelectedTenantId(null)}>
                <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden flex flex-col border-border shadow-2xl rounded-2xl">
                    <DialogHeader className="p-8 border-b border-border bg-white rounded-t-2xl">
                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 text-left">
                            <div className="space-y-2">
                                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-primary/10 text-primary text-[9px] font-black uppercase tracking-widest rounded-full border border-primary/20">
                                    Infrastructure Audit
                                </div>
                                <DialogTitle className="text-2xl font-bold tracking-tight flex items-center gap-4">
                                    <div className="p-2 bg-primary/10 rounded-xl border border-primary/20">
                                        <Building2 className="h-6 w-6 text-primary" />
                                    </div>
                                    <span className="text-foreground">{tenants?.find(t => t.id === selectedTenantId)?.business_name}</span>
                                </DialogTitle>
                            </div>
                            <div className="flex flex-col items-end">
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">System Node ID</span>
                                <Badge variant="outline" className="text-muted-foreground border-border bg-neutral-50 font-medium px-2 py-1 rounded-lg text-xs">
                                    {selectedTenantId}
                                </Badge>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="flex-1 overflow-hidden bg-white">
                        <ScrollArea className="h-full">
                            <div className="p-8 space-y-10">
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-left">
                                    {[
                                        { label: 'Staff Clear', val: tenantDetails?.stats.products, icon: Package, color: 'text-neutral-600' },
                                        { label: 'Active Clients', val: tenantDetails?.stats.clients, icon: Users, color: 'text-neutral-600' },
                                        { label: 'Cumulative Yield', val: tenantDetails?.stats.revenue.toLocaleString(), icon: TrendingUp, color: 'text-primary' },
                                        { label: 'System Liability', val: `KES ${Math.round((tenantDetails?.stats.revenue || 0) * 0.15).toLocaleString()}`, icon: AlertCircle, color: 'text-destructive' }
                                    ].map((stat, i) => (
                                        <div key={i} className="p-4 rounded-xl bg-white border border-border shadow-sm">
                                            <div className="flex items-center gap-2.5 mb-2">
                                                <div className={`p-1 font-bold ${stat.color}`}>
                                                    <stat.icon className="h-4 w-4" />
                                                </div>
                                                <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">{stat.label}</span>
                                            </div>
                                            <div className={`text-lg font-black tracking-tight ${stat.color === 'text-primary' ? 'text-primary' : stat.color === 'text-destructive' ? 'text-destructive' : 'text-foreground'}`}>
                                                {detailsLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : stat.val ?? '0'}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <Tabs defaultValue="personnel" className="w-full">
                                    <TabsList className="bg-neutral-100/60 p-1 rounded-xl border border-border mb-6">
                                        <TabsTrigger value="personnel" className="rounded-lg px-6 py-1.5 text-xs font-bold data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-primary">Staff Protocols</TabsTrigger>
                                        <TabsTrigger value="clients" className="rounded-lg px-6 py-1.5 text-xs font-bold data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-primary">Client Directory</TabsTrigger>
                                    </TabsList>

                                    <TabsContent value="personnel">
                                        <Table>
                                            <TableHeader className="bg-neutral-50/50">
                                                <TableRow className="border-border">
                                                    <TableHead className="font-bold text-[10px] uppercase tracking-widest py-3 pl-6 text-muted-foreground">Authorized Node</TableHead>
                                                    <TableHead className="font-bold text-[10px] uppercase tracking-widest text-muted-foreground text-center">Clearance</TableHead>
                                                    <TableHead className="font-bold text-[10px] uppercase tracking-widest text-muted-foreground text-right pr-6">Status</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {detailsLoading ? (
                                                    <TableRow><TableCell colSpan={3} className="py-20 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto text-primary opacity-30" /></TableCell></TableRow>
                                                ) : tenantDetails?.profiles.map((profile: any) => (
                                                    <TableRow key={profile.id} className="border-border">
                                                        <TableCell className="py-5 pl-6 font-bold text-sm text-neutral-800">{profile.full_name}</TableCell>
                                                        <TableCell className="text-center text-xs text-muted-foreground font-black uppercase tracking-tighter">{profile.user_roles?.[0]?.role}</TableCell>
                                                        <TableCell className="text-right pr-6">
                                                            <div className="flex items-center justify-end gap-1.5 text-primary text-[10px] font-black uppercase">
                                                                Active <CheckCircle2 className="h-3 w-3" />
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </TabsContent>

                                    <TabsContent value="clients">
                                        <Table>
                                            <TableHeader className="bg-neutral-50/50">
                                                <TableRow className="border-border">
                                                    <TableHead className="font-bold text-[10px] uppercase tracking-widest py-3 pl-6 text-muted-foreground">Client Identity</TableHead>
                                                    <TableHead className="font-bold text-[10px] uppercase tracking-widest text-muted-foreground text-center">Outstanding Debt</TableHead>
                                                    <TableHead className="font-bold text-[10px] uppercase tracking-widest pr-6 text-right text-muted-foreground">Status</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {detailsLoading ? (
                                                    <TableRow><TableCell colSpan={3} className="py-20 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto text-primary opacity-30" /></TableCell></TableRow>
                                                ) : tenantDetails?.clients.map((client: any) => (
                                                    <TableRow key={client.id} className="border-border">
                                                        <TableCell className="py-5 pl-6 font-bold text-sm text-neutral-800">{client.name}</TableCell>
                                                        <TableCell className="text-center font-black text-sm text-destructive">KES {Number(client.total_balance).toLocaleString()}</TableCell>
                                                        <TableCell className={`text-right pr-6 uppercase text-[10px] font-black ${client.status === 'active' ? 'text-primary' : 'text-destructive'}`}>{client.status}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </TabsContent>
                                </Tabs>
                            </div>
                        </ScrollArea>
                    </div>

                    <div className="p-6 bg-neutral-50 border-t border-border flex justify-end">
                        <Button variant="ghost" className="text-muted-foreground hover:text-foreground font-bold text-xs uppercase tracking-widest" onClick={() => setSelectedTenantId(null)}>Terminate Audit</Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default SuperAdminTenants;