create or replace function public.prevent_duplicate_affiliate_lead()
returns trigger language plpgsql security definer set search_path = public as $$
declare _digits text := nullif(regexp_replace(coalesce(new.phone,''), '\D', '', 'g'), '');
begin
  if right(_digits, 10) is not null and length(_digits) < 10 then _digits := null; end if;
  if exists (
    select 1 from public.affiliate_leads l
    where (new.email is not null and trim(new.email) <> '' and lower(trim(l.email)) = lower(trim(new.email)))
       or (_digits is not null and right(regexp_replace(coalesce(l.phone,''), '\D', '', 'g'), 10) = right(_digits, 10))
  ) then
    raise exception 'This person has already been submitted as a lead.' using errcode = '23505';
  end if;
  return new;
end $$;

drop trigger if exists prevent_duplicate_affiliate_lead on public.affiliate_leads;
create trigger prevent_duplicate_affiliate_lead before insert on public.affiliate_leads
for each row execute function public.prevent_duplicate_affiliate_lead();