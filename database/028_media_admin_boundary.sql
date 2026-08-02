-- ============================================================
-- CULTURA ESTA
-- Migracion 028
-- Limite estricto del administrador del medio
-- ============================================================

begin;

-- Las politicas restrictivas se combinan con las politicas heredadas. Un
-- media_admin solo puede leer registros operativos que ya sean publicos y no
-- puede escribir agenda, asistentes, reportes o financiacion.

drop policy if exists "Media admins only read published experiences" on public.experiences;
create policy "Media admins only read published experiences" on public.experiences
as restrictive for select to authenticated
using (public.current_profile_role() <> 'media_admin' or status = 'published');
drop policy if exists "Media admins cannot insert experiences" on public.experiences;
create policy "Media admins cannot insert experiences" on public.experiences as restrictive for insert to authenticated
with check (public.current_profile_role() <> 'media_admin');
drop policy if exists "Media admins cannot update experiences" on public.experiences;
create policy "Media admins cannot update experiences" on public.experiences as restrictive for update to authenticated
using (public.current_profile_role() <> 'media_admin') with check (public.current_profile_role() <> 'media_admin');
drop policy if exists "Media admins cannot delete experiences" on public.experiences;
create policy "Media admins cannot delete experiences" on public.experiences as restrictive for delete to authenticated
using (public.current_profile_role() <> 'media_admin');

drop policy if exists "Media admins cannot access registrations" on public.experience_registrations;
create policy "Media admins cannot access registrations" on public.experience_registrations
as restrictive for all to authenticated
using (public.current_profile_role() <> 'media_admin')
with check (public.current_profile_role() <> 'media_admin');

drop policy if exists "Media admins only read published reports" on public.experience_reports;
create policy "Media admins only read published reports" on public.experience_reports
as restrictive for select to authenticated
using (public.current_profile_role() <> 'media_admin' or status = 'published');
drop policy if exists "Media admins cannot insert reports" on public.experience_reports;
create policy "Media admins cannot insert reports" on public.experience_reports as restrictive for insert to authenticated
with check (public.current_profile_role() <> 'media_admin');
drop policy if exists "Media admins cannot update reports" on public.experience_reports;
create policy "Media admins cannot update reports" on public.experience_reports as restrictive for update to authenticated
using (public.current_profile_role() <> 'media_admin') with check (public.current_profile_role() <> 'media_admin');
drop policy if exists "Media admins cannot delete reports" on public.experience_reports;
create policy "Media admins cannot delete reports" on public.experience_reports as restrictive for delete to authenticated
using (public.current_profile_role() <> 'media_admin');

drop policy if exists "Media admins only read published funding" on public.funding_opportunities;
create policy "Media admins only read published funding" on public.funding_opportunities
as restrictive for select to authenticated
using (public.current_profile_role() <> 'media_admin' or status = 'published');
drop policy if exists "Media admins cannot insert funding" on public.funding_opportunities;
create policy "Media admins cannot insert funding" on public.funding_opportunities as restrictive for insert to authenticated
with check (public.current_profile_role() <> 'media_admin');
drop policy if exists "Media admins cannot update funding" on public.funding_opportunities;
create policy "Media admins cannot update funding" on public.funding_opportunities as restrictive for update to authenticated
using (public.current_profile_role() <> 'media_admin') with check (public.current_profile_role() <> 'media_admin');
drop policy if exists "Media admins cannot delete funding" on public.funding_opportunities;
create policy "Media admins cannot delete funding" on public.funding_opportunities as restrictive for delete to authenticated
using (public.current_profile_role() <> 'media_admin');

drop policy if exists "Media admins cannot access funding applications" on public.funding_applications;
create policy "Media admins cannot access funding applications" on public.funding_applications
as restrictive for all to authenticated
using (public.current_profile_role() <> 'media_admin')
with check (public.current_profile_role() <> 'media_admin');

-- Los SECURITY DEFINER historicos omiten RLS. Estos triggers impiden que una
-- RPC heredada use media_admin para modificar operacion no editorial.
create or replace function public.block_media_admin_operational_write()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if public.current_profile_role() = 'media_admin' then
    raise exception 'El administrador del medio solo puede modificar el modulo editorial';
  end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

drop trigger if exists experiences_media_boundary on public.experiences;
create trigger experiences_media_boundary before insert or update or delete on public.experiences
for each row execute function public.block_media_admin_operational_write();
drop trigger if exists registrations_media_boundary on public.experience_registrations;
create trigger registrations_media_boundary before insert or update or delete on public.experience_registrations
for each row execute function public.block_media_admin_operational_write();
drop trigger if exists reports_media_boundary on public.experience_reports;
create trigger reports_media_boundary before insert or update or delete on public.experience_reports
for each row execute function public.block_media_admin_operational_write();
drop trigger if exists funding_media_boundary on public.funding_opportunities;
create trigger funding_media_boundary before insert or update or delete on public.funding_opportunities
for each row execute function public.block_media_admin_operational_write();
drop trigger if exists funding_applications_media_boundary on public.funding_applications;
create trigger funding_applications_media_boundary before insert or update or delete on public.funding_applications
for each row execute function public.block_media_admin_operational_write();

commit;
