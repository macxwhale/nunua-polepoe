import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useCreateNotification } from "@/hooks/useNotifications";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Plus, Check, ChevronsUpDown } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { Tables } from "@/integrations/supabase/types";
import { useClients } from "@/hooks/useClients";
import { useProducts } from "@/hooks/useProducts";
import { useCreateInvoice, useUpdateInvoice, useGenerateInvoiceNumber } from "@/hooks/useInvoices";
import { ProductDialog } from "@/components/products/ProductDialog";

const invoiceSchema = z.object({
  client_id: z.string().min(1, "Client is required"),
  product_id: z.string().optional(),
  amount: z.string().min(1, "Amount is required"),
  status: z.enum(["pending", "paid", "overdue", "partial"]),
  notes: z.string().optional(),
});

type InvoiceFormData = z.infer<typeof invoiceSchema>;

interface InvoiceDialogProps {
  open: boolean;
  onClose: () => void;
  invoice: Tables<"invoices"> | null;
}

export function InvoiceDialog({ open, onClose, invoice }: InvoiceDialogProps) {
  const { data: clients = [] } = useClients();
  const { data: products = [] } = useProducts();
  const { data: nextInvoiceNumber } = useGenerateInvoiceNumber();
  const createInvoice = useCreateInvoice();
  const updateInvoice = useUpdateInvoice();
  const createNotification = useCreateNotification();
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string | undefined>(
    invoice?.product_id || undefined
  );
  const [clientPopoverOpen, setClientPopoverOpen] = useState(false);
  const [productPopoverOpen, setProductPopoverOpen] = useState(false);

  const form = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      client_id: "",
      product_id: "",
      amount: "",
      status: "pending",
      notes: "",
    },
  });

  useEffect(() => {
    if (invoice) {
      form.reset({
        client_id: invoice.client_id,
        product_id: invoice.product_id || "",
        amount: invoice.amount.toString(),
        status: invoice.status as "pending" | "paid" | "overdue",
        notes: invoice.notes || "",
      });
      setSelectedProductId(invoice.product_id || undefined);
    } else {
      form.reset({
        client_id: "",
        product_id: "",
        amount: "",
        status: "pending",
        notes: "",
      });
      setSelectedProductId(undefined);
    }
  }, [invoice, form]);

  const handleProductChange = (productId: string) => {
    setSelectedProductId(productId);
    const selectedProduct = products?.find((p) => p.id === productId);
    if (selectedProduct) {
      form.setValue("amount", selectedProduct.price.toString());
    }
  };

  const handleProductDialogClose = () => {
    setProductDialogOpen(false);
  };

  const onSubmit = async (data: InvoiceFormData) => {
    try {
      const invoiceData = {
        client_id: data.client_id,
        product_id: data.product_id || null,
        amount: parseFloat(data.amount),
        status: data.status,
        notes: data.notes || null,
        invoice_number: invoice?.invoice_number || nextInvoiceNumber || `INV-${Date.now()}`,
      };

      if (invoice) {
        await updateInvoice.mutateAsync({
          id: invoice.id,
          updates: invoiceData,
        });
        toast.success("Invoice updated successfully");
      } else {
        const createdInvoice = await createInvoice.mutateAsync(invoiceData);
        
        // Create corresponding sale transaction for new invoices
        if (createdInvoice) {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const { data: profile } = await supabase
              .from("profiles")
              .select("tenant_id")
              .eq("user_id", user.id)
              .single();

            if (profile) {
              await supabase.from("transactions").insert({
                tenant_id: profile.tenant_id,
                client_id: data.client_id,
                invoice_id: createdInvoice.id,
                amount: parseFloat(data.amount),
                type: "sale",
                date: new Date().toISOString(),
                notes: data.notes || `Invoice ${invoiceData.invoice_number}`,
              });
            }
          }
        }
        
        toast.success("Invoice created successfully");
        
        // Create notification for new invoice
        const selectedClient = clients.find(c => c.id === data.client_id);
        createNotification.mutate({
          title: 'New Invoice Created',
          message: `Invoice ${invoiceData.invoice_number} for ${selectedClient?.name || 'client'} - KES ${parseFloat(data.amount).toLocaleString()}`,
          type: 'invoice',
          link: '/invoices',
          read: false,
        });
      }

      onClose();
    } catch (error) {
      console.error("Error saving invoice:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to save invoice";
      toast.error(errorMessage);
    }
  };

  // Show all clients (not just active ones) to ensure dropdown is never empty
  const availableClients = clients || [];

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-lg mx-auto max-h-[90vh] overflow-y-auto">
          <div className="w-full">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">{invoice ? "Edit Invoice" : "Create Invoice"}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 sm:space-y-5">
              <FormField
                control={form.control}
                name="client_id"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel className="text-sm sm:text-base">Client</FormLabel>
                    <Popover open={clientPopoverOpen} onOpenChange={setClientPopoverOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={clientPopoverOpen}
                            className={cn(
                              "w-full justify-between h-11 sm:h-10 text-base",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value
                              ? availableClients.find((client) => client.id === field.value)?.name
                              : "Search client..."}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0 bg-popover z-50" align="start">
                        <Command>
                          <CommandInput placeholder="Search client..." />
                          <CommandList>
                            <CommandEmpty>No client found.</CommandEmpty>
                            <CommandGroup>
                              {availableClients.map((client) => (
                                <CommandItem
                                  key={client.id}
                                  value={client.name || client.phone_number}
                                  onSelect={() => {
                                    field.onChange(client.id);
                                    setClientPopoverOpen(false);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      field.value === client.id ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  {client.name || client.phone_number}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="product_id"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel className="text-sm sm:text-base">Product (Optional)</FormLabel>
                    <div className="flex gap-2">
                      <Popover open={productPopoverOpen} onOpenChange={setProductPopoverOpen}>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              role="combobox"
                              aria-expanded={productPopoverOpen}
                              className={cn(
                                "flex-1 justify-between h-11 sm:h-10 text-base",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value
                                ? products.find((product) => product.id === field.value)?.name
                                : "Search product..."}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0 bg-popover z-50" align="start">
                          <Command>
                            <CommandInput placeholder="Search product..." />
                            <CommandList>
                              <CommandEmpty>No product found.</CommandEmpty>
                              <CommandGroup>
                                {products
                                  .filter((product) => product.price)
                                  .map((product) => (
                                    <CommandItem
                                      key={product.id}
                                      value={product.name}
                                      onSelect={() => {
                                        field.onChange(product.id);
                                        handleProductChange(product.id);
                                        setProductPopoverOpen(false);
                                      }}
                                    >
                                      <Check
                                        className={cn(
                                          "mr-2 h-4 w-4",
                                          field.value === product.id ? "opacity-100" : "opacity-0"
                                        )}
                                      />
                                      {product.name} - KES {product.price.toLocaleString()}
                                    </CommandItem>
                                  ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => setProductDialogOpen(true)}
                        className="h-11 w-11 sm:h-10 sm:w-10"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm sm:text-base">Amount (KES)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01" 
                        className="h-11 sm:h-10 text-base" 
                        placeholder="Enter amount"
                        readOnly={!!selectedProductId}
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm sm:text-base">Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-11 sm:h-10 text-base">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                       <SelectContent position="popper" sideOffset={4}>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="partial">Partial</SelectItem>
                        <SelectItem value="paid">Paid</SelectItem>
                        <SelectItem value="overdue">Overdue</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm sm:text-base">Notes</FormLabel>
                    <FormControl>
                      <Textarea className="min-h-[80px] text-base" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button 
                type="submit" 
                disabled={createInvoice.isPending || updateInvoice.isPending}
                className="w-full h-11 sm:h-10 text-base sm:text-sm"
              >
                {createInvoice.isPending || updateInvoice.isPending ? "Saving..." : invoice ? "Update" : "Create"}
              </Button>
            </form>
          </Form>
          </div>
        </DialogContent>
      </Dialog>

      <ProductDialog
        open={productDialogOpen}
        onClose={handleProductDialogClose}
        product={null}
      />
    </>
  );
}