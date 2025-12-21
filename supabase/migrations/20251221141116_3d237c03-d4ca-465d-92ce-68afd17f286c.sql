-- Create function to automatically update invoice status based on payments
-- This implements the state machine: pending -> partial -> paid
CREATE OR REPLACE FUNCTION public.update_invoice_status_on_payment()
RETURNS TRIGGER AS $$
DECLARE
  v_invoice_amount NUMERIC;
  v_total_paid NUMERIC;
  v_new_status TEXT;
  v_invoice_id UUID;
BEGIN
  -- Determine which invoice_id to use (NEW for INSERT/UPDATE, OLD for DELETE)
  IF TG_OP = 'DELETE' THEN
    v_invoice_id := OLD.invoice_id;
  ELSE
    v_invoice_id := NEW.invoice_id;
  END IF;

  -- Skip if no invoice_id
  IF v_invoice_id IS NULL THEN
    IF TG_OP = 'DELETE' THEN
      RETURN OLD;
    ELSE
      RETURN NEW;
    END IF;
  END IF;

  -- Get invoice amount
  SELECT amount INTO v_invoice_amount 
  FROM invoices 
  WHERE id = v_invoice_id;

  -- Calculate total paid for this invoice
  SELECT COALESCE(SUM(amount), 0) INTO v_total_paid
  FROM transactions 
  WHERE invoice_id = v_invoice_id AND type = 'payment';

  -- Determine new status based on state machine logic
  IF v_total_paid >= v_invoice_amount THEN
    v_new_status := 'paid';
  ELSIF v_total_paid > 0 THEN
    v_new_status := 'partial';
  ELSE
    v_new_status := 'pending';
  END IF;

  -- Update invoice status
  UPDATE invoices 
  SET status = v_new_status, updated_at = now()
  WHERE id = v_invoice_id;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger on transactions table for payment-related changes
DROP TRIGGER IF EXISTS trigger_update_invoice_status ON transactions;
CREATE TRIGGER trigger_update_invoice_status
AFTER INSERT OR UPDATE OR DELETE ON transactions
FOR EACH ROW
EXECUTE FUNCTION update_invoice_status_on_payment();