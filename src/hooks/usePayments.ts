import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as paymentsApi from "@/api/payments.api";
import { toast } from "sonner";

export const queryKeys = {
  payments: ["payment-details"] as const,
  activePayments: ["payment-details", "active"] as const,
};

/**
 * Hook to fetch all payment details
 */
export const usePaymentDetails = () => {
  return useQuery({
    queryKey: queryKeys.payments,
    queryFn: paymentsApi.getPaymentDetails,
  });
};

/**
 * Hook to fetch active payment details
 */
export const useActivePaymentDetails = () => {
  return useQuery({
    queryKey: queryKeys.activePayments,
    queryFn: paymentsApi.getActivePaymentDetails,
  });
};

/**
 * Hook to create a payment detail
 */
export const useCreatePaymentDetail = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: paymentsApi.createPaymentDetail,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.payments });
      queryClient.invalidateQueries({ queryKey: queryKeys.activePayments });
      toast.success("Payment method added successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to add payment method: ${error.message}`);
    },
  });
};

/**
 * Hook to update a payment detail
 */
export const useUpdatePaymentDetail = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<paymentsApi.PaymentDetailInsert> }) =>
      paymentsApi.updatePaymentDetail(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.payments });
      queryClient.invalidateQueries({ queryKey: queryKeys.activePayments });
      toast.success("Payment method updated successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to update payment method: ${error.message}`);
    },
  });
};

/**
 * Hook to delete a payment detail
 */
export const useDeletePaymentDetail = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: paymentsApi.deletePaymentDetail,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.payments });
      queryClient.invalidateQueries({ queryKey: queryKeys.activePayments });
      toast.success("Payment method deleted successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete payment method: ${error.message}`);
    },
  });
};
