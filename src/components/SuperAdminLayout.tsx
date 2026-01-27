import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { SuperAdminSidebar } from "./SuperAdminSidebar";
import { useAuth } from "@/hooks/useAuth";
import { 
    Bell, 
    Search, 
    User,
    ShieldCheck,
    LogOut,
    Settings
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

interface SuperAdminLayoutProps {
    children: React.ReactNode;
}

export function SuperAdminLayout({ children }: SuperAdminLayoutProps) {
    const { user, signOut } = useAuth();
    
    const getUserName = () => {
        if (!user) return "SuperAdmin";
        return user.user_metadata?.full_name || user.email?.split('@')[0] || "SuperAdmin";
    };

    return (
        <SidebarProvider>
            <div className="flex min-h-screen w-full bg-neutral-50/30">
                <SuperAdminSidebar />
                <div className="flex flex-col flex-1 overflow-hidden">
                    {/* Header */}
                    <header className="h-16 border-b border-border bg-white flex items-center justify-between px-6 sticky top-0 z-10">
                        <div className="flex items-center gap-4">
                            <SidebarTrigger className="text-neutral-500 hover:text-primary transition-colors" />
                            <div className="h-4 w-px bg-border hidden md:block" />
                            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-neutral-50 rounded-lg text-[10px] font-bold text-neutral-400 uppercase tracking-widest border border-border">
                                <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                                Secured Infrastructure
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <Button variant="ghost" size="icon" className="text-neutral-400 hover:text-primary rounded-xl">
                                <Search className="h-5 w-5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="text-neutral-400 hover:text-primary rounded-xl relative">
                                <Bell className="h-5 w-5" />
                                <span className="absolute top-2 right-2 w-2 h-2 bg-destructive rounded-full border-2 border-white" />
                            </Button>
                            
                            <div className="w-px h-6 bg-border mx-1" />

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="pl-2 pr-4 h-10 gap-3 hover:bg-neutral-50 rounded-xl transition-all">
                                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-xs border border-primary/20">
                                            {getUserName().charAt(0).toUpperCase()}
                                        </div>
                                        <div className="flex flex-col items-start">
                                            <span className="text-xs font-bold text-neutral-800 leading-none">{getUserName()}</span>
                                            <span className="text-[9px] font-bold text-primary uppercase tracking-tighter mt-0.5">Global Admin</span>
                                        </div>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-56 rounded-xl border-border shadow-2xl p-2">
                                    <DropdownMenuLabel className="font-bold text-xs text-neutral-400 uppercase tracking-widest p-3">Account Systems</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem className="rounded-lg gap-2 font-bold text-xs py-2.5 cursor-pointer">
                                        <User className="h-4 w-4 text-primary" /> Profile Node
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="rounded-lg gap-2 font-bold text-xs py-2.5 cursor-pointer">
                                        <Settings className="h-4 w-4 text-primary" /> Platform Settings
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem 
                                        className="rounded-lg gap-2 font-bold text-xs py-2.5 text-destructive cursor-pointer hover:bg-destructive/5"
                                        onClick={() => signOut()}
                                    >
                                        <LogOut className="h-4 w-4" /> Terminate Session
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </header>

                    {/* Content */}
                    <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-8">
                        {children}
                    </main>
                </div>
            </div>
        </SidebarProvider>
    );
}