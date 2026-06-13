import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeftRight, CheckCircle, RotateCcw, Search, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentTenantId } from "@/api/tenant.api";
import { formatCurrency, formatDateShort } from "@/shared/utils";

type FilterType = "all" | "sale" | "payment" | "refund";

interface TransactionRow {
  id: string;
  date: string;
  type: string;
  amount: number;
  notes: string | null;
  client_name: string;
  invoice_number: string | null;
}

const isRefund = (t: TransactionRow) => t.type === "payment" && t.amount < 0;

export default function Transactions() {
  const [transactions, setTransactions] = useState<TransactionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const tenantId = await getCurrentTenantId();
      const { data, error } = await supabase
        .from("transactions")
        .select("id, date, type, amount, notes, clients(name), invoices(invoice_number)")
        .eq("tenant_id", tenantId)
        .order("date", { ascending: false });

      if (error) throw error;

      setTransactions(
        (data || []).map((t: any) => ({
          id: t.id,
          date: t.date,
          type: t.type,
          amount: Number(t.amount),
          notes: t.notes,
          client_name: t.clients?.name || "Unknown",
          invoice_number: t.invoices?.invoice_number || null,
        }))
      );
    } catch (err) {
      console.error("Error fetching transactions:", err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = transactions.filter((t) => {
    const q = search.toLowerCase();
    const matchesSearch =
      t.client_name.toLowerCase().includes(q) ||
      (t.invoice_number?.toLowerCase().includes(q) ?? false) ||
      (t.notes?.toLowerCase().includes(q) ?? false);

    if (!matchesSearch) return false;
    if (filter === "refund") return isRefund(t);
    if (filter === "payment") return t.type === "payment" && t.amount >= 0;
    if (filter === "sale") return t.type === "sale";
    return true;
  });

  const counts = {
    all: transactions.length,
    sale: transactions.filter((t) => t.type === "sale").length,
    payment: transactions.filter((t) => t.type === "payment" && t.amount >= 0).length,
    refund: transactions.filter((t) => isRefund(t)).length,
  };

  const typeLabel = (t: TransactionRow) =>
    isRefund(t) ? "Refund" : t.type === "sale" ? "Sale" : "Payment";

  const typeColor = (t: TransactionRow) =>
    isRefund(t) ? "text-warning" : t.type === "sale" ? "text-destructive" : "text-success";

  const TypeIcon = ({ t }: { t: TransactionRow }) =>
    isRefund(t) ? (
      <RotateCcw className="h-4 w-4 text-warning" />
    ) : t.type === "sale" ? (
      <TrendingUp className="h-4 w-4 text-destructive" />
    ) : (
      <CheckCircle className="h-4 w-4 text-success" />
    );

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-display font-bold">Transactions</h1>
        <p className="text-muted-foreground text-sm">All sales, payments, and refunds</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by client, invoice, or notes..."
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <Tabs value={filter} onValueChange={(v) => setFilter(v as FilterType)}>
        <TabsList className="grid grid-cols-4 w-full sm:w-auto sm:inline-flex">
          <TabsTrigger value="all">All ({counts.all})</TabsTrigger>
          <TabsTrigger value="sale">Sales ({counts.sale})</TabsTrigger>
          <TabsTrigger value="payment">Payments ({counts.payment})</TabsTrigger>
          <TabsTrigger value="refund">Refunds ({counts.refund})</TabsTrigger>
        </TabsList>
      </Tabs>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <ArrowLeftRight className="h-12 w-12 mx-auto mb-3 opacity-20" />
          <p className="font-medium">No transactions found</p>
          {search && <p className="text-sm mt-1">Try a different search term</p>}
        </div>
      ) : (
        <>
          {/* Mobile card view */}
          <div className="md:hidden space-y-3">
            {filtered.map((t) => (
              <div key={t.id} className="rounded-xl border bg-card shadow-sm p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TypeIcon t={t} />
                    <span className="font-medium text-sm">{t.client_name}</span>
                  </div>
                  <span className={`font-display font-bold ${typeColor(t)}`}>
                    {isRefund(t) ? "-" : ""}{formatCurrency(Math.abs(t.amount))}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    <span className={typeColor(t)}>{typeLabel(t)}</span>
                    {t.invoice_number && ` · ${t.invoice_number}`}
                  </span>
                  <span>{formatDateShort(t.date)}</span>
                </div>
                {t.notes && (
                  <div className="text-xs text-muted-foreground bg-muted/50 rounded px-2 py-1 truncate">
                    {t.notes}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Desktop table view */}
          <div className="hidden md:block rounded-xl border border-border/40 overflow-hidden bg-card shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 border-b border-border/50">
                  {["Date", "Client", "Type", "Invoice", "Notes", "Amount"].map((h, i) => (
                    <th
                      key={h}
                      className={`px-4 py-3 font-display font-bold text-xs uppercase tracking-wider text-muted-foreground ${i === 5 ? "text-right" : "text-left"}`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((t) => (
                  <tr key={t.id} className="border-b border-border/30 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                      {formatDateShort(t.date)}
                    </td>
                    <td className="px-4 py-3 font-medium">{t.client_name}</td>
                    <td className="px-4 py-3">
                      <div className={`flex items-center gap-1.5 ${typeColor(t)}`}>
                        <TypeIcon t={t} />
                        <span>{typeLabel(t)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {t.invoice_number || "—"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground max-w-[180px] truncate">
                      {t.notes || "—"}
                    </td>
                    <td className={`px-4 py-3 text-right font-display font-bold ${typeColor(t)}`}>
                      {isRefund(t) ? "-" : ""}{formatCurrency(Math.abs(t.amount))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
