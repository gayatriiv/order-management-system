-- Create invoices table
CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number TEXT UNIQUE NOT NULL,
  order_id UUID REFERENCES public.orders(id) NOT NULL,
  customer_id UUID REFERENCES public.customers(id) NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('draft', 'sent', 'viewed', 'paid', 'overdue', 'cancelled')) DEFAULT 'draft',
  
  -- Invoice amounts
  subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
  tax_rate DECIMAL(5,4) DEFAULT 0, -- e.g., 0.0825 for 8.25%
  tax_amount DECIMAL(10,2) DEFAULT 0,
  shipping_amount DECIMAL(10,2) DEFAULT 0,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  
  -- Payment terms and dates
  payment_terms TEXT DEFAULT 'Net 30', -- Net 30, Net 15, Due on Receipt, etc.
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE NOT NULL,
  paid_date DATE,
  
  -- Invoice details
  notes TEXT,
  terms_conditions TEXT,
  
  -- Billing addresses
  bill_to_name TEXT NOT NULL,
  bill_to_company TEXT,
  bill_to_address TEXT NOT NULL,
  bill_to_city TEXT NOT NULL,
  bill_to_state TEXT NOT NULL,
  bill_to_zip TEXT NOT NULL,
  bill_to_country TEXT DEFAULT 'US',
  
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create invoice line items table
CREATE TABLE IF NOT EXISTS public.invoice_line_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID REFERENCES public.invoices(id) ON DELETE CASCADE,
  order_item_id UUID REFERENCES public.order_items(id),
  description TEXT NOT NULL,
  quantity DECIMAL(10,2) NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create payments table
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_number TEXT UNIQUE NOT NULL,
  invoice_id UUID REFERENCES public.invoices(id) NOT NULL,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('credit_card', 'bank_transfer', 'check', 'cash', 'paypal', 'stripe', 'other')),
  payment_status TEXT NOT NULL CHECK (payment_status IN ('pending', 'processing', 'completed', 'failed', 'refunded', 'cancelled')) DEFAULT 'pending',
  
  -- Payment amounts
  amount DECIMAL(10,2) NOT NULL,
  fee_amount DECIMAL(10,2) DEFAULT 0,
  net_amount DECIMAL(10,2) NOT NULL,
  
  -- Payment details
  transaction_id TEXT, -- External payment processor transaction ID
  reference_number TEXT, -- Check number, wire reference, etc.
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  processed_date TIMESTAMP WITH TIME ZONE,
  
  -- Payment processor info
  processor TEXT, -- stripe, paypal, square, etc.
  processor_fee DECIMAL(10,2) DEFAULT 0,
  
  notes TEXT,
  
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create payment terms table for standardized terms
CREATE TABLE IF NOT EXISTS public.payment_terms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  days INTEGER NOT NULL, -- Number of days from invoice date
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create credit memos table for refunds/adjustments
CREATE TABLE IF NOT EXISTS public.credit_memos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  credit_memo_number TEXT UNIQUE NOT NULL,
  invoice_id UUID REFERENCES public.invoices(id),
  customer_id UUID REFERENCES public.customers(id) NOT NULL,
  reason TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('draft', 'issued', 'applied')) DEFAULT 'draft',
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  applied_date DATE,
  notes TEXT,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on billing tables
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_terms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_memos ENABLE ROW LEVEL SECURITY;

-- RLS policies for invoices
CREATE POLICY "Staff can view all invoices" ON public.invoices
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'finance', 'sales')
    )
  );

CREATE POLICY "Clients can view their invoices" ON public.invoices
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      JOIN public.customers c ON c.id = customer_id
      WHERE p.id = auth.uid() AND p.role = 'client' AND c.email = p.email
    )
  );

CREATE POLICY "Finance and admin can manage invoices" ON public.invoices
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'finance')
    )
  );

-- RLS policies for invoice_line_items
CREATE POLICY "Users can view line items for accessible invoices" ON public.invoice_line_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.invoices i
      WHERE i.id = invoice_id AND (
        EXISTS (
          SELECT 1 FROM public.profiles 
          WHERE id = auth.uid() AND role IN ('admin', 'finance', 'sales')
        )
        OR
        EXISTS (
          SELECT 1 FROM public.profiles p
          JOIN public.customers c ON c.id = i.customer_id
          WHERE p.id = auth.uid() AND p.role = 'client' AND c.email = p.email
        )
      )
    )
  );

CREATE POLICY "Finance can manage invoice line items" ON public.invoice_line_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'finance')
    )
  );

-- RLS policies for payments
CREATE POLICY "Staff can view all payments" ON public.payments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'finance', 'sales')
    )
  );

CREATE POLICY "Clients can view their payments" ON public.payments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      JOIN public.invoices i ON i.id = invoice_id
      JOIN public.customers c ON c.id = i.customer_id
      WHERE p.id = auth.uid() AND p.role = 'client' AND c.email = p.email
    )
  );

CREATE POLICY "Finance and admin can manage payments" ON public.payments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'finance')
    )
  );

-- RLS policies for payment_terms
CREATE POLICY "All authenticated users can view payment terms" ON public.payment_terms
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admin and finance can manage payment terms" ON public.payment_terms
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'finance')
    )
  );

-- RLS policies for credit_memos
CREATE POLICY "Staff can view all credit memos" ON public.credit_memos
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'finance', 'sales')
    )
  );

CREATE POLICY "Clients can view their credit memos" ON public.credit_memos
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      JOIN public.customers c ON c.id = customer_id
      WHERE p.id = auth.uid() AND p.role = 'client' AND c.email = p.email
    )
  );

CREATE POLICY "Finance and admin can manage credit memos" ON public.credit_memos
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'finance')
    )
  );

-- Insert default payment terms
INSERT INTO public.payment_terms (name, days, description) VALUES
('Due on Receipt', 0, 'Payment due immediately upon receipt'),
('Net 15', 15, 'Payment due within 15 days'),
('Net 30', 30, 'Payment due within 30 days'),
('Net 60', 60, 'Payment due within 60 days'),
('Net 90', 90, 'Payment due within 90 days')
ON CONFLICT (name) DO NOTHING;

-- Function to calculate invoice due date based on payment terms
CREATE OR REPLACE FUNCTION calculate_due_date(issue_date DATE, payment_terms TEXT)
RETURNS DATE AS $$
DECLARE
  term_days INTEGER;
BEGIN
  SELECT days INTO term_days 
  FROM public.payment_terms 
  WHERE name = payment_terms AND is_active = true;
  
  IF term_days IS NULL THEN
    term_days := 30; -- Default to Net 30
  END IF;
  
  RETURN issue_date + INTERVAL '1 day' * term_days;
END;
$$ LANGUAGE plpgsql;

-- Function to update invoice status based on payments
CREATE OR REPLACE FUNCTION update_invoice_payment_status()
RETURNS TRIGGER AS $$
DECLARE
  invoice_total DECIMAL(10,2);
  payments_total DECIMAL(10,2);
BEGIN
  -- Get invoice total
  SELECT total_amount INTO invoice_total
  FROM public.invoices
  WHERE id = NEW.invoice_id;
  
  -- Get sum of completed payments
  SELECT COALESCE(SUM(amount), 0) INTO payments_total
  FROM public.payments
  WHERE invoice_id = NEW.invoice_id AND payment_status = 'completed';
  
  -- Update invoice status based on payment
  IF payments_total >= invoice_total THEN
    UPDATE public.invoices 
    SET status = 'paid', paid_date = CURRENT_DATE
    WHERE id = NEW.invoice_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update invoice status when payment is completed
CREATE TRIGGER payment_status_trigger
  AFTER INSERT OR UPDATE ON public.payments
  FOR EACH ROW
  WHEN (NEW.payment_status = 'completed')
  EXECUTE FUNCTION update_invoice_payment_status();

-- Function to auto-generate invoice from order
CREATE OR REPLACE FUNCTION generate_invoice_from_order(order_uuid UUID)
RETURNS UUID AS $$
DECLARE
  invoice_uuid UUID;
  order_record RECORD;
  invoice_num TEXT;
BEGIN
  -- Get order details
  SELECT o.*, c.company_name, c.contact_name, c.address, c.city, c.state, c.zip_code
  INTO order_record
  FROM public.orders o
  JOIN public.customers c ON c.id = o.customer_id
  WHERE o.id = order_uuid;
  
  -- Generate invoice number
  invoice_num := 'INV-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(EXTRACT(EPOCH FROM NOW())::TEXT, 10, '0');
  
  -- Create invoice
  INSERT INTO public.invoices (
    invoice_number,
    order_id,
    customer_id,
    subtotal,
    tax_amount,
    shipping_amount,
    discount_amount,
    total_amount,
    due_date,
    bill_to_name,
    bill_to_company,
    bill_to_address,
    bill_to_city,
    bill_to_state,
    bill_to_zip,
    created_by
  ) VALUES (
    invoice_num,
    order_record.id,
    order_record.customer_id,
    order_record.total_amount - COALESCE(order_record.tax_amount, 0) - COALESCE(order_record.shipping_amount, 0) + COALESCE(order_record.discount_amount, 0),
    COALESCE(order_record.tax_amount, 0),
    COALESCE(order_record.shipping_amount, 0),
    COALESCE(order_record.discount_amount, 0),
    order_record.total_amount,
    calculate_due_date(CURRENT_DATE, 'Net 30'),
    order_record.contact_name,
    order_record.company_name,
    order_record.address,
    order_record.city,
    order_record.state,
    order_record.zip_code,
    order_record.created_by
  ) RETURNING id INTO invoice_uuid;
  
  -- Create invoice line items from order items
  INSERT INTO public.invoice_line_items (invoice_id, order_item_id, description, quantity, unit_price, total_price)
  SELECT 
    invoice_uuid,
    oi.id,
    p.name,
    oi.quantity,
    oi.unit_price,
    oi.total_price
  FROM public.order_items oi
  JOIN public.products p ON p.id = oi.product_id
  WHERE oi.order_id = order_uuid;
  
  RETURN invoice_uuid;
END;
$$ LANGUAGE plpgsql;
