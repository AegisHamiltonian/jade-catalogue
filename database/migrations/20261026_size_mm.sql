begin;
set local lock_timeout='10s';
lock table public.products in share row exclusive mode;
alter table public.products alter column ni_tay type numeric, alter column bead_diameter_mm type numeric;
do $$
declare before_fields text; after_fields text;
begin
  select md5(coalesce(jsonb_agg(to_jsonb(p)-'size_mm'-'updated_at' order by p.id)::text,'[]')) into before_fields from public.products p;
  -- Backfill only when adding the column. A retry must not resurrect a size the owner cleared.
  if not exists(select 1 from information_schema.columns where table_schema='public' and table_name='products' and column_name='size_mm') then
    alter table public.products add column size_mm varchar(150);
    update public.products set size_mm = case
      when category in ('vong','nhan') and ni_tay is not null then 'Ni '||replace(ni_tay::text,'.',',')||' mm'||case when nullif(btrim(dimensions),'') is not null then ' · '||dimensions else '' end
      when category='vong_chuoi' and bead_diameter_mm is not null then 'Hạt '||replace(bead_diameter_mm::text,'.',',')||' mm'||case when nullif(btrim(dimensions),'') is not null then ' · '||dimensions else '' end
      else nullif(btrim(dimensions),'') end;
  end if;
  select md5(coalesce(jsonb_agg(to_jsonb(p)-'size_mm'-'updated_at' order by p.id)::text,'[]')) into after_fields from public.products p;
  if before_fields is distinct from after_fields then raise exception 'Unrelated product data changed during Size migration'; end if;
end $$;
alter table public.products drop constraint category_size;
alter table public.products add constraint category_size check (
  (category in ('vong','nhan') and nullif(btrim(size_mm),'') is not null and (ni_tay is null or ni_tay>0))
  or (category in ('vong_chuoi','mat_day','charm','khac') and ni_tay is null)
);
-- The single sync function/trigger is installed by the migration runner in this transaction.
