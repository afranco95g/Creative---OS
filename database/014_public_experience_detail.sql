-- ============================================================
-- CULTURA ESTÁ
-- Migración 014
-- Ficha pública individual de experiencias
-- ============================================================

begin;

create or replace function public.get_published_experience_by_reference(
  target_reference text
)
returns table (
  id uuid,
  title text,
  slug text,
  summary text,
  description text,
  experience_type text,
  city text,
  venue_name text,
  address text,
  starts_at timestamptz,
  ends_at timestamptz,
  capacity integer,
  ticket_url text,
  cover_image_url text,

  project_id uuid,
  project_slug text,
  project_headline text,
  project_summary text,

  host_space_id uuid,
  host_space_slug text,
  host_space_name text,
  host_space_description text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    experiences.id,
    experiences.title,
    experiences.slug,
    experiences.summary,
    experiences.description,
    experiences.experience_type,
    experiences.city,
    experiences.venue_name,
    experiences.address,
    experiences.starts_at,
    experiences.ends_at,
    experiences.capacity,
    experiences.ticket_url,
    experiences.cover_image_url,

    case
      when project_editorial.project_id is not null
        then projects.id
      else null
    end as project_id,

    case
      when project_editorial.project_id is not null
        then project_editorial.slug
      else null
    end as project_slug,

    case
      when project_editorial.project_id is not null
        then coalesce(
          nullif(project_editorial.headline, ''),
          projects.title
        )
      else null
    end as project_headline,

    case
      when project_editorial.project_id is not null
        then coalesce(
          nullif(project_editorial.summary, ''),
          projects.description
        )
      else null
    end as project_summary,

    case
      when spaces.status = 'published'
        then spaces.id
      else null
    end as host_space_id,

    case
      when spaces.status = 'published'
        then spaces.slug
      else null
    end as host_space_slug,

    case
      when spaces.status = 'published'
        then spaces.name
      else null
    end as host_space_name,

    case
      when spaces.status = 'published'
        then spaces.description
      else null
    end as host_space_description

  from public.experiences

  left join public.projects
    on projects.id =
      experiences.project_id

    and projects.workflow_status =
      'published'

  left join public.project_editorial_profiles
    as project_editorial

    on project_editorial.project_id =
      projects.id

    and project_editorial.status =
      'published'

  left join public.spaces
    on spaces.id =
      experiences.host_space_id

  where experiences.status =
    'published'

    and (
      experiences.slug =
        target_reference

      or experiences.id::text =
        target_reference
    )

  limit 1;
$$;

revoke all
on function public.get_published_experience_by_reference(text)
from public;

grant execute
on function public.get_published_experience_by_reference(text)
to anon, authenticated;

commit;