-- Server-side analytics aggregation: return only the summary the dashboard needs.
CREATE OR REPLACE FUNCTION public.get_store_analytics(_store_id UUID, _days INTEGER DEFAULT 30)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _since TIMESTAMPTZ;
  _result JSONB;
BEGIN
  IF NOT (public.owns_store(_store_id, auth.uid()) OR public.is_staff(auth.uid())) THEN
    RAISE EXCEPTION 'NOT_AUTHORIZED';
  END IF;

  _since := now() - (GREATEST(1, LEAST(_days, 365)) || ' days')::interval;

  WITH order_summary AS (
    SELECT
      COUNT(*) FILTER (WHERE status NOT IN ('cancelled','refunded'))::BIGINT AS valid_orders,
      COUNT(*)::BIGINT AS total_orders,
      COALESCE(SUM(total) FILTER (WHERE status NOT IN ('cancelled','refunded')), 0)::NUMERIC AS revenue
    FROM public.orders
    WHERE store_id = _store_id AND created_at >= _since
  ),
  source_summary AS (
    SELECT COALESCE(source::TEXT, 'unknown') AS source,
           COALESCE(SUM(total) FILTER (WHERE status NOT IN ('cancelled','refunded')), 0)::NUMERIC AS revenue
    FROM public.orders
    WHERE store_id = _store_id AND created_at >= _since
    GROUP BY source
  ),
  product_summary AS (
    SELECT oi.product_name AS name,
           SUM(oi.quantity)::BIGINT AS qty,
           SUM(oi.line_total)::NUMERIC AS revenue
    FROM public.order_items oi
    JOIN public.orders o ON o.id = oi.order_id
    WHERE oi.store_id = _store_id
      AND o.created_at >= _since
      AND o.status NOT IN ('cancelled','refunded')
    GROUP BY oi.product_name
    ORDER BY SUM(oi.line_total) DESC
    LIMIT 8
  ),
  daily_summary AS (
    SELECT
      to_char(date_trunc('day', created_at), 'YYYY-MM-DD') AS day,
      COALESCE(SUM(total) FILTER (WHERE status NOT IN ('cancelled','refunded')), 0)::NUMERIC AS total
    FROM public.orders
    WHERE store_id = _store_id AND created_at >= _since
    GROUP BY date_trunc('day', created_at)
    ORDER BY date_trunc('day', created_at)
  )
  SELECT jsonb_build_object(
    'revenue', os.revenue,
    'orders', os.valid_orders,
    'cancelled_refunded', os.total_orders - os.valid_orders,
    'average_order', CASE WHEN os.valid_orders > 0 THEN os.revenue / os.valid_orders ELSE 0 END,
    'currency', (SELECT currency FROM public.stores WHERE id = _store_id),
    'by_source', COALESCE((SELECT jsonb_object_agg(source, revenue) FROM source_summary), '{}'::jsonb),
    'top_products', COALESCE((SELECT jsonb_agg(jsonb_build_object('name', name, 'qty', qty, 'revenue', revenue)) FROM product_summary), '[]'::jsonb),
    'daily', COALESCE((SELECT jsonb_agg(jsonb_build_object('key', day, 'total', total) ORDER BY day) FROM daily_summary), '[]'::jsonb)
  ) INTO _result
  FROM order_summary os;

  RETURN _result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_store_analytics(UUID, INTEGER) TO authenticated;
