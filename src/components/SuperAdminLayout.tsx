import { SuperAdminSidebar } from "@/components/SuperAdminSidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { SidebarProvider } from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Bell, ChevronDown } from "lucide-react";
import { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface SuperAdminLayoutProps {
    children: ReactNode;
}

export function SuperAdminLayout({ children }: SuperAdminLayoutProps) {
    const { user } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) {
            toast.error('Failed to log out');
        } else {
            toast.success('Logged out successfully');
            navigate('/auth', { replace: true });
        }
    };

    const getUserName = () => {
        if (!user) return "Super Admin";
        return user.user_metadata?.full_name || user.email?.split('@')[0] || "Super Admin";
    };

    return (
        <SidebarProvider>
            <div className="min-h-screen flex w-full bg-slate-50">
                <SuperAdminSidebar />
                <main className="flex-1 flex flex-col bg-white">
                    {/* Header */}
                    <header className="sticky top-0 z-10 h-16 border-b border-sidebar-border bg-white/95 backdrop-blur-sm flex items-center justify-between px-8">
                        <div className="flex items-center gap-4">
                            <div className="px-3 py-1 bg-primary/10 text-primary text-[9px] font-black uppercase tracking-[0.2em] rounded-full border border-primary/20">
                                Infrastructure Console
                            </div>
                        </div>

                        <div className="flex items-center gap-6">
                            <Button variant="ghost" size="icon" className="text-slate-400 hover:text-primary transition-all">
                                <Bell className="h-4 w-4" />
                            </Button>

                            <div className="h-6 w-[1px] bg-slate-100" />

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="gap-3 hover:bg-slate-50 transition-all px-2 h-10 rounded-xl border border-transparent hover:border-slate-100">
                                        <Avatar className="h-8 w-8 border-2 border-primary/20 shadow-sm ring-2 ring-white">
                                            <AvatarFallback className="bg-primary text-white text-[10px] font-black uppercase">SA</AvatarFallback>
                                        </Avatar>
                                        <div className="flex flex-col items-start leading-tight">
                                            <span className="text-sm font-black text-slate-900 tracking-tight">{getUserName()}</span>
                                            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Platform Admin</span>
                                        </div>
                                        <ChevronDown className="h-3 w-3 text-slate-300" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-56">
                                    <DropdownMenuLabel>Global Account</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem className="cursor-pointer" onClick={() => navigate('/dashboard')}>
                                        Switch to Business App
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="cursor-pointer">System Logs</DropdownMenuItem>
                                    <DropdownMenuItem className="cursor-pointer">Security Settings</DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                        onClick={handleLogout}
                                        className="text-destructive focus:text-destructive cursor-pointer"
                                    >
                                        Log out
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </header>

                    {/* Main Content */}
                    <div className="flex-1 p-8">
                        {children}
                    </div>
                </main>
            </div>
        </SidebarProvider>
    );
}
