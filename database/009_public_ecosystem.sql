-- ============================================================
-- CULTURA ESTÁ
-- Migración 009
-- Directorio público del ecosistema
-- ============================================================

begin;

-- ============================================================
-- 1. LISTADO PÚBLICO DE ACTORES
-- ============================================================

create or replace function public.list_published_ecosystem_actors()
returns table (
  actor_type text,
  actor_id uuid,
  name text,
  slug text,
  headline text,
  description text,
  image_url text,
  city text,
  department text,
  country text,
  labels text[],
  offers text[],
  interests text[],
  verified boolean,
  featured boolean
)
language sql
stable
security definer
set search_path = public
as $$
  select *
  from (
    -- --------------------------------------------------------
    -- PERSONAS
    -- --------------------------------------------------------

    select
      'person'::text as actor_type,
      people.id as actor_id,
      people.full_name as name,
      people.slug,
      coalesce(
        nullif(people.headline, ''),
        'Persona del ecosistema'
      ) as headline,
      coalesce(
        nullif(people.biography, ''),
        ''
      ) as description,
      people.avatar_url as image_url,
      people.city,
      people.department,
      people.country,
      coalesce(
        people.roles,
        '{}'::text[]
      ) as labels,
      coalesce(
        people.skills,
        '{}'::text[]
      ) as offers,
      coalesce(
        people.interests,
        '{}'::text[]
      ) as interests,
      coalesce(
        people.verified,
        false
      ) as verified,
      coalesce(
        people.featured,
        false
      ) as featured

    from public.people

    where people.status = 'published'

    union all

    -- --------------------------------------------------------
    -- ESPACIOS
    -- --------------------------------------------------------

    select
      'space'::text,
      spaces.id,
      spaces.name,
      spaces.slug,
      coalesce(
        nullif(spaces.city, ''),
        'Espacio creativo'
      ),
      coalesce(
        nullif(spaces.description, ''),
        ''
      ),
      null::text,
      spaces.city,
      spaces.department,
      spaces.country,
      coalesce(
        spaces.space_types,
        '{}'::text[]
      ),
      coalesce(
        spaces.offers,
        '{}'::text[]
      ),
      coalesce(
        spaces.needs,
        '{}'::text[]
      ),
      coalesce(
        spaces.verified,
        false
      ),
      coalesce(
        spaces.featured,
        false
      )

    from public.spaces

    where spaces.status = 'published'

    union all

    -- --------------------------------------------------------
    -- FINANCIADORES
    -- --------------------------------------------------------

    select
      'funder'::text,
      funders.id,
      funders.name,
      funders.slug,
      coalesce(
        nullif(funders.funder_type, ''),
        'Marca o financiador'
      ),
      coalesce(
        nullif(funders.description, ''),
        ''
      ),
      null::text,
      funders.city,
      null::text,
      funders.country,
      array_remove(
        array[
          funders.funder_type
        ],
        null
      )::text[],
      coalesce(
        funders.support_modes,
        '{}'::text[]
      ),
      coalesce(
        funders.interests,
        '{}'::text[]
      ),
      coalesce(
        funders.verified,
        false
      ),
      coalesce(
        funders.featured,
        false
      )

    from public.funders

    where funders.status = 'published'
  ) as actors

  order by
    actors.featured desc,
    actors.verified desc,
    actors.name;
$$;

revoke all
on function public.list_published_ecosystem_actors()
from public;

grant execute
on function public.list_published_ecosystem_actors()
to anon, authenticated;

-- ============================================================
-- 2. FICHA PÚBLICA DE UN ACTOR
-- ============================================================

create or replace function public.get_published_ecosystem_actor(
  target_actor_type text,
  target_slug text
)
returns table (
  actor_type text,
  actor_id uuid,
  name text,
  slug text,
  headline text,
  description text,
  image_url text,
  city text,
  department text,
  country text,
  labels text[],
  offers text[],
  interests text[],
  verified boolean,
  featured boolean
)
language sql
stable
security definer
set search_path = public
as $$
  select
    actors.actor_type,
    actors.actor_id,
    actors.name,
    actors.slug,
    actors.headline,
    actors.description,
    actors.image_url,
    actors.city,
    actors.department,
    actors.country,
    actors.labels,
    actors.offers,
    actors.interests,
    actors.verified,
    actors.featured

  from public.list_published_ecosystem_actors()
    as actors

  where actors.actor_type =
    target_actor_type

    and actors.slug =
      target_slug

  limit 1;
$$;

revoke all
on function public.get_published_ecosystem_actor(text, text)
from public;

grant execute
on function public.get_published_ecosystem_actor(text, text)
to anon, authenticated;

-- ============================================================
-- 3. PROYECTOS PÚBLICOS RELACIONADOS CON UN ACTOR
-- ============================================================

create or replace function public.get_published_actor_projects(
  target_actor_type text,
  target_actor_id uuid
)
returns table (
  project_id uuid,
  slug text,
  headline text,
  summary text,
  cover_image_url text,
  city text,
  category text,
  relationship_label text,
  published_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    projects.id as project_id,
    editorial.slug,
    editorial.headline,
    editorial.summary,
    editorial.cover_image_url,
    editorial.city,
    projects.category,
    links.relationship_label,
    projects.published_at

  from public.project_actor_links
    as links

  inner join public.projects
    on projects.id =
      links.project_id

  inner join public.project_editorial_profiles
    as editorial
    on editorial.project_id =
      projects.id

  where links.is_public = true

    and projects.workflow_status =
      'published'

    and editorial.status =
      'published'

    and (
      (
        target_actor_type = 'person'
        and links.person_id =
          target_actor_id
      )
      or
      (
        target_actor_type = 'space'
        and links.space_id =
          target_actor_id
      )
      or
      (
        target_actor_type = 'funder'
        and links.funder_id =
          target_actor_id
      )
    )

  order by
    projects.published_at desc nulls last,
    projects.updated_at desc;
$$;

revoke all
on function public.get_published_actor_projects(text, uuid)
from public;

grant execute
on function public.get_published_actor_projects(text, uuid)
to anon, authenticated;

commit;