begin;

-- Projects belong to an operational actor. The account only authenticates the
-- person who is acting on behalf of that actor.
alter table public.projects
  add column if not exists actor_id uuid,
  add column if not exists actor_type text;

alter table public.projects drop constraint if exists projects_actor_type_check;
alter table public.projects add constraint projects_actor_type_check
  check (actor_type is null or actor_type in ('person', 'space', 'funder'));

update public.projects p
set actor_id = people.id, actor_type = 'person'
from public.people
where p.actor_id is null and people.profile_id = p.owner_id;

create index if not exists projects_actor_idx
  on public.projects(actor_type, actor_id, updated_at desc);

create or replace function public.account_manages_actor(
  requester_id uuid, requested_actor_type text, requested_actor_id uuid
) returns boolean
language sql stable security definer set search_path = ''
as $$
  select case requested_actor_type
    when 'person' then exists (
      select 1 from public.people p
      where p.id = requested_actor_id and p.profile_id = requester_id
    )
    when 'space' then exists (
      select 1 from public.space_memberships m
      where m.space_id = requested_actor_id and m.profile_id = requester_id
        and m.status = 'active'
    )
    when 'funder' then exists (
      select 1 from public.funder_memberships m
      where m.funder_id = requested_actor_id and m.profile_id = requester_id
        and m.status = 'active'
    )
    else false
  end;
$$;

create or replace function public.enforce_project_actor_ownership()
returns trigger language plpgsql security invoker set search_path = ''
as $$
begin
  if new.actor_id is null or new.actor_type is null then
    raise exception 'El proyecto necesita una identidad propietaria';
  end if;
  if not public.account_manages_actor(auth.uid(), new.actor_type, new.actor_id) then
    raise exception 'La cuenta no administra la identidad del proyecto';
  end if;
  if tg_op = 'UPDATE' and (new.actor_id, new.actor_type) is distinct from
      (old.actor_id, old.actor_type) then
    raise exception 'La identidad propietaria del proyecto no puede cambiar';
  end if;
  return new;
end;
$$;

drop trigger if exists projects_enforce_actor_ownership on public.projects;
create trigger projects_enforce_actor_ownership
before insert or update of actor_id, actor_type on public.projects
for each row execute function public.enforce_project_actor_ownership();

-- Reviewers never receive project rows: those rows contain graph and messages.
drop policy if exists "Ecosystem admins can review projects" on public.projects;
drop policy if exists "Media team can review submitted projects" on public.projects;
drop policy if exists "Ecosystem admins can update reviews" on public.projects;
drop policy if exists "Media admins can update reviews" on public.projects;
drop policy if exists "Super admins can manage projects" on public.projects;

create table if not exists public.project_applications (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null unique references public.projects(id) on delete cascade,
  applicant_profile_id uuid not null references public.profiles(id) on delete cascade,
  actor_type text not null check (actor_type in ('person', 'space', 'funder')),
  actor_id uuid not null,
  application_type text not null check (application_type in (
    'creative_project','experience','product','campaign','activation','call','editorial_story','other'
  )),
  requested_routes text[] not null default '{}',
  public_summary text not null,
  ecosystem_offer text not null,
  ecosystem_needs text not null,
  target_audience text not null,
  geographic_scope text not null default '',
  snapshot jsonb not null default '{}'::jsonb,
  product_details jsonb,
  experience_details jsonb,
  campaign_details jsonb,
  status text not null default 'draft' check (status in (
    'draft','submitted','under_review','changes_requested','accepted','rejected','withdrawn','archived'
  )),
  decision text check (decision is null or decision in (
    'connections','experience','ticket_distribution','brand_activation','funding',
    'editorial_referral','changes_required','not_eligible'
  )),
  reviewer_profile_id uuid references public.profiles(id) on delete set null,
  reviewer_note text,
  submitted_at timestamptz,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists project_applications_review_idx
  on public.project_applications(status, submitted_at desc);
alter table public.project_applications enable row level security;

create or replace function public.prepare_project_application()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare source_project public.projects%rowtype;
begin
  select * into source_project from public.projects where id = new.project_id;
  if not found or source_project.owner_id <> auth.uid() then
    raise exception 'No puedes aplicar con este proyecto';
  end if;
  if (new.actor_id, new.actor_type) is distinct from
      (source_project.actor_id, source_project.actor_type) then
    raise exception 'La aplicación debe usar la identidad propietaria del proyecto';
  end if;
  if tg_op = 'UPDATE' and old.status not in ('draft', 'changes_requested', 'rejected') then
    raise exception 'Esta aplicación ya no se puede editar';
  end if;
  new.applicant_profile_id := auth.uid();
  new.snapshot := jsonb_build_object(
    'projectTitle', source_project.title,
    'projectDescription', source_project.description,
    'projectCategory', source_project.category,
    'projectStage', source_project.stage,
    'projectProgress', source_project.progress,
    'identity', coalesce(source_project.graph #>> '{modules,identity,content}', ''),
    'purpose', coalesce(source_project.graph #>> '{modules,purpose,content}', ''),
    'problem', coalesce(source_project.graph #>> '{modules,problem,content}', ''),
    'context', coalesce(source_project.graph #>> '{modules,context,content}', ''),
    'community', coalesce(source_project.graph #>> '{modules,community,content}', ''),
    'generalObjective', coalesce(source_project.graph #>> '{modules,generalObjective,content}', ''),
    'specificObjectives', coalesce(source_project.graph #>> '{modules,specificObjectives,content}', ''),
    'activities', coalesce(source_project.graph #>> '{modules,activities,content}', ''),
    'timeline', coalesce(source_project.graph #>> '{modules,timeline,content}', ''),
    'allies', coalesce(source_project.graph #>> '{modules,allies,content}', ''),
    'sustainability', coalesce(source_project.graph #>> '{modules,sustainability,content}', ''),
    'impact', coalesce(source_project.graph #>> '{modules,impact,content}', ''),
    'kpis', coalesce(source_project.graph #>> '{modules,kpis,content}', '')
  );
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists project_applications_prepare on public.project_applications;
create trigger project_applications_prepare
before insert or update of project_id, actor_type, actor_id, application_type,
  requested_routes, public_summary, ecosystem_offer, ecosystem_needs,
  target_audience, geographic_scope, product_details, experience_details,
  campaign_details
on public.project_applications
for each row execute function public.prepare_project_application();

drop policy if exists "Owners manage project applications" on public.project_applications;
drop policy if exists "Owners view project applications" on public.project_applications;
drop policy if exists "Owners create project applications" on public.project_applications;
drop policy if exists "Owners edit project applications" on public.project_applications;
drop policy if exists "Owners delete project applications" on public.project_applications;
create policy "Owners view project applications" on public.project_applications
for select to authenticated using (applicant_profile_id = auth.uid());
create policy "Owners create project applications" on public.project_applications
for insert to authenticated with check (applicant_profile_id = auth.uid() and status = 'draft');
create policy "Owners edit project applications" on public.project_applications
for update to authenticated
using (applicant_profile_id = auth.uid() and status in ('draft','changes_requested','rejected'))
with check (applicant_profile_id = auth.uid() and status in ('draft','changes_requested','rejected'));
create policy "Owners delete project applications" on public.project_applications
for delete to authenticated
using (applicant_profile_id = auth.uid() and status in ('draft','changes_requested'));

create or replace function public.submit_project_application(target_application_id uuid)
returns void language plpgsql security definer set search_path = ''
as $$
declare target_project_id uuid;
begin
  update public.project_applications
  set status = 'submitted', decision = null, reviewer_note = null,
      submitted_at = now(), reviewed_at = null, updated_at = now()
  where id = target_application_id and applicant_profile_id = auth.uid()
    and status in ('draft', 'changes_requested', 'rejected')
  returning project_id into target_project_id;
  if target_project_id is null then raise exception 'La aplicación no se puede enviar'; end if;
  update public.projects set workflow_status = 'eligibility_requested', eligibility_requested_at = now()
  where id = target_project_id and owner_id = auth.uid()
    and workflow_status in ('private', 'eligibility_rejected');
end;
$$;

create or replace function public.list_project_applications_for_review()
returns table (
  application_id uuid, project_id uuid, applicant_profile_id uuid,
  applicant_name text, applicant_email text, actor_type text, actor_id uuid,
  actor_name text, application_type text, requested_routes text[], public_summary text,
  ecosystem_offer text, ecosystem_needs text, target_audience text, geographic_scope text,
  snapshot jsonb, product_details jsonb, experience_details jsonb, campaign_details jsonb,
  application_status text, application_decision text, reviewer_note text,
  submitted_at timestamptz, created_at timestamptz
) language plpgsql stable security definer set search_path = ''
as $$
begin
  if public.current_profile_role() not in ('ecosystem_admin', 'super_admin') then
    raise exception 'No tienes permisos para revisar aplicaciones';
  end if;
  return query
  select a.id, a.project_id, a.applicant_profile_id, coalesce(p.full_name, ''), coalesce(p.email, ''),
    a.actor_type, a.actor_id,
    coalesce(case a.actor_type when 'person' then pe.full_name when 'space' then s.name else f.name end, ''),
    a.application_type, a.requested_routes, a.public_summary, a.ecosystem_offer,
    a.ecosystem_needs, a.target_audience, a.geographic_scope, a.snapshot,
    a.product_details, a.experience_details, a.campaign_details, a.status, a.decision,
    a.reviewer_note, a.submitted_at, a.created_at
  from public.project_applications a
  join public.profiles p on p.id = a.applicant_profile_id
  left join public.people pe on a.actor_type = 'person' and pe.id = a.actor_id
  left join public.spaces s on a.actor_type = 'space' and s.id = a.actor_id
  left join public.funders f on a.actor_type = 'funder' and f.id = a.actor_id
  where a.status in ('submitted','under_review','changes_requested','accepted','rejected')
  order by a.submitted_at desc nulls last;
end;
$$;

create or replace function public.start_project_application_review(target_application_id uuid)
returns void language plpgsql security definer set search_path = ''
as $$
begin
  if public.current_profile_role() not in ('ecosystem_admin', 'super_admin') then raise exception 'Sin permisos'; end if;
  update public.project_applications set status = 'under_review', reviewer_profile_id = auth.uid(), updated_at = now()
  where id = target_application_id and status = 'submitted';
  if not found then raise exception 'La aplicación no está disponible para revisión'; end if;
end;
$$;

create or replace function public.review_project_application(
  target_application_id uuid, requested_status text, requested_decision text, requested_note text
) returns void language plpgsql security definer set search_path = ''
as $$
declare target_project_id uuid;
begin
  if public.current_profile_role() not in ('ecosystem_admin', 'super_admin') then raise exception 'Sin permisos'; end if;
  if requested_status not in ('accepted','changes_requested','rejected') then raise exception 'Estado inválido'; end if;
  if requested_status <> 'accepted' and nullif(trim(requested_note), '') is null then raise exception 'La nota es obligatoria'; end if;
  if requested_status = 'accepted' and requested_decision in ('changes_required','not_eligible') then raise exception 'Decisión inválida'; end if;
  if requested_status = 'changes_requested' and requested_decision <> 'changes_required' then raise exception 'Decisión inválida'; end if;
  if requested_status = 'rejected' and requested_decision <> 'not_eligible' then raise exception 'Decisión inválida'; end if;
  update public.project_applications set status = requested_status, decision = requested_decision,
    reviewer_profile_id = auth.uid(), reviewer_note = nullif(trim(requested_note), ''),
    reviewed_at = now(), updated_at = now()
  where id = target_application_id and status in ('submitted','under_review')
  returning project_id into target_project_id;
  if target_project_id is null then raise exception 'La aplicación no se puede revisar'; end if;
  update public.projects set
    workflow_status = case when requested_status = 'accepted' then 'eligible' else 'eligibility_rejected' end,
    eligibility_note = nullif(trim(requested_note), ''), eligibility_reviewed_at = now()
  where id = target_project_id;
end;
$$;

-- Editorial RPCs expose summaries only. graph and messages never cross this boundary.
create or replace function public.list_editorial_project_reviews()
returns table (
  project_id uuid, owner_id uuid, owner_name text, owner_email text, actor_id uuid,
  actor_type text, title text, description text, category text, stage text, progress integer,
  workflow_status text, eligibility_note text, editorial_note text,
  submitted_to_media_at timestamptz, editorial_reviewed_at timestamptz,
  published_at timestamptz, updated_at timestamptz, created_at timestamptz
) language plpgsql stable security definer set search_path = ''
as $$
begin
  if public.current_profile_role() not in ('journalist','media_admin','super_admin') then raise exception 'Sin permisos'; end if;
  return query select p.id, p.owner_id, coalesce(o.full_name,''), coalesce(o.email,''),
    p.actor_id, p.actor_type, p.title, p.description, p.category, p.stage, p.progress,
    p.workflow_status, p.eligibility_note, p.editorial_note, p.submitted_to_media_at,
    p.editorial_reviewed_at, p.published_at, p.updated_at, p.created_at
  from public.projects p join public.profiles o on o.id = p.owner_id
  where p.workflow_status in ('submitted_to_media','editorial_review','publication_rejected','published')
  order by p.submitted_to_media_at desc nulls last;
end;
$$;

create or replace function public.start_editorial_project_review(target_project_id uuid)
returns void language plpgsql security definer set search_path = ''
as $$
begin
  if public.current_profile_role() not in ('journalist','media_admin','super_admin') then raise exception 'Sin permisos'; end if;
  update public.projects set workflow_status = 'editorial_review'
  where id = target_project_id and workflow_status = 'submitted_to_media';
  if not found then raise exception 'El proyecto no está disponible para revisión'; end if;
end;
$$;

create or replace function public.get_editorial_project_summary(target_project_id uuid)
returns table (id uuid, title text, description text, workflow_status text)
language plpgsql stable security definer set search_path = ''
as $$
begin
  if public.current_profile_role() not in ('journalist','media_admin','super_admin') then raise exception 'Sin permisos'; end if;
  return query select p.id, p.title, p.description, p.workflow_status
  from public.projects p
  where p.id = target_project_id
    and p.workflow_status in ('submitted_to_media','editorial_review','publication_rejected','published');
end;
$$;

create or replace function public.review_editorial_project(
  target_project_id uuid, publish_project boolean, review_note text
) returns void language plpgsql security definer set search_path = ''
as $$
begin
  if public.current_profile_role() not in ('media_admin','super_admin') then raise exception 'Sin permisos'; end if;
  if not publish_project and nullif(trim(review_note), '') is null then raise exception 'La nota es obligatoria'; end if;
  update public.projects set
    workflow_status = case when publish_project then 'published' else 'publication_rejected' end,
    editorial_note = nullif(trim(review_note), ''), editorial_reviewed_at = now(),
    published_at = case when publish_project then now() else published_at end
  where id = target_project_id and workflow_status in ('submitted_to_media','editorial_review');
  if not found then raise exception 'El proyecto no se puede revisar'; end if;
end;
$$;

grant select, insert, update, delete on public.project_applications to authenticated;
revoke all on function public.account_manages_actor(uuid,text,uuid) from public;
revoke all on function public.submit_project_application(uuid) from public;
revoke all on function public.list_project_applications_for_review() from public;
revoke all on function public.start_project_application_review(uuid) from public;
revoke all on function public.review_project_application(uuid,text,text,text) from public;
revoke all on function public.list_editorial_project_reviews() from public;
revoke all on function public.start_editorial_project_review(uuid) from public;
revoke all on function public.get_editorial_project_summary(uuid) from public;
revoke all on function public.review_editorial_project(uuid,boolean,text) from public;
grant execute on function public.account_manages_actor(uuid,text,uuid) to authenticated;
grant execute on function public.submit_project_application(uuid) to authenticated;
grant execute on function public.list_project_applications_for_review() to authenticated;
grant execute on function public.start_project_application_review(uuid) to authenticated;
grant execute on function public.review_project_application(uuid,text,text,text) to authenticated;
grant execute on function public.list_editorial_project_reviews() to authenticated;
grant execute on function public.start_editorial_project_review(uuid) to authenticated;
grant execute on function public.get_editorial_project_summary(uuid) to authenticated;
grant execute on function public.review_editorial_project(uuid,boolean,text) to authenticated;

commit;
