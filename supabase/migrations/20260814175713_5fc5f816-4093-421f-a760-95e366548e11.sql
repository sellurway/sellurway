-- ENUMS
CREATE TYPE public.app_role AS ENUM ('owner','admin','support','moderator');
CREATE TYPE public.plan_type AS ENUM ('free','lifetime');
CREATE TYPE public.selling_mode AS ENUM ('full_checkout','direct_order','whatsapp','multiple');
CREATE TYPE public.order_status AS ENUM ('pending','paid','processing','shipped','completed','cancelled','refunded');
CREATE TYPE public.delivery_status AS ENUM ('new','confirmed','preparing','ready','out_for_delivery','delivered','cancelled');
CREATE TYPE public.payment_status AS ENUM ('pending','paid','cash_on_delivery','manual_payment','failed','refunded');
CREATE TYPE public.order_source AS ENUM ('online_checkout','direct_order','whatsapp');
CREATE TYPE public.ticket_status AS ENUM ('open','in_progress','resolved','closed');

-- SHARED
CREATE OR REPLACE FUNCTION public.update_updated_at_column() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql SET search_path = public;

-- PROFILES
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  plan public.plan_type NOT NULL DEFAULT 'free',
  suspended BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ROLES
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE OR REPLACE FUNCTION public.is_staff(_user_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id);
$$;

CREATE POLICY "own roles" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_staff(auth.uid()));
CREATE POLICY "profiles select" ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid() OR public.is_staff(auth.uid()));
CREATE POLICY "profiles insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "profiles update" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid() OR public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'admin'));

-- new user trigger
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name',''))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ENTITLEMENTS
CREATE TABLE public.entitlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  plan public.plan_type NOT NULL DEFAULT 'lifetime',
  payment_reference TEXT UNIQUE,
  provider TEXT,
  amount_usd NUMERIC(10,2) NOT NULL DEFAULT 10.00,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.entitlements TO authenticated;
GRANT ALL ON public.entitlements TO service_role;
ALTER TABLE public.entitlements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own entitlement" ON public.entitlements FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_staff(auth.uid()));

-- STORES
CREATE TABLE public.stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  category TEXT,
  business_type TEXT,
  logo_url TEXT,
  banner_url TEXT,
  country TEXT,
  currency TEXT NOT NULL DEFAULT 'USD',
  contact_email TEXT,
  contact_phone TEXT,
  whatsapp_number TEXT,
  theme TEXT NOT NULL DEFAULT 'lumen',
  theme_settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  selling_mode public.selling_mode NOT NULL DEFAULT 'full_checkout',
  product_action TEXT NOT NULL DEFAULT 'add_to_cart',
  payment_methods JSONB NOT NULL DEFAULT '{"online":false,"cash_on_delivery":true,"manual":false,"pickup":false,"manual_instructions":""}'::jsonb,
  delivery_settings JSONB NOT NULL DEFAULT '{"delivery_enabled":true,"pickup_enabled":false,"fee":0,"free_threshold":null,"min_order":0,"eta":"","instructions_enabled":true,"time_pref_enabled":false}'::jsonb,
  social_links JSONB NOT NULL DEFAULT '{}'::jsonb,
  policies JSONB NOT NULL DEFAULT '{}'::jsonb,
  published BOOLEAN NOT NULL DEFAULT false,
  suspended BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.stores TO authenticated;
GRANT SELECT ON public.stores TO anon;
GRANT ALL ON public.stores TO service_role;
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_stores_updated BEFORE UPDATE ON public.stores FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.owns_store(_store_id UUID, _user_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.stores WHERE id = _store_id AND owner_id = _user_id);
$$;

CREATE POLICY "public can view live stores" ON public.stores FOR SELECT TO anon USING (published = true AND suspended = false);
CREATE POLICY "owners view own stores" ON public.stores FOR SELECT TO authenticated USING (owner_id = auth.uid() OR (published = true AND suspended = false) OR public.is_staff(auth.uid()));
CREATE POLICY "owners create stores" ON public.stores FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());
CREATE POLICY "owners update stores" ON public.stores FOR UPDATE TO authenticated USING (owner_id = auth.uid() OR public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'moderator'));
CREATE POLICY "owners delete stores" ON public.stores FOR DELETE TO authenticated USING (owner_id = auth.uid());

-- STORE MEMBERS
CREATE TABLE public.store_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT NOT NULL DEFAULT 'staff',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (store_id, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.store_members TO authenticated;
GRANT ALL ON public.store_members TO service_role;
ALTER TABLE public.store_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "store members manage" ON public.store_members FOR ALL TO authenticated
  USING (public.owns_store(store_id, auth.uid()) OR user_id = auth.uid())
  WITH CHECK (public.owns_store(store_id, auth.uid()));

-- CATEGORIES
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (store_id, slug)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.categories TO authenticated;
GRANT SELECT ON public.categories TO anon;
GRANT ALL ON public.categories TO service_role;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "categories public read" ON public.categories FOR SELECT USING (true);
CREATE POLICY "categories owner write" ON public.categories FOR ALL TO authenticated
  USING (public.owns_store(store_id, auth.uid())) WITH CHECK (public.owns_store(store_id, auth.uid()));

-- PRODUCTS
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (price >= 0),
  compare_at_price NUMERIC(12,2) CHECK (compare_at_price IS NULL OR compare_at_price >= 0),
  sku TEXT,
  stock_quantity INTEGER NOT NULL DEFAULT 0,
  track_stock BOOLEAN NOT NULL DEFAULT false,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'active',
  featured BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT SELECT ON public.products TO anon;
GRANT ALL ON public.products TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_products_store ON public.products(store_id);
CREATE TRIGGER trg_products_updated BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE POLICY "products public read" ON public.products FOR SELECT USING (
  status = 'active' AND EXISTS (SELECT 1 FROM public.stores s WHERE s.id = store_id AND s.published AND NOT s.suspended)
);
CREATE POLICY "products owner read" ON public.products FOR SELECT TO authenticated USING (public.owns_store(store_id, auth.uid()) OR public.is_staff(auth.uid()));
CREATE POLICY "products owner write" ON public.products FOR INSERT TO authenticated WITH CHECK (public.owns_store(store_id, auth.uid()));
CREATE POLICY "products owner update" ON public.products FOR UPDATE TO authenticated USING (public.owns_store(store_id, auth.uid()));
CREATE POLICY "products owner delete" ON public.products FOR DELETE TO authenticated USING (public.owns_store(store_id, auth.uid()));

-- FREE PLAN LIMIT
CREATE OR REPLACE FUNCTION public.enforce_product_limit() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _owner UUID; _plan public.plan_type; _count INT;
BEGIN
  SELECT owner_id INTO _owner FROM public.stores WHERE id = NEW.store_id;
  SELECT plan INTO _plan FROM public.profiles WHERE id = _owner;
  IF _plan = 'lifetime' THEN RETURN NEW; END IF;
  SELECT count(*) INTO _count FROM public.products p
    JOIN public.stores s ON s.id = p.store_id
   WHERE s.owner_id = _owner;
  IF _count >= 5 THEN
    RAISE EXCEPTION 'PRODUCT_LIMIT_REACHED';
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_product_limit BEFORE INSERT ON public.products FOR EACH ROW EXECUTE FUNCTION public.enforce_product_limit();

-- PRODUCT IMAGES
CREATE TABLE public.product_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_images TO authenticated;
GRANT SELECT ON public.product_images TO anon;
GRANT ALL ON public.product_images TO service_role;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "images public read" ON public.product_images FOR SELECT USING (true);
CREATE POLICY "images owner write" ON public.product_images FOR ALL TO authenticated
  USING (public.owns_store(store_id, auth.uid())) WITH CHECK (public.owns_store(store_id, auth.uid()));

-- PRODUCT VARIANTS
CREATE TABLE public.product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  value TEXT NOT NULL,
  price_delta NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_variants TO authenticated;
GRANT SELECT ON public.product_variants TO anon;
GRANT ALL ON public.product_variants TO service_role;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "variants public read" ON public.product_variants FOR SELECT USING (true);
CREATE POLICY "variants owner write" ON public.product_variants FOR ALL TO authenticated
  USING (public.owns_store(store_id, auth.uid())) WITH CHECK (public.owns_store(store_id, auth.uid()));

-- DELIVERY AREAS
CREATE TABLE public.delivery_areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  fee NUMERIC(12,2) NOT NULL DEFAULT 0,
  eta TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.delivery_areas TO authenticated;
GRANT SELECT ON public.delivery_areas TO anon;
GRANT ALL ON public.delivery_areas TO service_role;
ALTER TABLE public.delivery_areas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "areas public read" ON public.delivery_areas FOR SELECT USING (true);
CREATE POLICY "areas owner write" ON public.delivery_areas FOR ALL TO authenticated
  USING (public.owns_store(store_id, auth.uid())) WITH CHECK (public.owns_store(store_id, auth.uid()));

-- CUSTOMERS
CREATE TABLE public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  name TEXT,
  email TEXT,
  phone TEXT,
  orders_count INTEGER NOT NULL DEFAULT 0,
  total_spent NUMERIC(12,2) NOT NULL DEFAULT 0,
  last_order_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX idx_customer_store_contact ON public.customers(store_id, coalesce(email,''), coalesce(phone,''));
GRANT SELECT, INSERT, UPDATE, DELETE ON public.customers TO authenticated;
GRANT ALL ON public.customers TO service_role;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "customers owner only" ON public.customers FOR ALL TO authenticated
  USING (public.owns_store(store_id, auth.uid()) OR public.is_staff(auth.uid()))
  WITH CHECK (public.owns_store(store_id, auth.uid()));

-- ORDERS
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  order_number TEXT NOT NULL UNIQUE,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  customer_name TEXT,
  customer_email TEXT,
  customer_phone TEXT,
  source public.order_source NOT NULL DEFAULT 'online_checkout',
  selling_mode public.selling_mode NOT NULL DEFAULT 'full_checkout',
  payment_method TEXT,
  payment_status public.payment_status NOT NULL DEFAULT 'pending',
  status public.order_status NOT NULL DEFAULT 'pending',
  delivery_status public.delivery_status,
  fulfillment_type TEXT NOT NULL DEFAULT 'delivery',
  subtotal NUMERIC(12,2) NOT NULL DEFAULT 0,
  shipping NUMERIC(12,2) NOT NULL DEFAULT 0,
  total NUMERIC(12,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  delivery_address TEXT,
  delivery_apartment TEXT,
  delivery_city TEXT,
  delivery_postal_code TEXT,
  delivery_area_id UUID REFERENCES public.delivery_areas(id) ON DELETE SET NULL,
  delivery_instructions TEXT,
  preferred_delivery_at TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_orders_updated BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE POLICY "orders owner only" ON public.orders FOR ALL TO authenticated
  USING (public.owns_store(store_id, auth.uid()) OR public.is_staff(auth.uid()))
  WITH CHECK (public.owns_store(store_id, auth.uid()));

CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  variant_label TEXT,
  unit_price NUMERIC(12,2) NOT NULL,
  quantity INTEGER NOT NULL,
  line_total NUMERIC(12,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.order_items TO authenticated;
GRANT ALL ON public.order_items TO service_role;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "order items owner only" ON public.order_items FOR ALL TO authenticated
  USING (public.owns_store(store_id, auth.uid()) OR public.is_staff(auth.uid()))
  WITH CHECK (public.owns_store(store_id, auth.uid()));

-- PAYMENTS
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE,
  user_id UUID,
  kind TEXT NOT NULL DEFAULT 'store_order',
  provider TEXT NOT NULL DEFAULT 'manual',
  provider_reference TEXT UNIQUE,
  amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  status public.payment_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.payments TO authenticated;
GRANT ALL ON public.payments TO service_role;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "payments visible to owner" ON public.payments FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR (store_id IS NOT NULL AND public.owns_store(store_id, auth.uid())) OR public.is_staff(auth.uid()));

-- SUPPORT
CREATE TABLE public.support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  subject TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  status public.ticket_status NOT NULL DEFAULT 'open',
  assigned_to UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.support_tickets TO authenticated;
GRANT ALL ON public.support_tickets TO service_role;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_tickets_updated BEFORE UPDATE ON public.support_tickets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE POLICY "tickets read" ON public.support_tickets FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_staff(auth.uid()));
CREATE POLICY "tickets create" ON public.support_tickets FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "tickets update" ON public.support_tickets FOR UPDATE TO authenticated USING (public.is_staff(auth.uid()));

CREATE TABLE public.support_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  author_id UUID NOT NULL,
  body TEXT NOT NULL,
  is_staff BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.support_messages TO authenticated;
GRANT ALL ON public.support_messages TO service_role;
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "messages read" ON public.support_messages FOR SELECT TO authenticated
  USING (public.is_staff(auth.uid()) OR EXISTS (SELECT 1 FROM public.support_tickets t WHERE t.id = ticket_id AND t.user_id = auth.uid()));
CREATE POLICY "messages create" ON public.support_messages FOR INSERT TO authenticated
  WITH CHECK (author_id = auth.uid() AND (public.is_staff(auth.uid()) OR EXISTS (SELECT 1 FROM public.support_tickets t WHERE t.id = ticket_id AND t.user_id = auth.uid())));

-- REPORTS
CREATE TABLE public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  reporter_id UUID,
  reporter_email TEXT,
  category TEXT NOT NULL,
  details TEXT,
  status TEXT NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.reports TO authenticated;
GRANT INSERT ON public.reports TO anon;
GRANT ALL ON public.reports TO service_role;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone can report" ON public.reports FOR INSERT WITH CHECK (true);
CREATE POLICY "staff read reports" ON public.reports FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "staff update reports" ON public.reports FOR UPDATE TO authenticated USING (public.is_staff(auth.uid()));

-- AUDIT LOGS
CREATE TABLE public.admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID NOT NULL,
  action TEXT NOT NULL,
  target_type TEXT,
  target_id TEXT,
  meta JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.admin_audit_logs TO authenticated;
GRANT ALL ON public.admin_audit_logs TO service_role;
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff audit read" ON public.admin_audit_logs FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "staff audit write" ON public.admin_audit_logs FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()) AND actor_id = auth.uid());

-- SECURE ORDER PLACEMENT (server-side pricing)
CREATE OR REPLACE FUNCTION public.place_order(
  _slug TEXT,
  _items JSONB,
  _customer JSONB,
  _delivery JSONB,
  _source public.order_source,
  _payment_method TEXT
) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _store public.stores%ROWTYPE;
  _item JSONB;
  _prod public.products%ROWTYPE;
  _qty INT;
  _subtotal NUMERIC(12,2) := 0;
  _shipping NUMERIC(12,2) := 0;
  _order_id UUID;
  _number TEXT;
  _cust_id UUID;
  _area_id UUID;
  _fulfillment TEXT;
  _pay_status public.payment_status;
BEGIN
  SELECT * INTO _store FROM public.stores WHERE slug = _slug AND published AND NOT suspended;
  IF _store.id IS NULL THEN RAISE EXCEPTION 'STORE_NOT_AVAILABLE'; END IF;
  IF _items IS NULL OR jsonb_array_length(_items) = 0 THEN RAISE EXCEPTION 'EMPTY_ORDER'; END IF;

  _fulfillment := COALESCE(_delivery->>'fulfillment_type','delivery');
  _order_id := gen_random_uuid();
  _number := 'SW-' || upper(substr(replace(_order_id::text,'-',''),1,8));

  FOR _item IN SELECT * FROM jsonb_array_elements(_items) LOOP
    SELECT * INTO _prod FROM public.products
      WHERE id = (_item->>'product_id')::uuid AND store_id = _store.id AND status = 'active';
    IF _prod.id IS NULL THEN RAISE EXCEPTION 'PRODUCT_UNAVAILABLE'; END IF;
    _qty := GREATEST(1, LEAST(999, COALESCE((_item->>'quantity')::int, 1)));
    IF _prod.track_stock AND _prod.stock_quantity < _qty THEN RAISE EXCEPTION 'OUT_OF_STOCK'; END IF;
    _subtotal := _subtotal + (_prod.price * _qty);
  END LOOP;

  IF _fulfillment = 'delivery' THEN
    IF (_delivery->>'delivery_area_id') IS NOT NULL AND (_delivery->>'delivery_area_id') <> '' THEN
      SELECT id, fee INTO _area_id, _shipping FROM public.delivery_areas
        WHERE id = (_delivery->>'delivery_area_id')::uuid AND store_id = _store.id;
      IF _area_id IS NULL THEN RAISE EXCEPTION 'INVALID_DELIVERY_AREA'; END IF;
    ELSE
      _shipping := COALESCE((_store.delivery_settings->>'fee')::numeric, 0);
    END IF;
    IF (_store.delivery_settings->>'free_threshold') IS NOT NULL
       AND (_store.delivery_settings->>'free_threshold') <> ''
       AND _subtotal >= (_store.delivery_settings->>'free_threshold')::numeric THEN
      _shipping := 0;
    END IF;
  END IF;

  IF _subtotal < COALESCE((_store.delivery_settings->>'min_order')::numeric, 0) THEN
    RAISE EXCEPTION 'MIN_ORDER_NOT_MET';
  END IF;

  _pay_status := CASE
    WHEN _payment_method = 'cash_on_delivery' THEN 'cash_on_delivery'::public.payment_status
    WHEN _payment_method = 'manual' THEN 'manual_payment'::public.payment_status
    ELSE 'pending'::public.payment_status END;

  INSERT INTO public.customers (store_id, name, email, phone)
  VALUES (_store.id, _customer->>'name', NULLIF(_customer->>'email',''), NULLIF(_customer->>'phone',''))
  ON CONFLICT (store_id, coalesce(email,''), coalesce(phone,''))
  DO UPDATE SET name = COALESCE(EXCLUDED.name, public.customers.name), updated_at = now()
  RETURNING id INTO _cust_id;

  INSERT INTO public.orders (
    id, store_id, order_number, customer_id, customer_name, customer_email, customer_phone,
    source, selling_mode, payment_method, payment_status, status, delivery_status, fulfillment_type,
    subtotal, shipping, total, currency, delivery_address, delivery_apartment, delivery_city,
    delivery_postal_code, delivery_area_id, delivery_instructions, preferred_delivery_at, notes
  ) VALUES (
    _order_id, _store.id, _number, _cust_id, _customer->>'name', NULLIF(_customer->>'email',''), _customer->>'phone',
    _source, _store.selling_mode, _payment_method, _pay_status, 'pending', 'new', _fulfillment,
    _subtotal, _shipping, _subtotal + _shipping, _store.currency,
    _delivery->>'address', _delivery->>'apartment', _delivery->>'city',
    _delivery->>'postal_code', _area_id, _delivery->>'instructions', _delivery->>'preferred_time', _customer->>'notes'
  );

  FOR _item IN SELECT * FROM jsonb_array_elements(_items) LOOP
    SELECT * INTO _prod FROM public.products WHERE id = (_item->>'product_id')::uuid AND store_id = _store.id;
    _qty := GREATEST(1, LEAST(999, COALESCE((_item->>'quantity')::int, 1)));
    INSERT INTO public.order_items (order_id, store_id, product_id, product_name, variant_label, unit_price, quantity, line_total)
    VALUES (_order_id, _store.id, _prod.id, _prod.name, NULLIF(_item->>'variant_label',''), _prod.price, _qty, _prod.price * _qty);
    IF _prod.track_stock THEN
      UPDATE public.products SET stock_quantity = stock_quantity - _qty WHERE id = _prod.id;
    END IF;
  END LOOP;

  UPDATE public.customers SET
    orders_count = orders_count + 1,
    total_spent = total_spent + (_subtotal + _shipping),
    last_order_at = now()
  WHERE id = _cust_id;

  RETURN jsonb_build_object('order_number', _number, 'total', _subtotal + _shipping, 'currency', _store.currency, 'subtotal', _subtotal, 'shipping', _shipping);
END; $$;

GRANT EXECUTE ON FUNCTION public.place_order(TEXT, JSONB, JSONB, JSONB, public.order_source, TEXT) TO anon, authenticated;

-- SLUG AVAILABILITY (public, no data leak)
CREATE OR REPLACE FUNCTION public.slug_available(_slug TEXT)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT NOT EXISTS (SELECT 1 FROM public.stores WHERE slug = lower(_slug));
$$;
GRANT EXECUTE ON FUNCTION public.slug_available(TEXT) TO anon, authenticated;