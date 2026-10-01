alter table public.store_paypal_credentials enable row level security;

drop policy if exists "Store owners can read PayPal credential metadata" on public.store_paypal_credentials;
drop policy if exists "Store owners can manage PayPal credentials" on public.store_paypal_credentials;

create policy "Store owners can insert PayPal credentials"
  on public.store_paypal_credentials
  for insert
  with check (
    exists (
      select 1 from public.stores s
      where s.id = store_paypal_credentials.store_id
        and s.owner_id = auth.uid()
    )
  );

create policy "Store owners can update PayPal credentials"
  on public.store_paypal_credentials
  for update
  using (
    exists (
      select 1 from public.stores s
      where s.id = store_paypal_credentials.store_id
        and s.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.stores s
      where s.id = store_paypal_credentials.store_id
        and s.owner_id = auth.uid()
    )
  );

create policy "Store owners can delete PayPal credentials"
  on public.store_paypal_credentials
  for delete
  using (
    exists (
      select 1 from public.stores s
      where s.id = store_paypal_credentials.store_id
        and s.owner_id = auth.uid()
    )
  );

revoke select (client_id, client_secret) on table public.store_paypal_credentials from anon, authenticated;