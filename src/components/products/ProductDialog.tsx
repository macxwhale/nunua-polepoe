import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCreateProduct, useUpdateProduct } from "@/hooks/useProducts";
import type { Tables } from "@/integrations/supabase/types";

type Product = Tables<"products">;

interface ProductDialogProps {
  open: boolean;
  onClose: () => void;
  product: Product | null;
}

export function ProductDialog({ open, onClose, product }: ProductDialogProps) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
  });

  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const isLoading = createProduct.isPending || updateProduct.isPending;

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name,
        description: product.description || "",
        price: product.price.toString(),
      });
    } else {
      setFormData({ name: "", description: "", price: "" });
    }
  }, [product]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const productData = {
      name: formData.name,
      description: formData.description || null,
      price: parseFloat(formData.price),
    };

    if (product) {
      updateProduct.mutate(
        { id: product.id, updates: productData },
        { onSuccess: () => onClose() }
      );
    } else {
      createProduct.mutate(productData, { onSuccess: () => onClose() });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-lg mx-4">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">{product ? "Edit Product" : "Add Product"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
          <div>
            <Label htmlFor="name" className="text-sm sm:text-base">Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="h-11 sm:h-10 text-base mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor="description" className="text-sm sm:text-base">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="min-h-[80px] text-base mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor="price" className="text-sm sm:text-base">Price (KES)</Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              required
              className="h-11 sm:h-10 text-base mt-1.5"
            />
          </div>
          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" className="flex-1 sm:flex-initial h-11 sm:h-10 text-base sm:text-sm" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="flex-1 sm:flex-initial h-11 sm:h-10 text-base sm:text-sm">
              {isLoading ? "Saving..." : "Save"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
