create table if not exists public.store_dropshipping_connections (
  store_id uuid primary key references public.stores(id) on delete cascade,
  provider text not null default 'cjdropshipping',
  api_key text not null,
  api_key_last4 text not null,
  enabled boolean not null default true,
  updated_at timestamptz not null default now(),
  constraint store_dropshipping_provider_check check (provider in ('cjdropshipping'))
);

alter table public.store_dropshipping_connections enable row level security;

drop policy if exists "Store owners can manage dropshipping connections" on public.store_dropshipping_connections;
create policy "Store owners can manage dropshipping connections"
  on public.store_dropshipping_connections
  for all
  using (exists (
    select 1 from public.stores s
    where s.id = store_dropshipping_connections.store_id
      and s.owner_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.stores s
    where s.id = store_dropshipping_connections.store_id
      and s.owner_id = auth.uid()
  ));

create index if not exists idx_store_dropshipping_connections_provider
  on public.store_dropshipping_connections(provider);
