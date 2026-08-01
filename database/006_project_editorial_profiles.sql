-- ============================================================
-- CULTURA ESTÁ
-- Migración 006 corregida
-- Ficha editorial de proyectos
-- ============================================================

begin;

-- ============================================================
-- 1. FICHA EDITORIAL
-- ============================================================

create table if not exists public.project_editorial_profiles (
  id uuid primary key default gen_random_uuid(),

  project_id uuid not null unique
    references public.projects(id)
    on delete cascade,

  slug text not null unique,

  headline text not null default '',

  summary text not null default '',

  body text not null default '',

  cover_image_url text,

  city text,

  disciplines text[] not null default '{}',

  credits text not null default '',

  status text not null default 'draft'
    check (
      status in (
        'draft',
        'ready',
        'published',
        'archived'
      )
    ),

  created_by uuid
    references public.profiles(id)
    on delete set null,

  updated_by uuid
    references public.profiles(id)
    on delete set null,

  created_at timestamptz not null default now(),

  updated_at timestamptz not null default now()
);

create index if not exists project_editorial_profiles_project_idx
on public.project_editorial_profiles(project_id);

create index if not exists project_editorial_profiles_slug_idx
on public.project_editorial_profiles(slug);

create index if not exists project_editorial_profiles_status_idx
on public.project_editorial_profiles(status);

create index if not exists project_editorial_profiles_disciplines_idx
on public.project_editorial_profiles
using gin(disciplines);

-- ============================================================
-- 2. UPDATED AT
-- ============================================================

drop trigger if exists project_editorial_profiles_set_updated_at
on public.project_editorial_profiles;

create trigger project_editorial_profiles_set_updated_at
before update
on public.project_editorial_profiles
for each row
execute function public.set_updated_at();

-- ============================================================
-- 3. CREAR FICHA CUANDO EL PROYECTO LLEGA AL MEDIO
-- ============================================================

create or replace function public.ensure_project_editorial_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.workflow_status in (
    'submitted_to_media',
    'editorial_review',
    'published'
  ) then
    insert into public.project_editorial_profiles (
      project_id,
      slug,
      headline,
      summary,
      body,
      status
    )
    values (
      new.id,
      public.make_unique_slug(new.title),
      new.title,
      new.description,
      '',
      case
        when new.workflow_status = 'published'
          then 'published'
        else 'draft'
      end
    )
    on conflict (project_id)
    do nothing;
  end if;

  return new;
end;
$$;

drop trigger if exists projects_create_editorial_profile
on public.projects;

create trigger projects_create_editorial_profile
after insert or update of workflow_status
on public.projects
for each row
execute function public.ensure_project_editorial_profile();

-- ============================================================
-- 4. BACKFILL DE PROYECTOS EXISTENTES
-- ============================================================

insert into public.project_editorial_profiles (
  project_id,
  slug,
  headline,
  summary,
  body,
  status
)
select
  projects.id,
  public.make_unique_slug(projects.title),
  projects.title,
  projects.description,
  '',
  case
    when projects.workflow_status = 'published'
      then 'published'
    else 'draft'
  end
from public.projects
where projects.workflow_status in (
  'submitted_to_media',
  'editorial_review',
  'published'
)
on conflict (project_id)
do nothing;

-- ============================================================
-- 5. CONTROL DE ESTADO EDITORIAL
-- ============================================================

create or replace function public.enforce_editorial_profile_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  requester_role text;
begin
  requester_role :=
    coalesce(
      public.current_profile_role(),
      'anonymous'
    );

  if tg_op = 'INSERT' then

    -- Las fichas creadas automáticamente por un trigger
    -- o durante una migración no llevan created_by.
    if new.created_by is null then
      return new;
    end if;

    if requester_role not in (
      'journalist',
      'media_admin',
      'super_admin'
    ) then
      raise exception
        'No tienes permiso para crear una ficha editorial';
    end if;

    new.updated_by :=
      coalesce(
        new.updated_by,
        auth.uid()
      );

    if new.status = 'published'
      and requester_role not in (
        'media_admin',
        'super_admin'
      )
    then
      raise exception
        'Solo un administrador del medio puede publicar';
    end if;

    return new;
  end if;

  if new.status is distinct from old.status
    and new.status = 'published'
    and requester_role not in (
      'media_admin',
      'super_admin'
    )
  then
    raise exception
      'Solo un administrador del medio puede publicar';
  end if;

  if auth.uid() is not null then
    new.updated_by :=
      auth.uid();
  end if;

  return new;
end;
$$;

drop trigger if exists project_editorial_profiles_enforce_status
on public.project_editorial_profiles;

create trigger project_editorial_profiles_enforce_status
before insert or update
on public.project_editorial_profiles
for each row
execute function public.enforce_editorial_profile_status();

-- ============================================================
-- 6. VALIDAR LA FICHA ANTES DE PUBLICAR EL PROYECTO
-- ============================================================

create or replace function public.require_editorial_profile_before_publish()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  editorial_status text;
begin
  if new.workflow_status = 'published'
    and old.workflow_status <> 'published'
  then
    select status
    into editorial_status
    from public.project_editorial_profiles
    where project_id = new.id;

    if editorial_status is null then
      raise exception
        'El proyecto no tiene una ficha editorial';
    end if;

    if editorial_status not in (
      'ready',
      'published'
    ) then
      raise exception
        'La ficha editorial debe estar marcada como lista antes de publicar';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists projects_require_editorial_profile
on public.projects;

create trigger projects_require_editorial_profile
before update of workflow_status
on public.projects
for each row
execute function public.require_editorial_profile_before_publish();

-- ============================================================
-- 7. PUBLICAR LA FICHA DESPUÉS DE PUBLICAR EL PROYECTO
-- ============================================================

create or replace function public.publish_editorial_profile_after_project()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.workflow_status = 'published'
    and old.workflow_status <> 'published'
  then
    update public.project_editorial_profiles
    set
      status = 'published',
      updated_by = auth.uid()
    where project_id = new.id;
  end if;

  return new;
end;
$$;

drop trigger if exists projects_publish_editorial_profile
on public.projects;

create trigger projects_publish_editorial_profile
after update of workflow_status
on public.projects
for each row
execute function public.publish_editorial_profile_after_project();

-- ============================================================
-- 8. ROW LEVEL SECURITY
-- ============================================================

alter table public.project_editorial_profiles
enable row level security;

drop policy if exists "Public can view published editorial profiles"
on public.project_editorial_profiles;

drop policy if exists "Media team can view editorial profiles"
on public.project_editorial_profiles;

drop policy if exists "Media team can create editorial profiles"
on public.project_editorial_profiles;

drop policy if exists "Media team can update editorial profiles"
on public.project_editorial_profiles;

create policy "Public can view published editorial profiles"
on public.project_editorial_profiles
for select
to anon, authenticated
using (
  status = 'published'
  and exists (
    select 1
    from public.projects
    where projects.id =
      project_editorial_profiles.project_id
      and projects.workflow_status = 'published'
  )
);

create policy "Media team can view editorial profiles"
on public.project_editorial_profiles
for select
to authenticated
using (
  public.current_profile_role() in (
    'journalist',
    'media_admin',
    'super_admin'
  )
);

create policy "Media team can create editorial profiles"
on public.project_editorial_profiles
for insert
to authenticated
with check (
  public.current_profile_role() in (
    'journalist',
    'media_admin',
    'super_admin'
  )
);

create policy "Media team can update editorial profiles"
on public.project_editorial_profiles
for update
to authenticated
using (
  public.current_profile_role() in (
    'journalist',
    'media_admin',
    'super_admin'
  )
)
with check (
  public.current_profile_role() in (
    'journalist',
    'media_admin',
    'super_admin'
  )
);

grant select
on public.project_editorial_profiles
to anon, authenticated;

grant insert, update
on public.project_editorial_profiles
to authenticated;

-- ============================================================
-- 9. FUNCIONES PÚBLICAS CON INFORMACIÓN EDITORIAL
-- ============================================================

drop function if exists public.list_published_projects();

create function public.list_published_projects()
returns table (
  id uuid,
  title text,
  description text,
  category text,
  stage text,
  progress integer,
  published_at timestamptz,
  updated_at timestamptz,
  slug text,
  headline text,
  summary text,
  cover_image_url text,
  city text,
  disciplines text[]
)
language sql
stable
security definer
set search_path = public
as $$
  select
    projects.id,
    projects.title,
    projects.description,
    projects.category,
    projects.stage,
    projects.progress,
    projects.published_at,
    projects.updated_at,
    editorial.slug,
    editorial.headline,
    editorial.summary,
    editorial.cover_image_url,
    editorial.city,
    editorial.disciplines
  from public.projects
  inner join public.project_editorial_profiles as editorial
    on editorial.project_id = projects.id
  where projects.workflow_status = 'published'
    and editorial.status = 'published'
  order by
    coalesce(
      projects.published_at,
      projects.updated_at
    ) desc;
$$;

revoke all
on function public.list_published_projects()
from public;

grant execute
on function public.list_published_projects()
to anon, authenticated;

drop function if exists public.get_published_project(uuid);

create function public.get_published_project(
  target_project_id uuid
)
returns table (
  id uuid,
  title text,
  description text,
  category text,
  stage text,
  progress integer,
  published_at timestamptz,
  updated_at timestamptz,
  slug text,
  headline text,
  summary text,
  body text,
  cover_image_url text,
  city text,
  disciplines text[],
  credits text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    projects.id,
    projects.title,
    projects.description,
    projects.category,
    projects.stage,
    projects.progress,
    projects.published_at,
    projects.updated_at,
    editorial.slug,
    editorial.headline,
    editorial.summary,
    editorial.body,
    editorial.cover_image_url,
    editorial.city,
    editorial.disciplines,
    editorial.credits
  from public.projects
  inner join public.project_editorial_profiles as editorial
    on editorial.project_id = projects.id
  where projects.id = target_project_id
    and projects.workflow_status = 'published'
    and editorial.status = 'published'
  limit 1;
$$;

revoke all
on function public.get_published_project(uuid)
from public;

grant execute
on function public.get_published_project(uuid)
to anon, authenticated;

commit;