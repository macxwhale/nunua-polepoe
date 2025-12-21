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
    refetch();
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-2 w-full sm:w-auto">
            <div className="h-9 w-40 bg-muted animate-shimmer rounded-xl" />
            <div className="h-4 w-72 bg-muted animate-shimmer rounded-lg" />
          </div>
          <div className="h-11 w-full sm:w-36 bg-muted animate-shimmer rounded-xl" />
        </div>
        <div className="rounded-xl border border-border/40 overflow-hidden">
          <div className="bg-muted/50 h-12 w-full" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="border-t border-border/30 p-5 space-y-3">
              <div className="h-4 bg-muted animate-shimmer rounded w-1/3" />
              <div className="h-4 bg-muted animate-shimmer rounded w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold tracking-tight text-foreground">
            Products
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Manage your product catalog and inventory
          </p>
        </div>
        <Button 
          onClick={() => setDialogOpen(true)} 
          className="gap-2 w-full sm:w-auto shadow-md hover:shadow-glow"
        >
          <Plus className="h-4 w-4" />
          Add Product
        </Button>
      </div>

      {/* Content */}
      {products.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No products yet"
          description="Build your catalog at your own pace. Add products when you're ready."
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