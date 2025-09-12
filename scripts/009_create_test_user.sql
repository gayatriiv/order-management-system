-- Fix table name consistency and create test user setup
-- The auth tables script creates 'profiles' table, so we need to use that name consistently

-- Insert a test user profile that will be created when they register
-- This is just for reference - the actual profile will be created by the trigger

-- Create a test customer record that can be linked to the test user
INSERT INTO public.customers (
  id,
  company_name,
  contact_name,
  email,
  phone,
  address,
  city,
  state,
  zip_code,
  country,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'Test Company',
  'Admin User',
  'your-email@gmail.com', -- Updated to use real email placeholder
  '+1-555-0123',
  '123 Test Street',
  'Test City',
  'CA',
  '90210',
  'US',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Insert some sample products for testing
INSERT INTO public.products (name, description, sku, base_price, category, is_customizable, stock_quantity, min_stock_level)
VALUES 
  ('Basic Widget', 'A standard widget for general use', 'WID-001', 29.99, 'Widgets', false, 100, 10),
  ('Premium Widget', 'A high-quality widget with advanced features', 'WID-002', 59.99, 'Widgets', true, 50, 5),
  ('Custom Component', 'Fully customizable component', 'CMP-001', 99.99, 'Components', true, 25, 5)
ON CONFLICT (sku) DO NOTHING;

-- Updated registration instructions to use real email addresses
-- Note: To test the login:
-- 1. Go to /auth/register
-- 2. Register with a REAL email address (Gmail, Outlook, etc.) - NOT test.com or example.com
-- 3. Use password: admin123 (or any password 6+ characters)
-- 4. Select "Admin" role for full system access
-- 5. Check your email for confirmation link and click it
-- 6. Go to /auth/login and sign in with your email / password
-- 
-- IMPORTANT: Supabase blocks test.com and example.com domains for security.
-- You must use a real email address that you can access to receive the confirmation email.
