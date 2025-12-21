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
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="space-y-1">
            <div className="h-6 w-32 bg-muted animate-shimmer rounded" />
            <div className="h-4 w-48 bg-muted animate-shimmer rounded" />
          </div>
          <div className="h-9 w-28 bg-muted animate-shimmer rounded" />
        </div>
        <div className="h-9 w-full bg-muted animate-shimmer rounded" />
        <div className="rounded-md border border-border overflow-hidden">
          <div className="bg-muted h-10 w-full" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="border-t border-border p-3 space-y-2">
              <div className="h-4 bg-muted animate-shimmer rounded w-1/3" />
              <div className="h-3 bg-muted animate-shimmer rounded w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-lg font-display font-bold text-foreground">
            Clients
          </h1>
          <p className="text-muted-foreground text-xs">
            Manage customer relationships and accounts
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)} size="sm" className="gap-1.5">
          <Plus className="h-4 w-4" />
          Add Client
        </Button>
      </div>

      {/* Search Bar */}
      {clients.length > 0 && (
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, phone, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-9"
          />
        </div>
      )}

      {/* Content */}
      {clients.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No clients yet"
          description="Start building lasting relationships by adding your first client."
          action={{
            label: "Add Client",
            onClick: () => setDialogOpen(true),
          }}
        />
      ) : filteredClients.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground rounded-md border border-dashed border-border">
          <Search className="h-8 w-8 mx-auto mb-2 opacity-40" />
          <p className="text-sm">No clients found matching "<span className="font-medium text-foreground">{searchQuery}</span>"</p>
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
