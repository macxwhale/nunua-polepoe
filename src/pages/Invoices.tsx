import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, FileText, Search } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { InvoicesTable } from "@/components/invoices/InvoicesTable";
import { InvoiceDialog } from "@/components/invoices/InvoiceDialog";
import { useInvoices } from "@/hooks/useInvoices";
import type { Tables } from "@/integrations/supabase/types";

type Invoice = Tables<"invoices">;

export default function Invoices() {
  const { data: invoices = [], isLoading: loading, refetch } = useInvoices();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);

  const handleEdit = (invoice: Invoice) => {
    setEditingInvoice(invoice);
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditingInvoice(null);
    refetch();
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-2 w-full sm:w-auto">
            <div className="h-9 w-40 bg-muted animate-shimmer rounded-xl" />
            <div className="h-4 w-64 bg-muted animate-shimmer rounded-lg" />
          </div>
          <div className="h-11 w-full sm:w-40 bg-muted animate-shimmer rounded-xl" />
        </div>
        <div className="rounded-xl border border-border/40 overflow-hidden">
          <div className="bg-muted/50 h-12 w-full" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="border-t border-border/30 p-5 space-y-3">
              <div className="h-4 bg-muted animate-shimmer rounded w-1/4" />
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
            Invoices
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Create and manage customer invoices
          </p>
        </div>
        <Button 
          onClick={() => setDialogOpen(true)} 
          variant="secondary"
          className="gap-2 w-full sm:w-auto shadow-md hover:shadow-glow-secondary"
        >
          <Plus className="h-4 w-4" />
          Create Invoice
        </Button>
      </div>

      {/* Content */}
      {invoices.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No invoices yet"
          description="When you're ready, create your first invoice. Every journey starts with a single step."
          action={{
            label: "Create Invoice",
            onClick: () => setDialogOpen(true),
          }}
        />
      ) : (
        <InvoicesTable invoices={invoices} onEdit={handleEdit} onRefresh={() => refetch()} />
      )}
      
      <InvoiceDialog
        open={dialogOpen}
        onClose={handleDialogClose}
        invoice={editingInvoice}
      />
    </div>
  );
}