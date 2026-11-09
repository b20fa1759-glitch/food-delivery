-- =====================================================================
-- Row Level Security (RLS)
-- Rule of thumb:
--   * menu data (categories, restaurants, menu_items, menu_item_categories)
--       → everyone can READ, only admin can WRITE
--   * personal data (profiles, addresses, cart_items)
--       → each user sees/changes only their own rows, admin can read all
--   * orders / order_items / payments
--       → user reads own; rows are CREATED only by server functions;
--         admin can update order status
-- =====================================================================

-- Helper: is the logged-in user an admin?
-- SECURITY DEFINER so it can read profiles without being blocked by RLS
-- (otherwise the profiles policy would call itself → infinite recursion).
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- Turn RLS on for ALL tables (requirement: "Бүх хүснэгтэд RLS")
alter table public.profiles             enable row level security;
alter table public.categories           enable row level security;
alter table public.restaurants          enable row level security;
alter table public.menu_items           enable row level security;
alter table public.menu_item_categories enable row level security;
alter table public.addresses            enable row level security;
alter table public.cart_items           enable row level security;
alter table public.orders               enable row level security;
alter table public.order_items          enable row level security;
alter table public.payments             enable row level security;

-- ---------- profiles ----------
create policy "profiles: read own or admin"
  on public.profiles for select
  using (id = auth.uid() or public.is_admin());

create policy "profiles: update own"
  on public.profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

create policy "profiles: admin update any"
  on public.profiles for update
  using (public.is_admin());
-- (rows are inserted by the handle_new_user trigger, so no insert policy)

-- Stop a normal user from making themselves admin with
--   supabase.from('profiles').update({ role: 'admin' })
create or replace function public.prevent_role_change()
returns trigger
language plpgsql
as $$
begin
  if new.role is distinct from old.role
     and auth.uid() is not null          -- null = SQL editor / service role
     and not public.is_admin() then
    raise exception 'Only an admin can change roles';
  end if;
  return new;
end;
$$;

create trigger profiles_prevent_role_change
  before update on public.profiles
  for each row execute function public.prevent_role_change();

-- ---------- public menu data: read for all, write for admin ----------
create policy "categories: public read"  on public.categories for select using (true);
create policy "categories: admin write"  on public.categories for all
  using (public.is_admin()) with check (public.is_admin());

create policy "restaurants: public read" on public.restaurants for select using (true);
create policy "restaurants: admin write" on public.restaurants for all
  using (public.is_admin()) with check (public.is_admin());

create policy "menu_items: public read"  on public.menu_items for select using (true);
create policy "menu_items: admin write"  on public.menu_items for all
  using (public.is_admin()) with check (public.is_admin());

create policy "menu_item_categories: public read" on public.menu_item_categories for select using (true);
create policy "menu_item_categories: admin write" on public.menu_item_categories for all
  using (public.is_admin()) with check (public.is_admin());

-- ---------- addresses: only own ----------
create policy "addresses: own rows"
  on public.addresses for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ---------- cart_items: only own ----------
create policy "cart_items: own rows"
  on public.cart_items for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ---------- orders ----------
create policy "orders: read own or admin"
  on public.orders for select
  using (user_id = auth.uid() or public.is_admin());

create policy "orders: admin update"
  on public.orders for update
  using (public.is_admin())
  with check (public.is_admin());
-- No insert policy: orders are created only through the
-- create_order_from_cart() function, which calculates prices itself.

-- ---------- order_items ----------
create policy "order_items: read own or admin"
  on public.order_items for select
  using (
    exists (
      select 1 from public.orders o
      where o.id = order_id
        and (o.user_id = auth.uid() or public.is_admin())
    )
  );

-- ---------- payments ----------
create policy "payments: read own or admin"
  on public.payments for select
  using (
    exists (
      select 1 from public.orders o
      where o.id = order_id
        and (o.user_id = auth.uid() or public.is_admin())
    )
  );
-- Inserts/updates come only from Edge Functions using the service_role key,
-- which bypasses RLS. The browser can never mark a payment as paid.
