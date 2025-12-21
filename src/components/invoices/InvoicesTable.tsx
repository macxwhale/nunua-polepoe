import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash, Download, Printer, MessageSquare, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { downloadInvoicePDF, printInvoicePDF } from "@/lib/pdfGenerator";
import { sendWhatsAppInvoice } from "@/lib/whatsapp";
import { toast } from "sonner";
import { DeleteConfirmDialog } from "@/shared/components/DeleteConfirmDialog";
import { useDeleteInvoice } from "@/hooks/useInvoices";
import { formatCurrency, formatDateShort } from "@/shared/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Tables } from "@/integrations/supabase/types";

type Invoice = Tables<"invoices">;

interface InvoicesTableProps {
  invoices: Invoice[];
  onEdit: (invoice: Invoice) => void;
  onRefresh: () => void;
}

export function InvoicesTable({ invoices, onEdit, onRefresh }: InvoicesTableProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState<Invoice | null>(null);
  const deleteInvoice = useDeleteInvoice();

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
              className={`rounded-xl border bg-card shadow-sm p-4 space-y-3 transition-all duration-200 hover:shadow-md ${
                isPaid ? 'border-l-4 border-l-primary border-border/40' : 'border-l-4 border-l-secondary border-border/40'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    isPaid ? 'bg-primary/10' : 'bg-secondary/10'
                  }`}>
                    <FileText className={`h-5 w-5 ${isPaid ? 'text-primary' : 'text-secondary'}`} />
                  </div>
                  <div>
                    <div className="font-display font-bold text-sm text-foreground">
                      {(invoice as any).products?.name || invoice.invoice_number}
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
              
              <div className="flex flex-wrap gap-2 pt-3 border-t border-border/30">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleDownloadPDF(invoice)} 
                  className="h-8 px-3 text-xs"
                >
                  <Download className="h-3.5 w-3.5 mr-1.5" />
                  PDF
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handlePrintPDF(invoice)} 
                  className="h-8 px-3 text-xs"
                >
                  <Printer className="h-3.5 w-3.5 mr-1.5" />
                  Print
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleSendWhatsApp(invoice)} 
                  className="h-8 px-3 text-xs"
                >
                  <MessageSquare className="h-3.5 w-3.5 mr-1.5" />
                  Send
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => onEdit(invoice)}
                  className="h-8 px-3 text-xs"
                >
                  <Edit className="h-3.5 w-3.5 mr-1.5" />
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteClick(invoice)}
                  className="h-8 px-3 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash className="h-3.5 w-3.5 mr-1.5" />
                  Delete
                </Button>
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
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                      invoice.status === 'paid' ? 'bg-primary/10' : 'bg-secondary/10'
                    }`}>
                      <FileText className={`h-4 w-4 ${
                        invoice.status === 'paid' ? 'text-primary' : 'text-secondary'
                      }`} />
                    </div>
                    <span className="font-medium">{(invoice as any).products?.name || invoice.invoice_number}</span>
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
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => onEdit(invoice)}
                      title="Edit"
                      className="h-8 w-8"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteClick(invoice)}
                      title="Delete"
                      className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
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
    </>
  );
}