-- ============================================================
-- CULTURA ESTA (EL CULEBREO)
-- Migracion 055
-- Portada del perfil publico de un espacio: imagen de fondo +
-- texto superpuesto con datos generales del edificio (pisos,
-- ascensor, banos, cafeteria, etc.). Solo aplica a actor_type =
-- 'space' -- personas y financiadores devuelven estos dos campos
-- en null, igual que ya pasa con offers/labels segun el tipo.
--
-- hero_image_path guarda la RUTA dentro del bucket de Storage
-- 'space-media' (el mismo que ya usan las fotos/video de los
-- salones), no la URL publica completa -- la URL se resuelve en
-- el servicio publicEcosystem.ts con getPublicUrl(), igual que ya
-- hace services/spaces/spaceMediaService.ts para la galeria de
-- cada salon.
--
-- Aprovechando el mismo cambio: logo_image_path resuelve el gap de
-- que el "image_url" de un espacio estaba hardcodeado en null en
-- list_published_ecosystem_actors() -- ningun espacio mostraba
-- nunca un logo. Mismo mecanismo que hero_image_path (ruta en
-- space-media, resuelta a URL publica en el servicio).
-- ============================================================

begin;

alter table public.spaces
  add column if not exists hero_image_path text,
  add column if not exists hero_info text,
  add column if not exists logo_image_path text;

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
  featured boolean,
  hero_image_path text,
  hero_info text,
  logo_image_path text
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
      ) as featured,
      null::text as hero_image_path,
      null::text as hero_info,
      null::text as logo_image_path

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
      ),
      spaces.hero_image_path,
      spaces.hero_info,
      spaces.logo_image_path

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
      ),
      null::text,
      null::text,
      null::text

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
  featured boolean,
  hero_image_path text,
  hero_info text,
  logo_image_path text
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
    actors.featured,
    actors.hero_image_path,
    actors.hero_info,
    actors.logo_image_path

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
