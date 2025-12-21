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

const rainbowGradients = [
  "from-red-500/10 to-orange-500/10 hover:from-red-500/20 hover:to-orange-500/20 border-l-4 border-l-red-500",
  "from-orange-500/10 to-yellow-500/10 hover:from-orange-500/20 hover:to-yellow-500/20 border-l-4 border-l-orange-500",
  "from-yellow-500/10 to-green-500/10 hover:from-yellow-500/20 hover:to-green-500/20 border-l-4 border-l-yellow-500",
  "from-green-500/10 to-emerald-500/10 hover:from-green-500/20 hover:to-emerald-500/20 border-l-4 border-l-green-500",
  "from-emerald-500/10 to-cyan-500/10 hover:from-emerald-500/20 hover:to-cyan-500/20 border-l-4 border-l-emerald-500",
  "from-cyan-500/10 to-blue-500/10 hover:from-cyan-500/20 hover:to-blue-500/20 border-l-4 border-l-cyan-500",
  "from-blue-500/10 to-indigo-500/10 hover:from-blue-500/20 hover:to-indigo-500/20 border-l-4 border-l-blue-500",
  "from-indigo-500/10 to-purple-500/10 hover:from-indigo-500/20 hover:to-purple-500/20 border-l-4 border-l-indigo-500",
  "from-purple-500/10 to-pink-500/10 hover:from-purple-500/20 hover:to-pink-500/20 border-l-4 border-l-purple-500",
  "from-pink-500/10 to-rose-500/10 hover:from-pink-500/20 hover:to-rose-500/20 border-l-4 border-l-pink-500",
];

const rainbowIconColors = [
  "text-red-500",
  "text-orange-500",
  "text-yellow-500",
  "text-green-500",
  "text-emerald-500",
  "text-cyan-500",
  "text-blue-500",
  "text-indigo-500",
  "text-purple-500",
  "text-pink-500",
];

export function ClientRow({ client, onEdit, onRefresh, mobileActions, rowIndex = 0 }: ClientRowProps) {
  if (mobileActions) {
    return <ClientActions client={client} onEdit={onEdit} onRefresh={onRefresh} />;
  }

  const gradientClass = rainbowGradients[rowIndex % rainbowGradients.length];
  const iconColor = rainbowIconColors[rowIndex % rainbowIconColors.length];

  return (
    <TableRow className={`group bg-gradient-to-r transition-all duration-300 border-b border-border/30 ${gradientClass}`}>
      <TableCell className="py-4">
        <div>
          <div className="flex items-center gap-2">
            <UserRound className={`h-5 w-5 ${iconColor}`} />
            <span className={`font-bold text-base ${iconColor} tracking-wide`}>
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
