-- Stripe credentials per store (server-only access)
CREATE TABLE public.store_stripe_credentials (
  store_id UUID PRIMARY KEY REFERENCES public.stores(id) ON DELETE CASCADE,
  secret_key TEXT NOT NULL,
  publishable_key TEXT,
  key_last4 TEXT,
  livemode BOOLEAN NOT NULL DEFAULT false,
  account_label TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT ALL ON public.store_stripe_credentials TO service_role;
ALTER TABLE public.store_stripe_credentials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "no direct client access" ON public.store_stripe_credentials FOR ALL TO authenticated USING (false) WITH CHECK (false);
CREATE TRIGGER trg_stripe_creds_updated BEFORE UPDATE ON public.store_stripe_credentials
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Public flag so storefronts can offer card payment
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS stripe_enabled BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS stripe_key_last4 TEXT;
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS stripe_livemode BOOLEAN NOT NULL DEFAULT false;

-- Courier / tracking + stripe references on orders
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS courier_name TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS tracking_number TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS tracking_url TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipped_at TIMESTAMPTZ;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS stripe_session_id TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS stripe_payment_intent TEXT;
CREATE INDEX IF NOT EXISTS idx_orders_stripe_session ON public.orders(stripe_session_id);
