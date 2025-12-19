import { ReactNode, useState } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Input } from "@/components/ui/input";
import { Search, ChevronDown, UserRound, Menu } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { GlobalSearch } from "@/components/GlobalSearch";
import { NotificationDropdown } from "@/components/NotificationDropdown";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchOpen, setSearchOpen] = useState(false);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error('Failed to log out');
    } else {
      toast.success('Logged out successfully');
      navigate('/auth', { replace: true });
    }
  };

  const getUserName = () => {
    if (!user) return "User";
    return user.user_metadata?.full_name || user.email?.split('@')[0] || "User";
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <main className="flex-1 flex flex-col">
          <header className="sticky top-0 z-10 h-16 border-b-2 border-primary bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 flex items-center justify-between px-6">
            <div className="flex items-center gap-4 flex-1 max-w-2xl">
              <SidebarTrigger className="hover:bg-primary/10 text-primary transition-colors" />
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
                <Input 
                  placeholder="Search clients, invoices, products..." 
                  className="pl-9 bg-primary/5 border border-primary/20 focus-visible:ring-1 focus-visible:ring-primary cursor-pointer"
                  onClick={() => setSearchOpen(true)}
                  readOnly
                />
                <kbd className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 hidden h-5 select-none items-center gap-1 rounded border border-primary/20 bg-primary/10 px-1.5 font-mono text-[10px] font-medium text-primary opacity-100 sm:flex">
                  <span className="text-xs">⌘</span>K
                </kbd>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <NotificationDropdown />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="gap-2 hover:bg-primary/10">
                    <Avatar className="h-8 w-8 ring-2 ring-primary/30">
                      <AvatarFallback className="bg-secondary text-white">
                        <UserRound className="h-5 w-5" />
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium hidden md:inline-block">{getUserName()}</span>
                    <ChevronDown className="h-4 w-4 text-primary" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 border-primary/20">
                  <DropdownMenuLabel className="text-primary">My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-primary/10" />
                  <DropdownMenuItem className="focus:bg-primary/10 focus:text-primary">Profile</DropdownMenuItem>
                  <DropdownMenuItem className="focus:bg-primary/10 focus:text-primary">Settings</DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-primary/10" />
                  <DropdownMenuItem onClick={handleLogout} className="text-secondary focus:text-secondary focus:bg-secondary/10">
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>
          <div className="flex-1 p-6 md:p-8 lg:p-10 animate-in fade-in duration-300">
            {children}
          </div>
        </main>
      </div>
      <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />
    </SidebarProvider>
  );
}
