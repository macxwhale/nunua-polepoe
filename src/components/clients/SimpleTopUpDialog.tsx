import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarIcon, Coins, TrendingUp, Banknote, FileText } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import type { ClientWithDetails } from "@/api/clients.api";
import { useInvoicesByClient } from "@/hooks/useInvoices";
import { useCreatePayment, useInvoicePaidAmount } from "@/hooks/useTransactions";
import type { Tables } from "@/integrations/supabase/types";

interface SimpleTopUpDialogProps {
  open: boolean;
  onClose: () => void;
  client: ClientWithDetails | null;
}

export function SimpleTopUpDialog({ open, onClose, client }: SimpleTopUpDialogProps) {
  const [date, setDate] = useState<Date>(new Date());
  const [amount, setAmount] = useState("");
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>("");
  const [selectedInvoice, setSelectedInvoice] = useState<Tables<"invoices"> | null>(null);

  const { data: invoices = [], refetch: refetchInvoices } = useInvoicesByClient(client?.id || "");
  const createPayment = useCreatePayment();
  
  // Get paid amount for selected invoice
  const { data: paidAmount = 0 } = useInvoicePaidAmount(selectedInvoiceId);

  // Filter unpaid and partially paid invoices
  const unpaidInvoices = invoices.filter((inv) => inv.status !== "paid");

  // Calculate outstanding balance for selected invoice
  const invoiceBalance = selectedInvoice ? Number(selectedInvoice.amount) - paidAmount : 0;

  // Update selected invoice when selection changes
  useEffect(() => {
    if (selectedInvoiceId) {
      const invoice = unpaidInvoices.find((inv) => inv.id === selectedInvoiceId);
      setSelectedInvoice(invoice || null);
    } else {
      setSelectedInvoice(null);
    }
  }, [selectedInvoiceId, unpaidInvoices]);

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setAmount("");
      setDate(new Date());
      setSelectedInvoiceId("");
      setSelectedInvoice(null);
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!client || !amount || !selectedInvoiceId) return;

    const paymentAmount = Number(amount);
    if (paymentAmount <= 0) return;

    createPayment.mutate(
      {
        clientId: client.id,
        invoiceId: selectedInvoiceId,
        amount: paymentAmount,
        date,
        notes: `Payment for Invoice ${selectedInvoice?.invoice_number}`,
      },
      {
        onSuccess: () => {
          setAmount("");
          setDate(new Date());
          setSelectedInvoiceId("");
          setSelectedInvoice(null);
          refetchInvoices();
          onClose();
        },
      }
    );
  };

  if (!client) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-[500px] mx-4 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <Coins className="h-5 w-5 text-accent" />
            Client Account Top-up
          </DialogTitle>
          <DialogDescription className="text-sm">Add payment to client account balance</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
          <div>
            <h3 className="text-sm font-semibold mb-3">Account Summary</h3>
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div className="border border-warning/30 rounded-lg p-3 sm:p-4 bg-warning/5">
                <div className="flex items-center gap-2 mb-2">
                  <Coins className="h-4 sm:h-5 w-4 sm:w-5 text-warning" />
                  <span className="font-semibold text-base sm:text-lg">
                    ksh {Number(client?.totalInvoiced ?? 0).toLocaleString()}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground">Total Invoiced</div>
              </div>
              <div className="border border-destructive/30 rounded-lg p-3 sm:p-4 bg-destructive/5">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 sm:h-5 w-4 sm:w-5 text-destructive" />
                  <span className="font-semibold text-base sm:text-lg">
                    ksh {Number((client?.totalInvoiced ?? 0) - (client?.totalPaid ?? 0)).toLocaleString()}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground">Outstanding Balance</div>
              </div>
            </div>
          </div>

          <div>
            <Label className="flex items-center gap-2 mb-2 font-medium text-sm sm:text-base">
              <FileText className="h-4 w-4" />
              Select Invoice to Pay
            </Label>
            <Select value={selectedInvoiceId} onValueChange={setSelectedInvoiceId}>
              <SelectTrigger className="w-full h-11 sm:h-10 text-base">
                <SelectValue placeholder="Choose an unpaid invoice" />
              </SelectTrigger>
              <SelectContent className="bg-popover z-50">
                {unpaidInvoices.length === 0 ? (
                  <div className="px-2 py-6 text-center text-sm text-muted-foreground">No unpaid invoices found</div>
                ) : (
                  unpaidInvoices.map((invoice) => {
                    const invoiceWithProduct = invoice as any;
                    const productName =
                      invoiceWithProduct.products?.name || invoiceWithProduct.invoice_number || "Unnamed Invoice";
                    return (
                      <SelectItem key={invoice.id} value={invoice.id} className="bg-popover">
                        {productName} - ksh {Number(invoice.amount).toLocaleString()} ({invoice.status})
                      </SelectItem>
                    );
                  })
                )}
              </SelectContent>
            </Select>
            {selectedInvoice && (
              <div className="mt-2 p-3 border border-accent/30 rounded-lg bg-accent/5">
                <p className="text-xs text-muted-foreground mb-1">Outstanding balance for this invoice:</p>
                <p className="font-semibold text-base">ksh {Number(invoiceBalance ?? 0).toLocaleString()}</p>
              </div>
            )}
          </div>

          <div>
            <Label className="flex items-center gap-2 mb-2 font-medium text-sm sm:text-base">
              <CalendarIcon className="h-4 w-4" />
              Payment Date
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal h-11 sm:h-10 text-base",
                    !date && "text-muted-foreground",
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : <span>Select Date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(newDate) => newDate && setDate(newDate)}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          <div>
            <Label className="flex items-center gap-2 mb-2 font-medium text-sm sm:text-base">
              <Banknote className="h-4 w-4" />
              Payment Amount
            </Label>
            <Input
              type="number"
              placeholder="Enter payment amount in ksh"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full h-11 sm:h-10 text-base"
              min="0.01"
              step="0.01"
              required
              disabled={!selectedInvoiceId}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {selectedInvoiceId ? "Amount can be partial or full payment" : "Select an invoice first"}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button
              type="submit"
              className="flex-1 bg-success hover:bg-success/90 text-success-foreground h-11 sm:h-10 text-base sm:text-sm"
              disabled={createPayment.isPending || !selectedInvoiceId}
            >
              {createPayment.isPending ? "Processing..." : "Record Payment"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="flex-1 h-11 sm:h-10 text-base sm:text-sm"
              onClick={onClose}
            >
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
