import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useDeleteInvoice } from "@/hooks/useInvoices";
import { useCreateRefund } from "@/hooks/useTransactions";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { downloadInvoicePDF, printInvoicePDF } from "@/lib/pdfGenerator";
import { sendWhatsAppInvoice } from "@/lib/whatsapp";
import { DeleteConfirmDialog } from "@/shared/components/DeleteConfirmDialog";
import { formatCurrency, formatDateShort } from "@/shared/utils";
import { Download, Edit, FileText, MessageSquare, Printer, RotateCcw, Trash } from "lucide-react";
import { FeatureGate } from "@/components/FeatureGate";
import { useState, useEffect } from "react";
import { toast } from "sonner";

type Invoice = Tables<"invoices">;

interface InvoicesTableProps {
  invoices: Invoice[];
  onEdit: (invoice: Invoice) => void;
  onRefresh: () => void;
}

export function InvoicesTable({ invoices, onEdit, onRefresh }: InvoicesTableProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState<Invoice | null>(null);
  const [refundDialogOpen, setRefundDialogOpen] = useState(false);
  const [refundInvoice, setRefundInvoice] = useState<Invoice | null>(null);
  const [refundAmount, setRefundAmount] = useState("");
  const [refundNotes, setRefundNotes] = useState("");
  const [maxRefund, setMaxRefund] = useState(0);
  const [refundedInvoiceIds, setRefundedInvoiceIds] = useState<Set<string>>(new Set());
  const deleteInvoice = useDeleteInvoice();
  const createRefund = useCreateRefund();

  useEffect(() => {
    supabase
      .from("transactions")
      .select("invoice_id, amount")
      .eq("type", "payment")
      .lt("amount", 0)
      .then(({ data }) => {
        if (data) {
          setRefundedInvoiceIds(new Set(data.map((t) => t.invoice_id).filter(Boolean)));
        }
      });
  }, [invoices]);

  const handleRefundClick = async (invoice: Invoice) => {
    const { data } = await supabase
      .from("transactions")
      .select("amount")
      .eq("invoice_id", invoice.id)
      .eq("type", "payment");
    const paid = data?.reduce((sum, t) => sum + Number(t.amount), 0) ?? 0;
    setMaxRefund(paid);
    setRefundInvoice(invoice);
    setRefundAmount("");
    setRefundNotes("");
    setRefundDialogOpen(true);
  };

  const handleRefundConfirm = async () => {
    if (!refundInvoice) return;
    const amount = parseFloat(refundAmount);
    if (!amount || amount <= 0 || amount > maxRefund) return;
    await createRefund.mutateAsync({
      clientId: refundInvoice.client_id,
      invoiceId: refundInvoice.id,
      amount,
      notes: refundNotes || "Refund",
    });
    setRefundDialogOpen(false);
    setRefundInvoice(null);
    onRefresh();
  };

  const handleDownloadPDF = async (invoice: Invoice) => {
    try {
      const { data: client } = await supabase
        .from("clients")
        .select("name, email, phone_number")
        .eq("id", invoice.client_id)
        .single();

      const { data: { user } } = await supabase.auth.getUser();
      const { data: profile } = await supabase
        .from("profiles")
        .select("tenant_id")
        .eq("user_id", user?.id)
        .single();

      const { data: tenant } = await supabase
        .from("tenants")
        .select("business_name, phone_number")
        .eq("id", profile?.tenant_id)
        .single();

      let productData = null;
      if (invoice.product_id) {
        const { data: product } = await supabase
          .from("products")
          .select("name, description, price")
          .eq("id", invoice.product_id)
          .single();

        if (product) {
          productData = {
            name: product.name,
            description: product.description,
            price: product.price,
          };
        }
      }

      downloadInvoicePDF({
        ...invoice,
        product: productData,
        client: client || undefined,
        tenant: tenant || undefined
      });
      toast.success("Invoice downloaded");
    } catch (error) {
      console.error("Error downloading invoice:", error);
      toast.error("Failed to download invoice");
    }
  };

  const handlePrintPDF = async (invoice: Invoice) => {
    try {
      const { data: client } = await supabase
        .from("clients")
        .select("name, email, phone_number")
        .eq("id", invoice.client_id)
        .single();

      const { data: { user } } = await supabase.auth.getUser();
      const { data: profile } = await supabase
        .from("profiles")
        .select("tenant_id")
        .eq("user_id", user?.id)
        .single();

      const { data: tenant } = await supabase
        .from("tenants")
        .select("business_name, phone_number")
        .eq("id", profile?.tenant_id)
        .single();

      let productData = null;
      if (invoice.product_id) {
        const { data: product } = await supabase
          .from("products")
          .select("name, description, price")
          .eq("id", invoice.product_id)
          .single();

        if (product) {
          productData = {
            name: product.name,
            description: product.description,
            price: product.price,
          };
        }
      }

      printInvoicePDF({
        ...invoice,
        product: productData,
        client: client || undefined,
        tenant: tenant || undefined
      });
    } catch (error) {
      console.error("Error printing invoice:", error);
      toast.error("Failed to print invoice");
    }
  };

  const handleSendWhatsApp = async (invoice: Invoice) => {
    try {
      const { data: client } = await supabase
        .from("clients")
        .select("phone_number")
        .eq("id", invoice.client_id)
        .single();

      if (!client?.phone_number) {
        toast.error("Client phone number not found");
        return;
      }

      let productName: string | undefined;
      if (invoice.product_id) {
        const { data: product } = await supabase
          .from("products")
          .select("name")
          .eq("id", invoice.product_id)
          .single();
        productName = product?.name;
      }

      sendWhatsAppInvoice(client.phone_number, invoice.invoice_number, Number(invoice.amount), productName);
      toast.success("Opening WhatsApp...");
    } catch (error) {
      console.error("Error sending WhatsApp:", error);
      toast.error("Failed to send WhatsApp message");
    }
  };

  const handleDeleteClick = (invoice: Invoice) => {
    setInvoiceToDelete(invoice);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!invoiceToDelete) return;
    await deleteInvoice.mutateAsync(invoiceToDelete.id);
    setDeleteDialogOpen(false);
    setInvoiceToDelete(null);
    onRefresh();
  };

  const getStatusStyles = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-primary/10 text-primary border-primary/20";
      case "pending":
        return "bg-warning/10 text-warning-foreground border-warning/20";
      default:
        return "bg-secondary/10 text-secondary border-secondary/20";
    }
  };

  return (
    <>
      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {invoices.map((invoice, index) => {
          const isPaid = invoice.status === "paid";

          return (
            <div
              key={invoice.id}
              className={`rounded-xl border bg-card shadow-sm p-4 space-y-3 transition-all duration-200 hover:shadow-md ${isPaid ? 'border-l-4 border-l-primary border-border/40' : 'border-l-4 border-l-secondary border-border/40'
                }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isPaid ? 'bg-primary/10' : 'bg-secondary/10'
                    }`}>
                    <FileText className={`h-5 w-5 ${isPaid ? 'text-primary' : 'text-secondary'}`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 font-display font-bold text-sm text-foreground">
                      {(invoice as any).products?.name || invoice.invoice_number}
                      {refundedInvoiceIds.has(invoice.id) && (
                        <Badge className="text-[10px] px-1.5 py-0 h-4 bg-warning/10 text-warning border-warning/30 font-medium">
                          Refunded
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatDateShort(invoice.created_at)}
                    </div>
                  </div>
                </div>
                <Badge className={getStatusStyles(invoice.status)}>
                  {invoice.status}
                </Badge>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-border/30">
                <span className="text-sm text-muted-foreground">Amount</span>
                <span className={`font-display font-bold text-lg ${isPaid ? 'text-primary' : 'text-secondary'}`}>
                  {formatCurrency(invoice.amount)}
                </span>
              </div>

              {invoice.notes && (
                <div className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-3">
                  {invoice.notes}
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 pt-3 border-t border-border/30">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownloadPDF(invoice)}
                  className="h-9 px-3 text-xs"
                >
                  <Download className="h-3.5 w-3.5 mr-1.5" />
                  PDF
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePrintPDF(invoice)}
                  className="h-9 px-3 text-xs"
                >
                  <Printer className="h-3.5 w-3.5 mr-1.5" />
                  Print
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSendWhatsApp(invoice)}
                  className="h-9 px-3 text-xs"
                >
                  <MessageSquare className="h-3.5 w-3.5 mr-1.5" />
                  WhatsApp
                </Button>
                <FeatureGate feature="invoicing" fallback="lock">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(invoice)}
                    className="h-9 px-3 text-xs"
                  >
                    <Edit className="h-3.5 w-3.5 mr-1.5" />
                    Edit
                  </Button>
                </FeatureGate>
                {(invoice.status === "paid" || invoice.status === "partial") && (
                  <FeatureGate feature="invoicing" fallback="lock">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRefundClick(invoice)}
                      className="h-9 px-3 text-xs text-warning-foreground border-warning/40 hover:bg-warning/10"
                    >
                      <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                      Refund
                    </Button>
                  </FeatureGate>
                )}
                <FeatureGate feature="invoicing" fallback="lock">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteClick(invoice)}
                    className="h-9 px-3 text-xs text-destructive hover:text-destructive hover:bg-destructive/10 col-span-2"
                  >
                    <Trash className="h-3.5 w-3.5 mr-1.5" />
                    Delete Invoice
                  </Button>
                </FeatureGate>
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block rounded-xl border border-border/40 overflow-hidden bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/60 border-b border-border/50">
              <TableHead className="font-display font-bold text-xs uppercase tracking-wider h-12 text-muted-foreground">
                Invoice
              </TableHead>
              <TableHead className="font-display font-bold text-xs uppercase tracking-wider h-12 text-muted-foreground">
                Amount
              </TableHead>
              <TableHead className="font-display font-bold text-xs uppercase tracking-wider h-12 text-muted-foreground">
                Status
              </TableHead>
              <TableHead className="font-display font-bold text-xs uppercase tracking-wider h-12 text-muted-foreground">
                Date
              </TableHead>
              <TableHead className="font-display font-bold text-xs uppercase tracking-wider h-12 text-right text-muted-foreground">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.map((invoice, index) => (
              <TableRow
                key={invoice.id}
                className="hover:bg-muted/30 transition-colors border-b border-border/30"
              >
                <TableCell className="py-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${invoice.status === 'paid' ? 'bg-primary/10' : 'bg-secondary/10'
                      }`}>
                      <FileText className={`h-4 w-4 ${invoice.status === 'paid' ? 'text-primary' : 'text-secondary'
                        }`} />
                    </div>
                    <span className="font-medium">{(invoice as any).products?.name || invoice.invoice_number}</span>
                    {refundedInvoiceIds.has(invoice.id) && (
                      <Badge className="text-[10px] px-1.5 py-0 h-4 bg-warning/10 text-warning border-warning/30 font-medium">
                        Refunded
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell className="font-display font-bold text-base py-4">
                  {formatCurrency(invoice.amount)}
                </TableCell>
                <TableCell className="py-4">
                  <Badge className={getStatusStyles(invoice.status)}>
                    {invoice.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground py-4">
                  {formatDateShort(invoice.created_at)}
                </TableCell>
                <TableCell className="py-4">
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDownloadPDF(invoice)}
                      title="Download PDF"
                      className="h-8 w-8"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handlePrintPDF(invoice)}
                      title="Print"
                      className="h-8 w-8"
                    >
                      <Printer className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleSendWhatsApp(invoice)}
                      title="Send via WhatsApp"
                      className="h-8 w-8"
                    >
                      <MessageSquare className="h-4 w-4" />
                    </Button>
                    <FeatureGate feature="invoicing" fallback="lock">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEdit(invoice)}
                        title="Edit"
                        className="h-8 w-8"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </FeatureGate>
                    {(invoice.status === "paid" || invoice.status === "partial") && (
                      <FeatureGate feature="invoicing" fallback="lock">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRefundClick(invoice)}
                          title="Refund"
                          className="h-8 w-8 text-warning-foreground hover:bg-warning/10"
                        >
                          <RotateCcw className="h-4 w-4" />
                        </Button>
                      </FeatureGate>
                    )}
                    <FeatureGate feature="invoicing" fallback="lock">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteClick(invoice)}
                        title="Delete"
                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </FeatureGate>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Invoice"
        description={`Are you sure you want to delete invoice "${invoiceToDelete?.invoice_number}"? This action cannot be undone.`}
        isLoading={deleteInvoice.isPending}
      />

      <Dialog open={refundDialogOpen} onOpenChange={setRefundDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Refund</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              Invoice: <span className="font-medium text-foreground">{refundInvoice?.invoice_number}</span>
            </p>
            <p className="text-sm text-muted-foreground">
              Maximum refundable: <span className="font-medium text-foreground">{maxRefund.toLocaleString("en-KE", { style: "currency", currency: "KES" })}</span>
            </p>
            <div className="space-y-1.5">
              <Label htmlFor="refund-amount">Refund Amount (KSH)</Label>
              <Input
                id="refund-amount"
                type="number"
                min="0.01"
                max={maxRefund}
                step="0.01"
                placeholder="0.00"
                value={refundAmount}
                onChange={(e) => setRefundAmount(e.target.value)}
              />
              {refundAmount && (parseFloat(refundAmount) > maxRefund || parseFloat(refundAmount) <= 0) && (
                <p className="text-xs text-destructive">
                  Amount must be between 0 and {maxRefund.toLocaleString()}.
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="refund-notes">Notes (optional)</Label>
              <Input
                id="refund-notes"
                placeholder="Reason for refund..."
                value={refundNotes}
                onChange={(e) => setRefundNotes(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRefundDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleRefundConfirm}
              disabled={
                createRefund.isPending ||
                !refundAmount ||
                parseFloat(refundAmount) <= 0 ||
                parseFloat(refundAmount) > maxRefund
              }
            >
              {createRefund.isPending ? "Processing..." : "Confirm Refund"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}