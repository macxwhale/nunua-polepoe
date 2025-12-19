import { useState } from "react";
import { LayoutDashboard, Users, FileText, Package, Menu, Settings, Plus, Smartphone } from "lucide-react";
import { NavLink } from "react-router-dom";
import { ClientDialog } from "@/components/clients/ClientDialog";
import { Button } from "@/components/ui/button";
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
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

const menuGroups = [
  {
    label: "Dashboards",
    items: [
      { title: "Default", url: "/", icon: LayoutDashboard },
    ]
  },
  {
    label: "Client & Sales",
    items: [
      { title: "Client List", url: "/clients", icon: Users },
      { title: "Invoices", url: "/invoices", icon: FileText },
      { title: "Products", url: "/products", icon: Package },
    ]
  },
  {
    label: "Settings",
    items: [
      { title: "Payment", url: "/payments", icon: Smartphone },
    ]
  }
];

export function AppSidebar() {
  const { state, setOpen, open, openMobile, setOpenMobile } = useSidebar();
  const isMobile = useIsMobile();
  const [openGroups, setOpenGroups] = useState<string[]>(["Dashboards"]);
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
    <Sidebar collapsible="icon" className="border-r-0">
      <div className={cn("p-6 border-b border-sidebar-border", !showText && "flex justify-center")}>
        {showText ? (
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-secondary rounded-lg flex items-center justify-center shadow-lg">
              <LayoutDashboard className="h-7 w-7 text-white" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-xl font-extrabold text-white tracking-tight">Lipia Pole Pole</h1>
              <span className="text-xs text-primary-foreground/70">Pay Slowly, Build Trust</span>
            </div>
          </div>
        ) : (
          <div className="w-12 h-12 bg-secondary rounded-lg flex items-center justify-center shadow-lg">
            <LayoutDashboard className="h-7 w-7 text-white" />
          </div>
        )}
      </div>

      <SidebarContent className="px-3 py-6">
        {menuGroups.map((group) => (
          <Collapsible
            key={group.label}
            open={openGroups.includes(group.label)}
            onOpenChange={() => toggleGroup(group.label)}
            className="mb-4"
          >
            <SidebarGroup>
              <CollapsibleTrigger className="w-full group/collapsible">
                <SidebarGroupLabel className="text-xs font-semibold text-primary-foreground/60 uppercase tracking-wider px-3 mb-2 flex items-center justify-between hover:text-primary-foreground/80 transition-colors cursor-pointer">
                  <span>{showText ? group.label : ""}</span>
                  {showText && (
                    <Menu className="h-4 w-4" />
                  )}
                </SidebarGroupLabel>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarMenu className="space-y-1">
                    {group.label === "Client & Sales" && (
                        <SidebarMenuItem>
                        <button
                          onClick={() => {
                            setClientDialogOpen(true);
                            handleMobileMenuClick();
                          }}
                          className={cn(
                            "flex items-center gap-4 rounded-xl px-4 py-4 text-base font-semibold transition-all duration-200 bg-secondary hover:bg-secondary/90 text-white w-full shadow-sm hover:shadow-md hover:scale-105",
                            !showText && "justify-center"
                          )}
                        >
                          <Plus className="h-6 w-6 flex-shrink-0 text-white" />
                          {showText && <span>Add Client</span>}
                        </button>
                      </SidebarMenuItem>
                    )}
                    {group.items.map((item, index) => {
                      return (
                        <SidebarMenuItem key={item.title}>
                          <SidebarMenuButton asChild>
                            <NavLink
                              to={item.url}
                              end
                              onClick={handleMobileMenuClick}
                              className={({ isActive }) =>
                                cn(
                                  "flex items-center gap-4 rounded-xl px-4 py-4 text-base font-semibold transition-all duration-200",
                                  isActive
                                    ? "bg-white text-primary shadow-md scale-105"
                                    : "text-primary-foreground hover:bg-white/20 hover:scale-105",
                                  !showText && "justify-center"
                                )
                              }
                            >
                              <item.icon className="h-6 w-6 flex-shrink-0" />
                              {showText && <span>{item.title}</span>}
                            </NavLink>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      );
                    })}
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
