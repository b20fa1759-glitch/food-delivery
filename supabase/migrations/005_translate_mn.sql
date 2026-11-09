-- Categories
update public.categories set name = 'Пицца'        where slug = 'pizza';
update public.categories set name = 'Бургер'       where slug = 'burger';
update public.categories set name = 'Монгол хоол'  where slug = 'mongolian';
update public.categories set name = 'Солонгос хоол' where slug = 'korean';
update public.categories set name = 'Ундаа'        where slug = 'drinks';
update public.categories set name = 'Амттан'       where slug = 'desserts';

-- Restaurants (names stay as brand names)
update public.restaurants set description = 'Зууханд жигнэсэн пицца, гоймон',
  address = 'Сүхбаатар дүүрэг, 1-р хороо, Сөүлийн гудамж 12' where id = 1;
update public.restaurants set description = 'Шүүслэг бургер, шарсан төмс',
  address = 'Чингэлтэй дүүрэг, 4-р хороо, Энхтайваны өргөн чөлөө 45' where id = 2;
update public.restaurants set description = 'Бууз, хуушуур, цуйван болон бусад',
  address = 'Баянгол дүүрэг, 3-р хороо, 3-р хороолол' where id = 3;
update public.restaurants set description = 'Бибимбап, ттокбокки, солонгос шарсан тахиа',
  address = 'Хан-Уул дүүрэг, 15-р хороо, Зайсан' where id = 4;

-- Dishes
update public.menu_items set name = 'Пепперони пицца 30см',  description = 'Улаан лоолийн соус, моцарелла, пепперони' where id = 1;
update public.menu_items set name = 'Маргарита пицца 30см',  description = 'Улаан лооль, моцарелла, базилик'          where id = 2;
update public.menu_items set name = 'Кока-Кола 0.5л',        description = ''                                          where id = 3;
update public.menu_items set name = 'Классик бургер',        description = 'Давхар үхрийн мах, бяслаг, даршилсан өргөст хэмх' where id = 4;
update public.menu_items set name = 'Тахианы бургер',        description = 'Шарсан тахиа, байцааны салат'             where id = 5;
update public.menu_items set name = 'Шарсан төмс',           description = 'Том порц'                                  where id = 6;
update public.menu_items set name = 'Бууз (8 ширхэг)',       description = 'Хонины махтай уураар жигнэсэн бууз'       where id = 7;
update public.menu_items set name = 'Хуушуур (4 ширхэг)',    description = 'Махтай шарсан хуушуур'                    where id = 8;
update public.menu_items set name = 'Цуйван',                description = 'Үхрийн махтай хуурсан гурилтай хоол'      where id = 9;
update public.menu_items set name = 'Сүүтэй цай',            description = ''                                          where id = 10;
update public.menu_items set name = 'Бибимбап',              description = 'Будаа, ногоо, өндөг, гочужан соус'        where id = 11;
update public.menu_items set name = 'Ттокбокки',             description = 'Халуун ногоотой будааны бялуу'            where id = 12;
update public.menu_items set name = 'Солонгос шарсан тахиа', description = 'Хагас тахиа, янңём соус'                  where id = 13;
update public.menu_items set name = 'Бингсү',                description = 'Улаан буурцагтай мөсөн амттан'            where id = 14;
