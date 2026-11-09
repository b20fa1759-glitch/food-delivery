-- =====================================================================
-- Online Food Delivery — database schema (Supabase / PostgreSQL)
-- Run this in Supabase Dashboard → SQL Editor (or `supabase db push`).
-- Order: 001_schema.sql → 002_rls.sql → 003_functions.sql → 004_storage.sql → seed.sql
-- =====================================================================

-- ---------- Enum types ----------
create type public.user_role    as enum ('customer', 'admin');
create type public.order_status as enum (
  'pending',     -- Хүлээгдэж буй: created, waiting for payment
  'paid',        -- Төлөгдсөн: set automatically by the payment webhook
  'preparing',   -- restaurant is cooking
  'delivering',  -- courier is on the way
  'delivered',   -- finished
  'cancelled'
);
create type public.payment_status as enum ('pending', 'paid', 'failed', 'refunded');

-- ---------- 1. profiles (1:1 with auth.users) ----------
create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  full_name   text not null default '',
  phone       text,
  avatar_url  text,
  role        public.user_role not null default 'customer',
  created_at  timestamptz not null default now()
);

-- ---------- 2. categories ----------
create table public.categories (
  id          bigint generated always as identity primary key,
  name        text not null unique,
  slug        text not null unique,
  image_url   text,
  sort_order  int  not null default 0,
  created_at  timestamptz not null default now()
);

-- ---------- 3. restaurants ----------
create table public.restaurants (
  id            bigint generated always as identity primary key,
  name          text not null,
  description   text,
  image_url     text,
  address       text not null,
  phone         text,
  delivery_fee  int  not null default 3000 check (delivery_fee >= 0),  -- ₮
  min_order     int  not null default 0    check (min_order >= 0),     -- ₮
  is_open       boolean not null default true,
  created_at    timestamptz not null default now()
);

-- ---------- 4. menu_items (restaurant 1:N menu_items) ----------
create table public.menu_items (
  id             bigint generated always as identity primary key,
  restaurant_id  bigint not null references public.restaurants (id) on delete cascade,
  name           text not null,
  description    text,
  price          int  not null check (price > 0),                      -- ₮
  image_url      text,
  is_available   boolean not null default true,
  created_at     timestamptz not null default now()
);
create index on public.menu_items (restaurant_id);

-- ---------- 5. menu_item_categories (menu_items N:M categories) ----------
create table public.menu_item_categories (
  menu_item_id  bigint not null references public.menu_items (id) on delete cascade,
  category_id   bigint not null references public.categories (id) on delete cascade,
  primary key (menu_item_id, category_id)
);
create index on public.menu_item_categories (category_id);

-- ---------- 6. addresses (profile 1:N addresses) ----------
create table public.addresses (
  id          bigint generated always as identity primary key,
  user_id     uuid not null references public.profiles (id) on delete cascade,
  label       text not null default 'Home',          -- Home / Work ...
  district    text not null,                         -- e.g. Sükhbaatar
  khoroo      text not null,                         -- e.g. 1-р хороо
  detail      text not null,                         -- building, entrance, door
  phone       text not null,
  is_default  boolean not null default false,
  created_at  timestamptz not null default now()
);
create index on public.addresses (user_id);

-- ---------- 7. cart_items (profiles N:M menu_items) ----------
create table public.cart_items (
  user_id       uuid   not null references public.profiles (id) on delete cascade,
  menu_item_id  bigint not null references public.menu_items (id) on delete cascade,
  quantity      int    not null default 1 check (quantity between 1 and 50),
  added_at      timestamptz not null default now(),
  primary key (user_id, menu_item_id)
);

-- ---------- 8. orders (profile 1:N orders, restaurant 1:N orders) ----------
create table public.orders (
  id               bigint generated always as identity primary key,
  user_id          uuid   not null references public.profiles (id) on delete cascade,
  restaurant_id    bigint not null references public.restaurants (id),
  address_id       bigint references public.addresses (id) on delete set null,
  delivery_address text   not null,     -- copy of the address at order time
  note             text,
  status           public.order_status not null default 'pending',
  subtotal         int not null check (subtotal >= 0),
  delivery_fee     int not null check (delivery_fee >= 0),
  total            int not null check (total >= 0),
  created_at       timestamptz not null default now(),
  paid_at          timestamptz
);
create index on public.orders (user_id, created_at desc);
create index on public.orders (status);

-- ---------- 9. order_items (orders N:M menu_items, with price snapshot) ----------
create table public.order_items (
  id            bigint generated always as identity primary key,
  order_id      bigint not null references public.orders (id) on delete cascade,
  menu_item_id  bigint references public.menu_items (id) on delete set null,
  name          text not null,   -- copy, so old orders still show the name
  unit_price    int  not null check (unit_price > 0),
  quantity      int  not null check (quantity > 0)
);
create index on public.order_items (order_id);

-- ---------- 10. payments (order 1:N payments) ----------
create table public.payments (
  id               bigint generated always as identity primary key,
  order_id         bigint not null references public.orders (id) on delete cascade,
  provider         text   not null default 'stripe',
  provider_ref     text   unique,          -- Stripe Checkout Session id
  amount           int    not null check (amount >= 0),
  status           public.payment_status not null default 'pending',
  raw_event        jsonb,                  -- webhook payload, for debugging
  created_at       timestamptz not null default now(),
  paid_at          timestamptz
);
create index on public.payments (order_id);
