import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";
import { useCreateClient, useUpdateClient, useCreateClientUser } from "@/hooks/useClients";

const clientSchema = z.object({
  phone_number: z
    .string()
    .regex(/^0\d{9}$/, "Phone must be 10 digits starting with 0")
    .min(1, "Phone number is required"),
});

type ClientFormData = z.infer<typeof clientSchema>;

interface ClientDialogProps {
  open: boolean;
  onClose: () => void;
  client: Tables<"clients"> | null;
}

export function ClientDialog({ open, onClose, client }: ClientDialogProps) {
  const createClient = useCreateClient();
  const updateClient = useUpdateClient();
  const createClientUser = useCreateClientUser();

  const form = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      phone_number: "",
    },
  });

  const isLoading = createClient.isPending || updateClient.isPending || createClientUser.isPending;

  useEffect(() => {
    if (client) {
      form.reset({
        phone_number: client.phone_number || "",
      });
    } else {
      form.reset({
        phone_number: "",
      });
    }
  }, [client, form]);

  const generatePIN = () => {
    // Use cryptographically secure random number generation
    const array = new Uint32Array(1);
    crypto.getRandomValues(array);
    const pin = (array[0] % 900000) + 100000;
    return pin.toString();
  };

  const onSubmit = async (data: ClientFormData) => {
    try {
      if (client) {
        // Update existing client
        await updateClient.mutateAsync({
          id: client.id,
          updates: {
            phone_number: data.phone_number,
          },
        });
        toast.success("Client updated successfully");
      } else {
        // Create new client with PIN - run client creation first for faster feedback
        const pin = generatePIN();
        
        // Create client record first (fast)
        await createClient.mutateAsync({
          phone_number: data.phone_number,
          name: data.phone_number,
        });

        // Create auth account in background (slow - sends SMS)
        createClientUser.mutateAsync({
          phoneNumber: data.phone_number,
          pin,
        }).catch((error) => {
          console.error("Failed to create client user account:", error);
          // Non-blocking - client record is already created
        });

        toast.success("Client created successfully! PIN will be sent via SMS.", {
          duration: 5000,
        });
      }

      onClose();
    } catch (error) {
      console.error("Error saving client:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to save client";
      toast.error(errorMessage);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-lg mx-4">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">{client ? "Edit Client" : "Add Client"}</DialogTitle>
          <DialogDescription className="text-sm">
            {client ? "Update client information" : "Add a new client to your system"}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6">
            <FormField
              control={form.control}
              name="phone_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm sm:text-base">Phone Number</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="0712345678" 
                      className="h-11 sm:h-10 text-base" 
                      {...field} 
                      disabled={!!client || isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button type="submit" className="flex-1 h-11 sm:h-10 text-base sm:text-sm" disabled={isLoading}>
                {isLoading ? "Processing..." : client ? "Update Client" : "Create Client"}
              </Button>
              <Button type="button" variant="secondary" className="flex-1 h-11 sm:h-10 text-base sm:text-sm" onClick={onClose} disabled={isLoading}>
                Cancel
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
