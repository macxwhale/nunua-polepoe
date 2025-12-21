import { supabase } from "@/integrations/supabase/client";
import { getCurrentTenantId } from "./tenant.api";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";

export type Transaction = Tables<"transactions">;
export type TransactionInsert = TablesInsert<"transactions">;

export interface CreatePaymentData {
  clientId: string;
  invoiceId: string;
  amount: number;
  date: Date;
  notes?: string;
}

export interface CreateSaleData {
  clientId: string;
  invoiceId: string;
  amount: number;
  notes?: string;
}

/**
 * Fetch all transactions for the current tenant
 */
export const getTransactions = async (): Promise<Transaction[]> => {
  const tenantId = await getCurrentTenantId();

  const { data, error } = await supabase
    .from("transactions")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
};

/**
 * Fetch transactions for a specific client
 */
export const getTransactionsByClient = async (clientId: string): Promise<Transaction[]> => {
  const tenantId = await getCurrentTenantId();

  const { data, error } = await supabase
    .from("transactions")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("client_id", clientId)
    .order("date", { ascending: false });

  if (error) throw error;
  return data || [];
};

/**
 * Fetch transactions for a specific invoice
 */
export const getTransactionsByInvoice = async (invoiceId: string): Promise<Transaction[]> => {
  const tenantId = await getCurrentTenantId();

  const { data, error } = await supabase
    .from("transactions")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("invoice_id", invoiceId)
    .order("date", { ascending: false });

  if (error) throw error;
  return data || [];
};

/**
 * Get total paid amount for an invoice
 */
export const getInvoicePaidAmount = async (invoiceId: string): Promise<number> => {
  const tenantId = await getCurrentTenantId();

  const { data, error } = await supabase
    .from("transactions")
    .select("amount")
    .eq("tenant_id", tenantId)
    .eq("invoice_id", invoiceId)
    .eq("type", "payment");

  if (error) throw error;
  return data?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;
};

/**
 * Create a payment transaction
 */
export const createPaymentTransaction = async (data: CreatePaymentData): Promise<Transaction> => {
  const tenantId = await getCurrentTenantId();

  const { data: transaction, error } = await supabase
    .from("transactions")
    .insert({
      tenant_id: tenantId,
      client_id: data.clientId,
      invoice_id: data.invoiceId,
      amount: data.amount,
      type: "payment",
      date: data.date.toISOString(),
      notes: data.notes,
    })
    .select()
    .single();

  if (error) throw error;
  return transaction;
};

/**
 * Create a sale transaction
 */
export const createSaleTransaction = async (data: CreateSaleData): Promise<Transaction> => {
  const tenantId = await getCurrentTenantId();

  const { data: transaction, error } = await supabase
    .from("transactions")
    .insert({
      tenant_id: tenantId,
      client_id: data.clientId,
      invoice_id: data.invoiceId,
      amount: data.amount,
      type: "sale",
      date: new Date().toISOString(),
      notes: data.notes,
    })
    .select()
    .single();

  if (error) throw error;
  return transaction;
};
