-- ============================================================
-- CULTURA ESTA
-- Migracion 026
-- Seguridad, auditoria e inteligencia agregada para superadmin
-- ============================================================

begin;

alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check check (role in (
  'member','journalist','media_admin','ecosystem_admin','finance_admin','super_admin'
));

create table if not exists public.admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_profile_id uuid references public.profiles(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id text,
  previous_value jsonb,
  new_value jsonb,
  reason text,
  request_metadata jsonb not null default '{}'::jsonb,
  result text not null default 'success' check (result in ('success','denied','failed')),
  created_at timestamptz not null default now()
);
create index if not exists admin_audit_log_created_idx
  on public.admin_audit_log(created_at desc);
create index if not exists admin_audit_log_entity_idx
  on public.admin_audit_log(entity_type, entity_id, created_at desc);
alter table public.admin_audit_log enable row level security;

drop policy if exists "Super admins read audit log" on public.admin_audit_log;
create policy "Super admins read audit log" on public.admin_audit_log
for select to authenticated
using (public.current_profile_role() = 'super_admin');

create or replace function public.prevent_audit_mutation()
returns trigger language plpgsql set search_path = '' as $$
begin
  raise exception 'La auditoria es inmutable';
end;
$$;
drop trigger if exists admin_audit_log_immutable on public.admin_audit_log;
create trigger admin_audit_log_immutable
before update or delete on public.admin_audit_log
for each row execute function public.prevent_audit_mutation();

create or replace function public.protect_profile_security_fields()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if (new.role, new.is_active) is distinct from (old.role, old.is_active)
    and public.current_profile_role() <> 'super_admin' then
    raise exception 'Solo un superadministrador puede cambiar roles o activar cuentas';
  end if;
  return new;
end;
$$;
drop trigger if exists profiles_protect_security_fields on public.profiles;
create trigger profiles_protect_security_fields
before update of role, is_active on public.profiles
for each row execute function public.protect_profile_security_fields();

create or replace function public.audit_profile_security_change()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if (new.role, new.is_active) is distinct from (old.role, old.is_active) then
    insert into public.admin_audit_log (
      actor_profile_id, action, entity_type, entity_id, previous_value, new_value, reason
    ) values (
      auth.uid(), 'profile_security_change', 'profile', new.id::text,
      jsonb_build_object('role', old.role, 'isActive', old.is_active),
      jsonb_build_object('role', new.role, 'isActive', new.is_active),
      nullif(current_setting('app.audit_reason', true), '')
    );
  end if;
  return new;
end;
$$;
drop trigger if exists profiles_audit_security_change on public.profiles;
create trigger profiles_audit_security_change
after update of role, is_active on public.profiles
for each row execute function public.audit_profile_security_change();

create or replace function public.audit_existing_admin_decision()
returns trigger language plpgsql security definer set search_path = '' as $$
declare role_name text; old_status text; new_status text;
begin
  role_name := public.current_profile_role();
  if role_name not in ('ecosystem_admin','media_admin','finance_admin','super_admin') then return new; end if;
  old_status := coalesce(to_jsonb(old)->>'status', to_jsonb(old)->>'workflow_status');
  new_status := coalesce(to_jsonb(new)->>'status', to_jsonb(new)->>'workflow_status');
  if new_status is distinct from old_status then
    insert into public.admin_audit_log (
      actor_profile_id, action, entity_type, entity_id, previous_value, new_value
    ) values (
      auth.uid(), 'status_change', tg_table_name, to_jsonb(new)->>'id',
      jsonb_build_object('status', old_status), jsonb_build_object('status', new_status)
    );
  end if;
  return new;
end;
$$;
drop trigger if exists project_applications_admin_audit on public.project_applications;
create trigger project_applications_admin_audit after update on public.project_applications
for each row execute function public.audit_existing_admin_decision();
drop trigger if exists experiences_admin_audit on public.experiences;
create trigger experiences_admin_audit after update on public.experiences
for each row execute function public.audit_existing_admin_decision();
drop trigger if exists editorial_posts_admin_audit on public.editorial_posts;
create trigger editorial_posts_admin_audit after update on public.editorial_posts
for each row execute function public.audit_existing_admin_decision();

create or replace function public.record_admin_audit(
  requested_action text,
  requested_entity_type text,
  requested_entity_id text,
  requested_previous_value jsonb default null,
  requested_new_value jsonb default null,
  requested_reason text default null,
  requested_metadata jsonb default '{}'::jsonb,
  requested_result text default 'success'
) returns uuid
language plpgsql security definer set search_path = '' as $$
declare audit_id uuid;
begin
  if public.current_profile_role() not in (
    'ecosystem_admin','media_admin','finance_admin','super_admin'
  ) then raise exception 'Sin permisos para registrar acciones administrativas'; end if;
  insert into public.admin_audit_log (
    actor_profile_id, action, entity_type, entity_id, previous_value,
    new_value, reason, request_metadata, result
  ) values (
    auth.uid(), trim(requested_action), trim(requested_entity_type),
    requested_entity_id, requested_previous_value, requested_new_value,
    nullif(trim(requested_reason), ''), coalesce(requested_metadata, '{}'::jsonb),
    requested_result
  ) returning id into audit_id;
  return audit_id;
end;
$$;

create or replace function public.manage_profile_access(
  target_profile_id uuid, requested_role text, requested_is_active boolean,
  requested_reason text
) returns void language plpgsql security definer set search_path = '' as $$
begin
  if public.current_profile_role() <> 'super_admin' then raise exception 'Sin permisos'; end if;
  if requested_role not in ('member','journalist','media_admin','ecosystem_admin','finance_admin','super_admin') then
    raise exception 'Rol invalido';
  end if;
  if nullif(trim(requested_reason),'') is null then raise exception 'El motivo es obligatorio'; end if;
  perform set_config('app.audit_reason', trim(requested_reason), true);
  update public.profiles set role = requested_role, is_active = requested_is_active
  where id = target_profile_id;
  if not found then raise exception 'Perfil no encontrado'; end if;
end;
$$;

create or replace function public.list_admin_profiles()
returns table (
  profile_id uuid, email text, full_name text, role text, is_active boolean,
  created_at timestamptz, updated_at timestamptz
) language plpgsql stable security definer set search_path = '' as $$
begin
  if public.current_profile_role() <> 'super_admin' then raise exception 'Sin permisos'; end if;
  return query select p.id, p.email, p.full_name, p.role, p.is_active,
    p.created_at, p.updated_at from public.profiles p order by p.created_at desc;
end;
$$;

create table if not exists public.ecosystem_signals (
  id uuid primary key default gen_random_uuid(),
  source_project_id uuid not null references public.projects(id) on delete cascade,
  source_actor_type text not null check (source_actor_type in ('person','space','funder')),
  source_actor_id uuid not null,
  source_module text not null,
  signal_type text not null check (signal_type in (
    'problem','question','doubt','need','opportunity','resource_gap','skill_gap',
    'space_need','funding_need','production_need','distribution_need',
    'community_interest','recurring_topic','emerging_trend','learning','collaboration_offer'
  )),
  category text not null,
  topic text not null,
  normalized_topic text not null,
  summary text not null check (char_length(summary) between 10 and 500),
  city text,
  territory text,
  sector text,
  audience text,
  project_stage text,
  urgency smallint not null default 1 check (urgency between 1 and 5),
  confidence numeric(4,3) not null default 0.5 check (confidence between 0 and 1),
  is_anonymized boolean not null default true,
  consent_scope text not null check (consent_scope in ('aggregate','identified')),
  consented_by uuid not null references public.profiles(id) on delete cascade,
  consented_at timestamptz not null default now(),
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(source_project_id, source_module, signal_type, normalized_topic)
);
create index if not exists ecosystem_signals_aggregate_idx
  on public.ecosystem_signals(signal_type, normalized_topic, created_at desc)
  where revoked_at is null;
alter table public.ecosystem_signals enable row level security;

drop policy if exists "Owners manage consented signals" on public.ecosystem_signals;
create policy "Owners manage consented signals" on public.ecosystem_signals
for select to authenticated using (consented_by = auth.uid());

create or replace function public.share_ecosystem_signal(
  target_project_id uuid, requested_source_module text, requested_signal_type text,
  requested_category text, requested_topic text, requested_summary text,
  requested_city text default null, requested_territory text default null,
  requested_sector text default null, requested_audience text default null,
  requested_urgency integer default 1, requested_confidence numeric default 0.5,
  requested_consent_scope text default 'aggregate'
) returns uuid
language plpgsql security definer set search_path = '' as $$
declare source_project public.projects%rowtype; signal_id uuid; normalized text;
begin
  select * into source_project from public.projects
  where id = target_project_id and owner_id = auth.uid();
  if not found then raise exception 'No puedes compartir senales de este proyecto'; end if;
  if requested_consent_scope not in ('aggregate','identified') then
    raise exception 'Alcance de consentimiento invalido';
  end if;
  normalized := lower(regexp_replace(trim(requested_topic), '[^[:alnum:] ]', '', 'g'));
  if normalized = '' then raise exception 'El tema es obligatorio'; end if;
  insert into public.ecosystem_signals (
    source_project_id, source_actor_type, source_actor_id, source_module,
    signal_type, category, topic, normalized_topic, summary, city, territory,
    sector, audience, project_stage, urgency, confidence, is_anonymized,
    consent_scope, consented_by
  ) values (
    source_project.id, source_project.actor_type, source_project.actor_id,
    trim(requested_source_module), requested_signal_type, trim(requested_category),
    trim(requested_topic), normalized, trim(requested_summary),
    nullif(trim(requested_city),''), nullif(trim(requested_territory),''),
    nullif(trim(requested_sector),''), nullif(trim(requested_audience),''),
    source_project.stage, requested_urgency, requested_confidence,
    requested_consent_scope = 'aggregate', requested_consent_scope, auth.uid()
  ) on conflict (source_project_id, source_module, signal_type, normalized_topic)
  do update set category = excluded.category, topic = excluded.topic,
    summary = excluded.summary, city = excluded.city, territory = excluded.territory,
    sector = excluded.sector, audience = excluded.audience,
    project_stage = excluded.project_stage, urgency = excluded.urgency,
    confidence = excluded.confidence, is_anonymized = excluded.is_anonymized,
    consent_scope = excluded.consent_scope, consented_at = now(), revoked_at = null,
    updated_at = now()
  returning id into signal_id;
  return signal_id;
end;
$$;

create or replace function public.revoke_ecosystem_signal(target_signal_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  update public.ecosystem_signals set revoked_at = now(), updated_at = now()
  where id = target_signal_id and consented_by = auth.uid() and revoked_at is null;
  if not found then raise exception 'La senal no existe o no te pertenece'; end if;
end;
$$;

create or replace function public.get_ecosystem_signal_trends(
  requested_from timestamptz default now() - interval '90 days',
  requested_to timestamptz default now(), requested_min_group integer default 3
) returns table (
  signal_type text, category text, normalized_topic text, signal_count bigint,
  project_count bigint, latest_at timestamptz
) language plpgsql stable security definer set search_path = '' as $$
declare safe_min integer;
begin
  if public.current_profile_role() not in ('ecosystem_admin','super_admin') then
    raise exception 'Sin permisos para consultar inteligencia';
  end if;
  safe_min := greatest(coalesce(requested_min_group, 3), 3);
  return query
  select s.signal_type, s.category, s.normalized_topic, count(*)::bigint,
    count(distinct s.source_project_id)::bigint, max(s.created_at)
  from public.ecosystem_signals s
  where s.revoked_at is null and s.is_anonymized = true
    and s.created_at >= requested_from and s.created_at < requested_to
  group by s.signal_type, s.category, s.normalized_topic
  having count(distinct s.consented_by) >= safe_min
  order by count(*) desc, max(s.created_at) desc;
end;
$$;

create or replace function public.get_superadmin_overview()
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare result jsonb;
begin
  if public.current_profile_role() <> 'super_admin' then raise exception 'Sin permisos'; end if;
  select jsonb_build_object(
    'activeProfiles', (select count(*) from public.profiles where is_active),
    'pendingApplications', (select count(*) from public.project_applications where status in ('submitted','under_review')),
    'activeProjects', (select count(*) from public.projects where workflow_status not in ('archived','publication_rejected')),
    'upcomingExperiences', (select count(*) from public.experiences where starts_at >= now()),
    'pendingEditorial', (select count(*) from public.editorial_posts where status in ('draft','in_review')),
    'newSignals', (select count(*) from public.ecosystem_signals where revoked_at is null and created_at >= now() - interval '7 days'),
    'generatedAt', now()
  ) into result;
  return result;
end;
$$;

revoke all on public.admin_audit_log from public;
revoke all on public.ecosystem_signals from public;
grant select on public.admin_audit_log to authenticated;
grant select on public.ecosystem_signals to authenticated;
revoke all on function public.record_admin_audit(text,text,text,jsonb,jsonb,text,jsonb,text) from public;
revoke all on function public.manage_profile_access(uuid,text,boolean,text) from public;
revoke all on function public.list_admin_profiles() from public;
revoke all on function public.share_ecosystem_signal(uuid,text,text,text,text,text,text,text,text,text,integer,numeric,text) from public;
revoke all on function public.revoke_ecosystem_signal(uuid) from public;
revoke all on function public.get_ecosystem_signal_trends(timestamptz,timestamptz,integer) from public;
revoke all on function public.get_superadmin_overview() from public;
grant execute on function public.record_admin_audit(text,text,text,jsonb,jsonb,text,jsonb,text) to authenticated;
grant execute on function public.manage_profile_access(uuid,text,boolean,text) to authenticated;
grant execute on function public.list_admin_profiles() to authenticated;
grant execute on function public.share_ecosystem_signal(uuid,text,text,text,text,text,text,text,text,text,integer,numeric,text) to authenticated;
grant execute on function public.revoke_ecosystem_signal(uuid) to authenticated;
grant execute on function public.get_ecosystem_signal_trends(timestamptz,timestamptz,integer) to authenticated;
grant execute on function public.get_superadmin_overview() to authenticated;

commit;
