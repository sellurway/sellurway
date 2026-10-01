alter table public.store_paypal_credentials enable row level security;

drop policy if exists "Store owners can read PayPal credential metadata" on public.store_paypal_credentials;
drop policy if exists "Store owners can manage PayPal credentials" on public.store_paypal_credentials;