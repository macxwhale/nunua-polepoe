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
          <Collapsible
            key={group.label}
            open={openGroups.includes(group.label)}
            onOpenChange={() => toggleGroup(group.label)}
            className="mb-4"
          >
            <SidebarGroup>
              <CollapsibleTrigger className="w-full group/collapsible">
                <SidebarGroupLabel className={cn(
                  "text-[11px] font-semibold text-gray-500 uppercase tracking-widest px-3 py-2 mb-2 flex items-center justify-between hover:text-gray-700 cursor-pointer transition-colors duration-200",
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
                  <SidebarMenu className="space-y-2">
                    {/* Add Client Quick Action */}
                    {group.label === "CLIENT & SALES" && (
                      <SidebarMenuItem>
                        <button
                          onClick={() => {
                            setClientDialogOpen(true);
                            handleMobileMenuClick();
                          }}
                          className={cn(
                            "flex items-center gap-3 px-4 py-3 text-sm font-medium w-full",
                            "min-h-[48px]", // WCAG touch target
                            "rounded-xl",
                            "bg-primary text-white",
                            "hover:bg-primary/90 hover:shadow-md",
                            "active:scale-[0.98]",
                            "transition-all duration-200 ease-out",
                            !showText && "justify-center px-3"
                          )}
                        >
                          <Plus className="h-5 w-5 flex-shrink-0" />
                          {showText && <span>Add Client</span>}
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
                              // Base styles - Industry standard
                              "flex items-center gap-3 px-4 py-3 text-sm font-medium w-full",
                              "min-h-[48px]", // WCAG touch target (48px)
                              "rounded-xl", // Rounded corners
                              "transition-all duration-200 ease-out",
                              
                              isActive
                                // Active: Semantic background, white text
                                ? cn(getActiveClass(item.iconColor), "font-semibold shadow-sm")
                                // Inactive: Dark readable text, semantic hover
                                : cn(
                                    "text-gray-700", // Solid dark text - ALWAYS readable
                                    getHoverClass(item.iconColor),
                                    "hover:text-gray-900"
                                  ),
                              !showText && "justify-center px-3"
                            )
                          }
                        >
                          {({ isActive }) => (
                            <>
                              <item.icon className={cn(
                                "h-5 w-5 flex-shrink-0",
                                getIconColorClass(item.iconColor, isActive)
                              )} />
                              {showText && (
                                <span>{item.title}</span>
                              )}
                            </>
                          )}
                        </NavLink>
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
