import { useState } from "react";
import { LayoutDashboard, Users, FileText, Package, ChevronRight, Plus, Smartphone, Sparkles } from "lucide-react";
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
      { title: "Overview", url: "/", icon: LayoutDashboard },
    ]
  },
  {
    label: "Client & Sales",
    items: [
      { title: "Clients", url: "/clients", icon: Users },
      { title: "Invoices", url: "/invoices", icon: FileText },
      { title: "Products", url: "/products", icon: Package },
    ]
  },
  {
    label: "Settings",
    items: [
      { title: "Payments", url: "/payments", icon: Smartphone },
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
    <Sidebar collapsible="icon" className="border-r-0 bg-sidebar">
      {/* Brand Header */}
      <div className={cn(
        "p-5 border-b border-sidebar-border/50",
        !showText && "flex justify-center p-4"
      )}>
        {showText ? (
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl gradient-brand flex items-center justify-center shadow-lg">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-display font-bold text-sidebar-foreground">Lipia Pole Pole</h1>
              <p className="text-xs text-sidebar-foreground/60">Credit Management</p>
            </div>
          </div>
        ) : (
          <div className="w-10 h-10 rounded-xl gradient-brand flex items-center justify-center shadow-lg">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
        )}
      </div>

      <SidebarContent className="px-3 py-4">
        {menuGroups.map((group, groupIndex) => (
          <Collapsible
            key={group.label}
            open={openGroups.includes(group.label)}
            onOpenChange={() => toggleGroup(group.label)}
            className="mb-2"
          >
            <SidebarGroup>
              <CollapsibleTrigger className="w-full group/collapsible">
                <SidebarGroupLabel className={cn(
                  "text-[11px] font-display font-semibold text-sidebar-foreground/50 uppercase tracking-widest px-3 py-2 flex items-center justify-between hover:text-sidebar-foreground/70 transition-colors cursor-pointer",
                  !showText && "justify-center"
                )}>
                  <span>{showText ? group.label : ""}</span>
                  {showText && (
                    <ChevronRight className={cn(
                      "h-3.5 w-3.5 transition-transform duration-200",
                      openGroups.includes(group.label) && "rotate-90"
                    )} />
                  )}
                </SidebarGroupLabel>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarMenu className="space-y-1">
                    {/* Add Client Quick Action */}
                    {group.label === "Client & Sales" && (
                      <SidebarMenuItem>
                        <button
                          onClick={() => {
                            setClientDialogOpen(true);
                            handleMobileMenuClick();
                          }}
                          className={cn(
                            "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-200",
                            "bg-sidebar-primary/15 hover:bg-sidebar-primary/25 text-sidebar-primary",
                            "border border-sidebar-primary/20 hover:border-sidebar-primary/40",
                            "hover:shadow-glow-sm w-full",
                            !showText && "justify-center px-2"
                          )}
                        >
                          <div className="w-7 h-7 rounded-lg bg-sidebar-primary/20 flex items-center justify-center">
                            <Plus className="h-4 w-4" />
                          </div>
                          {showText && <span>Add Client</span>}
                        </button>
                      </SidebarMenuItem>
                    )}
                    
                    {group.items.map((item, index) => (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton asChild>
                          <NavLink
                            to={item.url}
                            end
                            onClick={handleMobileMenuClick}
                            className={({ isActive }) =>
                              cn(
                                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                                isActive
                                  ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                                  : "text-sidebar-foreground/70 hover:bg-sidebar-muted hover:text-sidebar-foreground",
                                !showText && "justify-center px-2"
                              )
                            }
                          >
                            {({ isActive }) => (
                              <>
                                <div className={cn(
                                  "w-7 h-7 rounded-lg flex items-center justify-center transition-colors",
                                  isActive 
                                    ? "bg-sidebar-primary text-sidebar-primary-foreground" 
                                    : "bg-sidebar-muted/50"
                                )}>
                                  <item.icon className="h-4 w-4" />
                                </div>
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