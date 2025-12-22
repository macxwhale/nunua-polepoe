import { useState } from "react";
import { Button } from "@/components/ui/button";
import { MoreVertical, ArrowUpCircle, Receipt, ArrowLeftRight, XCircle, Pencil, Power } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SimpleTopUpDialog } from "./SimpleTopUpDialog";
import { ClientSalesDialog } from "./ClientSalesDialog";
import { ClientTransactionsDialog } from "./ClientTransactionsDialog";
import { DeleteConfirmDialog } from "@/shared/components/DeleteConfirmDialog";
import { useDeleteClient, useUpdateClient } from "@/hooks/useClients";
import type { ClientWithDetails } from "@/api/clients.api";
import { toast } from "@/hooks/use-toast";

interface ClientActionsProps {
  client: ClientWithDetails;
  onEdit: (client: ClientWithDetails) => void;
  onRefresh: () => void;
}

export function ClientActions({ client, onEdit, onRefresh }: ClientActionsProps) {
  const [topUpDialogOpen, setTopUpDialogOpen] = useState(false);
  const [salesDialogOpen, setSalesDialogOpen] = useState(false);
  const [transactionsDialogOpen, setTransactionsDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const deleteClient = useDeleteClient();
  const updateClient = useUpdateClient();

  const handleDelete = async () => {
    await deleteClient.mutateAsync(client.id);
    setDeleteDialogOpen(false);
    onRefresh();
  };

  const handleToggleStatus = async () => {
    const newStatus = client.status === "open" ? "closed" : "open";
    try {
      await updateClient.mutateAsync({
        id: client.id,
        updates: { status: newStatus },
      });
      toast({
        title: "Status Updated",
        description: `Client status changed to ${newStatus === "open" ? "Active" : "Closed"}.`,
      });
      onRefresh();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update client status.",
        variant: "destructive",
      });
    }
  };

  const handleTopUpClick = () => {
    if (client.totalInvoiced === 0) {
      toast({
        title: "No Invoice Value",
        description: "This client has 0 invoice value. Opening sales view.",
      });
      setSalesDialogOpen(true);
    } else {
      setTopUpDialogOpen(true);
    }
  };

  const isOpen = client.status === "open";

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="ghost" 
            size="sm"
            className="h-8 w-8 p-0 opacity-60 group-hover:opacity-100 transition-opacity hover:bg-accent/10"
          >
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48 bg-popover z-50">
          <DropdownMenuItem
            className="cursor-pointer"
            onClick={() => onEdit(client)}
          >
            <Pencil className="h-4 w-4 mr-2" />
            Edit Client
          </DropdownMenuItem>
          <DropdownMenuItem
            className="cursor-pointer"
            onClick={handleTopUpClick}
          >
            <ArrowUpCircle className="h-4 w-4 mr-2" />
            Top Up
          </DropdownMenuItem>
          <DropdownMenuItem
            className="cursor-pointer"
            onClick={() => setSalesDialogOpen(true)}
          >
            <Receipt className="h-4 w-4 mr-2" />
            View Sales
          </DropdownMenuItem>
          <DropdownMenuItem
            className="cursor-pointer"
            onClick={() => setTransactionsDialogOpen(true)}
          >
            <ArrowLeftRight className="h-4 w-4 mr-2" />
            View Transactions
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="cursor-pointer"
            onClick={handleToggleStatus}
          >
            <Power className="h-4 w-4 mr-2" />
            {isOpen ? "Close Account" : "Reopen Account"}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setDeleteDialogOpen(true)}
            className="text-destructive cursor-pointer focus:text-destructive"
          >
            <XCircle className="h-4 w-4 mr-2" />
            Drop Invoice Account
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <SimpleTopUpDialog
        open={topUpDialogOpen}
        onClose={() => {
          setTopUpDialogOpen(false);
          onRefresh();
        }}
        client={client}
      />
      <ClientSalesDialog
        open={salesDialogOpen}
        onClose={() => {
          setSalesDialogOpen(false);
          onRefresh();
        }}
        client={client}
      />
      <ClientTransactionsDialog
        open={transactionsDialogOpen}
        onClose={() => {
          setTransactionsDialogOpen(false);
          onRefresh();
        }}
        client={client}
      />
      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        title="Are you sure?"
        description={`This will permanently delete the client "${client.name}" and all associated records. This action cannot be undone.`}
        isLoading={deleteClient.isPending}
      />
    </>
  );
}
