import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Edit, Trash, Package } from "lucide-react";
import { DeleteConfirmDialog } from "@/shared/components/DeleteConfirmDialog";
import { useDeleteProduct } from "@/hooks/useProducts";
import { formatCurrency } from "@/shared/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Tables } from "@/integrations/supabase/types";

type Product = Tables<"products">;

interface ProductsTableProps {
  products: Product[];
  onEdit: (product: Product) => void;
  onRefresh: () => void;
}

export function ProductsTable({ products, onEdit, onRefresh }: ProductsTableProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const deleteProduct = useDeleteProduct();

  const handleDeleteClick = (product: Product) => {
    setProductToDelete(product);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!productToDelete) return;
    await deleteProduct.mutateAsync(productToDelete.id);
    setDeleteDialogOpen(false);
    setProductToDelete(null);
    onRefresh();
  };

  return (
    <>
      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {products.map((product, index) => {
          const isEven = index % 2 === 0;
          
          return (
            <div 
              key={product.id} 
              className={`rounded-xl border border-border/40 bg-card shadow-sm p-4 space-y-3 transition-all duration-200 hover:shadow-md ${
                isEven ? 'border-l-4 border-l-primary' : 'border-l-4 border-l-secondary'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 flex-1">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    isEven ? 'bg-primary/10' : 'bg-secondary/10'
                  }`}>
                    <Package className={`h-5 w-5 ${isEven ? 'text-primary' : 'text-secondary'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-display font-bold text-sm text-foreground truncate">
                      {product.name}
                    </div>
                    {product.description && (
                      <div className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                        {product.description}
                      </div>
                    )}
                  </div>
                </div>
                <div className={`font-display font-bold text-lg flex-shrink-0 ${
                  isEven ? 'text-primary' : 'text-secondary'
                }`}>
                  {formatCurrency(product.price)}
                </div>
              </div>
              
              <div className="flex gap-2 pt-3 border-t border-border/30">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => onEdit(product)}
                  className="flex-1 h-8 text-xs"
                >
                  <Edit className="h-3.5 w-3.5 mr-1.5" />
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteClick(product)}
                  className="h-8 px-3 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash className="h-3.5 w-3.5 mr-1.5" />
                  Delete
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block rounded-xl border border-border/40 overflow-hidden bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/60 border-b border-border/50">
              <TableHead className="font-display font-bold text-xs uppercase tracking-wider h-12 text-muted-foreground">
                Product
              </TableHead>
              <TableHead className="font-display font-bold text-xs uppercase tracking-wider h-12 text-muted-foreground">
                Description
              </TableHead>
              <TableHead className="font-display font-bold text-xs uppercase tracking-wider h-12 text-muted-foreground">
                Price
              </TableHead>
              <TableHead className="font-display font-bold text-xs uppercase tracking-wider h-12 text-right text-muted-foreground">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product, index) => (
              <TableRow 
                key={product.id} 
                className="hover:bg-muted/30 transition-colors border-b border-border/30"
              >
                <TableCell className="py-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                      index % 2 === 0 ? 'bg-primary/10' : 'bg-secondary/10'
                    }`}>
                      <Package className={`h-4 w-4 ${
                        index % 2 === 0 ? 'text-primary' : 'text-secondary'
                      }`} />
                    </div>
                    <span className="font-medium">{product.name}</span>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground py-4 max-w-xs truncate">
                  {product.description || "—"}
                </TableCell>
                <TableCell className="font-display font-bold text-base py-4 text-primary">
                  {formatCurrency(product.price)}
                </TableCell>
                <TableCell className="py-4">
                  <div className="flex justify-end gap-1">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => onEdit(product)}
                      title="Edit"
                      className="h-8 w-8"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteClick(product)}
                      title="Delete"
                      className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Product"
        description={`Are you sure you want to delete "${productToDelete?.name}"? This action cannot be undone.`}
        isLoading={deleteProduct.isPending}
      />
    </>
  );
}