import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryClient";
import * as transactionsApi from "@/api/transactions.api";
import { toast } from "@/hooks/use-toast";

/**
 * Hook to fetch all transactions
 */
export const useTransactions = () => {
  return useQuery({
    queryKey: queryKeys.transactions,
    queryFn: transactionsApi.getTransactions,
  });
};

/**
 * Hook to fetch transactions for a specific client
 */
export const useTransactionsByClient = (clientId: string) => {
  return useQuery({
    queryKey: queryKeys.transactionsByClient(clientId),
    queryFn: () => transactionsApi.getTransactionsByClient(clientId),
    enabled: !!clientId,
  });
};

/**
 * Hook to fetch transactions for a specific invoice
 */
export const useTransactionsByInvoice = (invoiceId: string) => {
  return useQuery({
    queryKey: queryKeys.transactionsByInvoice(invoiceId),
    queryFn: () => transactionsApi.getTransactionsByInvoice(invoiceId),
    enabled: !!invoiceId,
  });
};

/**
 * Hook to get invoice paid amount
 */
export const useInvoicePaidAmount = (invoiceId: string) => {
  return useQuery({
    queryKey: [...queryKeys.transactionsByInvoice(invoiceId), 'paidAmount'],
    queryFn: () => transactionsApi.getInvoicePaidAmount(invoiceId),
    enabled: !!invoiceId,
  });
};

/**
 * Hook to create a payment transaction
 */
export const useCreatePayment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: transactionsApi.createPaymentTransaction,
    onSuccess: (_, variables) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions });
      queryClient.invalidateQueries({ queryKey: queryKeys.transactionsByClient(variables.clientId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.transactionsByInvoice(variables.invoiceId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.invoices });
      queryClient.invalidateQueries({ queryKey: queryKeys.clients });
      
      toast({
        title: "Payment Recorded",
        description: `Payment of KSH ${variables.amount.toLocaleString()} recorded successfully.`,
      });
    },
    onError: (error) => {
      console.error("Error creating payment:", error);
      toast({
        title: "Error",
        description: "Failed to record payment. Please try again.",
        variant: "destructive",
      });
    },
  });
};

/**
 * Hook to create a sale transaction
 */
export const useCreateSale = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: transactionsApi.createSaleTransaction,
    onSuccess: (_, variables) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions });
      queryClient.invalidateQueries({ queryKey: queryKeys.transactionsByClient(variables.clientId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.invoices });
      queryClient.invalidateQueries({ queryKey: queryKeys.clients });
    },
    onError: (error) => {
      console.error("Error creating sale:", error);
      toast({
        title: "Error",
        description: "Failed to create sale. Please try again.",
        variant: "destructive",
      });
    },
  });
};
