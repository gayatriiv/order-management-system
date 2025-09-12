-- Create function for monthly revenue calculation
CREATE OR REPLACE FUNCTION get_monthly_revenue()
RETURNS TABLE (
  month DATE,
  revenue DECIMAL,
  order_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    DATE_TRUNC('month', o.created_at)::DATE as month,
    SUM(o.total_amount) as revenue,
    COUNT(o.id) as order_count
  FROM orders o
  WHERE o.created_at >= CURRENT_DATE - INTERVAL '12 months'
  GROUP BY DATE_TRUNC('month', o.created_at)
  ORDER BY month DESC;
END;
$$ LANGUAGE plpgsql;

-- Create function for inventory alerts
CREATE OR REPLACE FUNCTION get_inventory_alerts()
RETURNS TABLE (
  product_id UUID,
  product_name TEXT,
  sku TEXT,
  current_stock INTEGER,
  reorder_level INTEGER,
  alert_type TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id as product_id,
    p.name as product_name,
    p.sku,
    i.quantity_on_hand as current_stock,
    i.reorder_level,
    CASE 
      WHEN i.quantity_on_hand = 0 THEN 'out_of_stock'
      WHEN i.quantity_on_hand <= i.reorder_level THEN 'low_stock'
      ELSE 'normal'
    END as alert_type
  FROM products p
  JOIN inventory i ON p.id = i.product_id
  WHERE i.quantity_on_hand <= i.reorder_level
  ORDER BY i.quantity_on_hand ASC;
END;
$$ LANGUAGE plpgsql;
