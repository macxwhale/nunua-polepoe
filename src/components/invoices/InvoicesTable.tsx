import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash, Download, Printer, MessageSquare } from "lucide-react";
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
  
  const rainbowGradients = [
    "from-violet-500/90 via-purple-500/90 to-fuchsia-500/90",
    "from-blue-500/90 via-cyan-500/90 to-teal-500/90",
    "from-emerald-500/90 via-green-500/90 to-lime-500/90",
    "from-amber-500/90 via-orange-500/90 to-red-500/90",
    "from-pink-500/90 via-rose-500/90 to-red-500/90",
    "from-indigo-500/90 via-blue-500/90 to-cyan-500/90",
  ];
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

  return (
    <>
      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {invoices.map((invoice, index) => {
          const gradientClass = rainbowGradients[index % rainbowGradients.length];
          
          return (
            <div 
              key={invoice.id} 
              className={`group rounded-xl overflow-hidden bg-gradient-to-br ${gradientClass} hover:scale-[1.02] text-white transition-all duration-300 shadow-lg hover:shadow-2xl border-0 p-5 space-y-4`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="font-bold text-base">
                    {(invoice as any).products?.name || invoice.invoice_number}
                  </div>
                  <div className="text-xs text-white/90 mt-1">
                    {formatDateShort(invoice.created_at)}
                  </div>
                </div>
                <Badge
                  className={`${
                    invoice.status === "paid"
                      ? "bg-white/20 text-white border-white/30"
                      : invoice.status === "pending"
                      ? "bg-yellow-500/30 text-white border-yellow-300/50"
                      : "bg-red-500/30 text-white border-red-300/50"
                  } backdrop-blur-sm`}
                >
                  {invoice.status}
                </Badge>
              </div>
              
              <div className="space-y-3 pt-3 border-t border-white/20">
                <div className="flex justify-between items-center">
                  <span className="text-white/90 text-sm">Amount</span>
                  <span className="font-bold text-white text-2xl">
                    {formatCurrency(invoice.amount)}
                  </span>
                </div>
                {invoice.notes && (
                  <div className="text-sm text-white/90 bg-black/10 rounded-lg p-3 backdrop-blur-sm">
                    {invoice.notes}
                  </div>
                )}
              </div>
              
              <div className="flex flex-wrap gap-2 pt-3 border-t border-white/20">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => handleDownloadPDF(invoice)} 
                  className="h-9 px-3 bg-white/20 hover:bg-white/30 text-white border-0 backdrop-blur-sm text-xs font-medium"
                >
                  <Download className="h-3.5 w-3.5 mr-1.5" />
                  PDF
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => handlePrintPDF(invoice)} 
                  className="h-9 px-3 bg-white/20 hover:bg-white/30 text-white border-0 backdrop-blur-sm text-xs font-medium"
                >
                  <Printer className="h-3.5 w-3.5 mr-1.5" />
                  Print
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => handleSendWhatsApp(invoice)} 
                  className="h-9 px-3 bg-white/20 hover:bg-white/30 text-white border-0 backdrop-blur-sm text-xs font-medium"
                >
                  <MessageSquare className="h-3.5 w-3.5 mr-1.5" />
                  Send
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => onEdit(invoice)}
                  className="h-9 px-3 bg-white/20 hover:bg-white/30 text-white border-0 backdrop-blur-sm text-xs font-medium"
                >
                  <Edit className="h-3.5 w-3.5 mr-1.5" />
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteClick(invoice)}
                  className="h-9 px-3 bg-red-500/30 hover:bg-red-500/50 text-white border-0 backdrop-blur-sm text-xs font-medium"
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
      <div className="hidden md:block rounded-xl border border-border/40 overflow-hidden bg-card shadow-lg">
        <Table>
          <TableHeader>
            <TableRow className="bg-gradient-to-r from-violet-500/20 via-purple-500/20 to-fuchsia-500/20 hover:from-violet-500/30 hover:via-purple-500/30 hover:to-fuchsia-500/30 border-b border-border/30">
              <TableHead className="text-foreground font-semibold text-sm tracking-wider h-12">
                INVOICE #
              </TableHead>
              <TableHead className="text-foreground font-semibold text-sm tracking-wider h-12">
                AMOUNT
              </TableHead>
              <TableHead className="text-foreground font-semibold text-sm tracking-wider h-12">
                STATUS
              </TableHead>
              <TableHead className="text-foreground font-semibold text-sm tracking-wider h-12">
                DATE
              </TableHead>
              <TableHead className="text-foreground font-semibold text-sm tracking-wider h-12 text-right">
                ACTIONS
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="bg-card">
            {invoices.map((invoice, index) => {
              const rowGradient = rainbowGradients[index % rainbowGradients.length];
              
              return (
                <TableRow 
                  key={invoice.id} 
                  className="relative hover:text-white transition-all duration-200 border-b border-border/30 group overflow-hidden"
                  style={{
                    background: 'transparent'
                  }}
                  onMouseEnter={(e) => {
                    const gradients = {
                      0: 'linear-gradient(to right, rgb(139 92 246 / 0.9), rgb(168 85 247 / 0.9), rgb(217 70 239 / 0.9))',
                      1: 'linear-gradient(to right, rgb(59 130 246 / 0.9), rgb(6 182 212 / 0.9), rgb(20 184 166 / 0.9))',
                      2: 'linear-gradient(to right, rgb(16 185 129 / 0.9), rgb(34 197 94 / 0.9), rgb(132 204 22 / 0.9))',
                      3: 'linear-gradient(to right, rgb(245 158 11 / 0.9), rgb(249 115 22 / 0.9), rgb(239 68 68 / 0.9))',
                      4: 'linear-gradient(to right, rgb(236 72 153 / 0.9), rgb(244 63 94 / 0.9), rgb(239 68 68 / 0.9))',
                      5: 'linear-gradient(to right, rgb(99 102 241 / 0.9), rgb(59 130 246 / 0.9), rgb(6 182 212 / 0.9))',
                    };
                    e.currentTarget.style.background = gradients[index % 6];
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <TableCell className="font-semibold py-5 group-hover:text-white">{(invoice as any).products?.name || invoice.invoice_number}</TableCell>
                  <TableCell className="font-bold py-5 text-lg group-hover:text-white">{formatCurrency(invoice.amount)}</TableCell>
                  <TableCell className="py-5">
                    <Badge
                      className={`group-hover:bg-white/20 group-hover:text-white group-hover:border-white/30 ${
                        invoice.status === "paid"
                          ? "bg-green-500/20 text-green-700 border-green-300"
                          : invoice.status === "pending"
                          ? "bg-yellow-500/20 text-yellow-700 border-yellow-300"
                          : "bg-red-500/20 text-red-700 border-red-300"
                      }`}
                    >
                      {invoice.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-5 group-hover:text-white">{formatDateShort(invoice.created_at)}</TableCell>
                  <TableCell className="py-5">
                    <div className="flex justify-end gap-1">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleDownloadPDF(invoice)} 
                        title="Download PDF"
                        className="h-9 w-9 hover:bg-white/20 group-hover:text-white group-hover:hover:bg-white/30"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handlePrintPDF(invoice)} 
                        title="Print"
                        className="h-9 w-9 hover:bg-white/20 group-hover:text-white group-hover:hover:bg-white/30"
                      >
                        <Printer className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleSendWhatsApp(invoice)} 
                        title="Send via WhatsApp"
                        className="h-9 w-9 hover:bg-white/20 group-hover:text-white group-hover:hover:bg-white/30"
                      >
                        <MessageSquare className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => onEdit(invoice)}
                        title="Edit"
                        className="h-9 w-9 hover:bg-white/20 group-hover:text-white group-hover:hover:bg-white/30"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteClick(invoice)}
                        title="Delete"
                        className="h-9 w-9 hover:bg-red-500/30 group-hover:text-white group-hover:hover:bg-red-500/50"
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
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
