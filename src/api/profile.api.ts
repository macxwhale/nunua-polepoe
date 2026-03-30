import { supabase } from '@/integrations/supabase/client';

export interface UserProfile {
  id: string;
  user_id: string;
  tenant_id: string;
  full_name: string;
  phone_number: string;
  email: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Get the current authenticated user's profile
 */
export const getUserProfile = async (): Promise<UserProfile> => {
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError || !user) {
    throw new Error('Not authenticated');
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (profileError || !profile) {
    console.error("Profile error details:", profileError);
    throw new Error(profileError ? profileError.message : 'Profile not found');
  }

  return profile as UserProfile;
};

/**
 * Update the current user's profile
 */
export const updateUserProfile = async (updates: Partial<Pick<UserProfile, 'full_name' | 'email'>>) => {
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError || !user) {
    throw new Error('Not authenticated');
  }

  console.log('Updating profile for user:', user.id, 'with data:', updates);

  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) {
    console.error('Profile update error:', error);
    throw error;
  }

  console.log('Profile update success:', data);
  return data as UserProfile;
};
