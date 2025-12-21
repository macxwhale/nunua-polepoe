import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Users, Search } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { ClientsTable } from "@/components/clients/ClientsTable";
import { ClientDialog } from "@/components/clients/ClientDialog";
import { useClients } from "@/hooks/useClients";
import type { ClientWithDetails } from "@/api/clients.api";
import type { Tables } from "@/integrations/supabase/types";

type Client = Tables<"clients">;

export default function Clients() {
  const { data: clients = [], isLoading: loading, refetch } = useClients();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const handleEdit = (client: ClientWithDetails) => {
    setEditingClient(client);
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditingClient(null);
    refetch();
  };

  const filteredClients = useMemo(() => {
    if (!searchQuery.trim()) return clients;
    
    const query = searchQuery.toLowerCase();
    return clients.filter(client => 
      client.name?.toLowerCase().includes(query) ||
      client.phone_number?.toLowerCase().includes(query) ||
      client.email?.toLowerCase().includes(query)
    );
  }, [clients, searchQuery]);

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-2 w-full sm:w-auto">
            <div className="h-9 w-40 bg-muted animate-shimmer rounded-xl" />
            <div className="h-4 w-72 bg-muted animate-shimmer rounded-lg" />
          </div>
          <div className="h-11 w-full sm:w-36 bg-muted animate-shimmer rounded-xl" />
        </div>
        <div className="h-11 w-full bg-muted animate-shimmer rounded-xl" />
        <div className="rounded-xl border border-border/40 overflow-hidden">
          <div className="bg-muted/50 h-12 w-full" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="border-t border-border/30 p-5 space-y-3">
              <div className="h-4 bg-muted animate-shimmer rounded w-1/3" />
              <div className="h-4 bg-muted animate-shimmer rounded w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold tracking-tight text-foreground">
            Clients
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Manage your customer relationships and accounts
          </p>
        </div>
        <Button 
          onClick={() => setDialogOpen(true)} 
          className="gap-2 w-full sm:w-auto shadow-md hover:shadow-glow"
        >
          <Plus className="h-4 w-4" />
          Add Client
        </Button>
      </div>

      {/* Search Bar */}
      {clients.length > 0 && (
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, phone, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-11 h-11 bg-muted/40 border-border/50 focus-visible:ring-primary/50 rounded-xl"
          />
        </div>
      )}

      {/* Content */}
      {clients.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No clients yet"
          description="Take your time. Start building lasting relationships by adding your first client—there's no rush."
          action={{
            label: "Add Client",
            onClick: () => setDialogOpen(true),
          }}
        />
      ) : filteredClients.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground rounded-xl border border-dashed border-border/50 bg-muted/20">
          <Search className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p>No clients found matching "<span className="font-medium text-foreground">{searchQuery}</span>"</p>
        </div>
      ) : (
        <ClientsTable clients={filteredClients} onEdit={handleEdit} onRefresh={() => refetch()} />
      )}
      
      <ClientDialog
        open={dialogOpen}
        onClose={handleDialogClose}
        client={editingClient}
      />
    </div>
  );
}