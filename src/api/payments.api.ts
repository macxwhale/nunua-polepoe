import { supabase } from "@/integrations/supabase/client";
import { getCurrentTenantId } from "./tenant.api";
import type { Tables } from "@/integrations/supabase/types";

export type PaymentDetail = Tables<"payment_details">;

export interface PaymentDetailInsert {
  payment_type: 'mpesa_paybill' | 'mpesa_till';
  name: string;
  paybill?: string;
  account_no?: string;
  till?: string;
  is_active?: boolean;
}

/**
 * Fetch all payment details for the current tenant
 */
export const getPaymentDetails = async (): Promise<PaymentDetail[]> => {
  const tenantId = await getCurrentTenantId();

  const { data, error } = await supabase
    .from("payment_details")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
};

/**
 * Fetch active payment details
 */
export const getActivePaymentDetails = async (): Promise<PaymentDetail[]> => {
  const tenantId = await getCurrentTenantId();

  const { data, error } = await supabase
    .from("payment_details")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
};

/**
 * Create a new payment detail
 */
export const createPaymentDetail = async (
  paymentData: PaymentDetailInsert
): Promise<PaymentDetail> => {
  const tenantId = await getCurrentTenantId();

  const { data, error } = await supabase
    .from("payment_details")
    .insert({
      ...paymentData,
      tenant_id: tenantId,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

/**
 * Update a payment detail
 */
export const updatePaymentDetail = async (
  id: string,
  updates: Partial<PaymentDetailInsert>
): Promise<PaymentDetail> => {
  const { data, error } = await supabase
    .from("payment_details")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

/**
 * Delete a payment detail
 */
export const deletePaymentDetail = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from("payment_details")
    .delete()
    .eq("id", id);

  if (error) throw error;
};
