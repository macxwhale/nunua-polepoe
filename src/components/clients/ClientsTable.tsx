import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ClientRow } from "./ClientRow";
import type { ClientWithDetails } from "@/api/clients.api";
import { formatCurrency } from "@/shared/utils";
import { UserRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ClientsTableProps {
  clients: ClientWithDetails[];
  onEdit: (client: ClientWithDetails) => void;
  onRefresh: () => void;
}

export function ClientsTable({ clients, onEdit, onRefresh }: ClientsTableProps) {
  return (
    <>
      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {clients.map((client) => {
          const balance = client.totalInvoiced - client.totalPaid;
          const isPositiveBalance = balance > 0;
          
          return (
            <div 
              key={client.id} 
              className={`rounded-xl border bg-card shadow-sm p-4 space-y-3 transition-all duration-200 hover:shadow-md ${
                isPositiveBalance ? 'border-l-4 border-l-destructive border-border/40' : 'border-l-4 border-l-primary border-border/40'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    isPositiveBalance ? 'bg-destructive/10' : 'bg-primary/10'
                  }`}>
                    <UserRound className={`h-5 w-5 ${isPositiveBalance ? 'text-destructive' : 'text-primary'}`} />
                  </div>
                  <div>
                    <div className="font-display font-bold text-sm text-foreground truncate">
                      {client.name || client.phone_number}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {client.phone_number}
                    </div>
                  </div>
                </div>
                <Badge className={
                  client.status === "open"
                    ? "bg-primary/10 text-primary border-primary/20"
                    : "bg-muted text-muted-foreground border-border/50"
                }>
                  {client.status === "open" ? "Active" : "Closed"}
                </Badge>
              </div>
              
              <div className="grid grid-cols-3 gap-3 pt-3 border-t border-border/30">
                <div className="bg-muted/30 rounded-lg p-2">
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5">Invoiced</div>
                  <div className="text-sm font-display font-bold text-foreground">
                    {formatCurrency(client.totalInvoiced)}
                  </div>
                </div>
                <div className="bg-primary/5 rounded-lg p-2">
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5">Paid</div>
                  <div className="text-sm font-display font-bold text-primary">
                    {formatCurrency(client.totalPaid)}
                  </div>
                </div>
                <div className={`rounded-lg p-2 ${isPositiveBalance ? 'bg-destructive/5' : 'bg-primary/5'}`}>
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5">Balance</div>
                  <div className={`text-sm font-display font-bold ${isPositiveBalance ? 'text-destructive' : 'text-primary'}`}>
                    {formatCurrency(balance)}
                  </div>
                </div>
              </div>
              
              <div className="pt-3 border-t border-border/30">
                <ClientRow key={client.id} client={client} onEdit={onEdit} onRefresh={onRefresh} mobileActions />
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
                Client
              </TableHead>
              <TableHead className="font-display font-bold text-xs uppercase tracking-wider h-12 text-muted-foreground">
                Financial Summary
              </TableHead>
              <TableHead className="font-display font-bold text-xs uppercase tracking-wider h-12 text-muted-foreground">
                Status
              </TableHead>
              <TableHead className="font-display font-bold text-xs uppercase tracking-wider h-12 text-right text-muted-foreground">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clients.map((client, index) => (
              <ClientRow key={client.id} client={client} onEdit={onEdit} onRefresh={onRefresh} rowIndex={index} />
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
