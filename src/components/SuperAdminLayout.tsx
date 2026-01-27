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
                <main className="flex-1 flex flex-col">
                    {/* Header */}
                    <header className="sticky top-0 z-10 h-16 border-b border-slate-200 bg-white/80 backdrop-blur-md flex items-center justify-between px-6">
                        <div className="flex items-center gap-4">
                            <div className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest rounded-full border border-primary/20">
                                Platform Control Central
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <Button variant="ghost" size="icon" className="text-slate-500 hover:text-primary transition-colors">
                                <Bell className="h-5 w-5" />
                            </Button>

                            <div className="h-8 w-[1px] bg-slate-200" />

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="gap-3 hover:bg-slate-100 transition-all px-2">
                                        <Avatar className="h-8 w-8 border border-slate-200 shadow-sm">
                                            <AvatarFallback className="bg-primary text-white text-xs font-bold">SA</AvatarFallback>
                                        </Avatar>
                                        <div className="flex flex-col items-start leading-none group">
                                            <span className="text-sm font-bold text-slate-700">{getUserName()}</span>
                                            <span className="text-[10px] text-slate-400 font-semibold group-hover:text-primary transition-colors">Platform Owner</span>
                                        </div>
                                        <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
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
