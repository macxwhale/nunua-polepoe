-- Update RLS policy for clients to handle tenant-specific email format
-- Drop the existing policy first
DROP POLICY IF EXISTS "Clients can view their own record" ON public.clients;

-- Create new policy that extracts both phone and tenant from email
CREATE POLICY "Clients can view their own record" ON public.clients
FOR SELECT USING (
  phone_number = substring((auth.jwt() ->> 'email'::text), '^(.+)-[^-]+@client\.internal$'::text)
  AND tenant_id::text = substring((auth.jwt() ->> 'email'::text), '^.+-([^-]+)@client\.internal$'::text)
);

-- Update RLS policy for invoices
DROP POLICY IF EXISTS "Clients can view their own invoices" ON public.invoices;

CREATE POLICY "Clients can view their own invoices" ON public.invoices
FOR SELECT USING (
  client_id IN (
    SELECT clients.id
    FROM clients
    WHERE clients.phone_number = substring((auth.jwt() ->> 'email'::text), '^(.+)-[^-]+@client\.internal$'::text)
    AND clients.tenant_id::text = substring((auth.jwt() ->> 'email'::text), '^.+-([^-]+)@client\.internal$'::text)
  )
);

-- Update RLS policy for payment_details
DROP POLICY IF EXISTS "Clients can view active payment details" ON public.payment_details;

CREATE POLICY "Clients can view active payment details" ON public.payment_details
FOR SELECT USING (
  is_active = true 
  AND tenant_id IN (
    SELECT clients.tenant_id
    FROM clients
    WHERE clients.phone_number = substring((auth.jwt() ->> 'email'::text), '^(.+)-[^-]+@client\.internal$'::text)
    AND clients.tenant_id::text = substring((auth.jwt() ->> 'email'::text), '^.+-([^-]+)@client\.internal$'::text)
  )
);