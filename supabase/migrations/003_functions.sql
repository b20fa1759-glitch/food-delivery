-- =====================================================================
-- Database functions and triggers
-- =====================================================================

-- ---------- 1. Create a profile row automatically on sign-up ----------
-- React calls supabase.auth.signUp({ email, password,
--   options: { data: { full_name, phone } } })
-- and this trigger copies that data into public.profiles.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, phone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    new.raw_user_meta_data ->> 'phone'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- ---------- 2. Turn the cart into an order (prices calculated HERE) ----------
-- Called from React:  supabase.rpc('create_order_from_cart',
--                       { p_address_id: 5, p_note: 'No onions' })
-- Why a function? If React sent the total, a user could change it in
-- DevTools and pay 1₮. Here the price is read from menu_items in the DB.
create or replace function public.create_order_from_cart(
  p_address_id bigint,
  p_note       text default null
)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user        uuid := auth.uid();
  v_address     public.addresses;
  v_restaurant  public.restaurants;
  v_rest_count  int;
  v_subtotal    int;
  v_order_id    bigint;
begin
  if v_user is null then
    raise exception 'You must be logged in';
  end if;

  -- the address must belong to this user
  select * into v_address
  from public.addresses
  where id = p_address_id and user_id = v_user;
  if not found then
    raise exception 'Address not found';
  end if;

  -- cart must not be empty and must be from ONE restaurant
  select count(distinct m.restaurant_id), sum(m.price * c.quantity)
    into v_rest_count, v_subtotal
  from public.cart_items c
  join public.menu_items m on m.id = c.menu_item_id
  where c.user_id = v_user;

  if v_rest_count = 0 or v_subtotal is null then
    raise exception 'Your cart is empty';
  end if;
  if v_rest_count > 1 then
    raise exception 'Cart can contain items from only one restaurant';
  end if;

  if exists (
    select 1 from public.cart_items c
    join public.menu_items m on m.id = c.menu_item_id
    where c.user_id = v_user and not m.is_available
  ) then
    raise exception 'Some items in your cart are no longer available';
  end if;

  select r.* into v_restaurant
  from public.restaurants r
  where r.id = (
    select m.restaurant_id from public.cart_items c
    join public.menu_items m on m.id = c.menu_item_id
    where c.user_id = v_user limit 1
  );

  if not v_restaurant.is_open then
    raise exception 'Restaurant is closed right now';
  end if;
  if v_subtotal < v_restaurant.min_order then
    raise exception 'Minimum order is %₮', v_restaurant.min_order;
  end if;

  insert into public.orders (
    user_id, restaurant_id, address_id, delivery_address, note,
    subtotal, delivery_fee, total
  ) values (
    v_user, v_restaurant.id, v_address.id,
    format('%s, %s, %s (tel: %s)', v_address.district, v_address.khoroo,
           v_address.detail, v_address.phone),
    nullif(trim(p_note), ''),
    v_subtotal, v_restaurant.delivery_fee, v_subtotal + v_restaurant.delivery_fee
  )
  returning id into v_order_id;

  insert into public.order_items (order_id, menu_item_id, name, unit_price, quantity)
  select v_order_id, m.id, m.name, m.price, c.quantity
  from public.cart_items c
  join public.menu_items m on m.id = c.menu_item_id
  where c.user_id = v_user;

  delete from public.cart_items where user_id = v_user;

  return v_order_id;
end;
$$;


-- ---------- 3. Customer can cancel own order while it is still pending ----------
create or replace function public.cancel_my_order(p_order_id bigint)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.orders
     set status = 'cancelled'
   where id = p_order_id
     and user_id = auth.uid()
     and status = 'pending';
  if not found then
    raise exception 'Only your own unpaid orders can be cancelled';
  end if;
end;
$$;


-- ---------- 4. Statistics for the admin dashboard ----------
-- supabase.rpc('admin_dashboard_stats', { p_days: 30 })
create or replace function public.admin_dashboard_stats(p_days int default 30)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_from timestamptz := date_trunc('day', now()) - make_interval(days => p_days - 1);
  result jsonb;
begin
  if not public.is_admin() then
    raise exception 'Admins only';
  end if;

  select jsonb_build_object(
    'total_revenue', (select coalesce(sum(total), 0) from orders
                      where status in ('paid','preparing','delivering','delivered')),
    'total_orders',  (select count(*) from orders),
    'paid_orders',   (select count(*) from orders
                      where status in ('paid','preparing','delivering','delivered')),
    'total_customers', (select count(*) from profiles where role = 'customer'),

    -- one row per day, including days with 0 revenue (for the line chart)
    'revenue_by_day', (
      select coalesce(jsonb_agg(jsonb_build_object('day', d.day::date, 'revenue', d.revenue, 'orders', d.orders) order by d.day), '[]')
      from (
        select g.day,
               coalesce(sum(o.total) filter (where o.status <> 'pending' and o.status <> 'cancelled'), 0) as revenue,
               count(o.id) as orders
        from generate_series(v_from, date_trunc('day', now()), interval '1 day') as g(day)
        left join orders o on date_trunc('day', o.created_at) = g.day
        group by g.day
      ) d
    ),

    'orders_by_status', (
      select coalesce(jsonb_agg(jsonb_build_object('status', s.status, 'count', s.cnt)), '[]')
      from (select status, count(*) as cnt from orders group by status) s
    ),

    'top_items', (
      select coalesce(jsonb_agg(t), '[]')
      from (
        select oi.name, sum(oi.quantity) as quantity, sum(oi.quantity * oi.unit_price) as revenue
        from order_items oi
        join orders o on o.id = oi.order_id
        where o.status not in ('pending', 'cancelled')
        group by oi.name
        order by quantity desc
        limit 5
      ) t
    ),

    'new_users_by_day', (
      select coalesce(jsonb_agg(jsonb_build_object('day', u.day::date, 'users', u.cnt) order by u.day), '[]')
      from (
        select g.day, count(p.id) as cnt
        from generate_series(v_from, date_trunc('day', now()), interval '1 day') as g(day)
        left join profiles p on date_trunc('day', p.created_at) = g.day
        group by g.day
      ) u
    )
  ) into result;

  return result;
end;
$$;

-- Only logged-in users may call these RPCs (anon cannot)
revoke execute on function public.create_order_from_cart(bigint, text) from public, anon;
revoke execute on function public.cancel_my_order(bigint)            from public, anon;
revoke execute on function public.admin_dashboard_stats(int)         from public, anon;
grant  execute on function public.create_order_from_cart(bigint, text) to authenticated;
grant  execute on function public.cancel_my_order(bigint)            to authenticated;
grant  execute on function public.admin_dashboard_stats(int)         to authenticated;


-- ---------- 5. Realtime: let the browser listen to order changes ----------
-- (RLS still applies: a user only receives events for their own orders)
alter publication supabase_realtime add table public.orders;
