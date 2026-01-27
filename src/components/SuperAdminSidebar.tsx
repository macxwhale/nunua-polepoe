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

    const handleMobileMenuClick = () => {
        if (isMobile) {
            setOpenMobile(false);
        }
    };

    return (
        <Sidebar collapsible="icon" className="border-r border-sidebar-border bg-slate-900 text-slate-100">
            {/* Platform Header */}
            <div className={cn(
                "p-4 border-b border-slate-800",
                !showText && "flex justify-center p-2"
            )}>
                {showText ? (
                    <div className="flex flex-col gap-1">
                        <span className="text-xs font-bold text-primary tracking-widest uppercase">Platform Control</span>
                        <img src="/logo.png" alt="LipiaPolePole" className="h-8 w-auto object-contain self-start brightness-0 invert" />
                    </div>
                ) : (
                    <ShieldCheck className="h-6 w-6 text-primary" />
                )}
            </div>

            <SidebarContent className="px-3 py-5">
                <SidebarGroup>
                    <SidebarGroupLabel className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-3 mb-2">
                        Management
                    </SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu className="space-y-1">
                            <SidebarMenuItem>
                                <NavLink
                                    to="/superadmin"
                                    end
                                    className={({ isActive }) =>
                                        cn(
                                            "flex items-center gap-3 px-4 py-2.5 text-sm font-medium w-full rounded-lg transition-all",
                                            isActive
                                                ? "bg-primary text-white shadow-lg"
                                                : "text-slate-400 hover:text-white hover:bg-slate-800"
                                        )
                                    }
                                >
                                    <LayoutDashboard className="h-5 w-5" />
                                    {showText && <span>Global Overview</span>}
                                </NavLink>
                            </SidebarMenuItem>

                            <SidebarMenuItem>
                                <NavLink
                                    to="/superadmin/tenants"
                                    className={({ isActive }) =>
                                        cn(
                                            "flex items-center gap-3 px-4 py-2.5 text-sm font-medium w-full rounded-lg transition-all",
                                            isActive
                                                ? "bg-primary text-white shadow-lg"
                                                : "text-slate-400 hover:text-white hover:bg-slate-800"
                                        )
                                    }
                                >
                                    <Users className="h-5 w-5" />
                                    {showText && <span>Business Tenants</span>}
                                </NavLink>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>

                <div className="mt-auto pt-10 px-3">
                    <NavLink
                        to="/dashboard"
                        className="flex items-center gap-3 px-4 py-2 text-xs font-semibold text-slate-500 hover:text-primary transition-colors group"
                    >
                        <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                        {showText && <span>Back to Business App</span>}
                    </NavLink>
                </div>
            </SidebarContent>
        </Sidebar>
    );
}
