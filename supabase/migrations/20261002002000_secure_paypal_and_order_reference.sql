-- PayPal credentials are server-only. The application server uses the service-role client.
alter table public.store_paypal_credentials enable row level security;

drop policy if exists "Store owners can read PayPal credential metadata" on public.store_paypal_credentials;
drop policy if exists "Store owners can manage PayPal credentials" on public.store_paypal_credentials;
drop policy if exists "Store owners can insert PayPal credentials" on public.store_paypal_credentials;
drop policy if exists "Store owners can update PayPal credentials" on public.store_paypal_credentials;
drop policy if exists "Store owners can delete PayPal credentials" on public.store_paypal_credentials;

revoke all on public.store_paypal_credentials from anon, authenticated;

alter table public.orders
  add column if not exists paypal_order_id text;

create index if not exists orders_paypal_order_id_idx
  on public.orders(paypal_order_id)
  where paypal_order_id is not null;
