import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowUpCircle } from "lucide-react";
import type { ClientWithDetails } from "@/api/clients.api";

interface SimpleTopUpDialogProps {
  open: boolean;
  onClose: () => void;
  client: ClientWithDetails | null;
}

export function SimpleTopUpDialog({ open, onClose, client }: SimpleTopUpDialogProps) {
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!client) return;

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: profile } = await supabase
        .from("profiles")
        .select("tenant_id")
        .eq("user_id", user.id)
        .single();

      if (!profile) throw new Error("Profile not found");

      // Get the first invoice for this client
      const { data: invoices } = await supabase
        .from("invoices")
        .select("id")
        .eq("client_id", client.id)
        .eq("tenant_id", profile.tenant_id)
        .order("created_at", { ascending: true })
        .limit(1);

      if (!invoices || invoices.length === 0) {
        toast.error("No invoice found for this client");
        return;
      }

      // Create payment transaction
      const { error: transactionError } = await supabase
        .from("transactions")
        .insert({
          tenant_id: profile.tenant_id,
          client_id: client.id,
          invoice_id: invoices[0].id,
          amount: parseFloat(amount),
          type: "payment",
          date: new Date().toISOString(),
          notes: notes || "Payment top-up",
        });

      if (transactionError) throw transactionError;

      toast.success("Top-up added successfully");
      setAmount("");
      setNotes("");
      onClose();
    } catch (error) {
      console.error("Error adding top-up:", error);
      toast.error("Failed to add top-up");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-[500px] mx-4">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <ArrowUpCircle className="h-5 w-5 text-accent" />
            Top Up Client Account
          </DialogTitle>
          <DialogDescription className="text-sm">Add payment to {client?.name}'s account</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
          <div className="space-y-4 sm:space-y-5">
            <div>
              <Label htmlFor="amount" className="flex items-center gap-2 font-medium text-sm sm:text-base">
                <span className="text-lg font-bold">Ksh</span>
                Amount
              </Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                placeholder="Enter amount in KSH"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                className="mt-2 h-11 sm:h-10 text-base"
              />
              <p className="text-xs text-muted-foreground mt-1">Payment amount to add</p>
            </div>

            <div>
              <Label htmlFor="notes" className="font-medium text-sm sm:text-base">
                Notes (Optional)
              </Label>
              <Textarea
                id="notes"
                placeholder="Add notes about this payment"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="mt-2 min-h-[80px]"
              />
              <p className="text-xs text-muted-foreground mt-1">Additional payment details</p>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full bg-accent hover:bg-accent/90 text-accent-foreground h-11 sm:h-10 text-base sm:text-sm"
            disabled={loading}
          >
            {loading ? "Processing..." : "Add Top-Up"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
