-- ============================================================
-- CULTURA ESTA
-- Migracion 029
-- Reemplazo seguro de RPC operativas heredadas
-- ============================================================

begin;

create or replace function public.list_manageable_experiences_secure()
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare result jsonb;
begin
  if public.current_profile_role() = 'media_admin' then raise exception 'Sin permisos operativos'; end if;
  select coalesce(jsonb_agg(to_jsonb(row_data)), '[]'::jsonb) into result
  from public.list_manageable_experiences() row_data;
  return result;
end;
$$;

create or replace function public.list_experience_attendees_secure(target_experience_id uuid)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare owner_id uuid; result jsonb;
begin
  select e.owner_id into owner_id from public.experiences e where e.id = target_experience_id;
  if owner_id is null then raise exception 'La actividad no existe'; end if;
  if owner_id <> auth.uid() and public.current_profile_role() not in ('ecosystem_admin','super_admin') then raise exception 'Sin permisos'; end if;
  select coalesce(jsonb_agg(to_jsonb(row_data)), '[]'::jsonb) into result
  from public.list_experience_attendees(target_experience_id) row_data;
  return result;
end;
$$;

create or replace function public.get_experience_report_workspace_secure(target_experience_id uuid)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare owner_id uuid; result jsonb;
begin
  select e.owner_id into owner_id from public.experiences e where e.id = target_experience_id;
  if owner_id is null then raise exception 'La actividad no existe'; end if;
  if owner_id <> auth.uid() and public.current_profile_role() not in ('ecosystem_admin','super_admin') then raise exception 'Sin permisos'; end if;
  select coalesce(jsonb_agg(to_jsonb(row_data)), '[]'::jsonb) into result
  from public.get_experience_report_workspace(target_experience_id) row_data;
  return result;
end;
$$;

create or replace function public.list_manageable_funding_opportunities_secure()
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare result jsonb;
begin
  if public.current_profile_role() = 'media_admin' then raise exception 'Sin permisos operativos'; end if;
  select coalesce(jsonb_agg(to_jsonb(row_data)), '[]'::jsonb) into result
  from public.list_manageable_funding_opportunities() row_data;
  return result;
end;
$$;

create or replace function public.list_funding_opportunity_applications_secure(target_opportunity_id uuid)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare owner_id uuid; result jsonb;
begin
  select f.owner_id into owner_id from public.funding_opportunities f where f.id = target_opportunity_id;
  if owner_id is null then raise exception 'La oportunidad no existe'; end if;
  if owner_id <> auth.uid() and public.current_profile_role() not in ('ecosystem_admin','finance_admin','super_admin') then raise exception 'Sin permisos'; end if;
  select coalesce(jsonb_agg(to_jsonb(row_data)), '[]'::jsonb) into result
  from public.list_funding_opportunity_applications(target_opportunity_id) row_data;
  return result;
end;
$$;

revoke execute on function public.list_manageable_experiences() from authenticated;
revoke execute on function public.list_experience_attendees(uuid) from authenticated;
revoke execute on function public.get_experience_report_workspace(uuid) from authenticated;
revoke execute on function public.list_manageable_funding_opportunities() from authenticated;
revoke execute on function public.list_funding_opportunity_applications(uuid) from authenticated;

grant execute on function public.list_manageable_experiences_secure() to authenticated;
grant execute on function public.list_experience_attendees_secure(uuid) to authenticated;
grant execute on function public.get_experience_report_workspace_secure(uuid) to authenticated;
grant execute on function public.list_manageable_funding_opportunities_secure() to authenticated;
grant execute on function public.list_funding_opportunity_applications_secure(uuid) to authenticated;

commit;
