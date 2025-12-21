import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ClientRow } from "./ClientRow";
import type { ClientWithDetails } from "@/api/clients.api";
import { formatCurrency } from "@/shared/utils";
import { UserRound } from "lucide-react";

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
        {clients.map((client, index) => {
          const isEven = index % 2 === 0;
          
          return (
            <div 
              key={client.id} 
              className={`rounded-xl border border-border/40 bg-card shadow-sm p-4 space-y-3 transition-all duration-200 hover:shadow-md ${
                isEven ? 'border-l-4 border-l-primary' : 'border-l-4 border-l-secondary'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      isEven ? 'bg-primary/10' : 'bg-secondary/10'
                    }`}>
                      <UserRound className={`h-4 w-4 ${isEven ? 'text-primary' : 'text-secondary'}`} />
                    </div>
                    <div>
                      <span className="font-display font-bold text-sm text-foreground">
                        {client.name || client.phone_number}
                      </span>
                      <div className="text-xs text-muted-foreground">
                        {client.phone_number}
                      </div>
                    </div>
                  </div>
                </div>
                <ClientRow key={client.id} client={client} onEdit={onEdit} onRefresh={onRefresh} mobileActions />
              </div>
              
              <div className="grid grid-cols-3 gap-2 pt-3 border-t border-border/30">
                <div className="text-center">
                  <div className="text-xs text-muted-foreground mb-0.5">Invoiced</div>
                  <div className="text-xs font-semibold text-foreground">
                    {formatCurrency(client.totalInvoiced)}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-muted-foreground mb-0.5">Paid</div>
                  <div className="text-xs font-semibold text-primary">
                    {formatCurrency(client.totalPaid)}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-muted-foreground mb-0.5">Balance</div>
                  <div className={`text-xs font-semibold ${
                    client.totalInvoiced - client.totalPaid > 0 ? 'text-secondary' : 'text-primary'
                  }`}>
                    {formatCurrency(client.totalInvoiced - client.totalPaid)}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between pt-2 border-t border-border/30">
                <span className="text-xs text-muted-foreground">Status</span>
                <div className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                  client.status === "open"
                    ? "bg-primary/10 text-primary border border-primary/20"
                    : "bg-muted text-muted-foreground border border-border/50"
                }`}>
                  <div className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                    client.status === "open" ? "bg-primary" : "bg-muted-foreground"
                  }`} />
                  {client.status === "open" ? "Active" : "Closed"}
                </div>
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