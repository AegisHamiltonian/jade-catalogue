-- One editable size string; numeric attributes remain derived indexes for filters.
create or replace function private.sync_size_mm() returns trigger
language plpgsql set search_path = '' as $$
declare matched text[]; measured numeric; expression text;
begin
  if tg_op='UPDATE' then
    if new.size_mm is not distinct from old.size_mm and new.category=old.category
      and (new.ni_tay is distinct from old.ni_tay or new.bead_diameter_mm is distinct from old.bead_diameter_mm or new.dimensions is distinct from old.dimensions) then
      raise exception 'Use Size (mm) to update measurements; reload the product form';
    end if;
  elsif new.size_mm is null and (new.ni_tay is not null or new.bead_diameter_mm is not null) then
    raise exception 'Size (mm) is the measurement source; reload the product form';
  end if;
  new.size_mm := nullif(btrim(new.size_mm),'');
  new.ni_tay := null;
  new.bead_diameter_mm := null;
  if new.category in ('vong','nhan') then
    expression := '^(?:ni\s*)?([0-9]+(?:[.,][0-9]+)?)(?:\s*mm)?(?:\s*[·;|].*)?$';
  elsif new.category='vong_chuoi' then
    expression := '^(?:hạt\s*)?([0-9]+(?:[.,][0-9]+)?)(?:\s*mm)?(?:\s*[·;|].*)?$';
  else return new;
  end if;
  matched := regexp_match(new.size_mm,expression,'i');
  if matched is not null then
    measured := replace(matched[1],',','.')::numeric;
    if measured<=0 or measured>=1000 then raise exception 'Size measurement must be positive and below 1000 mm'; end if;
    if new.category in ('vong','nhan') then new.ni_tay := measured;
    else new.bead_diameter_mm := measured;
    end if;
  end if;
  return new;
end $$;
create trigger products_size_mm before insert or update on public.products
for each row execute function private.sync_size_mm();
