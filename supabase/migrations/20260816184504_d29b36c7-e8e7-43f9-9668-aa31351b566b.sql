create table public.upgrade_claims (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  paypal_note text,
  local_currency text,
  local_amount numeric(12,2),
  country text,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid
);
create index upgrade_claims_user_idx on public.upgrade_claims(user_id);

grant select, insert, update on public.upgrade_claims to authenticated;
grant all on public.upgrade_claims to service_role;

alter table public.upgrade_claims enable row level security;

create policy "own claims" on public.upgrade_claims for select to authenticated
  using (user_id = auth.uid() or public.is_staff(auth.uid()));
create policy "create own claim" on public.upgrade_claims for insert to authenticated
  with check (user_id = auth.uid());
create policy "staff update claims" on public.upgrade_claims for update to authenticated
  using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));

create or replace function public.review_upgrade_claim(_claim_id uuid, _approve boolean)
returns void language plpgsql security definer set search_path = public as $$
declare _uid uuid;
begin
  if not public.is_staff(auth.uid()) then raise exception 'NOT_AUTHORIZED'; end if;
  select user_id into _uid from public.upgrade_claims where id = _claim_id;
  if _uid is null then raise exception 'CLAIM_NOT_FOUND'; end if;
  update public.upgrade_claims
     set status = case when _approve then 'approved' else 'rejected' end,
         reviewed_at = now(), reviewed_by = auth.uid()
   where id = _claim_id;
  if _approve then
    update public.profiles set plan = 'lifetime' where id = _uid;
    insert into public.entitlements (user_id, plan, provider, payment_reference, amount_usd)
    values (_uid, 'lifetime', 'paypal', 'claim:' || _claim_id::text, 10.00)
    on conflict (user_id) do nothing;
  end if;
end; $$;
grant execute on function public.review_upgrade_claim(uuid, boolean) to authenticated;