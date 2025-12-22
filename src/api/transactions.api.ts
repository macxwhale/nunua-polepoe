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
 * Send SMS notification for a transaction
 */
const sendTransactionSms = async (data: {
  clientId: string;
  type: 'sale' | 'payment';
  amount: number;
  invoiceNumber?: string;
  productName?: string;
  newBalance?: number;
}) => {
  try {
    console.log("Sending transaction SMS:", data);
    const { data: result, error } = await supabase.functions.invoke('send-transaction-sms', {
      body: data,
    });
    
    if (error) {
      console.error("SMS function error:", error);
    } else {
      console.log("SMS function result:", result);
    }
  } catch (err) {
    // Don't fail the transaction if SMS fails
    console.error("Failed to send transaction SMS:", err);
  }
};

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
 * Create a payment transaction and send SMS
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

  // Fetch invoice details for SMS
  const { data: invoice } = await supabase
    .from("invoices")
    .select("invoice_number, amount")
    .eq("id", data.invoiceId)
    .single();

  // Get total paid for this invoice to calculate remaining balance
  const paidAmount = await getInvoicePaidAmount(data.invoiceId);
  const remainingBalance = invoice ? Number(invoice.amount) - paidAmount : undefined;

  // Send SMS notification (non-blocking)
  sendTransactionSms({
    clientId: data.clientId,
    type: 'payment',
    amount: data.amount,
    invoiceNumber: invoice?.invoice_number,
    newBalance: remainingBalance,
  });

  return transaction;
};

/**
 * Create a sale transaction and send SMS
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

  // Fetch invoice and product details for SMS
  const { data: invoice } = await supabase
    .from("invoices")
    .select("invoice_number, product_id, products(name)")
    .eq("id", data.invoiceId)
    .single();

  const productName = (invoice as any)?.products?.name;

  // Send SMS notification (non-blocking)
  sendTransactionSms({
    clientId: data.clientId,
    type: 'sale',
    amount: data.amount,
    invoiceNumber: invoice?.invoice_number,
    productName,
  });

  return transaction;
};
