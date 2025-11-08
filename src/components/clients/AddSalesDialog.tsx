import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ShoppingCart, Plus, Package } from "lucide-react";
import type { ClientWithDetails } from "@/api/clients.api";
import { useProducts } from "@/hooks/useProducts";

interface AddSalesDialogProps {
  open: boolean;
  onClose: () => void;
  client: ClientWithDetails | null;
}

export function AddSalesDialog({ open, onClose, client }: AddSalesDialogProps) {
  const [selectedProduct, setSelectedProduct] = useState<string>("");
  const [productName, setProductName] = useState("");
  const [productDescription, setProductDescription] = useState("");
  const [price, setPrice] = useState("");
  const [loading, setLoading] = useState(false);
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  const { data: products = [], refetch: refetchProducts } = useProducts();

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setSelectedProduct("");
      setProductName("");
      setProductDescription("");
      setPrice("");
      setIsCreatingNew(false);
    }
  }, [open]);

  // Auto-fill price when existing product is selected
  useEffect(() => {
    if (selectedProduct && selectedProduct !== "create_new") {
      const product = products.find(p => p.id === selectedProduct);
      if (product) {
        setPrice(product.price.toString());
        setProductName(product.name);
      }
    } else if (selectedProduct === "create_new") {
      setIsCreatingNew(true);
      setPrice("");
      setProductName("");
      setProductDescription("");
    } else {
      setIsCreatingNew(false);
    }
  }, [selectedProduct, products]);

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

      let productId = selectedProduct !== "create_new" ? selectedProduct : null;

      // If creating a new product, create it first
      if (isCreatingNew) {
        const { data: newProduct, error: productError } = await supabase
          .from("products")
          .insert({
            tenant_id: profile.tenant_id,
            name: productName,
            description: productDescription,
            price: parseFloat(price)
          })
          .select()
          .single();

        if (productError) throw productError;
        productId = newProduct.id;
        refetchProducts(); // Refresh products list
      }

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
          product_id: productId,
          notes: isCreatingNew ? productDescription : undefined,
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
        }
      }

      toast.success(isCreatingNew ? "Product created and sale added successfully" : "Sale added successfully");
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
              <Label htmlFor="product-select" className="flex items-center gap-2 font-medium text-sm sm:text-base">
                <Package className="h-4 w-4" />
                Select Product
              </Label>
              <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                <SelectTrigger className="mt-2 h-11 sm:h-10 text-base">
                  <SelectValue placeholder="Choose a product or create new" />
                </SelectTrigger>
                <SelectContent className="bg-popover z-[100]">
                  <SelectItem value="create_new" className="bg-popover">
                    <div className="flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      <span>Create New Product</span>
                    </div>
                  </SelectItem>
                  {products.map((product) => (
                    <SelectItem key={product.id} value={product.id} className="bg-popover">
                      {product.name} - ksh {Number(product.price).toLocaleString()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                {isCreatingNew ? "Fill in the details below to create a new product" : "Select from existing products or create a new one"}
              </p>
            </div>

            {isCreatingNew && (
              <>
                <div>
                  <Label htmlFor="product-name" className="flex items-center gap-2 font-medium text-sm sm:text-base">
                    <ShoppingCart className="h-4 w-4" />
                    Product Name
                  </Label>
                  <Input
                    id="product-name"
                    placeholder="Enter product or service name"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    required
                    className="mt-2 h-11 sm:h-10 text-base"
                  />
                </div>

                <div>
                  <Label htmlFor="product-description" className="flex items-center gap-2 font-medium text-sm sm:text-base">
                    Description (Optional)
                  </Label>
                  <Textarea
                    id="product-description"
                    placeholder="Enter product description"
                    value={productDescription}
                    onChange={(e) => setProductDescription(e.target.value)}
                    className="mt-2 text-base"
                    rows={3}
                  />
                </div>
              </>
            )}

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
                disabled={!isCreatingNew && !selectedProduct}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {isCreatingNew ? "Price for the new product" : "Amount to be invoiced"}
              </p>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full bg-success hover:bg-success/90 text-success-foreground h-11 sm:h-10 text-base sm:text-sm"
            disabled={loading || !selectedProduct}
          >
            {loading ? "Processing..." : isCreatingNew ? "Create Product & Add Sale" : "Add Sale"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
