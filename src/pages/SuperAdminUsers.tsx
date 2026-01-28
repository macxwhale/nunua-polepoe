import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    Loader2,
    Search,
    ShieldAlert,
    ShieldCheck,
    UserPlus
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const SuperAdminUsers = () => {
    const queryClient = useQueryClient();
    const [searchQuery, setSearchQuery] = useState("");
    const [globalSearchLoading, setGlobalSearchLoading] = useState(false);
    const [foundUsers, setFoundUsers] = useState<any[]>([]);

    const { data: superadmins, isLoading: adminsLoading, error: adminsError } = useQuery({
        queryKey: ["superadmin-users"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("user_roles")
                .select(`
                    id,
                    user_id,
                    role,
                    profiles!user_roles_user_id_profiles_fkey(
                        full_name, 
                        phone_number, 
                        tenant_id, 
                        tenants(business_name)
                    )
                `)
                .eq("role", "superadmin" as any);

            if (error) {
                console.error("Superadmin fetch error:", error);
                throw error;
            }
            return data as any[];
        },
    });

    const handleGlobalSearch = async () => {
        if (!searchQuery.trim()) return;
        setGlobalSearchLoading(true);
        try {
            // Find users by phone or name
            const { data, error } = await supabase
                .from("profiles")
                .select(`
                    id,
                    user_id,
                    full_name,
                    phone_number,
                    tenant_id,
                    tenants(business_name),
                    user_roles!user_roles_user_id_profiles_fkey(role)
                `)
                .or(`full_name.ilike.%${searchQuery}%,phone_number.ilike.%${searchQuery}%`)
                .limit(10);

            if (error) throw error;
            setFoundUsers(data || []);
            if (data?.length === 0) {
                toast.info("No users found with those credentials");
            }
        } catch (error: any) {
            toast.error(`Search failed: ${error.message}`);
        } finally {
            setGlobalSearchLoading(false);
        }
    };

    const promoteMutation = useMutation({
        mutationFn: async (userId: string) => {
            const { error } = await supabase
                .from("user_roles")
                .insert([{ user_id: userId, role: "superadmin" as any }]);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["superadmin-users"] });
            toast.success("User promoted to Superadmin successfully");
            setFoundUsers([]);
            setSearchQuery("");
        },
        onError: (error: any) => toast.error(`Promotion failed: ${error.message}`)
    });

    if (adminsLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[500px] gap-8 animate-in fade-in duration-1000">
                <Loader2 className="h-10 w-10 animate-spin text-primary opacity-60" />
                <p className="text-xl font-bold text-foreground tracking-tight">Authenticating Administrative Records...</p>
            </div>
        );
    }

    if (adminsError) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[500px] gap-8 text-center p-12 bg-white rounded-2xl border border-destructive/20">
                <ShieldAlert className="h-10 w-10 text-destructive" />
                <h2 className="text-2xl font-bold text-foreground">Query Authentication Failed</h2>
                <p className="text-muted-foreground text-sm max-w-md">{(adminsError as any).message || "The platform was unable to resolve administrative hierarchy."}</p>
                <Button onClick={() => queryClient.invalidateQueries({ queryKey: ["superadmin-users"] })}>Retry Protocol Sync</Button>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-700 max-w-[1600px] mx-auto pb-10">
            <div className="flex flex-col gap-4 px-4 md:px-0">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">Access Management</h1>
                    <Badge className="w-fit bg-primary/10 text-primary border-primary/20 font-bold px-3 py-1 text-[10px] md:text-xs uppercase tracking-widest">Global Governance</Badge>
                </div>
                <p className="text-muted-foreground text-xs md:text-sm font-medium">Control platform administrative privileges and superadmin authorization</p>
            </div>

            {/* Promotion Section */}
            <Card className="border-border shadow-md overflow-hidden rounded-2xl bg-white border-b-4 border-b-primary/10">
                <CardHeader className="bg-white border-b border-border py-5 px-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-center gap-4">
                            <div className="p-2.5 bg-primary/10 rounded-xl border border-primary/20">
                                <UserPlus className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <CardTitle className="text-lg font-bold tracking-tight text-foreground uppercase tracking-tighter">Grant Privileges</CardTitle>
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Search and promote users to Global Admin</p>
                            </div>
                        </div>
                        <div className="flex gap-2 w-full md:w-auto">
                            <div className="relative flex-1 md:w-80">
                                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
                                <Input
                                    placeholder="Search by Name or Phone..."
                                    className="pl-10 h-11 bg-neutral-50/50 border-border rounded-xl font-medium text-foreground"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleGlobalSearch()}
                                />
                            </div>
                            <Button
                                onClick={handleGlobalSearch}
                                disabled={globalSearchLoading}
                                className="h-11 rounded-xl px-6 font-bold"
                            >
                                {globalSearchLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Identify"}
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                {foundUsers.length > 0 && (
                    <CardContent className="p-0 border-b border-border">
                        <Table>
                            <TableBody>
                                {foundUsers.map((user) => {
                                    const isAlreadyAdmin = user.user_roles?.some((r: any) => r.role === 'superadmin');
                                    return (
                                        <TableRow key={user.id} className="hover:bg-primary/5 transition-colors border-border">
                                            <TableCell className="py-4 pl-8">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-foreground">{user.full_name}</span>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[10px] text-muted-foreground font-medium">{user.phone_number}</span>
                                                        <Badge variant="outline" className="text-[9px] font-bold text-muted-foreground px-1 bg-neutral-50">
                                                            Node: {user.tenants?.business_name || "Unassigned"}
                                                        </Badge>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right pr-8">
                                                {isAlreadyAdmin ? (
                                                    <Badge className="bg-primary/10 text-primary border-primary/20 font-bold px-3 py-1 text-[9px] uppercase tracking-widest">Active Admin</Badge>
                                                ) : (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="h-8 px-4 rounded-lg font-bold text-[10px] gap-2 border-primary/30 text-primary hover:bg-primary/10 transition-all"
                                                        onClick={() => promoteMutation.mutate(user.user_id)}
                                                        disabled={promoteMutation.isPending}
                                                    >
                                                        <ShieldCheck className="h-3.5 w-3.5" />
                                                        Promote
                                                    </Button>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </CardContent>
                )}
            </Card>

            {/* Existing Admins List */}
            <Card className="border-border shadow-md overflow-hidden rounded-2xl bg-white">
                <CardHeader className="bg-white border-b border-border py-5 px-8">
                    <div className="flex items-center gap-4">
                        <div className="p-2.5 bg-primary/10 rounded-xl border border-primary/20">
                            <ShieldCheck className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <CardTitle className="text-lg font-bold tracking-tight text-foreground uppercase tracking-tighter">Authorized Administrators</CardTitle>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{superadmins?.length || 0} Global Controllers</p>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {/* Desktop View */}
                    <div className="hidden md:block">
                        <Table>
                            <TableHeader className="bg-neutral-50/50">
                                <TableRow className="border-border">
                                    <TableHead className="font-bold text-[10px] uppercase tracking-widest py-4 pl-8 text-muted-foreground">Administrator Identity</TableHead>
                                    <TableHead className="font-bold text-[10px] uppercase tracking-widest text-muted-foreground">Reference Node</TableHead>
                                    <TableHead className="font-bold text-[10px] uppercase tracking-widest text-muted-foreground text-center">Status</TableHead>
                                    <TableHead className="text-right font-bold text-[10px] uppercase tracking-widest pr-8 text-muted-foreground">Hierarchy</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {superadmins?.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="py-20 text-center">
                                            <p className="text-sm text-muted-foreground font-medium">No administrative nodes identified.</p>
                                        </TableCell>
                                    </TableRow>
                                ) : superadmins?.map((admin) => (
                                    <TableRow key={admin.id} className="hover:bg-neutral-50 transition-colors border-border">
                                        <TableCell className="py-5 pl-8">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-foreground tracking-tight mb-1">
                                                    {(Array.isArray(admin.profiles) ? admin.profiles[0] : admin.profiles)?.full_name || "Root Admin"}
                                                </span>
                                                <span className="text-[10px] text-muted-foreground font-medium">
                                                    {(Array.isArray(admin.profiles) ? admin.profiles[0] : admin.profiles)?.phone_number}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="text-[10px] font-bold text-muted-foreground border-neutral-200 bg-neutral-50">
                                                {(Array.isArray(admin.profiles) ? admin.profiles[0] : admin.profiles)?.tenants?.business_name || "Primary Node"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <div className="inline-flex items-center gap-1.5 text-primary text-[9px] font-black uppercase tracking-widest">
                                                Active <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right pr-8">
                                            <Badge className="bg-neutral-900 text-white border-0 font-black px-3 py-1 text-[9px] uppercase tracking-widest">Master Admin</Badge>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Mobile View */}
                    <div className="md:hidden divide-y divide-border">
                        {superadmins?.length === 0 ? (
                            <div className="py-10 text-center">
                                <p className="text-xs text-muted-foreground font-medium">No administrative nodes identified.</p>
                            </div>
                        ) : superadmins?.map((admin) => (
                            <div key={admin.id} className="p-5 flex flex-col gap-3">
                                <div className="flex justify-between items-start">
                                    <div className="flex flex-col gap-1">
                                        <h3 className="text-sm font-bold text-foreground">
                                            {(Array.isArray(admin.profiles) ? admin.profiles[0] : admin.profiles)?.full_name || "Root Admin"}
                                        </h3>
                                        <span className="text-[10px] text-muted-foreground font-medium">
                                            {(Array.isArray(admin.profiles) ? admin.profiles[0] : admin.profiles)?.phone_number}
                                        </span>
                                    </div>
                                    <Badge className="bg-neutral-900 text-white border-0 font-black px-2 py-0.5 text-[8px] uppercase tracking-widest">Master</Badge>
                                </div>
                                <div className="flex items-center justify-between pt-2 border-t border-border/50">
                                    <Badge variant="outline" className="text-[9px] font-bold text-muted-foreground border-neutral-200 bg-neutral-50">
                                        {(Array.isArray(admin.profiles) ? admin.profiles[0] : admin.profiles)?.tenants?.business_name || "Primary Node"}
                                    </Badge>
                                    <div className="inline-flex items-center gap-1.5 text-primary text-[8px] font-black uppercase tracking-widest">
                                        Authenticated <div className="w-1 h-1 rounded-full bg-primary animate-pulse" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default SuperAdminUsers;
