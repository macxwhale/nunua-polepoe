import { supabase } from '@/integrations/supabase/client';
import { getCurrentTenantId } from './tenant.api';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

type Client = Tables<'clients'>;
type ClientInsert = TablesInsert<'clients'>;
type ClientUpdate = TablesUpdate<'clients'>;

export interface ClientWithDetails extends Client {
  totalInvoiced: number;
  totalPaid: number;
}

/**
 * Get all clients with aggregated financial details
 * Optimized single query to avoid N+1 problem
 */
export const getClientsWithDetails = async (): Promise<ClientWithDetails[]> => {
  const tenantId = await getCurrentTenantId();

  const { data: clients, error: clientsError } = await supabase
    .from('clients')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false });

  if (clientsError) throw clientsError;
  if (!clients) return [];

  // Fetch all invoices for these clients in one query
  const { data: invoices, error: invoicesError } = await supabase
    .from('invoices')
    .select('client_id, amount')
    .eq('tenant_id', tenantId)
    .in('client_id', clients.map(c => c.id));

  if (invoicesError) throw invoicesError;

  // Fetch all transactions for these clients in one query
  const { data: transactions, error: transactionsError } = await supabase
    .from('transactions')
    .select('client_id, amount, type')
    .eq('tenant_id', tenantId)
    .in('client_id', clients.map(c => c.id));

  if (transactionsError) throw transactionsError;

  // Aggregate data
  return clients.map(client => {
    const clientInvoices = invoices?.filter(inv => inv.client_id === client.id) || [];
    const clientTransactions = transactions?.filter(txn => txn.client_id === client.id) || [];

    const totalInvoiced = clientInvoices.reduce(
      (sum, inv) => sum + Number(inv.amount || 0),
      0
    );

    const totalPaid = clientTransactions
      .filter(txn => txn.type === 'payment')
      .reduce((sum, txn) => sum + Number(txn.amount || 0), 0);

    return {
      ...client,
      totalInvoiced,
      totalPaid,
    };
  });
};

/**
 * Get a single client by ID
 */
export const getClientById = async (id: string): Promise<Client | null> => {
  const tenantId = await getCurrentTenantId();

  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .single();

  if (error) throw error;
  return data;
};

/**
 * Create a new client
 */
export const createClient = async (
  clientData: Omit<ClientInsert, 'tenant_id'>
): Promise<Client> => {
  const tenantId = await getCurrentTenantId();

  const { data, error } = await supabase
    .from('clients')
    .insert({
      ...clientData,
      tenant_id: tenantId,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

/**
 * Update an existing client
 */
export const updateClient = async (
  id: string,
  updates: ClientUpdate
): Promise<Client> => {
  const tenantId = await getCurrentTenantId();

  const { data, error } = await supabase
    .from('clients')
    .update(updates)
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

/**
 * Delete a client
 */
export const deleteClient = async (id: string): Promise<void> => {
  const tenantId = await getCurrentTenantId();

  const { error } = await supabase
    .from('clients')
    .delete()
    .eq('id', id)
    .eq('tenant_id', tenantId);

  if (error) throw error;
};

/**
 * Update client balance (used for top-ups and sales)
 */
export const updateClientBalance = async (
  clientId: string,
  amount: number
): Promise<void> => {
  const tenantId = await getCurrentTenantId();

  // Get current balance
  const { data: client, error: fetchError } = await supabase
    .from('clients')
    .select('total_balance')
    .eq('id', clientId)
    .eq('tenant_id', tenantId)
    .single();

  if (fetchError) throw fetchError;

  const newBalance = Number(client.total_balance) + amount;

  const { error: updateError } = await supabase
    .from('clients')
    .update({ total_balance: newBalance })
    .eq('id', clientId)
    .eq('tenant_id', tenantId);

  if (updateError) throw updateError;
};

/**
 * Create a client user account via edge function
 */
export const createClientUser = async (
  phoneNumber: string,
  pin: string
): Promise<{ userId: string; email: string }> => {
  const tenantId = await getCurrentTenantId();

  const { data, error } = await supabase.functions.invoke('create-client-user', {
    body: {
      email: `${phoneNumber}-${tenantId}@client.internal`, // Will be overridden by edge function
      password: pin,
      metadata: { role: 'client', phone_number: phoneNumber },
      tenantId,
      phoneNumber,
    },
  });

  if (error) {
    console.error('create-client-user edge function error:', error);
    let message = 'Failed to create client account';

    // Try to extract a user-friendly message from the edge function response
    if (typeof error.message === 'string') {
      const jsonMatch = error.message.match(/{.*}$/s);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0]);
          if (parsed && typeof parsed.error === 'string') {
            message = parsed.error;
          }
        } catch {
          // Ignore JSON parse errors and fall back to default message
        }
      }
    }

    throw new Error(message);
  }

  if ((data as any)?.error) {
    throw new Error((data as any).error as string);
  }
  
  return data as { userId: string; email: string };
};
