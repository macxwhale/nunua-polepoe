import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { queryKeys } from '@/lib/queryClient';
import * as clientsApi from '@/api/clients.api';
import type { ClientWithDetails } from '@/api/clients.api';
import type { TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

/**
 * Get all clients with aggregated financial details
 */
export const useClients = () => {
  return useQuery({
    queryKey: queryKeys.clients,
    queryFn: clientsApi.getClientsWithDetails,
  });
};

/**
 * Get a single client by ID
 */
export const useClient = (id: string) => {
  return useQuery({
    queryKey: queryKeys.clientById(id),
    queryFn: () => clientsApi.getClientById(id),
    enabled: !!id,
  });
};

/**
 * Create a new client with optimistic update
 */
export const useCreateClient = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Omit<TablesInsert<'clients'>, 'tenant_id'>) =>
      clientsApi.createClient(data),
    onMutate: async (newClient) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.clients });

      // Snapshot previous value
      const previousClients = queryClient.getQueryData(queryKeys.clients);

      // Optimistically add the new client
      queryClient.setQueryData(queryKeys.clients, (old: ClientWithDetails[] | undefined) => {
        if (!old) return old;
        const optimisticClient: ClientWithDetails = {
          id: `temp-${Date.now()}`,
          name: newClient.name || null,
          phone_number: newClient.phone_number,
          email: newClient.email || null,
          status: 'active',
          total_balance: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          tenant_id: '',
          totalInvoiced: 0,
          totalPaid: 0,
        };
        return [optimisticClient, ...old];
      });

      return { previousClients };
    },
    onError: (error: Error, _, context) => {
      // Rollback on error
      if (context?.previousClients) {
        queryClient.setQueryData(queryKeys.clients, context.previousClients);
      }
      console.error('Create client error:', error);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.clients });
    },
  });
};

/**
 * Update an existing client with optimistic update
 */
export const useUpdateClient = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: TablesUpdate<'clients'> }) =>
      clientsApi.updateClient(id, updates),
    onMutate: async ({ id, updates }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.clients });

      const previousClients = queryClient.getQueryData(queryKeys.clients);

      // Optimistically update the client
      queryClient.setQueryData(queryKeys.clients, (old: ClientWithDetails[] | undefined) => {
        if (!old) return old;
        return old.map((client) =>
          client.id === id ? { ...client, ...updates, updated_at: new Date().toISOString() } : client
        );
      });

      return { previousClients };
    },
    onError: (error: Error, _, context) => {
      if (context?.previousClients) {
        queryClient.setQueryData(queryKeys.clients, context.previousClients);
      }
      console.error('Update client error:', error);
    },
    onSettled: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.clients });
      if (data) {
        queryClient.invalidateQueries({ queryKey: queryKeys.clientById(data.id) });
      }
    },
  });
};

/**
 * Delete a client with optimistic update
 */
export const useDeleteClient = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: clientsApi.deleteClient,
    onMutate: async (clientId: string) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.clients });

      // Snapshot previous value
      const previousClients = queryClient.getQueryData(queryKeys.clients);

      // Optimistically update
      queryClient.setQueryData(queryKeys.clients, (old: ClientWithDetails[] | undefined) => {
        if (!old) return old;
        return old.filter((client) => client.id !== clientId);
      });

      return { previousClients };
    },
    onError: (error: Error, clientId, context) => {
      // Rollback on error
      if (context?.previousClients) {
        queryClient.setQueryData(queryKeys.clients, context.previousClients);
      }
      toast.error(`Failed to delete client: ${error.message}`);
      console.error('Delete client error:', error);
    },
    onSuccess: () => {
      toast.success('Client deleted successfully');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.clients });
    },
  });
};

/**
 * Update client balance (for top-ups and sales)
 */
export const useUpdateClientBalance = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ clientId, amount }: { clientId: string; amount: number }) =>
      clientsApi.updateClientBalance(clientId, amount),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.clients });
      toast.success('Balance updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update balance: ${error.message}`);
      console.error('Update balance error:', error);
    },
  });
};

/**
 * Create a client user account
 */
export const useCreateClientUser = () => {
  return useMutation({
    mutationFn: ({ phoneNumber, pin }: { phoneNumber: string; pin: string }) =>
      clientsApi.createClientUser(phoneNumber, pin),
  });
};
