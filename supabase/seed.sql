-- =====================================================================
-- Demo data (run after the migrations).
-- Images: replace image_url values with your own uploads in the
-- 'food-images' bucket (Admin panel → edit item → upload).
-- =====================================================================

insert into public.categories (name, slug, sort_order) values
  ('Pizza',        'pizza',     1),
  ('Burger',       'burger',    2),
  ('Mongolian',    'mongolian', 3),
  ('Korean',       'korean',    4),
  ('Drinks',       'drinks',    5),
  ('Desserts',     'desserts',  6);

insert into public.restaurants (name, description, address, phone, delivery_fee, min_order) values
  ('Pizza Hub',      'Wood-fired pizza and pasta',            'Sükhbaatar, 1-р хороо, Seoul street 12', '77001122', 3000, 15000),
  ('Burger Town',    'Smash burgers and fries',               'Chingeltei, 4-р хороо, Peace Ave 45',    '77003344', 2500, 10000),
  ('Nomad Kitchen',  'Buuz, khuushuur, tsuivan and more',     'Bayangol, 3-р хороо, 3rd district',      '77005566', 2000, 8000),
  ('Seoul Bowl',     'Bibimbap, tteokbokki, Korean fried chicken', 'Khan-Uul, 15-р хороо, Zaisan',     '77007788', 3500, 12000);

insert into public.menu_items (restaurant_id, name, description, price) values
  (1, 'Pepperoni pizza 30cm', 'Tomato sauce, mozzarella, pepperoni', 28000),
  (1, 'Margherita pizza 30cm','Tomato, mozzarella, basil',           24000),
  (1, 'Coca-Cola 0.5L',       '',                                    3500),
  (2, 'Classic smash burger', 'Double beef, cheese, pickles',        18000),
  (2, 'Chicken burger',       'Crispy chicken, slaw',                16000),
  (2, 'French fries',         'Large portion',                        6000),
  (3, 'Buuz (8 pcs)',         'Steamed mutton dumplings',            12000),
  (3, 'Khuushuur (4 pcs)',    'Fried meat pastries',                 11000),
  (3, 'Tsuivan',              'Stir-fried noodles with beef',        15000),
  (3, 'Milk tea (suutei tsai)','',                                    2500),
  (4, 'Bibimbap',             'Rice, vegetables, egg, gochujang',    19000),
  (4, 'Tteokbokki',           'Spicy rice cakes',                    14000),
  (4, 'Korean fried chicken', 'Half chicken, yangnyeom sauce',       26000),
  (4, 'Bingsu',               'Shaved ice dessert with red bean',    13000);

-- N:M links (an item can be in several categories)
insert into public.menu_item_categories (menu_item_id, category_id) values
  (1,1),(2,1),(3,5),
  (4,2),(5,2),(6,2),
  (7,3),(8,3),(9,3),(10,3),(10,5),
  (11,4),(12,4),(13,4),(14,4),(14,6);

-- First admin: sign up normally in the app, then run:
--   update public.profiles set role = 'admin'
--   where id = (select id from auth.users where email = 'YOUR_ADMIN_EMAIL');
