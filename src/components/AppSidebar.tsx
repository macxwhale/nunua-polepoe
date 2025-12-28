import { useState } from "react";
import { LayoutDashboard, Users, FileText, Package, ChevronDown, Plus, Smartphone } from "lucide-react";
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
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

type IconColor = "green" | "red";

interface MenuItem {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
  iconColor: IconColor;
}

interface MenuGroup {
  label: string;
  items: MenuItem[];
}

const menuGroups: MenuGroup[] = [
  {
    label: "DASHBOARDS",
    items: [
      { title: "Overview", url: "/", icon: LayoutDashboard, iconColor: "green" },
    ]
  },
  {
    label: "CLIENT & SALES",
    items: [
      { title: "Clients", url: "/clients", icon: Users, iconColor: "green" },
      { title: "Invoices", url: "/invoices", icon: FileText, iconColor: "red" },
      { title: "Products", url: "/products", icon: Package, iconColor: "green" },
    ]
  },
  {
    label: "SETTINGS",
    items: [
      { title: "Payments", url: "/payments", icon: Smartphone, iconColor: "green" },
    ]
  }
];

// Get icon color class based on type
const getIconColorClass = (color: IconColor, isActive: boolean): string => {
  if (isActive) return "text-white";
  return color === "green" ? "text-primary" : "text-destructive";
};

// Get hover background class based on icon color
const getHoverClass = (color: IconColor): string => {
  return color === "green" 
    ? "hover:bg-[hsl(142,60%,92%)]" 
    : "hover:bg-[hsl(0,86%,97%)]";
};

// Get active background class based on icon color
const getActiveClass = (color: IconColor): string => {
  return color === "green" 
    ? "bg-primary text-white" 
    : "bg-destructive text-white";
};

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
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <LayoutDashboard className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-sm font-display font-bold text-primary">Lipia Pole Pole</h1>
              <p className="text-xs text-muted-foreground">Credit Management</p>
            </div>
          </div>
        ) : (
          <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
            <LayoutDashboard className="h-4 w-4 text-primary" />
          </div>
        )}
      </div>

      <SidebarContent className="px-3 py-5">
        {menuGroups.map((group) => (
          <SidebarGroup key={group.label} className="mb-4">
            {/* Only show collapsible header when expanded */}
            {showText && (
              <Collapsible
                open={openGroups.includes(group.label)}
                onOpenChange={() => toggleGroup(group.label)}
              >
                <CollapsibleTrigger className="w-full">
                  <SidebarGroupLabel className="text-[11px] font-semibold text-gray-500 uppercase tracking-widest px-3 py-2 mb-2 flex items-center justify-between hover:text-gray-700 cursor-pointer transition-colors duration-200">
                    <span>{group.label}</span>
                    <ChevronDown className={cn(
                      "h-3.5 w-3.5 transition-transform duration-200 ease-out",
                      !openGroups.includes(group.label) && "-rotate-90"
                    )} />
                  </SidebarGroupLabel>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarGroupContent>
                    <SidebarMenu className="space-y-2">
                      {/* Add Client Quick Action */}
                      {group.label === "CLIENT & SALES" && (
                        <SidebarMenuItem>
                          <button
                            onClick={() => {
                              setClientDialogOpen(true);
                              handleMobileMenuClick();
                            }}
                            className="flex items-center gap-3 px-4 py-3 text-sm font-medium w-full min-h-[48px] rounded-xl bg-primary text-white hover:bg-primary/90 hover:shadow-md active:scale-[0.98] transition-all duration-200 ease-out"
                          >
                            <Plus className="h-5 w-5 flex-shrink-0" />
                            <span>Add Client</span>
                          </button>
                        </SidebarMenuItem>
                      )}
                      
                      {group.items.map((item) => (
                        <SidebarMenuItem key={item.title}>
                          <NavLink
                            to={item.url}
                            end
                            onClick={handleMobileMenuClick}
                            className={({ isActive }) =>
                              cn(
                                "flex items-center gap-3 px-4 py-3 text-sm font-medium w-full min-h-[48px] rounded-xl transition-all duration-200 ease-out",
                                isActive
                                  ? cn(getActiveClass(item.iconColor), "font-semibold shadow-sm")
                                  : cn("text-gray-700", getHoverClass(item.iconColor), "hover:text-gray-900")
                              )
                            }
                          >
                            {({ isActive }) => (
                              <>
                                <item.icon className={cn("h-5 w-5 flex-shrink-0", getIconColorClass(item.iconColor, isActive))} />
                                <span>{item.title}</span>
                              </>
                            )}
                          </NavLink>
                        </SidebarMenuItem>
                      ))}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </CollapsibleContent>
              </Collapsible>
            )}

            {/* Collapsed state - show icons only, evenly spaced */}
            {!showText && (
              <SidebarGroupContent>
                <SidebarMenu className="flex flex-col items-center gap-3">
                  {/* Add Client Quick Action */}
                  {group.label === "CLIENT & SALES" && (
                    <SidebarMenuItem className="w-full flex justify-center">
                      <button
                        onClick={() => {
                          setClientDialogOpen(true);
                          handleMobileMenuClick();
                        }}
                        className="w-10 h-10 rounded-xl bg-primary text-white hover:bg-primary/90 flex items-center justify-center transition-all duration-200"
                        title="Add Client"
                      >
                        <Plus className="h-5 w-5" />
                      </button>
                    </SidebarMenuItem>
                  )}
                  
                  {group.items.map((item) => (
                    <SidebarMenuItem key={item.title} className="w-full flex justify-center">
                      <NavLink
                        to={item.url}
                        end
                        onClick={handleMobileMenuClick}
                        title={item.title}
                        className={({ isActive }) =>
                          cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200",
                            isActive
                              ? cn(getActiveClass(item.iconColor), "shadow-sm")
                              : cn("text-gray-700 hover:bg-muted")
                          )
                        }
                      >
                        {({ isActive }) => (
                          <item.icon className={cn("h-5 w-5", getIconColorClass(item.iconColor, isActive))} />
                        )}
                      </NavLink>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            )}
          </SidebarGroup>
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
