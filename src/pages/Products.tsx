import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Package } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { ProductsTable } from "@/components/products/ProductsTable";
import { ProductDialog } from "@/components/products/ProductDialog";
import { useProducts } from "@/hooks/useProducts";
import type { Tables } from "@/integrations/supabase/types";

type Product = Tables<"products">;

export default function Products() {
  const { data: products = [], isLoading: loading, refetch } = useProducts();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditingProduct(null);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="space-y-1">
            <div className="h-6 w-32 bg-muted animate-shimmer rounded" />
            <div className="h-4 w-48 bg-muted animate-shimmer rounded" />
          </div>
          <div className="h-9 w-28 bg-muted animate-shimmer rounded" />
        </div>
        <div className="rounded-md border border-border overflow-hidden">
          <div className="bg-muted h-10 w-full" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="border-t border-border p-3 space-y-2">
              <div className="h-4 bg-muted animate-shimmer rounded w-1/3" />
              <div className="h-3 bg-muted animate-shimmer rounded w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground tracking-tight">
            Products
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage your product catalog
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)} size="lg" className="gap-2">
          <Plus className="h-4 w-4" />
          Add Product
        </Button>
      </div>

      {/* Content */}
      {products.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No products yet"
          description="Build your catalog by adding products."
          action={{
            label: "Add Product",
            onClick: () => setDialogOpen(true),
          }}
        />
      ) : (
        <ProductsTable products={products} onEdit={handleEdit} onRefresh={() => refetch()} />
      )}
      
      <ProductDialog
        open={dialogOpen}
        onClose={handleDialogClose}
        product={editingProduct}
      />
    </div>
  );
}
