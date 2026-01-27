import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuItem,
    useSidebar,
} from "@/components/ui/sidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { ArrowLeft, LayoutDashboard, ShieldCheck, Users } from "lucide-react";
import { NavLink } from "react-router-dom";

export function SuperAdminSidebar() {
    const { state, openMobile, setOpenMobile } = useSidebar();
    const isMobile = useIsMobile();

    const showText = state === "expanded" || (isMobile && openMobile);

    return (
        <Sidebar collapsible="icon" className="border-r border-border bg-white text-foreground">
            {/* Platform Header */}
            <div className={cn(
                "p-4 border-b border-border",
                !showText && "flex justify-center p-2"
            )}>
                {showText ? (
                    <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-black text-primary tracking-[0.2em] uppercase">Platform Control</span>
                        <img src="/logo.png" alt="LipiaPolePole" className="h-8 w-auto object-contain self-start" />
                    </div>
                ) : (
                    <ShieldCheck className="h-6 w-6 text-primary" />
                )}
            </div>

            <SidebarContent className="px-3 py-6 bg-white">
                <SidebarGroup>
                    <SidebarGroupLabel className="text-[10px] font-black text-neutral-400 uppercase tracking-widest px-3 mb-4">
                        Strategic Management
                    </SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu className="space-y-1.5">
                            <SidebarMenuItem>
                                <NavLink
                                    to="/superadmin"
                                    end
                                    className={({ isActive }) =>
                                        cn(
                                            "flex items-center gap-3 px-4 py-3 text-sm font-bold w-full rounded-xl transition-all",
                                            isActive
                                                ? "bg-primary text-white shadow-md shadow-primary/20"
                                                : "text-neutral-500 hover:text-primary hover:bg-primary/5"
                                        )
                                    }
                                >
                                    <LayoutDashboard className="h-5 w-5" />
                                    {showText && <span>Global Intelligence</span>}
                                </NavLink>
                            </SidebarMenuItem>

                            <SidebarMenuItem>
                                <NavLink
                                    to="/superadmin/tenants"
                                    className={({ isActive }) =>
                                        cn(
                                            "flex items-center gap-3 px-4 py-3 text-sm font-bold w-full rounded-xl transition-all",
                                            isActive
                                                ? "bg-primary text-white shadow-md shadow-primary/20"
                                                : "text-neutral-500 hover:text-primary hover:bg-primary/5"
                                        )
                                    }
                                >
                                    <Users className="h-5 w-5" />
                                    {showText && <span>Business Directory</span>}
                                </NavLink>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>

                <div className="mt-auto pt-10 px-3 pb-4">
                    <NavLink
                        to="/dashboard"
                        className="flex items-center gap-3 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-neutral-400 hover:text-primary transition-all group"
                    >
                        <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                        {showText && <span>Return to App</span>}
                    </NavLink>
                </div>
            </SidebarContent>
        </Sidebar>
    );
}