-- Create function to generate notifications on payment events (Domain Event pattern)
CREATE OR REPLACE FUNCTION public.create_payment_notification()
RETURNS TRIGGER AS $$
DECLARE
  v_client_name TEXT;
  v_invoice_number TEXT;
  v_user_id UUID;
BEGIN
  -- Only create notification for payment transactions
  IF NEW.type != 'payment' THEN
    RETURN NEW;
  END IF;

  -- Get client name
  SELECT COALESCE(name, phone_number) INTO v_client_name 
  FROM clients 
  WHERE id = NEW.client_id;

  -- Get invoice number if available
  IF NEW.invoice_id IS NOT NULL THEN
    SELECT invoice_number INTO v_invoice_number 
    FROM invoices 
    WHERE id = NEW.invoice_id;
  END IF;

  -- Get user_id from profiles (first user of tenant for notification)
  SELECT user_id INTO v_user_id 
  FROM profiles 
  WHERE tenant_id = NEW.tenant_id 
  LIMIT 1;

  -- Skip if no user found
  IF v_user_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Create notification (Domain Event: PaymentReceived)
  INSERT INTO notifications (tenant_id, user_id, title, message, type, link)
  VALUES (
    NEW.tenant_id,
    v_user_id,
    'Payment Received',
    format('Payment of KSH %s received from %s%s', 
           to_char(NEW.amount, 'FM999,999,999'),
           v_client_name,
           CASE WHEN v_invoice_number IS NOT NULL 
                THEN format(' for Invoice %s', v_invoice_number) 
                ELSE '' 
           END),
    'payment',
    '/clients'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for payment notifications
DROP TRIGGER IF EXISTS trigger_payment_notification ON transactions;
CREATE TRIGGER trigger_payment_notification
AFTER INSERT ON transactions
FOR EACH ROW
EXECUTE FUNCTION create_payment_notification();

-- Create function to generate notifications on invoice creation (Domain Event: InvoiceCreated)
CREATE OR REPLACE FUNCTION public.create_invoice_notification()
RETURNS TRIGGER AS $$
DECLARE
  v_client_name TEXT;
  v_user_id UUID;
BEGIN
  -- Get client name
  SELECT COALESCE(name, phone_number) INTO v_client_name 
  FROM clients 
  WHERE id = NEW.client_id;

  -- Get user_id from profiles
  SELECT user_id INTO v_user_id 
  FROM profiles 
  WHERE tenant_id = NEW.tenant_id 
  LIMIT 1;

  -- Skip if no user found
  IF v_user_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Create notification
  INSERT INTO notifications (tenant_id, user_id, title, message, type, link)
  VALUES (
    NEW.tenant_id,
    v_user_id,
    'Invoice Created',
    format('Invoice %s for KSH %s created for %s', 
           NEW.invoice_number,
           to_char(NEW.amount, 'FM999,999,999'),
           v_client_name),
    'invoice',
    '/invoices'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for invoice notifications
DROP TRIGGER IF EXISTS trigger_invoice_notification ON invoices;
CREATE TRIGGER trigger_invoice_notification
AFTER INSERT ON invoices
FOR EACH ROW
EXECUTE FUNCTION create_invoice_notification();