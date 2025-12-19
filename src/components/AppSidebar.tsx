import { useState } from "react";
import { LayoutDashboard, Users, FileText, Package, Plus, Smartphone, ChevronDown, Wallet } from "lucide-react";
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
  const { state, openMobile, setOpenMobile } = useSidebar();
  const isMobile = useIsMobile();
  const [openGroups, setOpenGroups] = useState<string[]>(["Dashboards", "Client & Sales", "Settings"]);
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
      {/* Brand Header */}
      <div className={cn(
        "p-4 border-b border-white/10",
        !showText && "flex justify-center p-3"
      )}>
        {showText ? (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-secondary rounded-lg flex items-center justify-center shadow-md">
              <Wallet className="h-5 w-5 text-white" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-base font-bold text-white leading-tight">Lipia Pole Pole</h1>
              <span className="text-[10px] text-white/60 font-medium">Pay Slowly, Build Trust</span>
            </div>
          </div>
        ) : (
          <div className="w-10 h-10 bg-secondary rounded-lg flex items-center justify-center shadow-md">
            <Wallet className="h-5 w-5 text-white" />
          </div>
        )}
      </div>

      <SidebarContent className="px-3 py-4">
        {menuGroups.map((group) => {
          const isOpen = openGroups.includes(group.label);
          
          return (
            <Collapsible
              key={group.label}
              open={isOpen}
              onOpenChange={() => toggleGroup(group.label)}
              className="mb-2"
            >
              <SidebarGroup className="p-0">
                <CollapsibleTrigger className="w-full group/collapsible">
                  <SidebarGroupLabel className={cn(
                    "text-[11px] font-semibold text-white/50 uppercase tracking-wider px-3 py-2 flex items-center justify-between hover:text-white/70 transition-colors cursor-pointer rounded-md hover:bg-white/5",
                    !showText && "justify-center px-2"
                  )}>
                    <span>{showText ? group.label : ""}</span>
                    {showText && (
                      <ChevronDown className={cn(
                        "h-3.5 w-3.5 transition-transform duration-200",
                        isOpen ? "rotate-0" : "-rotate-90"
                      )} />
                    )}
                  </SidebarGroupLabel>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarGroupContent>
                    <SidebarMenu className="space-y-0.5 mt-1">
                      {/* Add Client Button - only in Client & Sales */}
                      {group.label === "Client & Sales" && (
                        <SidebarMenuItem>
                          <button
                            onClick={() => {
                              setClientDialogOpen(true);
                              handleMobileMenuClick();
                            }}
                            className={cn(
                              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150 bg-secondary hover:bg-secondary/80 text-white w-full",
                              !showText && "justify-center px-2"
                            )}
                          >
                            <Plus className="h-4 w-4 flex-shrink-0" />
                            {showText && <span>Add Client</span>}
                          </button>
                        </SidebarMenuItem>
                      )}
                      
                      {/* Menu Items */}
                      {group.items.map((item) => (
                        <SidebarMenuItem key={item.title}>
                          <SidebarMenuButton asChild>
                            <NavLink
                              to={item.url}
                              end
                              onClick={handleMobileMenuClick}
                              className={({ isActive }) =>
                                cn(
                                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150",
                                  isActive
                                    ? "bg-white text-primary shadow-sm"
                                    : "text-white/90 hover:bg-white/10 hover:text-white",
                                  !showText && "justify-center px-2"
                                )
                              }
                            >
                              <item.icon className="h-4 w-4 flex-shrink-0" />
                              {showText && <span>{item.title}</span>}
                            </NavLink>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      ))}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </CollapsibleContent>
              </SidebarGroup>
            </Collapsible>
          );
        })}
      </SidebarContent>

      <ClientDialog
        open={clientDialogOpen}
        onClose={() => setClientDialogOpen(false)}
        client={null}
      />
    </Sidebar>
  );
}
