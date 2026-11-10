create table if not exists public.products (
  id text primary key,
  sort_order integer not null default 0,
  data jsonb not null check (jsonb_typeof(data) = 'object'),
  updated_at timestamptz not null default now()
);

create table if not exists public.site_content (
  id smallint primary key default 1 check (id = 1),
  data jsonb not null check (jsonb_typeof(data) = 'object'),
  updated_at timestamptz not null default now()
);

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users (id) on delete cascade
);

alter table public.products enable row level security;
alter table public.site_content enable row level security;
alter table public.admin_users enable row level security;

drop policy if exists "Public can read products" on public.products;
create policy "Public can read products"
  on public.products for select
  to anon, authenticated
  using (true);

drop policy if exists "Admins can manage products" on public.products;
create policy "Admins can manage products"
  on public.products for all
  to authenticated
  using (exists (
    select 1 from public.admin_users
    where admin_users.user_id = (select auth.uid())
  ))
  with check (exists (
    select 1 from public.admin_users
    where admin_users.user_id = (select auth.uid())
  ));

drop policy if exists "Public can read site content" on public.site_content;
create policy "Public can read site content"
  on public.site_content for select
  to anon, authenticated
  using (true);

drop policy if exists "Admins can manage site content" on public.site_content;
create policy "Admins can manage site content"
  on public.site_content for all
  to authenticated
  using (exists (
    select 1 from public.admin_users
    where admin_users.user_id = (select auth.uid())
  ))
  with check (exists (
    select 1 from public.admin_users
    where admin_users.user_id = (select auth.uid())
  ));

drop policy if exists "Users can read their own admin membership" on public.admin_users;
create policy "Users can read their own admin membership"
  on public.admin_users for select
  to authenticated
  using (user_id = (select auth.uid()));

grant select on public.products, public.site_content to anon, authenticated;
grant insert, update, delete on public.products, public.site_content to authenticated;
grant select on public.admin_users to authenticated;
