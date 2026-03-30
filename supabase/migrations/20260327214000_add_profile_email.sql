-- Migration: Add email to profiles table
-- Created at: 2026-03-27

-- 1. Add email column to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS email TEXT;

-- 2. Update RLS policies (if needed, though existing policies usually cover all columns)
-- Existing policies on public.profiles:
-- "Users can view profiles in their tenant"
-- "Users can view their own profile"
-- "Users can update their own profile"

-- No change needed to policies as they apply to the entire row by default.

-- 3. Comment for documentation
COMMENT ON COLUMN public.profiles.email IS 'User-provided real email address for transactions and notifications.';
