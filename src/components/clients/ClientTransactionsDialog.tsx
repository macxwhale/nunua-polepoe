import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeftRight, FileText, CheckCircle, Coins, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import type { ClientWithDetails } from "@/api/clients.api";
import type { Tables } from "@/integrations/supabase/types";

type Transaction = Tables<"transactions">;
type Invoice = Tables<"invoices">;

interface ClientTransactionsDialogProps {
  open: boolean;
  onClose: () => void;
  client: ClientWithDetails | null;
}

export function ClientTransactionsDialog({ open, onClose, client }: ClientTransactionsDialogProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && client) {
      fetchData();
    }
  }, [open, client]);

  const fetchData = async () => {
    if (!client) return;

    setLoading(true);
    try {
      const [{ data: txnData, error: txnError }, { data: invData, error: invError }] = await Promise.all([
        supabase
          .from("transactions")
          .select("*")
          .eq("client_id", client.id)
          .order("date", { ascending: false }),
        supabase
          .from("invoices")
          .select("*, products(name)")
          .eq("client_id", client.id)
          .order("created_at", { ascending: false }),
      ]);

      if (txnError) throw txnError;
      if (invError) throw invError;

      setTransactions(txnData || []);
      setInvoices(invData || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  if (!client) return null;

  const totalInvoiced = invoices.reduce((sum, inv) => sum + Number(inv.amount), 0);
  const totalPaid = transactions
    .filter((txn) => txn.type === "payment")
    .reduce((sum, txn) => sum + Number(txn.amount), 0);
  const balance = totalInvoiced - totalPaid;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-[600px] mx-4 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <ArrowLeftRight className="h-5 w-5 text-info" />
            Client Transactions
          </DialogTitle>
          <DialogDescription className="text-sm">View transaction history and invoices</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="transactions" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="transactions" className="data-[state=active]:bg-info data-[state=active]:text-info-foreground">
              <ArrowLeftRight className="h-4 w-4 mr-2" />
              Transactions
            </TabsTrigger>
            <TabsTrigger value="invoices" className="data-[state=active]:bg-info data-[state=active]:text-info-foreground">
              <FileText className="h-4 w-4 mr-2" />
              Invoice Items
            </TabsTrigger>
          </TabsList>

          <TabsContent value="transactions" className="space-y-4 mt-6">
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                ))}
              </div>
            ) : transactions.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <ArrowLeftRight className="h-12 w-12 mx-auto mb-3 opacity-20" />
                <p>No transactions found</p>
              </div>
            ) : (
              transactions.map((txn) => (
                <div
                  key={txn.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-success" />
                    <div>
                      <div className="font-medium">Payment</div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(txn.date).toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </div>
                    </div>
                  </div>
                  <Badge variant="success" className="text-base font-semibold px-3 py-1">
                    KSH {Number(txn.amount).toLocaleString()}
                  </Badge>
                </div>
              ))
            )}
          </TabsContent>

          <TabsContent value="invoices" className="space-y-4 mt-6">
            {loading ? (
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : invoices.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-3 opacity-20" />
                <p>No invoices found</p>
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  {invoices.map((invoice) => (
                    <div
                      key={invoice.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-info" />
                        <span className="font-medium">{(invoice as any).products?.name || invoice.invoice_number}</span>
                      </div>
                      <span className="text-muted-foreground">KSH {Number(invoice.amount).toLocaleString()}</span>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-4 mt-6 pt-4 border-t">
                  <div className="border border-warning/30 rounded-lg p-4 bg-warning/5">
                    <div className="flex items-center gap-2 mb-2">
                      <Coins className="h-5 w-5 text-warning" />
                      <span className="text-sm text-muted-foreground">Total</span>
                    </div>
                    <div className="text-xl font-bold">
                      KSH {Number(totalInvoiced ?? 0).toLocaleString()}
                    </div>
                  </div>
                  <div className="border border-destructive/30 rounded-lg p-4 bg-destructive/5">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="h-5 w-5 text-destructive" />
                      <span className="text-sm text-muted-foreground">Balance</span>
                    </div>
                    <div className="text-xl font-bold text-destructive">
                      KSH {Number(balance ?? 0).toLocaleString()}
                    </div>
                  </div>
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
