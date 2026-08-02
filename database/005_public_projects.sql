-- ============================================================
-- CULTURA ESTA
-- Migración 005
-- Consulta pública segura de proyectos publicados
-- ============================================================

begin;

-- ============================================================
-- 1. LISTADO PÚBLICO
-- ============================================================
--
-- Esta función expone únicamente información editorial segura.
-- No entrega:
--
-- - graph
-- - messages
-- - owner_id
-- - notas administrativas
-- - memoria ejecutiva
-- - información interna
--
-- ============================================================

create or replace function public.list_published_projects()
returns table (
  id uuid,
  title text,
  description text,
  category text,
  stage text,
  progress integer,
  published_at timestamptz,
  updated_at timestamptz
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
    projects.updated_at
  from public.projects
  where projects.workflow_status = 'published'
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

-- ============================================================
-- 2. FICHA PÚBLICA DE UN PROYECTO
-- ============================================================

create or replace function public.get_published_project(
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
  updated_at timestamptz
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
    projects.updated_at
  from public.projects
  where projects.id = target_project_id
    and projects.workflow_status = 'published'
  limit 1;
$$;

revoke all
on function public.get_published_project(uuid)
from public;

grant execute
on function public.get_published_project(uuid)
to anon, authenticated;

commit;