import { Badge } from "@/components/ui/badge";
import { CheckCircle, UserRound } from "lucide-react";
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

export function ClientRow({ client, onEdit, onRefresh, mobileActions }: ClientRowProps) {
  if (mobileActions) {
    return <ClientActions client={client} onEdit={onEdit} onRefresh={onRefresh} />;
  }

  return (
    <TableRow className="group transition-all duration-300 border-b border-border/30 hover:bg-muted/50">
      <TableCell className="py-4">
        <div>
          <div className="flex items-center gap-2">
            <UserRound className="h-5 w-5 text-primary" />
            <span className="font-bold text-base text-foreground tracking-wide">
              {client.phone_number || client.name}
            </span>
          </div>
          <div className="text-xs text-muted-foreground mt-1 ml-7">
            Joined {formatDate(client.created_at)}
          </div>
        </div>
      </TableCell>
      <TableCell className="py-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-muted-foreground font-medium w-16">Invoiced</span>
            <span className="font-semibold text-foreground">{formatCurrency(client.totalInvoiced)}</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-muted-foreground font-medium w-16">Paid</span>
            <span className="font-semibold text-success">{formatCurrency(client.totalPaid)}</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-muted-foreground font-medium w-16">Balance</span>
            <span className="font-semibold text-accent">{formatCurrency(client.totalInvoiced - client.totalPaid)}</span>
          </div>
        </div>
      </TableCell>
      <TableCell className="py-4">
        <Badge
          variant="outline"
          className={
            client.status === "open"
              ? "bg-success/5 text-success border-success/30 font-medium px-3 py-1"
              : "bg-muted text-muted-foreground border-border/50 font-medium px-3 py-1"
          }
        >
          <div className={`w-1.5 h-1.5 rounded-full mr-1.5 ${client.status === "open" ? "bg-success" : "bg-muted-foreground"}`} />
          {client.status === "open" ? "Open" : "Closed"}
        </Badge>
      </TableCell>
      <TableCell className="py-4 text-right">
        <ClientActions client={client} onEdit={onEdit} onRefresh={onRefresh} />
      </TableCell>
    </TableRow>
  );
}
