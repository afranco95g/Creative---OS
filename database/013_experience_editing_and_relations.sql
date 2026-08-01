-- ============================================================
-- CULTURA ESTÁ
-- Migración 013
-- Edición y relaciones de experiencias
-- ============================================================

begin;

-- ============================================================
-- 1. OPCIONES DE PROYECTOS Y ESPACIOS
-- ============================================================

create or replace function public.list_experience_relation_options()
returns table (
  option_type text,
  option_id uuid,
  name text,
  subtitle text
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
      'member'
    );

  return query

  select
    'project'::text as option_type,
    projects.id as option_id,
    projects.title as name,

    coalesce(
      nullif(
        projects.description,
        ''
      ),
      initcap(
        replace(
          projects.category,
          '_',
          ' '
        )
      ),
      'Proyecto de Creative OS'
    ) as subtitle

  from public.projects

  where
    projects.owner_id = auth.uid()

    or projects.workflow_status =
      'published'

    or requester_role in (
      'ecosystem_admin',
      'media_admin',
      'super_admin'
    )

  union all

  select
    'space'::text,
    spaces.id,
    spaces.name,

    coalesce(
      nullif(
        spaces.city,
        ''
      ),
      nullif(
        spaces.description,
        ''
      ),
      'Espacio del ecosistema'
    )

  from public.spaces

  where
    spaces.status =
      'published'

    or requester_role in (
      'ecosystem_admin',
      'media_admin',
      'super_admin'
    )

  order by
    1,
    3;
end;
$$;

revoke all
on function public.list_experience_relation_options()
from public;

grant execute
on function public.list_experience_relation_options()
to authenticated;

-- ============================================================
-- 2. VALIDAR RELACIONES
-- ============================================================

create or replace function public.validate_experience_relations()
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
      'member'
    );

  if new.project_id is not null then
    if not exists (
      select 1
      from public.projects

      where projects.id =
        new.project_id

        and (
          projects.owner_id =
            auth.uid()

          or projects.workflow_status =
            'published'

          or requester_role in (
            'ecosystem_admin',
            'media_admin',
            'super_admin'
          )
        )
    ) then
      raise exception
        'No tienes permiso para vincular esta actividad con el proyecto seleccionado';
    end if;
  end if;

  if new.host_space_id is not null then
    if not exists (
      select 1
      from public.spaces

      where spaces.id =
        new.host_space_id

        and (
          spaces.status =
            'published'

          or requester_role in (
            'ecosystem_admin',
            'media_admin',
            'super_admin'
          )
        )
    ) then
      raise exception
        'El espacio seleccionado no está disponible para esta actividad';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists
  experiences_validate_relations
on public.experiences;

create trigger
  experiences_validate_relations
before insert or update of
  project_id,
  host_space_id
on public.experiences
for each row
execute function
  public.validate_experience_relations();

commit;