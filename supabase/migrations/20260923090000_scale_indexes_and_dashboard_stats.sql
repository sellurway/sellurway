-- Scale indexes and server-side dashboard aggregates for SellUrway
-- These indexes align with the application's most frequent tenant, join, RLS and ordering queries.

CREATE INDEX IF NOT EXISTS idx_stores_owner_id
  ON public.stores(owner_id);

CREATE INDEX IF NOT EXISTS idx_store_members_user_id
  ON public.store_members(user_id);

CREATE INDEX IF NOT EXISTS idx_user_roles_user_id
  ON public.user_roles(user_id);

CREATE INDEX IF NOT EXISTS idx_categories_store_name
  ON public.categories(store_id, name);

CREATE INDEX IF NOT EXISTS idx_products_store_status_created
  ON public.products(store_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_products_store_category_status
  ON public.products(store_id, category_id, status);

CREATE INDEX IF NOT EXISTS idx_product_images_product_position
  ON public.product_images(product_id, position);

CREATE INDEX IF NOT EXISTS idx_product_images_store_id
  ON public.product_images(store_id);

CREATE INDEX IF NOT EXISTS idx_product_variants_product_id
  ON public.product_variants(product_id);

CREATE INDEX IF NOT EXISTS idx_product_variants_store_id
  ON public.product_variants(store_id);

CREATE INDEX IF NOT EXISTS idx_delivery_areas_store_id
  ON public.delivery_areas(store_id);

CREATE INDEX IF NOT EXISTS idx_customers_store_created
  ON public.customers(store_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_orders_store_created
  ON public.orders(store_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_orders_store_status_created
  ON public.orders(store_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_orders_customer_id
  ON public.orders(customer_id);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id
  ON public.order_items(order_id);

CREATE INDEX IF NOT EXISTS idx_order_items_store_id
  ON public.order_items(store_id);

CREATE INDEX IF NOT EXISTS idx_payments_order_id
  ON public.payments(order_id);

CREATE INDEX IF NOT EXISTS idx_payments_store_id
  ON public.payments(store_id);

CREATE INDEX IF NOT EXISTS idx_support_messages_ticket_id
  ON public.support_messages(ticket_id);

CREATE INDEX IF NOT EXISTS idx_reports_store_id
  ON public.reports(store_id);

CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_actor_created
  ON public.admin_audit_logs(actor_id, created_at DESC);

-- Keep dashboard statistics server-side so the browser never downloads an entire
-- order history just to calculate revenue and order counts.
CREATE OR REPLACE FUNCTION public.get_dashboard_stats(_store_id UUID)
RETURNS TABLE (
  revenue NUMERIC,
  orders BIGINT,
  products BIGINT,
  customers BIGINT,
  currency TEXT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT (public.owns_store(_store_id, auth.uid()) OR public.is_staff(auth.uid())) THEN
    RAISE EXCEPTION 'NOT_AUTHORIZED';
  END IF;

  RETURN QUERY
  SELECT
    COALESCE((
      SELECT SUM(o.total)
      FROM public.orders o
      WHERE o.store_id = _store_id
        AND o.status NOT IN ('cancelled', 'refunded')
    ), 0)::NUMERIC AS revenue,
    (SELECT COUNT(*) FROM public.orders o WHERE o.store_id = _store_id)::BIGINT AS orders,
    (SELECT COUNT(*) FROM public.products p WHERE p.store_id = _store_id)::BIGINT AS products,
    (SELECT COUNT(*) FROM public.customers c WHERE c.store_id = _store_id)::BIGINT AS customers,
    s.currency
  FROM public.stores s
  WHERE s.id = _store_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_dashboard_stats(UUID) TO authenticated;
