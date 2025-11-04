-- Create payment_details table for storing configured payment options
CREATE TABLE public.payment_details (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  payment_type TEXT NOT NULL, -- 'mpesa_paybill', 'mpesa_till'
  name TEXT NOT NULL, -- Display name
  paybill TEXT, -- For Mpesa Paybill type
  account_no TEXT, -- For Mpesa Paybill type
  till TEXT, -- For Mpesa Till type
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.payment_details ENABLE ROW LEVEL SECURITY;

-- Create policies for payment_details
CREATE POLICY "Users can view payment details in their tenant" 
ON public.payment_details 
FOR SELECT 
USING (tenant_id = get_user_tenant_id());

CREATE POLICY "Users can insert payment details in their tenant" 
ON public.payment_details 
FOR INSERT 
WITH CHECK (tenant_id = get_user_tenant_id());

CREATE POLICY "Users can update payment details in their tenant" 
ON public.payment_details 
FOR UPDATE 
USING (tenant_id = get_user_tenant_id());

CREATE POLICY "Users can delete payment details in their tenant" 
ON public.payment_details 
FOR DELETE 
USING (tenant_id = get_user_tenant_id());

-- Clients can view active payment details
CREATE POLICY "Clients can view active payment details" 
ON public.payment_details 
FOR SELECT 
USING (
  is_active = true 
  AND tenant_id IN (
    SELECT tenant_id FROM clients 
    WHERE phone_number = substring((auth.jwt() ->> 'email'::text), '^(.+)@client\.internal$')
  )
);

-- Create updated_at trigger
CREATE TRIGGER update_payment_details_updated_at
BEFORE UPDATE ON public.payment_details
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();