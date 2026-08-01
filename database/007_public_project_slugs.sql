-- ============================================================
-- CULTURA ESTÁ
-- Migración 007
-- Proyectos públicos por slug editorial
-- ============================================================

begin;

create or replace function public.get_published_project_by_reference(
  target_reference text
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

  where projects.workflow_status = 'published'
    and editorial.status = 'published'
    and (
      editorial.slug = target_reference
      or projects.id::text = target_reference
    )

  limit 1;
$$;

revoke all
on function public.get_published_project_by_reference(text)
from public;

grant execute
on function public.get_published_project_by_reference(text)
to anon, authenticated;

commit;