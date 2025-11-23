import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { queryKeys } from '@/lib/queryClient';
import * as clientsApi from '@/api/clients.api';
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
 * Create a new client
 */
export const useCreateClient = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Omit<TablesInsert<'clients'>, 'tenant_id'>) =>
      clientsApi.createClient(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.clients });
    },
    onError: (error: Error) => {
      console.error('Create client error:', error);
    },
  });
};

/**
 * Update an existing client
 */
export const useUpdateClient = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: TablesUpdate<'clients'> }) =>
      clientsApi.updateClient(id, updates),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.clients });
      queryClient.invalidateQueries({ queryKey: queryKeys.clientById(data.id) });
    },
    onError: (error: Error) => {
      console.error('Update client error:', error);
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
      queryClient.setQueryData(queryKeys.clients, (old: any) => {
        if (!old) return old;
        return old.filter((client: any) => client.id !== clientId);
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
