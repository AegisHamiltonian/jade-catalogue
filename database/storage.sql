-- Run after schema.sql on Supabase. Public media only: never upload private files.
begin;
insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('product-media','product-media',true,41943040,array['image/jpeg','image/png','image/webp','video/mp4','video/webm'])
on conflict (id) do update set public=excluded.public,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;

-- Public bucket URLs serve photos/videos without an account.
-- Listing and every write operation still require current shop membership.
create policy "Shop admins manage product media" on storage.objects
for all to authenticated
using (bucket_id='product-media' and (select public.is_shop_admin()))
with check (bucket_id='product-media' and (select public.is_shop_admin()));
commit;
