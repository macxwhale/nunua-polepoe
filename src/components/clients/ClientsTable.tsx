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
      <div className="md:hidden space-y-2">
        {clients.map((client) => {
          const balance = client.totalInvoiced - client.totalPaid;
          
          return (
            <div 
              key={client.id} 
              className="rounded-md border border-border bg-card p-3 space-y-2"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <UserRound className="h-5 w-5 text-primary flex-shrink-0" />
                  <div>
                    <span className="font-medium text-sm text-foreground block truncate">
                      {client.name || client.phone_number}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {client.phone_number}
                    </span>
                  </div>
                </div>
                <ClientRow key={client.id} client={client} onEdit={onEdit} onRefresh={onRefresh} mobileActions />
              </div>
              
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border">
                <div>
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Invoiced</div>
                  <div className="text-xs font-medium text-foreground">
                    {formatCurrency(client.totalInvoiced)}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Paid</div>
                  <div className="text-xs font-medium text-success">
                    {formatCurrency(client.totalPaid)}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Balance</div>
                  <div className={`text-xs font-medium ${balance > 0 ? 'text-destructive' : 'text-success'}`}>
                    {formatCurrency(balance)}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between pt-2 border-t border-border">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Status</span>
                <span className={`text-xs font-medium ${client.status === "open" ? "text-foreground" : "text-muted-foreground"}`}>
                  {client.status === "open" ? "Active" : "Closed"}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block rounded-md border border-border overflow-hidden bg-card">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50 border-b border-border">
              <TableHead className="font-medium text-xs uppercase tracking-wide h-10 text-muted-foreground">
                Client
              </TableHead>
              <TableHead className="font-medium text-xs uppercase tracking-wide h-10 text-muted-foreground">
                Financial Summary
              </TableHead>
              <TableHead className="font-medium text-xs uppercase tracking-wide h-10 text-muted-foreground">
                Status
              </TableHead>
              <TableHead className="font-medium text-xs uppercase tracking-wide h-10 text-right text-muted-foreground">
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
