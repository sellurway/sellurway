CREATE OR REPLACE FUNCTION public.enforce_product_limit() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  plan_t text;
  product_count int;
BEGIN
  SELECT p.plan INTO plan_t FROM public.stores s JOIN public.profiles p ON p.id = s.owner_id WHERE s.id = NEW.store_id;
  IF plan_t = 'lifetime' THEN
    RETURN NEW;
  END IF;
  SELECT count(*) INTO product_count FROM public.products WHERE store_id = NEW.store_id;
  IF product_count >= 3 THEN
    RAISE EXCEPTION 'Free plan is limited to 3 products. Upgrade for unlimited products.';
  END IF;
  RETURN NEW;
END;
$$;