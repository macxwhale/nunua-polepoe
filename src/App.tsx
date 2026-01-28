import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { Layout } from "./components/Layout";
import { SuperAdminLayout } from "./components/SuperAdminLayout";
import { WhatsAppButton } from "./components/WhatsAppButton";
import { useAuth } from "./hooks/useAuth";
import { useUserRole } from "./hooks/useUserRole";
import Auth from "./pages/Auth";
import ClientDashboard from "./pages/ClientDashboard";
import Clients from "./pages/Clients";
import Dashboard from "./pages/Dashboard";
import Invoices from "./pages/Invoices";
import Landing from "./pages/Landing";
import NotFound from "./pages/NotFound";
import Payments from "./pages/Payments";
import Products from "./pages/Products";
import SuperAdmin from "./pages/SuperAdmin";
import SuperAdminTenants from "./pages/SuperAdminTenants";
import SuperAdminUsers from "./pages/SuperAdminUsers";

function ProtectedRoute({ children, requireOwner = false, requireSuperAdmin = false }: { children: React.ReactNode; requireOwner?: boolean; requireSuperAdmin?: boolean }) {
  const { user, loading: authLoading } = useAuth();
  const { role, isClient, isSuperAdmin, isLoading: roleLoading } = useUserRole();
  const location = useLocation();

  // Wait for both auth and role to finish loading
  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Redirect if superadmin is required but user is not superadmin
  if (requireSuperAdmin && !isSuperAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  // Redirect clients to their dashboard if they try to access owner pages
  if (requireOwner && isClient && location.pathname !== '/client-dashboard') {
    return <Navigate to="/client-dashboard" replace />;
  }

  // Don't wrap client dashboard in Layout
  if (location.pathname === '/client-dashboard') {
    return <>{children}</>;
  }

  // Special layout for superadmin pages
  if (location.pathname.startsWith('/superadmin')) {
    return <SuperAdminLayout>{children}</SuperAdminLayout>;
  }

  return <Layout>{children}</Layout>;
}

function DashboardRouter() {
  const { role, isLoading: roleLoading } = useUserRole();
  const { loading: authLoading } = useAuth();

  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (role === 'client') {
    return <Navigate to="/client-dashboard" replace />;
  }

  return <Dashboard />;
}

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <WhatsAppButton />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/auth" element={<Auth />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardRouter />
              </ProtectedRoute>
            }
          />
          <Route
            path="/superadmin"
            element={
              <ProtectedRoute requireSuperAdmin>
                <SuperAdmin />
              </ProtectedRoute>
            }
          />
          <Route
            path="/superadmin/tenants"
            element={
              <ProtectedRoute requireSuperAdmin>
                <SuperAdminTenants />
              </ProtectedRoute>
            }
          />
          <Route
            path="/superadmin/users"
            element={
              <ProtectedRoute requireSuperAdmin>
                <SuperAdminUsers />
              </ProtectedRoute>
            }
          />
          <Route
            path="/client-dashboard"
            element={
              <ProtectedRoute>
                <ClientDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/clients"
            element={
              <ProtectedRoute requireOwner>
                <Clients />
              </ProtectedRoute>
            }
          />
          <Route
            path="/invoices"
            element={
              <ProtectedRoute requireOwner>
                <Invoices />
              </ProtectedRoute>
            }
          />
          <Route
            path="/products"
            element={
              <ProtectedRoute requireOwner>
                <Products />
              </ProtectedRoute>
            }
          />
          <Route
            path="/payments"
            element={
              <ProtectedRoute requireOwner>
                <Payments />
              </ProtectedRoute>
            }
          />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
