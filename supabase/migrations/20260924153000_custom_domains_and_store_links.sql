-- Custom domains and editable storefront links
ALTER TABLE public.stores
  ADD COLUMN IF NOT EXISTS custom_domain TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS stores_custom_domain_unique
  ON public.stores (lower(custom_domain))
  WHERE custom_domain IS NOT NULL;

CREATE INDEX IF NOT EXISTS stores_slug_lower_idx ON public.stores (lower(slug));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.stores TO authenticated;
