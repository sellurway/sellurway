create table if not exists public.store_paypal_credentials (
  store_id uuid primary key references public.stores(id) on delete cascade,
  client_id text not null,
  client_secret text not null,
  client_id_last4 text not null,
  livemode boolean not null default true,
  updated_at timestamptz not null default now()
);

alter table public.store_paypal_credentials enable row level security;

drop policy if exists "Store owners can read PayPal credential metadata" on public.store_paypal_credentials;
create policy "Store owners can read PayPal credential metadata"
  on public.store_paypal_credentials
  for select
  using (
    exists (
      select 1 from public.stores s
      where s.id = store_paypal_credentials.store_id
        and s.owner_id = auth.uid()
    )
  );

drop policy if exists "Store owners can manage PayPal credentials" on public.store_paypal_credentials;
create policy "Store owners can manage PayPal credentials"
  on public.store_paypal_credentials
  for all
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