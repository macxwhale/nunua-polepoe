import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ShoppingCart } from "lucide-react";
import type { ClientWithDetails } from "@/api/clients.api";

interface AddSalesDialogProps {
  open: boolean;
  onClose: () => void;
  client: ClientWithDetails | null;
}

export function AddSalesDialog({ open, onClose, client }: AddSalesDialogProps) {
  const [productName, setProductName] = useState("");
  const [price, setPrice] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!client) return;

    setLoading(true);
    try {
      // Get user and tenant info
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: profile } = await supabase
        .from("profiles")
        .select("tenant_id")
        .eq("user_id", user.id)
        .single();

      if (!profile) throw new Error("Profile not found");

      // Generate invoice number
      const invoiceNumber = `INV-${Date.now()}`;

      // Create invoice
      const { data: newInvoice, error: invoiceError } = await supabase
        .from("invoices")
        .insert({
          tenant_id: profile.tenant_id,
          client_id: client.id,
          invoice_number: invoiceNumber,
          amount: parseFloat(price),
          notes: productName,
          status: "pending"
        })
        .select()
        .single();

      if (invoiceError) throw invoiceError;

      // Create corresponding sale transaction
      if (newInvoice) {
        const { error: transactionError } = await supabase
          .from("transactions")
          .insert({
            tenant_id: profile.tenant_id,
            client_id: client.id,
            invoice_id: newInvoice.id,
            amount: parseFloat(price),
            type: "sale",
            date: new Date().toISOString(),
            notes: `Sale: ${productName}`,
          });

        if (transactionError) {
          console.error("Error creating sale transaction:", transactionError);
          // Don't throw - invoice was created successfully
        }
      }

      toast.success("Sale added successfully");
      setProductName("");
      setPrice("");
      onClose();
    } catch (error) {
      console.error("Error adding sale:", error);
      toast.error("Failed to add sale");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-[500px] mx-4">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <ShoppingCart className="h-5 w-5 text-accent" />
            Add Sales
          </DialogTitle>
          <DialogDescription className="text-sm">Create a new invoice for this client</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
          <div className="space-y-4 sm:space-y-5">
            <div>
              <Label htmlFor="product" className="flex items-center gap-2 font-medium text-sm sm:text-base">
                <ShoppingCart className="h-4 w-4" />
                Product Name
              </Label>
              <Input
                id="product"
                placeholder="Enter product or service name"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                required
                className="mt-2 h-11 sm:h-10 text-base"
              />
              <p className="text-xs text-muted-foreground mt-1">What was sold to the client</p>
            </div>

            <div>
              <Label htmlFor="price" className="flex items-center gap-2 font-medium text-sm sm:text-base">
                <span className="text-lg font-bold">Ksh</span>
                Price
              </Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                placeholder="Enter price in KSH"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
                className="mt-2 h-11 sm:h-10 text-base"
              />
              <p className="text-xs text-muted-foreground mt-1">Amount to be invoiced</p>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full bg-success hover:bg-success/90 text-success-foreground h-11 sm:h-10 text-base sm:text-sm"
            disabled={loading}
          >
            {loading ? "Adding..." : "Add Product"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
