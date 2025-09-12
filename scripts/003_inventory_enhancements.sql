-- Add inventory tracking tables
CREATE TABLE IF NOT EXISTS public.inventory_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.products(id) NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('in', 'out', 'adjustment')),
  quantity INTEGER NOT NULL,
  reference_type TEXT, -- 'order', 'purchase', 'adjustment'
  reference_id UUID, -- order_id, purchase_id, etc.
  notes TEXT,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add suppliers table
CREATE TABLE IF NOT EXISTS public.suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  contact_name TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  country TEXT DEFAULT 'US',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add product suppliers relationship
CREATE TABLE IF NOT EXISTS public.product_suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  supplier_id UUID REFERENCES public.suppliers(id) ON DELETE CASCADE,
  supplier_sku TEXT,
  cost_price DECIMAL(10,2),
  lead_time_days INTEGER DEFAULT 7,
  minimum_order_quantity INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(product_id, supplier_id)
);

-- Enable RLS on new tables
ALTER TABLE public.inventory_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_suppliers ENABLE ROW LEVEL SECURITY;

-- RLS policies for inventory_transactions
CREATE POLICY "Staff can view inventory transactions" ON public.inventory_transactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'ops', 'finance')
    )
  );

CREATE POLICY "Ops and admin can manage inventory transactions" ON public.inventory_transactions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'ops')
    )
  );

-- RLS policies for suppliers
CREATE POLICY "Staff can view suppliers" ON public.suppliers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'ops', 'finance')
    )
  );

CREATE POLICY "Ops and admin can manage suppliers" ON public.suppliers
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'ops')
    )
  );

-- RLS policies for product_suppliers
CREATE POLICY "Staff can view product suppliers" ON public.product_suppliers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'ops', 'finance')
    )
  );

CREATE POLICY "Ops and admin can manage product suppliers" ON public.product_suppliers
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'ops')
    )
  );

-- Function to update product stock after inventory transaction
CREATE OR REPLACE FUNCTION update_product_stock()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.transaction_type = 'in' THEN
    UPDATE public.products 
    SET stock_quantity = stock_quantity + NEW.quantity
    WHERE id = NEW.product_id;
  ELSIF NEW.transaction_type = 'out' THEN
    UPDATE public.products 
    SET stock_quantity = stock_quantity - NEW.quantity
    WHERE id = NEW.product_id;
  ELSIF NEW.transaction_type = 'adjustment' THEN
    UPDATE public.products 
    SET stock_quantity = NEW.quantity
    WHERE id = NEW.product_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update stock
CREATE TRIGGER inventory_transaction_trigger
  AFTER INSERT ON public.inventory_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_product_stock();
