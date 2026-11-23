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

-- Add optional columns used by the website editor while preserving legacy
-- flat products tables that may already contain catalogue data.
alter table public.products add column if not exists sort_order integer;
alter table public.products alter column sort_order set default 0;
update public.products set sort_order = 0 where sort_order is null;
alter table public.products alter column sort_order set not null;

alter table public.products add column if not exists featured boolean;
alter table public.products alter column featured set default false;
update public.products set featured = false where featured is null;
alter table public.products alter column featured set not null;

alter table public.products add column if not exists images text;

create table if not exists public.categories (
  id text primary key,
  name text not null,
  sort_order integer not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists public.partners (
  id text primary key,
  name text not null,
  description text not null default '',
  sort_order integer not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists public.hero_slides (
  id text primary key,
  title text not null,
  eyebrow text not null default '',
  description text not null default '',
  button_label text not null default 'View Details',
  destination text not null default '#catalog',
  image text not null default '',
  sort_order integer not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists public.sales_settings (
  id smallint primary key default 1 check (id = 1),
  email text not null default 'info@hdpeduct.net',
  phone text not null default '',
  whatsapp text not null default '',
  address text not null default '',
  updated_at timestamptz not null default now()
);

create table if not exists public.cloudinary_settings (
  id smallint primary key default 1 check (id = 1),
  cloud_name text not null default '',
  unsigned_preset text not null default '',
  updated_at timestamptz not null default now()
);

alter table public.products enable row level security;
alter table public.site_content enable row level security;
alter table public.admin_users enable row level security;
alter table public.categories enable row level security;
alter table public.partners enable row level security;
alter table public.hero_slides enable row level security;
alter table public.sales_settings enable row level security;
alter table public.cloudinary_settings enable row level security;

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

drop policy if exists "Public can read categories" on public.categories;
create policy "Public can read categories"
  on public.categories for select
  to anon, authenticated
  using (true);

drop policy if exists "Admins can manage categories" on public.categories;
create policy "Admins can manage categories"
  on public.categories for all
  to authenticated
  using (exists (select 1 from public.admin_users where admin_users.user_id = (select auth.uid())))
  with check (exists (select 1 from public.admin_users where admin_users.user_id = (select auth.uid())));

drop policy if exists "Public can read partners" on public.partners;
create policy "Public can read partners"
  on public.partners for select
  to anon, authenticated
  using (true);

drop policy if exists "Admins can manage partners" on public.partners;
create policy "Admins can manage partners"
  on public.partners for all
  to authenticated
  using (exists (select 1 from public.admin_users where admin_users.user_id = (select auth.uid())))
  with check (exists (select 1 from public.admin_users where admin_users.user_id = (select auth.uid())));

drop policy if exists "Public can read hero slides" on public.hero_slides;
create policy "Public can read hero slides"
  on public.hero_slides for select
  to anon, authenticated
  using (true);

drop policy if exists "Admins can manage hero slides" on public.hero_slides;
create policy "Admins can manage hero slides"
  on public.hero_slides for all
  to authenticated
  using (exists (select 1 from public.admin_users where admin_users.user_id = (select auth.uid())))
  with check (exists (select 1 from public.admin_users where admin_users.user_id = (select auth.uid())));

drop policy if exists "Public can read sales settings" on public.sales_settings;
create policy "Public can read sales settings"
  on public.sales_settings for select
  to anon, authenticated
  using (true);

drop policy if exists "Admins can manage sales settings" on public.sales_settings;
create policy "Admins can manage sales settings"
  on public.sales_settings for all
  to authenticated
  using (exists (select 1 from public.admin_users where admin_users.user_id = (select auth.uid())))
  with check (exists (select 1 from public.admin_users where admin_users.user_id = (select auth.uid())));

drop policy if exists "Public can read Cloudinary settings" on public.cloudinary_settings;
create policy "Public can read Cloudinary settings"
  on public.cloudinary_settings for select
  to anon, authenticated
  using (true);

drop policy if exists "Admins can manage Cloudinary settings" on public.cloudinary_settings;
create policy "Admins can manage Cloudinary settings"
  on public.cloudinary_settings for all
  to authenticated
  using (exists (select 1 from public.admin_users where admin_users.user_id = (select auth.uid())))
  with check (exists (select 1 from public.admin_users where admin_users.user_id = (select auth.uid())));

grant select on public.products, public.site_content to anon, authenticated;
grant insert, update, delete on public.products, public.site_content to authenticated;
grant select on public.admin_users to authenticated;
grant select on public.categories, public.partners, public.hero_slides, public.sales_settings, public.cloudinary_settings to anon, authenticated;
grant insert, update, delete on public.categories, public.partners, public.hero_slides, public.sales_settings, public.cloudinary_settings to authenticated;
