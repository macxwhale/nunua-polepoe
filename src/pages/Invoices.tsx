import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, FileText } from "lucide-react";
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
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="space-y-1">
            <div className="h-6 w-32 bg-muted animate-shimmer rounded" />
            <div className="h-4 w-48 bg-muted animate-shimmer rounded" />
          </div>
          <div className="h-9 w-32 bg-muted animate-shimmer rounded" />
        </div>
        <div className="rounded-md border border-border overflow-hidden">
          <div className="bg-muted h-10 w-full" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="border-t border-border p-3 space-y-2">
              <div className="h-4 bg-muted animate-shimmer rounded w-1/4" />
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
            Invoices
          </h1>
          <p className="text-muted-foreground text-xs">
            Create and manage customer invoices
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)} size="sm" className="gap-1.5">
          <Plus className="h-4 w-4" />
          Create Invoice
        </Button>
      </div>

      {/* Content */}
      {invoices.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No invoices yet"
          description="Create your first invoice when you're ready."
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
