import { Badge } from "@/components/ui/badge";
import { UserRound } from "lucide-react";
import { TableCell, TableRow } from "@/components/ui/table";
import { ClientActions } from "@/components/clients/ClientActions";
import { formatDate, formatCurrency } from "@/shared/utils";
import type { ClientWithDetails } from "@/api/clients.api";

interface ClientRowProps {
  client: ClientWithDetails;
  onEdit: (client: ClientWithDetails) => void;
  onRefresh: () => void;
  mobileActions?: boolean;
  rowIndex?: number;
}

export function ClientRow({ client, onEdit, onRefresh, mobileActions, rowIndex = 0 }: ClientRowProps) {
  if (mobileActions) {
    return <ClientActions client={client} onEdit={onEdit} onRefresh={onRefresh} />;
  }

  const balance = client.totalInvoiced - client.totalPaid;
  const isPositiveBalance = balance > 0;

  return (
    <TableRow className="hover:bg-muted/30 transition-colors border-b border-border/30">
      <TableCell className="py-4">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
            isPositiveBalance ? 'bg-destructive/10' : 'bg-primary/10'
          }`}>
            <UserRound className={`h-4 w-4 ${isPositiveBalance ? 'text-destructive' : 'text-primary'}`} />
          </div>
          <div>
            <span className="font-medium text-foreground">
              {client.name || client.phone_number}
            </span>
            <div className="text-xs text-muted-foreground mt-0.5">
              {client.phone_number} • Joined {formatDate(client.created_at)}
            </div>
          </div>
        </div>
      </TableCell>
      <TableCell className="py-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground w-14">Invoiced</span>
            <span className="font-display font-semibold text-sm text-foreground">{formatCurrency(client.totalInvoiced)}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground w-14">Paid</span>
            <span className="font-display font-semibold text-sm text-primary">{formatCurrency(client.totalPaid)}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground w-14">Balance</span>
            <span className={`font-display font-bold text-sm ${isPositiveBalance ? 'text-destructive' : 'text-primary'}`}>
              {formatCurrency(balance)}
            </span>
          </div>
        </div>
      </TableCell>
      <TableCell className="py-4">
        <Badge
          className={
            client.status === "open"
              ? "bg-primary/10 text-primary border-primary/20"
              : "bg-muted text-muted-foreground border-border/50"
          }
        >
          <div className={`w-1.5 h-1.5 rounded-full mr-1.5 ${client.status === "open" ? "bg-primary" : "bg-muted-foreground"}`} />
          {client.status === "open" ? "Active" : "Closed"}
        </Badge>
      </TableCell>
      <TableCell className="py-4 text-right">
        <ClientActions client={client} onEdit={onEdit} onRefresh={onRefresh} />
      </TableCell>
    </TableRow>
  );
}
