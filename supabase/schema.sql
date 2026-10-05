-- ============================================================
-- Bikoom Store — Supabase schema
-- Run this whole file in the Supabase SQL editor (Dashboard →
-- SQL Editor → New query → paste → Run).
-- Safe to re-run: every object uses "if not exists" / or-replace.
-- ============================================================

-- ------------------------------------------------------------
-- Profiles (created automatically on Google sign-in)
-- ------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  email text,
  avatar_url text,
  is_admin boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Auto-create a profile row whenever a user signs up with Google.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name',
             new.raw_user_meta_data ->> 'name'),
    new.email,
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do update
    set email = excluded.email;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Users can read their own profile (and admins read all via the API's
-- service-role key, which bypasses RLS). No write policies on purpose:
-- is_admin must only be changed by the service role / SQL.
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles for select
  to authenticated
  using (auth.uid() = id);

-- ------------------------------------------------------------
-- Categories
-- ------------------------------------------------------------
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.categories enable row level security;

-- Storefront catalogue is public: visitors browse without signing in.
drop policy if exists "categories_read" on public.categories;
create policy "categories_read"
  on public.categories for select
  to anon, authenticated
  using (true);

-- ------------------------------------------------------------
-- Products
-- ------------------------------------------------------------
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.categories (id) on delete set null,
  name text not null,
  slug text not null unique,
  description text not null default '',
  price numeric(12, 2),
  show_price boolean not null default true,
  is_available boolean not null default true,
  is_featured boolean not null default false,
  image_url text,
  images text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists products_category_idx on public.products (category_id);
create index if not exists products_featured_idx on public.products (is_featured);

alter table public.products enable row level security;

-- Public catalogue: anyone can browse products without an account.
drop policy if exists "products_read" on public.products;
create policy "products_read"
  on public.products for select
  to anon, authenticated
  using (true);

-- ------------------------------------------------------------
-- Homepage banners
-- ------------------------------------------------------------
create table if not exists public.banners (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  subtitle text,
  image_url text,
  link_url text,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.banners enable row level security;

drop policy if exists "banners_read" on public.banners;
create policy "banners_read"
  on public.banners for select
  to anon, authenticated
  using (true);

-- ------------------------------------------------------------
-- Order requests (customer sends their cart to WhatsApp; the
-- request is also stored here and e-mailed to Bikoom via Mailgun)
-- ------------------------------------------------------------
create table if not exists public.order_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  customer_name text not null,
  customer_phone text not null,
  customer_location text,
  notes text,
  displayed_total numeric(12, 2),
  status text not null default 'new'
    check (status in ('new', 'contacted', 'closed')),
  created_at timestamptz not null default now()
);

create index if not exists order_requests_created_idx
  on public.order_requests (created_at desc);

alter table public.order_requests enable row level security;

drop policy if exists "orders_insert_own" on public.order_requests;
create policy "orders_insert_own"
  on public.order_requests for insert
  to authenticated
  with check (auth.uid() = user_id or user_id is null);

drop policy if exists "orders_select_own" on public.order_requests;
create policy "orders_select_own"
  on public.order_requests for select
  to authenticated
  using (auth.uid() = user_id);

-- ------------------------------------------------------------
-- Order request items (product snapshot per order line)
-- ------------------------------------------------------------
create table if not exists public.order_request_items (
  id uuid primary key default gen_random_uuid(),
  order_request_id uuid not null references public.order_requests (id) on delete cascade,
  product_id uuid references public.products (id) on delete set null,
  product_name text not null,
  unit_price numeric(12, 2),
  show_price boolean not null default true,
  quantity integer not null check (quantity > 0)
);

create index if not exists order_items_order_idx
  on public.order_request_items (order_request_id);

alter table public.order_request_items enable row level security;
-- Read/written through the API's service role only.

-- ------------------------------------------------------------
-- Delivery / waybill requests
-- ------------------------------------------------------------
create table if not exists public.delivery_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  name text not null,
  phone text not null,
  location text not null,
  product_info text not null,
  notes text,
  status text not null default 'new'
    check (status in ('new', 'contacted', 'closed')),
  created_at timestamptz not null default now()
);

create index if not exists delivery_requests_created_idx
  on public.delivery_requests (created_at desc);

alter table public.delivery_requests enable row level security;

drop policy if exists "delivery_insert_own" on public.delivery_requests;
create policy "delivery_insert_own"
  on public.delivery_requests for insert
  to authenticated
  with check (auth.uid() = user_id or user_id is null);

drop policy if exists "delivery_select_own" on public.delivery_requests;
create policy "delivery_select_own"
  on public.delivery_requests for select
  to authenticated
  using (auth.uid() = user_id);

-- ------------------------------------------------------------
-- Storage buckets for product & banner images
-- ------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('products', 'products', true), ('banners', 'banners', true)
on conflict (id) do nothing;

drop policy if exists "media_public_read" on storage.objects;
create policy "media_public_read"
  on storage.objects for select
  using (bucket_id in ('products', 'banners'));

drop policy if exists "media_admin_insert" on storage.objects;
create policy "media_admin_insert"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id in ('products', 'banners')
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_admin = true
    )
  );

drop policy if exists "media_admin_update" on storage.objects;
create policy "media_admin_update"
  on storage.objects for update
  to authenticated
  using (
    bucket_id in ('products', 'banners')
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_admin = true
    )
  );

drop policy if exists "media_admin_delete" on storage.objects;
create policy "media_admin_delete"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id in ('products', 'banners')
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_admin = true
    )
  );

-- ------------------------------------------------------------
-- Admin promotion helper.
-- Usage (SQL editor): select public.promote_admin('you@gmail.com');
-- Revoke execute from regular users first.
-- ------------------------------------------------------------
create or replace function public.promote_admin(target_email text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles
    set is_admin = true, updated_at = now()
    where lower(email) = lower(target_email);
  if not found then
    raise notice 'No profile found for % — sign in with Google once, then re-run.', target_email;
  end if;
end;
$$;

revoke execute on function public.promote_admin(text) from public;
revoke execute on function public.promote_admin(text) from anon;
revoke execute on function public.promote_admin(text) from authenticated;
grant execute on function public.promote_admin(text) to service_role;

-- ------------------------------------------------------------
-- Realtime — instant two-way sync between the website and the
-- mobile app. Postgres changes are only delivered for tables in
-- this publication, and only to subscribers allowed by RLS.
-- ------------------------------------------------------------
do $$
declare t text;
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    create publication supabase_realtime;
  end if;
  foreach t in array array['products','categories','banners','order_requests','delivery_requests'] loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public' and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;

-- Admins see live order/delivery requests (RLS also gates realtime
-- events). Promote your account first: select public.promote_admin('you@gmail.com');
drop policy if exists "orders_select_admin" on public.order_requests;
create policy "orders_select_admin"
  on public.order_requests for select
  to authenticated
  using (exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true
  ));

drop policy if exists "delivery_select_admin" on public.delivery_requests;
create policy "delivery_select_admin"
  on public.delivery_requests for select
  to authenticated
  using (exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true
  ));
