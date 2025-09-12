-- Create analytics views for better performance
CREATE OR REPLACE VIEW order_analytics AS
SELECT 
  DATE_TRUNC('month', created_at) as month,
  order_status,
  COUNT(*) as order_count,
  SUM(total_amount) as total_revenue,
  AVG(total_amount) as avg_order_value
FROM orders
GROUP BY DATE_TRUNC('month', created_at), order_status;

CREATE OR REPLACE VIEW inventory_analytics AS
SELECT 
  p.id,
  p.name,
  p.sku,
  p.price,
  i.quantity_on_hand,
  i.reserved_quantity,
  i.reorder_level,
  CASE 
    WHEN i.quantity_on_hand <= i.reorder_level THEN 'low_stock'
    WHEN i.quantity_on_hand = 0 THEN 'out_of_stock'
    ELSE 'in_stock'
  END as stock_status
FROM products p
LEFT JOIN inventory i ON p.id = i.product_id;

CREATE OR REPLACE VIEW customer_analytics AS
SELECT 
  c.id,
  c.company_name,
  c.contact_name,
  COUNT(o.id) as total_orders,
  SUM(o.total_amount) as total_spent,
  AVG(o.total_amount) as avg_order_value,
  MAX(o.created_at) as last_order_date
FROM customers c
LEFT JOIN orders o ON c.id = o.customer_id
GROUP BY c.id, c.company_name, c.contact_name;

CREATE OR REPLACE VIEW payment_analytics AS
SELECT 
  DATE_TRUNC('month', payment_date) as month,
  payment_status,
  payment_method,
  COUNT(*) as payment_count,
  SUM(amount) as total_amount
FROM payments
GROUP BY DATE_TRUNC('month', payment_date), payment_status, payment_method;
