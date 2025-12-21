import { ReactNode, useState } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Input } from "@/components/ui/input";
import { Search, ChevronDown, UserRound } from "lucide-react";
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

  const getInitials = () => {
    const name = getUserName();
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <main className="flex-1 flex flex-col">
          {/* Header */}
          <header className="sticky top-0 z-10 h-16 border-b border-border/50 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60 flex items-center justify-between px-4 md:px-6">
            <div className="flex items-center gap-3 flex-1 max-w-xl">
              <SidebarTrigger className="hover:bg-accent transition-colors rounded-lg" />
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search clients, invoices..." 
                  className="pl-10 bg-muted/40 border-0 focus-visible:ring-1 focus-visible:ring-primary/50 cursor-pointer rounded-xl h-10"
                  onClick={() => setSearchOpen(true)}
                  readOnly
                />
                <kbd className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 hidden h-6 select-none items-center gap-1 rounded-md border border-border bg-muted px-2 font-mono text-[10px] font-medium opacity-100 sm:flex">
                  <span className="text-xs">⌘</span>K
                </kbd>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <NotificationDropdown />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="gap-2 hover:bg-accent rounded-xl px-2">
                    <Avatar className="h-8 w-8 ring-2 ring-primary/20">
                      <AvatarFallback className="gradient-brand text-white font-display font-bold text-xs">
                        {getInitials()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium hidden md:inline-block">{getUserName()}</span>
                    <ChevronDown className="h-4 w-4 text-muted-foreground hidden md:block" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 rounded-xl">
                  <DropdownMenuLabel className="font-display">My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="cursor-pointer rounded-lg">Profile</DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer rounded-lg">Settings</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={handleLogout} 
                    className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer rounded-lg"
                  >
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>
          
          {/* Main Content */}
          <div className="flex-1 p-4 md:p-6 lg:p-8 animate-fade-in">
            {children}
          </div>
        </main>
      </div>
      <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />
    </SidebarProvider>
  );
}