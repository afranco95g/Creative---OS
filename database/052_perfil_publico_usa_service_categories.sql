-- ============================================================
-- CULTURA ESTA (EL CULEBREO)
-- Migracion 052
-- Corrige la redundancia offers vs service_categories en el
-- perfil publico de espacios: el motor de emparejamiento (Fase 3)
-- ya usa spaces.service_categories (vocabulario cerrado, 044); el
-- perfil publico seguia mostrando spaces.offers (texto libre
-- legado). Se deja service_categories como unica fuente de verdad
-- para "que ofrece" un espacio. funders.offers en esta misma
-- funcion en realidad viene de funders.support_modes (modalidades
-- de apoyo: subvencion, en especie, etc.) -- un concepto distinto
-- de service_categories (los servicios concretos de una agencia,
-- por ejemplo Imagine), no una redundancia del mismo tipo, y no se
-- toca aqui.
-- Ver: EL CULEBREO - Aliados y modelo de necesidades-servicios
-- (borrador).md, seccion 3.
-- ============================================================

begin;

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
        spaces.service_categories,
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

commit;
