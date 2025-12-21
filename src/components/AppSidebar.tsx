import { useState } from "react";
import { LayoutDashboard, Users, FileText, Package, ChevronDown, Plus, Smartphone, Sparkles } from "lucide-react";
import { NavLink } from "react-router-dom";
import { ClientDialog } from "@/components/clients/ClientDialog";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

const menuGroups = [
  {
    label: "DASHBOARDS",
    items: [
      { title: "Overview", url: "/", icon: LayoutDashboard, iconColor: "text-primary" },
    ]
  },
  {
    label: "CLIENT & SALES",
    items: [
      { title: "Clients", url: "/clients", icon: Users, iconColor: "text-muted-foreground" },
      { title: "Invoices", url: "/invoices", icon: FileText, iconColor: "text-muted-foreground" },
      { title: "Products", url: "/products", icon: Package, iconColor: "text-muted-foreground" },
    ]
  },
  {
    label: "SETTINGS",
    items: [
      { title: "Payments", url: "/payments", icon: Smartphone, iconColor: "text-muted-foreground" },
    ]
  }
];

export function AppSidebar() {
  const { state, openMobile, setOpenMobile } = useSidebar();
  const isMobile = useIsMobile();
  const [openGroups, setOpenGroups] = useState<string[]>(["DASHBOARDS", "CLIENT & SALES", "SETTINGS"]);
  const [clientDialogOpen, setClientDialogOpen] = useState(false);
  
  const showText = state === "expanded" || (isMobile && openMobile);

  const handleMobileMenuClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  const toggleGroup = (label: string) => {
    setOpenGroups(prev => 
      prev.includes(label) 
        ? prev.filter(g => g !== label)
        : [...prev, label]
    );
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border bg-sidebar">
      {/* Brand Header */}
      <div className={cn(
        "p-4 border-b border-sidebar-border",
        !showText && "flex justify-center p-3"
      )}>
        {showText ? (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-orange-500 flex items-center justify-center shadow-md">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-display font-bold text-primary">Lipia Pole Pole</h1>
              <p className="text-xs text-muted-foreground">Credit Management</p>
            </div>
          </div>
        ) : (
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-orange-500 flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
        )}
      </div>

      <SidebarContent className="px-3 py-4">
        {menuGroups.map((group) => (
          <Collapsible
            key={group.label}
            open={openGroups.includes(group.label)}
            onOpenChange={() => toggleGroup(group.label)}
            className="mb-3"
          >
            <SidebarGroup>
              <CollapsibleTrigger className="w-full group/collapsible">
                <SidebarGroupLabel className={cn(
                  "text-[11px] font-semibold text-sidebar-foreground/50 uppercase tracking-widest px-3 py-2 flex items-center justify-between hover:text-sidebar-foreground/80 cursor-pointer transition-colors duration-200",
                  !showText && "justify-center"
                )}>
                  <span>{showText ? group.label : ""}</span>
                  {showText && (
                    <ChevronDown className={cn(
                      "h-3.5 w-3.5 transition-transform duration-200 ease-out",
                      !openGroups.includes(group.label) && "-rotate-90"
                    )} />
                  )}
                </SidebarGroupLabel>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarMenu className="space-y-1 mt-1">
                    {/* Add Client Quick Action */}
                    {group.label === "CLIENT & SALES" && (
                      <SidebarMenuItem>
                        <button
                          onClick={() => {
                            setClientDialogOpen(true);
                            handleMobileMenuClick();
                          }}
                          className={cn(
                            "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium w-full transition-all duration-200",
                            "bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-sm active:scale-[0.98]",
                            "min-h-[44px]", // Accessibility: minimum touch target
                            !showText && "justify-center px-3"
                          )}
                        >
                          <Plus className="h-4.5 w-4.5 flex-shrink-0" />
                          {showText && <span>Add Client</span>}
                        </button>
                      </SidebarMenuItem>
                    )}
                    
                    {group.items.map((item) => (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton asChild>
                          <NavLink
                            to={item.url}
                            end
                            onClick={handleMobileMenuClick}
                            className={({ isActive }) =>
                              cn(
                                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                                "min-h-[44px]", // Accessibility: minimum touch target
                                isActive
                                  ? "bg-primary text-primary-foreground font-semibold shadow-sm"
                                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground hover:translate-x-0.5",
                                !showText && "justify-center px-3"
                              )
                            }
                          >
                            {({ isActive }) => (
                              <>
                                <item.icon className={cn(
                                  "h-[18px] w-[18px] flex-shrink-0 transition-transform duration-200",
                                  isActive ? "text-primary-foreground" : item.iconColor
                                )} />
                                {showText && (
                                  <span className={cn(
                                    "transition-all duration-200",
                                    isActive && "tracking-wide"
                                  )}>
                                    {item.title}
                                  </span>
                                )}
                              </>
                            )}
                          </NavLink>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </CollapsibleContent>
            </SidebarGroup>
          </Collapsible>
        ))}
      </SidebarContent>

      <ClientDialog
        open={clientDialogOpen}
        onClose={() => setClientDialogOpen(false)}
        client={null}
      />
    </Sidebar>
  );
}
