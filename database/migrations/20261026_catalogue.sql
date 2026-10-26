-- Expand categories in place. Existing codes/rows and certificate metadata remain intact.
-- New enum values must commit before they can be referenced by constraints.
begin;
set local lock_timeout = '10s';
alter type public.product_category add value if not exists 'vong_chuoi' before 'vong';
alter type public.product_category add value if not exists 'charm' before 'khac';
commit;

begin;
set local lock_timeout = '10s';
lock table public.products in share row exclusive mode;
alter table public.products add column if not exists bead_diameter_mm numeric(4,1);
do $$
declare before_rows text; after_rows text;
begin
  select md5(coalesce(jsonb_agg(to_jsonb(p) order by p.id)::text,'[]')) into before_rows from public.products p;
  alter table public.products drop constraint category_size;
  alter table public.products add constraint category_size check (
    (category in ('vong','nhan') and ni_tay is not null and ni_tay > 0)
    or (category in ('vong_chuoi','mat_day','charm','khac') and ni_tay is null)
  );
  alter table public.products drop constraint if exists bead_size;
  alter table public.products add constraint bead_size check (
    bead_diameter_mm is null or (category='vong_chuoi' and bead_diameter_mm>0)
  );
  -- Shop-requested form now retains the certificate number only.
  -- Keep existing lab/URL columns and their values, including HTTPS validation.
  alter table public.products drop constraint treatment_evidence;
  alter table public.products add constraint treatment_evidence check (
    treatment = 'unknown' or nullif(btrim(certificate_number),'') is not null
  );
  select md5(coalesce(jsonb_agg(to_jsonb(p) order by p.id)::text,'[]')) into after_rows from public.products p;
  if before_rows is distinct from after_rows then raise exception 'Catalogue rows unexpectedly changed during schema migration'; end if;
end $$;
notify pgrst, 'reload schema';
commit;
