-- =====================================================================
-- Storage: image bucket with size and type limits
--   * public read (images shown on the site)
--   * max 2 MB, only JPG / PNG / WEBP  (also checked in React before upload)
--   * only admin can upload / replace / delete
-- =====================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'food-images',
  'food-images',
  true,
  2 * 1024 * 1024,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

create policy "food-images: public read"
  on storage.objects for select
  using (bucket_id = 'food-images');

create policy "food-images: admin insert"
  on storage.objects for insert
  with check (bucket_id = 'food-images' and public.is_admin());

create policy "food-images: admin update"
  on storage.objects for update
  using (bucket_id = 'food-images' and public.is_admin());

create policy "food-images: admin delete"
  on storage.objects for delete
  using (bucket_id = 'food-images' and public.is_admin());
