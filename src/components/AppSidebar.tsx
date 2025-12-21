import { useState } from "react";
import { LayoutDashboard, Users, FileText, Package, ChevronRight, Plus, Smartphone } from "lucide-react";
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
    label: "Dashboards",
    items: [
      { title: "Overview", url: "/", icon: LayoutDashboard, iconColor: "text-primary" },
    ]
  },
  {
    label: "Client & Sales",
    items: [
      { title: "Clients", url: "/clients", icon: Users, iconColor: "text-primary" },
      { title: "Invoices", url: "/invoices", icon: FileText, iconColor: "text-destructive" },
      { title: "Products", url: "/products", icon: Package, iconColor: "text-primary" },
    ]
  },
  {
    label: "Settings",
    items: [
      { title: "Payments", url: "/payments", icon: Smartphone, iconColor: "text-primary" },
    ]
  }
];

export function AppSidebar() {
  const { state, openMobile, setOpenMobile } = useSidebar();
  const isMobile = useIsMobile();
  const [openGroups, setOpenGroups] = useState<string[]>(["Dashboards", "Client & Sales"]);
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
          <div>
            <h1 className="text-sm font-display font-bold text-sidebar-foreground">Lipia Pole Pole</h1>
            <p className="text-xs text-sidebar-foreground/60">Credit Management</p>
          </div>
        ) : (
          <span className="text-sm font-display font-bold text-sidebar-foreground">LP</span>
        )}
      </div>

      <SidebarContent className="px-2 py-3">
        {menuGroups.map((group) => (
          <Collapsible
            key={group.label}
            open={openGroups.includes(group.label)}
            onOpenChange={() => toggleGroup(group.label)}
            className="mb-1"
          >
            <SidebarGroup>
              <CollapsibleTrigger className="w-full group/collapsible">
                <SidebarGroupLabel className={cn(
                  "text-[10px] font-medium text-sidebar-foreground/50 uppercase tracking-wider px-2 py-1.5 flex items-center justify-between hover:text-sidebar-foreground/70 cursor-pointer",
                  !showText && "justify-center"
                )}>
                  <span>{showText ? group.label : ""}</span>
                  {showText && (
                    <ChevronRight className={cn(
                      "h-3 w-3 transition-transform duration-150",
                      openGroups.includes(group.label) && "rotate-90"
                    )} />
                  )}
                </SidebarGroupLabel>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarMenu className="space-y-0.5">
                    {/* Add Client Quick Action */}
                    {group.label === "Client & Sales" && (
                      <SidebarMenuItem>
                        <button
                          onClick={() => {
                            setClientDialogOpen(true);
                            handleMobileMenuClick();
                          }}
                          className={cn(
                            "flex items-center gap-2 rounded-md px-2 py-1.5 text-xs font-medium w-full",
                            "bg-primary text-primary-foreground hover:bg-primary/90",
                            !showText && "justify-center px-2"
                          )}
                        >
                          <Plus className="h-4 w-4" />
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
                                "flex items-center gap-2 rounded-full px-2 py-1.5 text-xs font-medium",
                                isActive
                                  ? "bg-primary text-primary-foreground"
                                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground",
                                !showText && "justify-center px-2"
                              )
                            }
                          >
                            {({ isActive }) => (
                              <>
                                <item.icon className={cn("h-4 w-4", isActive ? "text-primary-foreground" : item.iconColor)} />
                                {showText && <span>{item.title}</span>}
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
