-- SellUrWay store team management
-- Owners can add existing SellUrWay accounts as staff and remove them later.

CREATE OR REPLACE FUNCTION public.is_store_member(_store_id UUID, _user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.store_members
    WHERE store_id = _store_id AND user_id = _user_id
  );
$$;

DROP POLICY IF EXISTS "owners view own stores" ON public.stores;
CREATE POLICY "owners and members view stores" ON public.stores
  FOR SELECT TO authenticated
  USING (
    owner_id = auth.uid()
    OR public.is_store_member(id, auth.uid())
    OR (published = true AND suspended = false)
    OR public.is_staff(auth.uid())
  );

CREATE OR REPLACE FUNCTION public.list_store_members(_store_id UUID)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  email TEXT,
  full_name TEXT,
  role TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.owns_store(_store_id, auth.uid()) THEN
    RAISE EXCEPTION 'Only the store owner can manage staff';
  END IF;

  RETURN QUERY
  SELECT sm.id, sm.user_id, p.email, p.full_name, sm.role, sm.created_at
  FROM public.store_members sm
  LEFT JOIN public.profiles p ON p.id = sm.user_id
  WHERE sm.store_id = _store_id
  ORDER BY sm.created_at ASC;
END;
$$;

CREATE OR REPLACE FUNCTION public.add_store_member_by_email(
  _store_id UUID,
  _email TEXT,
  _role TEXT DEFAULT 'staff'
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  email TEXT,
  full_name TEXT,
  role TEXT
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _user_id UUID;
  _normalized_email TEXT := lower(trim(_email));
BEGIN
  IF NOT public.owns_store(_store_id, auth.uid()) THEN
    RAISE EXCEPTION 'Only the store owner can add staff';
  END IF;

  IF _normalized_email = '' THEN
    RAISE EXCEPTION 'Enter a staff member email address';
  END IF;

  SELECT p.id INTO _user_id
  FROM public.profiles p
  WHERE lower(p.email) = _normalized_email
  LIMIT 1;

  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'No SellUrWay account exists for that email. Ask the person to create an account first.';
  END IF;

  IF _user_id = (SELECT owner_id FROM public.stores WHERE id = _store_id) THEN
    RAISE EXCEPTION 'The store owner is already the owner';
  END IF;

  INSERT INTO public.store_members (store_id, user_id, role)
  VALUES (_store_id, _user_id, CASE WHEN lower(_role) IN ('staff','manager') THEN lower(_role) ELSE 'staff' END)
  ON CONFLICT (store_id, user_id)
  DO UPDATE SET role = EXCLUDED.role;

  RETURN QUERY
  SELECT sm.id, sm.user_id, p.email, p.full_name, sm.role
  FROM public.store_members sm
  JOIN public.profiles p ON p.id = sm.user_id
  WHERE sm.store_id = _store_id AND sm.user_id = _user_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.remove_store_member(
  _store_id UUID,
  _user_id UUID
)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.owns_store(_store_id, auth.uid()) THEN
    RAISE EXCEPTION 'Only the store owner can remove staff';
  END IF;

  DELETE FROM public.store_members
  WHERE store_id = _store_id AND user_id = _user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.list_store_members(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.add_store_member_by_email(UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.remove_store_member(UUID, UUID) TO authenticated;
