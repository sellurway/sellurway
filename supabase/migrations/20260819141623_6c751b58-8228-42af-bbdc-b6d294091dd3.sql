CREATE OR REPLACE FUNCTION public.grant_lifetime_on_claim()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.status = 'pending' THEN
    UPDATE public.profiles SET plan = 'lifetime' WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_claim_grant_lifetime ON public.upgrade_claims;
CREATE TRIGGER trg_claim_grant_lifetime
AFTER INSERT ON public.upgrade_claims
FOR EACH ROW EXECUTE FUNCTION public.grant_lifetime_on_claim();

CREATE OR REPLACE FUNCTION public.revoke_lifetime_on_reject()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.status = 'rejected' AND OLD.status <> 'rejected' THEN
    IF NOT EXISTS (SELECT 1 FROM public.entitlements WHERE user_id = NEW.user_id) THEN
      UPDATE public.profiles SET plan = 'free' WHERE id = NEW.user_id;
    END IF;
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_claim_revoke_lifetime ON public.upgrade_claims;
CREATE TRIGGER trg_claim_revoke_lifetime
AFTER UPDATE ON public.upgrade_claims
FOR EACH ROW EXECUTE FUNCTION public.revoke_lifetime_on_reject();