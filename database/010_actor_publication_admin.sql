-- ============================================================
-- CULTURA ESTA
-- Migración 010
-- Administración y publicación de actores
-- ============================================================

begin;

-- ============================================================
-- 1. LISTADO ADMINISTRATIVO DE ACTORES
-- ============================================================

create or replace function public.list_ecosystem_actors_for_review()
returns table (
  actor_type text,
  actor_id uuid,
  name text,
  slug text,
  headline text,
  description text,
  city text,
  country text,
  actor_status text,
  verified boolean,
  featured boolean
)
language plpgsql
stable
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

  if requester_role not in (
    'ecosystem_admin',
    'super_admin'
  ) then
    raise exception
      'No tienes permiso para revisar actores del ecosistema';
  end if;

  return query

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
    people.city,
    people.country,
    people.status as actor_status,
    coalesce(
      people.verified,
      false
    ) as verified,
    coalesce(
      people.featured,
      false
    ) as featured

  from public.people

  union all

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
    spaces.city,
    spaces.country,
    spaces.status,
    coalesce(
      spaces.verified,
      false
    ),
    coalesce(
      spaces.featured,
      false
    )

  from public.spaces

  union all

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
    funders.city,
    funders.country,
    funders.status,
    coalesce(
      funders.verified,
      false
    ),
    coalesce(
      funders.featured,
      false
    )

  from public.funders

  order by
    1,
    3;
end;
$$;

revoke all
on function public.list_ecosystem_actors_for_review()
from public;

grant execute
on function public.list_ecosystem_actors_for_review()
to authenticated;

-- ============================================================
-- 2. ACTUALIZAR ESTADO DE UN ACTOR
-- ============================================================

create or replace function public.update_ecosystem_actor_publication(
  target_actor_type text,
  target_actor_id uuid,
  target_status text,
  target_verified boolean,
  target_featured boolean
)
returns void
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

  if requester_role not in (
    'ecosystem_admin',
    'super_admin'
  ) then
    raise exception
      'No tienes permiso para administrar actores del ecosistema';
  end if;

  if target_actor_type not in (
    'person',
    'space',
    'funder'
  ) then
    raise exception
      'Tipo de actor no válido';
  end if;

  if target_status not in (
    'draft',
    'review',
    'published',
    'archived'
  ) then
    raise exception
      'Estado de publicación no válido';
  end if;

  if target_actor_type = 'person' then

    update public.people
    set
      status = target_status,
      verified = target_verified,
      featured = target_featured
    where id = target_actor_id;

  elsif target_actor_type = 'space' then

    update public.spaces
    set
      status = target_status,
      verified = target_verified,
      featured = target_featured
    where id = target_actor_id;

  elsif target_actor_type = 'funder' then

    update public.funders
    set
      status = target_status,
      verified = target_verified,
      featured = target_featured
    where id = target_actor_id;

  end if;

  if not found then
    raise exception
      'No se encontró el actor solicitado';
  end if;
end;
$$;

revoke all
on function public.update_ecosystem_actor_publication(
  text,
  uuid,
  text,
  boolean,
  boolean
)
from public;

grant execute
on function public.update_ecosystem_actor_publication(
  text,
  uuid,
  text,
  boolean,
  boolean
)
to authenticated;

commit;