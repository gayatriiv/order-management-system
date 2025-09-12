-- Create customization requests table
CREATE TABLE IF NOT EXISTS public.customization_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_item_id UUID REFERENCES public.order_items(id) ON DELETE CASCADE,
  request_type TEXT NOT NULL CHECK (request_type IN ('design', 'material', 'size', 'color', 'other')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  specifications JSONB,
  attachments JSONB, -- Array of file URLs/paths
  status TEXT NOT NULL CHECK (status IN ('pending', 'under_review', 'approved', 'rejected', 'revision_needed')) DEFAULT 'pending',
  priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
  estimated_cost DECIMAL(10,2) DEFAULT 0,
  estimated_days INTEGER DEFAULT 0,
  requested_by UUID REFERENCES public.profiles(id),
  assigned_to UUID REFERENCES public.profiles(id),
  reviewed_by UUID REFERENCES public.profiles(id),
  review_notes TEXT,
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create customization workflow steps table
CREATE TABLE IF NOT EXISTS public.customization_workflow_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customization_request_id UUID REFERENCES public.customization_requests(id) ON DELETE CASCADE,
  step_name TEXT NOT NULL,
  step_order INTEGER NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'in_progress', 'completed', 'skipped')) DEFAULT 'pending',
  assigned_to UUID REFERENCES public.profiles(id),
  estimated_hours DECIMAL(5,2),
  actual_hours DECIMAL(5,2),
  notes TEXT,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create customization comments table for communication
CREATE TABLE IF NOT EXISTS public.customization_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customization_request_id UUID REFERENCES public.customization_requests(id) ON DELETE CASCADE,
  comment_text TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT FALSE, -- Internal comments not visible to clients
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on customization tables
ALTER TABLE public.customization_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customization_workflow_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customization_comments ENABLE ROW LEVEL SECURITY;

-- RLS policies for customization_requests
CREATE POLICY "Staff can view all customization requests" ON public.customization_requests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'sales', 'ops')
    )
  );

CREATE POLICY "Clients can view their own customization requests" ON public.customization_requests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      JOIN public.order_items oi ON oi.id = order_item_id
      JOIN public.orders o ON o.id = oi.order_id
      JOIN public.customers c ON c.id = o.customer_id
      WHERE p.id = auth.uid() AND p.role = 'client' AND c.email = p.email
    )
  );

CREATE POLICY "Sales and admin can manage customization requests" ON public.customization_requests
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'sales', 'ops')
    )
  );

-- RLS policies for customization_workflow_steps
CREATE POLICY "Staff can view workflow steps" ON public.customization_workflow_steps
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'sales', 'ops')
    )
  );

CREATE POLICY "Ops and admin can manage workflow steps" ON public.customization_workflow_steps
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'ops')
    )
  );

-- RLS policies for customization_comments
CREATE POLICY "Users can view relevant comments" ON public.customization_comments
  FOR SELECT USING (
    -- Staff can see all comments
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'sales', 'ops')
    )
    OR
    -- Clients can see non-internal comments on their requests
    (
      NOT is_internal AND
      EXISTS (
        SELECT 1 FROM public.profiles p
        JOIN public.customization_requests cr ON cr.id = customization_request_id
        JOIN public.order_items oi ON oi.id = cr.order_item_id
        JOIN public.orders o ON o.id = oi.order_id
        JOIN public.customers c ON c.id = o.customer_id
        WHERE p.id = auth.uid() AND p.role = 'client' AND c.email = p.email
      )
    )
  );

CREATE POLICY "Authenticated users can add comments" ON public.customization_comments
  FOR INSERT WITH CHECK (auth.uid() = created_by);

-- Function to update customization request status based on workflow steps
CREATE OR REPLACE FUNCTION update_customization_status()
RETURNS TRIGGER AS $$
BEGIN
  -- If all steps are completed, mark request as approved
  IF NOT EXISTS (
    SELECT 1 FROM public.customization_workflow_steps 
    WHERE customization_request_id = NEW.customization_request_id 
    AND status NOT IN ('completed', 'skipped')
  ) THEN
    UPDATE public.customization_requests 
    SET status = 'approved', approved_at = NOW()
    WHERE id = NEW.customization_request_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update customization status
CREATE TRIGGER customization_workflow_status_trigger
  AFTER UPDATE ON public.customization_workflow_steps
  FOR EACH ROW
  WHEN (NEW.status = 'completed')
  EXECUTE FUNCTION update_customization_status();
