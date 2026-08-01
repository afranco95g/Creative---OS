-- ============================================================
-- CULTURA ESTÁ
-- Migración 008
-- Relaciones entre proyectos y actores del ecosistema
-- ============================================================

begin;

-- ============================================================
-- 1. TABLA DE RELACIONES
-- ============================================================

create table if not exists public.project_actor_links (
  id uuid primary key default gen_random_uuid(),

  project_id uuid not null
    references public.projects(id)
    on delete cascade,

  person_id uuid
    references public.people(id)
    on delete cascade,

  space_id uuid
    references public.spaces(id)
    on delete cascade,

  funder_id uuid
    references public.funders(id)
    on delete cascade,

  relationship_label text not null default 'Participa',

  is_public boolean not null default true,

  sort_order integer not null default 0,

  created_by uuid
    references public.profiles(id)
    on delete set null,

  created_at timestamptz not null default now(),

  constraint project_actor_links_one_actor_check
  check (
    num_nonnulls(
      person_id,
      space_id,
      funder_id
    ) = 1
  )
);

create index if not exists project_actor_links_project_idx
on public.project_actor_links(project_id);

create index if not exists project_actor_links_person_idx
on public.project_actor_links(person_id);

create index if not exists project_actor_links_space_idx
on public.project_actor_links(space_id);

create index if not exists project_actor_links_funder_idx
on public.project_actor_links(funder_id);

create unique index if not exists project_actor_links_unique_person
on public.project_actor_links(
  project_id,
  person_id
)
where person_id is not null;

create unique index if not exists project_actor_links_unique_space
on public.project_actor_links(
  project_id,
  space_id
)
where space_id is not null;

create unique index if not exists project_actor_links_unique_funder
on public.project_actor_links(
  project_id,
  funder_id
)
where funder_id is not null;

-- ============================================================
-- 2. OPCIONES DISPONIBLES PARA EL EQUIPO EDITORIAL
-- ============================================================

create or replace function public.list_project_actor_options()
returns table (
  actor_type text,
  actor_id uuid,
  name text,
  subtitle text,
  actor_status text
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
    'journalist',
    'media_admin',
    'super_admin'
  ) then
    raise exception
      'No tienes permiso para consultar actores editoriales';
  end if;

  return query

  select
    'person'::text,
    people.id,
    people.full_name,
    coalesce(
      nullif(people.headline, ''),
      array_to_string(
        people.roles,
        ', '
      ),
      'Persona del ecosistema'
    ),
    people.status
  from public.people
  where people.status <> 'archived'

  union all

  select
    'space'::text,
    spaces.id,
    spaces.name,
    coalesce(
      nullif(spaces.city, ''),
      nullif(spaces.description, ''),
      'Espacio creativo'
    ),
    spaces.status
  from public.spaces
  where spaces.status <> 'archived'

  union all

  select
    'funder'::text,
    funders.id,
    funders.name,
    coalesce(
      nullif(funders.description, ''),
      funders.funder_type,
      'Marca o financiador'
    ),
    funders.status
  from public.funders
  where funders.status <> 'archived'

  order by 1, 3;
end;
$$;

revoke all
on function public.list_project_actor_options()
from public;

grant execute
on function public.list_project_actor_options()
to authenticated;

-- ============================================================
-- 3. RELACIONES ACTUALES PARA EL EDITOR
-- ============================================================

create or replace function public.get_project_actor_links_for_editor(
  target_project_id uuid
)
returns table (
  link_id uuid,
  actor_type text,
  actor_id uuid,
  relationship_label text,
  is_public boolean,
  sort_order integer
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
    'journalist',
    'media_admin',
    'super_admin'
  ) then
    raise exception
      'No tienes permiso para consultar estas relaciones';
  end if;

  return query
  select
    links.id,

    case
      when links.person_id is not null
        then 'person'
      when links.space_id is not null
        then 'space'
      else 'funder'
    end,

    coalesce(
      links.person_id,
      links.space_id,
      links.funder_id
    ),

    links.relationship_label,
    links.is_public,
    links.sort_order

  from public.project_actor_links as links

  where links.project_id =
    target_project_id

  order by
    links.sort_order,
    links.created_at;
end;
$$;

revoke all
on function public.get_project_actor_links_for_editor(uuid)
from public;

grant execute
on function public.get_project_actor_links_for_editor(uuid)
to authenticated;

-- ============================================================
-- 4. GUARDAR TODAS LAS RELACIONES
-- ============================================================

create or replace function public.save_project_actor_links(
  target_project_id uuid,
  actor_links jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  requester_role text;
  project_status text;

  link_record jsonb;

  actor_type_value text;
  actor_id_value uuid;
  relationship_value text;
  public_value boolean;
  order_value integer;
begin
  requester_role :=
    coalesce(
      public.current_profile_role(),
      'anonymous'
    );

  if requester_role not in (
    'journalist',
    'media_admin',
    'super_admin'
  ) then
    raise exception
      'No tienes permiso para editar actores del proyecto';
  end if;

  select workflow_status
  into project_status
  from public.projects
  where id = target_project_id;

  if project_status is null then
    raise exception
      'El proyecto no existe';
  end if;

  if project_status not in (
    'submitted_to_media',
    'editorial_review',
    'published'
  ) then
    raise exception
      'El proyecto todavía no está dentro del proceso editorial';
  end if;

  delete from public.project_actor_links
  where project_id = target_project_id;

  for link_record in
    select *
    from jsonb_array_elements(
      coalesce(
        actor_links,
        '[]'::jsonb
      )
    )
  loop
    actor_type_value :=
      link_record ->> 'actorType';

    actor_id_value :=
      (
        link_record ->> 'actorId'
      )::uuid;

    relationship_value :=
      coalesce(
        nullif(
          trim(
            link_record ->> 'relationshipLabel'
          ),
          ''
        ),
        'Participa'
      );

    public_value :=
      coalesce(
        (
          link_record ->> 'isPublic'
        )::boolean,
        true
      );

    order_value :=
      coalesce(
        (
          link_record ->> 'sortOrder'
        )::integer,
        0
      );

    if actor_type_value = 'person' then
      insert into public.project_actor_links (
        project_id,
        person_id,
        relationship_label,
        is_public,
        sort_order,
        created_by
      )
      values (
        target_project_id,
        actor_id_value,
        relationship_value,
        public_value,
        order_value,
        auth.uid()
      );

    elsif actor_type_value = 'space' then
      insert into public.project_actor_links (
        project_id,
        space_id,
        relationship_label,
        is_public,
        sort_order,
        created_by
      )
      values (
        target_project_id,
        actor_id_value,
        relationship_value,
        public_value,
        order_value,
        auth.uid()
      );

    elsif actor_type_value = 'funder' then
      insert into public.project_actor_links (
        project_id,
        funder_id,
        relationship_label,
        is_public,
        sort_order,
        created_by
      )
      values (
        target_project_id,
        actor_id_value,
        relationship_value,
        public_value,
        order_value,
        auth.uid()
      );

    else
      raise exception
        'Tipo de actor no válido: %',
        actor_type_value;
    end if;
  end loop;
end;
$$;

revoke all
on function public.save_project_actor_links(uuid, jsonb)
from public;

grant execute
on function public.save_project_actor_links(uuid, jsonb)
to authenticated;

-- ============================================================
-- 5. ACTORES PÚBLICOS DEL PROYECTO
-- ============================================================

create or replace function public.get_published_project_actors(
  target_project_id uuid
)
returns table (
  actor_type text,
  actor_id uuid,
  name text,
  subtitle text,
  slug text,
  image_url text,
  relationship_label text,
  sort_order integer
)
language sql
stable
security definer
set search_path = public
as $$
  select *
  from (
    select
      'person'::text as actor_type,
      people.id as actor_id,
      people.full_name as name,

      coalesce(
        nullif(people.headline, ''),
        'Persona del ecosistema'
      ) as subtitle,

      people.slug,
      people.avatar_url as image_url,

      links.relationship_label,
      links.sort_order

    from public.project_actor_links as links

    inner join public.people
      on people.id = links.person_id

    where links.project_id =
      target_project_id

      and links.is_public = true

      and people.status = 'published'

    union all

    select
      'space'::text,
      spaces.id,
      spaces.name,

      coalesce(
        nullif(spaces.city, ''),
        'Espacio creativo'
      ),

      spaces.slug,
      null::text,

      links.relationship_label,
      links.sort_order

    from public.project_actor_links as links

    inner join public.spaces
      on spaces.id = links.space_id

    where links.project_id =
      target_project_id

      and links.is_public = true

      and spaces.status = 'published'

    union all

    select
      'funder'::text,
      funders.id,
      funders.name,

      coalesce(
        nullif(funders.description, ''),
        funders.funder_type
      ),

      funders.slug,
      null::text,

      links.relationship_label,
      links.sort_order

    from public.project_actor_links as links

    inner join public.funders
      on funders.id = links.funder_id

    where links.project_id =
      target_project_id

      and links.is_public = true

      and funders.status = 'published'
  ) as actors

  where exists (
    select 1
    from public.projects
    where projects.id =
      target_project_id

      and projects.workflow_status =
        'published'
  )

  order by
    actors.sort_order,
    actors.name;
$$;

revoke all
on function public.get_published_project_actors(uuid)
from public;

grant execute
on function public.get_published_project_actors(uuid)
to anon, authenticated;

-- ============================================================
-- 6. ROW LEVEL SECURITY
-- ============================================================

alter table public.project_actor_links
enable row level security;

drop policy if exists "Media team can view project actor links"
on public.project_actor_links;

drop policy if exists "Media team can manage project actor links"
on public.project_actor_links;

create policy "Media team can view project actor links"
on public.project_actor_links
for select
to authenticated
using (
  public.current_profile_role() in (
    'journalist',
    'media_admin',
    'super_admin'
  )
);

create policy "Media team can manage project actor links"
on public.project_actor_links
for all
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

grant select, insert, update, delete
on public.project_actor_links
to authenticated;

commit;