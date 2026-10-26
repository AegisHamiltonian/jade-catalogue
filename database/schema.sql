-- Fresh Supabase project. Review docs/architecture.md before applying.
-- Functionality preservation: all proposed product responsibilities are retained.
-- gen_random_uuid() is PostgreSQL's active UUID v4 equivalent; no extension needed.
begin;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create type public.product_category as enum ('vong_chuoi','vong','nhan','mat_day','charm','khac');
create type public.supply_status as enum ('stock','order','sold');
create type public.jade_material as enum ('unknown','jadeite','nephrite','other');
create type public.jade_treatment as enum ('unknown','a','b','c','bc','other');

-- Membership is written only by the database owner, not by the application.
create table private.shop_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table private.shop_admins enable row level security;
revoke all on private.shop_admins from public, anon, authenticated;

create function public.is_shop_admin() returns boolean
language sql stable security definer set search_path = ''
as $$ select exists (select 1 from private.shop_admins where user_id = (select auth.uid())); $$;
revoke all on function public.is_shop_admin() from public;
grant execute on function public.is_shop_admin() to anon, authenticated;

create table public.products (
  id uuid primary key default gen_random_uuid(),
  sku varchar(32) not null unique check (sku ~ '^[a-zA-Z0-9._-]{1,32}$'),
  title varchar(150) not null check (length(btrim(title)) > 0),
  category public.product_category not null,
  supply public.supply_status not null default 'stock',
  jade_texture varchar(64),
  jade_color varchar(64),
  -- One convention: INNER DIAMETER IN MM. No US/ring-size-number conversion.
  ni_tay numeric(4,1),
  bead_diameter_mm numeric(4,1),
  dimensions varchar(64),
  jade_material public.jade_material not null default 'unknown',
  treatment public.jade_treatment not null default 'unknown',
  certificate_lab varchar(150),
  certificate_number varchar(100),
  certificate_url text check (certificate_url is null or certificate_url ~ '^https://[^[:space:]]+$'),
  price_vnd bigint not null check (price_vnd > 0 and price_vnd <= 9007199254740991),
  thumbnail_url text not null check (thumbnail_url ~ '^https://[^[:space:]]+$'),
  gallery_urls text[] not null default '{}',
  video_url text check (video_url is null or video_url ~ '^https://[^[:space:]]+$'),
  description text,
  batch_date date not null default (now() at time zone 'Asia/Ho_Chi_Minh')::date,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint category_size check (
    (category in ('vong','nhan') and ni_tay is not null and ni_tay > 0)
    or (category in ('vong_chuoi','mat_day','charm','khac') and ni_tay is null)
  ),
  constraint bead_size check (
    bead_diameter_mm is null or (category='vong_chuoi' and bead_diameter_mm>0)
  ),
  constraint treatment_evidence check (
    treatment = 'unknown' or nullif(btrim(certificate_number),'') is not null
  )
);
-- Case-insensitive SKU uniqueness, without creating a second SKU source.
create unique index products_sku_folded on public.products(lower(sku));
create index idx_products_catalogue_feed on public.products (batch_date desc,created_at desc,id) where is_published;
create index idx_products_filter_category_supply on public.products (category,supply,ni_tay) where is_published;
create index idx_products_ni_tay on public.products (ni_tay) where is_published and ni_tay is not null;

create function private.validate_product_media() returns trigger
language plpgsql set search_path = '' as $$
begin
  if exists (select 1 from unnest(new.gallery_urls) as media(url) where url is null or url !~ '^https://[^[:space:]]+$') then
    raise exception 'Gallery URLs must use HTTPS';
  end if;
  if tg_op = 'UPDATE' then
    new.created_at := old.created_at;
    new.updated_at := clock_timestamp();
  end if;
  return new;
end; $$;
create trigger products_validate_and_timestamp before insert or update on public.products
for each row execute function private.validate_product_media();

-- Audit data is private and cannot be modified by an ordinary admin browser.
create table private.product_audit (
  id bigint generated always as identity primary key,
  product_id uuid not null,
  action text not null,
  actor_id uuid,
  before_row jsonb,
  after_row jsonb,
  occurred_at timestamptz not null default clock_timestamp()
);
alter table private.product_audit enable row level security;
revoke all on private.product_audit from public, anon, authenticated;
create function private.audit_product() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into private.product_audit(product_id,action,actor_id,before_row,after_row)
  values(coalesce(new.id,old.id),tg_op,auth.uid(),
    case when tg_op in ('UPDATE','DELETE') then to_jsonb(old) else null end,
    case when tg_op in ('INSERT','UPDATE') then to_jsonb(new) else null end);
  return coalesce(new,old);
end; $$;
revoke all on function private.audit_product() from public;
create trigger products_audit after insert or update or delete on public.products
for each row execute function private.audit_product();

alter table public.products enable row level security;
revoke all on public.products from public, anon, authenticated;
grant select on public.products to anon, authenticated;
grant insert,update,delete on public.products to authenticated;
create policy "Public can view published products" on public.products
for select to anon, authenticated using (is_published = true);
create policy "Only shop admins can manage products" on public.products
for all to authenticated using ((select public.is_shop_admin())) with check ((select public.is_shop_admin()));

-- Storage setup is separate so it can be tested and applied after this transaction.
commit;
