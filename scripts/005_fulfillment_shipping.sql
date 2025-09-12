-- Create shipping carriers table
CREATE TABLE IF NOT EXISTS public.shipping_carriers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  api_endpoint TEXT,
  api_key_encrypted TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  supported_services JSONB, -- Array of service types like ["standard", "express", "overnight"]
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create shipments table
CREATE TABLE IF NOT EXISTS public.shipments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) NOT NULL,
  shipment_number TEXT UNIQUE NOT NULL,
  carrier_id UUID REFERENCES public.shipping_carriers(id),
  service_type TEXT, -- standard, express, overnight, etc.
  tracking_number TEXT,
  status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'shipped', 'in_transit', 'delivered', 'exception', 'returned')) DEFAULT 'pending',
  
  -- Shipping addresses
  ship_to_name TEXT NOT NULL,
  ship_to_company TEXT,
  ship_to_address TEXT NOT NULL,
  ship_to_city TEXT NOT NULL,
  ship_to_state TEXT NOT NULL,
  ship_to_zip TEXT NOT NULL,
  ship_to_country TEXT DEFAULT 'US',
  ship_to_phone TEXT,
  
  ship_from_name TEXT NOT NULL,
  ship_from_company TEXT,
  ship_from_address TEXT NOT NULL,
  ship_from_city TEXT NOT NULL,
  ship_from_state TEXT NOT NULL,
  ship_from_zip TEXT NOT NULL,
  ship_from_country TEXT DEFAULT 'US',
  
  -- Package details
  weight_lbs DECIMAL(8,2),
  length_in DECIMAL(8,2),
  width_in DECIMAL(8,2),
  height_in DECIMAL(8,2),
  declared_value DECIMAL(10,2),
  
  -- Costs and dates
  shipping_cost DECIMAL(10,2) DEFAULT 0,
  insurance_cost DECIMAL(10,2) DEFAULT 0,
  estimated_delivery_date TIMESTAMP WITH TIME ZONE,
  actual_delivery_date TIMESTAMP WITH TIME ZONE,
  shipped_date TIMESTAMP WITH TIME ZONE,
  
  -- Tracking and notes
  tracking_events JSONB, -- Array of tracking events
  special_instructions TEXT,
  notes TEXT,
  
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create shipment items table (what's in each shipment)
CREATE TABLE IF NOT EXISTS public.shipment_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id UUID REFERENCES public.shipments(id) ON DELETE CASCADE,
  order_item_id UUID REFERENCES public.order_items(id),
  quantity_shipped INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create fulfillment tasks table
CREATE TABLE IF NOT EXISTS public.fulfillment_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) NOT NULL,
  task_type TEXT NOT NULL CHECK (task_type IN ('pick', 'pack', 'quality_check', 'label', 'ship')),
  status TEXT NOT NULL CHECK (status IN ('pending', 'in_progress', 'completed', 'on_hold')) DEFAULT 'pending',
  priority INTEGER DEFAULT 5, -- 1 = highest, 10 = lowest
  assigned_to UUID REFERENCES public.profiles(id),
  estimated_minutes INTEGER,
  actual_minutes INTEGER,
  notes TEXT,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on fulfillment tables
ALTER TABLE public.shipping_carriers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipment_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fulfillment_tasks ENABLE ROW LEVEL SECURITY;

-- RLS policies for shipping_carriers
CREATE POLICY "Staff can view shipping carriers" ON public.shipping_carriers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'ops', 'sales')
    )
  );

CREATE POLICY "Admin and ops can manage shipping carriers" ON public.shipping_carriers
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'ops')
    )
  );

-- RLS policies for shipments
CREATE POLICY "Staff can view all shipments" ON public.shipments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'ops', 'sales', 'finance')
    )
  );

CREATE POLICY "Clients can view their shipments" ON public.shipments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      JOIN public.orders o ON o.id = order_id
      JOIN public.customers c ON c.id = o.customer_id
      WHERE p.id = auth.uid() AND p.role = 'client' AND c.email = p.email
    )
  );

CREATE POLICY "Ops and admin can manage shipments" ON public.shipments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'ops')
    )
  );

-- RLS policies for shipment_items
CREATE POLICY "Users can view shipment items for accessible shipments" ON public.shipment_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.shipments s
      WHERE s.id = shipment_id AND (
        EXISTS (
          SELECT 1 FROM public.profiles 
          WHERE id = auth.uid() AND role IN ('admin', 'ops', 'sales', 'finance')
        )
        OR
        EXISTS (
          SELECT 1 FROM public.profiles p
          JOIN public.orders o ON o.id = s.order_id
          JOIN public.customers c ON c.id = o.customer_id
          WHERE p.id = auth.uid() AND p.role = 'client' AND c.email = p.email
        )
      )
    )
  );

CREATE POLICY "Ops can manage shipment items" ON public.shipment_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'ops')
    )
  );

-- RLS policies for fulfillment_tasks
CREATE POLICY "Staff can view fulfillment tasks" ON public.fulfillment_tasks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'ops')
    )
  );

CREATE POLICY "Ops and admin can manage fulfillment tasks" ON public.fulfillment_tasks
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'ops')
    )
  );

-- Insert default shipping carriers
INSERT INTO public.shipping_carriers (name, code, supported_services) VALUES
('FedEx', 'FEDEX', '["standard", "express", "overnight", "ground"]'),
('UPS', 'UPS', '["ground", "express", "overnight", "international"]'),
('USPS', 'USPS', '["standard", "priority", "express"]'),
('DHL', 'DHL', '["express", "international"]')
ON CONFLICT (code) DO NOTHING;

-- Function to auto-create fulfillment tasks when order is confirmed
CREATE OR REPLACE FUNCTION create_fulfillment_tasks()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create tasks when order status changes to 'confirmed'
  IF NEW.status = 'confirmed' AND OLD.status != 'confirmed' THEN
    INSERT INTO public.fulfillment_tasks (order_id, task_type, priority)
    VALUES 
      (NEW.id, 'pick', 1),
      (NEW.id, 'pack', 2),
      (NEW.id, 'quality_check', 3),
      (NEW.id, 'label', 4),
      (NEW.id, 'ship', 5);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to create fulfillment tasks
CREATE TRIGGER order_fulfillment_trigger
  AFTER UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION create_fulfillment_tasks();
