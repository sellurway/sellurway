ALTER TABLE public.stores
  ADD COLUMN IF NOT EXISTS custom_domain TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_stores_custom_domain_lower
  ON public.stores (LOWER(custom_domain))
  WHERE custom_domain IS NOT NULL;

COMMENT ON COLUMN public.stores.custom_domain IS
  'Merchant-owned public hostname for this storefront, for example brand.com or shop.brand.co.za';
