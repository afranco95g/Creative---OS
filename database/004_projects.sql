-- ============================================================
-- CULTURA ESTÁ
-- Migración 004
-- Proyectos de Creative OS y flujo de publicación
-- ============================================================

begin;

-- ============================================================
-- 1. TABLA PRINCIPAL DE PROYECTOS
-- ============================================================

create table if not exists public.projects (
  id uuid primary key,

  owner_id uuid not null
    references public.profiles(id)
    on delete cascade,

  title text not null,

  description text not null default '',

  category text not null default 'other'
    check (
      category in (
        'cultural',
        'product',
        'event',
        'social',
        'artistic',
        'business',
        'other'
      )
    ),

  stage text not null default 'idea',

  progress integer not null default 0
    check (
      progress >= 0
      and progress <= 100
    ),

  graph jsonb not null,

  messages jsonb not null default '[]'::jsonb,

  workflow_status text not null default 'private'
    check (
      workflow_status in (
        'private',
        'eligibility_requested',
        'eligibility_rejected',
        'eligible',
        'submitted_to_media',
        'editorial_review',
        'publication_rejected',
        'published',
        'archived'
      )
    ),

  eligibility_requested_at timestamptz,

  eligibility_reviewed_at timestamptz,

  eligibility_reviewed_by uuid
    references public.profiles(id)
    on delete set null,

  eligibility_note text,

  submitted_to_media_at timestamptz,

  editorial_reviewed_at timestamptz,

  editorial_reviewed_by uuid
    references public.profiles(id)
    on delete set null,

  editorial_note text,

  published_at timestamptz,

  client_updated_at timestamptz not null default now(),

  created_at timestamptz not null default now(),

  updated_at timestamptz not null default now()
);

-- ============================================================
-- 2. ÍNDICES
-- ============================================================

create index if not exists projects_owner_id_idx
on public.projects(owner_id);

create index if not exists projects_workflow_status_idx
on public.projects(workflow_status);

create index if not exists projects_category_idx
on public.projects(category);

create index if not exists projects_stage_idx
on public.projects(stage);

create index if not exists projects_updated_at_idx
on public.projects(updated_at desc);

create index if not exists projects_graph_idx
on public.projects
using gin(graph);

-- ============================================================
-- 3. ACTUALIZACIÓN AUTOMÁTICA DE updated_at
-- ============================================================

drop trigger if exists projects_set_updated_at
on public.projects;

create trigger projects_set_updated_at
before update on public.projects
for each row
execute function public.set_updated_at();

-- ============================================================
-- 4. CONTROL DEL FLUJO DE APROBACIÓN
-- ============================================================

create or replace function public.enforce_project_workflow()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  requester_id uuid;
  requester_role text;
  owner_transition boolean;
begin
  requester_id := auth.uid();

  requester_role :=
    coalesce(
      public.current_profile_role(),
      'anonymous'
    );

  -- ----------------------------------------------------------
  -- CREACIÓN
  -- ----------------------------------------------------------

  if tg_op = 'INSERT' then
    if requester_id is null then
      raise exception
        'Debes iniciar sesión para crear un proyecto';
    end if;

    if new.owner_id <> requester_id
      and requester_role <> 'super_admin'
    then
      raise exception
        'No puedes crear un proyecto para otra cuenta';
    end if;

    new.workflow_status := 'private';

    new.eligibility_requested_at := null;
    new.eligibility_reviewed_at := null;
    new.eligibility_reviewed_by := null;
    new.eligibility_note := null;

    new.submitted_to_media_at := null;
    new.editorial_reviewed_at := null;
    new.editorial_reviewed_by := null;
    new.editorial_note := null;

    new.published_at := null;

    return new;
  end if;

  -- ----------------------------------------------------------
  -- PROPIETARIO
  -- ----------------------------------------------------------

  if new.owner_id <> old.owner_id
    and requester_role <> 'super_admin'
  then
    raise exception
      'No está permitido cambiar el propietario del proyecto';
  end if;

  -- Si el estado no cambia, el propietario puede seguir
  -- trabajando en el contenido del proyecto.
  if new.workflow_status = old.workflow_status then
    if requester_id = old.owner_id then
      new.eligibility_requested_at :=
        old.eligibility_requested_at;

      new.eligibility_reviewed_at :=
        old.eligibility_reviewed_at;

      new.eligibility_reviewed_by :=
        old.eligibility_reviewed_by;

      new.eligibility_note :=
        old.eligibility_note;

      new.submitted_to_media_at :=
        old.submitted_to_media_at;

      new.editorial_reviewed_at :=
        old.editorial_reviewed_at;

      new.editorial_reviewed_by :=
        old.editorial_reviewed_by;

      new.editorial_note :=
        old.editorial_note;

      new.published_at :=
        old.published_at;
    end if;

    return new;
  end if;

  owner_transition :=
    requester_id = old.owner_id
    and (
      (
        old.workflow_status in (
          'private',
          'eligibility_rejected'
        )
        and new.workflow_status =
          'eligibility_requested'
      )
      or
      (
        old.workflow_status in (
          'eligible',
          'publication_rejected'
        )
        and new.workflow_status =
          'submitted_to_media'
      )
    );

  if owner_transition then
    if new.workflow_status =
      'eligibility_requested'
    then
      new.eligibility_requested_at :=
        now();

      new.eligibility_reviewed_at :=
        null;

      new.eligibility_reviewed_by :=
        null;

      new.eligibility_note :=
        null;
    end if;

    if new.workflow_status =
      'submitted_to_media'
    then
      new.submitted_to_media_at :=
        now();

      new.editorial_reviewed_at :=
        null;

      new.editorial_reviewed_by :=
        null;

      new.editorial_note :=
        null;
    end if;

    return new;
  end if;

  -- ----------------------------------------------------------
  -- ADMINISTRADOR DEL ECOSISTEMA
  -- ----------------------------------------------------------

  if requester_role in (
    'ecosystem_admin',
    'super_admin'
  )
    and old.workflow_status =
      'eligibility_requested'
    and new.workflow_status in (
      'eligible',
      'eligibility_rejected'
    )
  then
    new.eligibility_reviewed_at :=
      now();

    new.eligibility_reviewed_by :=
      requester_id;

    return new;
  end if;

  -- ----------------------------------------------------------
  -- ADMINISTRADOR DEL MEDIO
  -- ----------------------------------------------------------

  if requester_role in (
    'media_admin',
    'super_admin'
  )
    and old.workflow_status in (
      'submitted_to_media',
      'editorial_review'
    )
    and new.workflow_status in (
      'editorial_review',
      'published',
      'publication_rejected'
    )
  then
    if new.workflow_status =
      'editorial_review'
    then
      return new;
    end if;

    new.editorial_reviewed_at :=
      now();

    new.editorial_reviewed_by :=
      requester_id;

    if new.workflow_status =
      'published'
    then
      new.published_at :=
        now();
    end if;

    return new;
  end if;

  -- ----------------------------------------------------------
  -- SUPERADMINISTRADOR
  -- ----------------------------------------------------------

  if requester_role =
    'super_admin'
  then
    return new;
  end if;

  raise exception
    'La transición de estado solicitada no está permitida';
end;
$$;

drop trigger if exists projects_enforce_workflow
on public.projects;

create trigger projects_enforce_workflow
before insert or update
on public.projects
for each row
execute function public.enforce_project_workflow();

-- ============================================================
-- 5. ROW LEVEL SECURITY
-- ============================================================

alter table public.projects
enable row level security;

drop policy if exists "Owners can view their projects"
on public.projects;

drop policy if exists "Ecosystem admins can review projects"
on public.projects;

drop policy if exists "Media team can review submitted projects"
on public.projects;

drop policy if exists "Owners can create projects"
on public.projects;

drop policy if exists "Owners can update their projects"
on public.projects;

drop policy if exists "Ecosystem admins can update reviews"
on public.projects;

drop policy if exists "Media admins can update reviews"
on public.projects;

drop policy if exists "Owners can delete private projects"
on public.projects;

drop policy if exists "Super admins can manage projects"
on public.projects;

-- El propietario puede consultar todos sus proyectos.
create policy "Owners can view their projects"
on public.projects
for select
to authenticated
using (
  owner_id = auth.uid()
);

-- El administrador del ecosistema consulta proyectos
-- que requieren revisión de elegibilidad.
create policy "Ecosystem admins can review projects"
on public.projects
for select
to authenticated
using (
  public.current_profile_role() in (
    'ecosystem_admin',
    'super_admin'
  )
);

-- El equipo del medio consulta los proyectos postulados.
create policy "Media team can review submitted projects"
on public.projects
for select
to authenticated
using (
  public.current_profile_role() in (
    'journalist',
    'media_admin',
    'super_admin'
  )
  and workflow_status in (
    'submitted_to_media',
    'editorial_review',
    'publication_rejected',
    'published'
  )
);

-- Una persona solo crea proyectos para sí misma.
create policy "Owners can create projects"
on public.projects
for insert
to authenticated
with check (
  owner_id = auth.uid()
);

-- El propietario puede seguir actualizando el contenido.
-- El trigger controla las transiciones de estado.
create policy "Owners can update their projects"
on public.projects
for update
to authenticated
using (
  owner_id = auth.uid()
)
with check (
  owner_id = auth.uid()
);

create policy "Ecosystem admins can update reviews"
on public.projects
for update
to authenticated
using (
  public.current_profile_role() in (
    'ecosystem_admin',
    'super_admin'
  )
)
with check (
  public.current_profile_role() in (
    'ecosystem_admin',
    'super_admin'
  )
);

create policy "Media admins can update reviews"
on public.projects
for update
to authenticated
using (
  public.current_profile_role() in (
    'media_admin',
    'super_admin'
  )
)
with check (
  public.current_profile_role() in (
    'media_admin',
    'super_admin'
  )
);

-- Un proyecto publicado no se elimina desde Creative OS.
create policy "Owners can delete private projects"
on public.projects
for delete
to authenticated
using (
  owner_id = auth.uid()
  and workflow_status in (
    'private',
    'eligibility_rejected',
    'publication_rejected'
  )
);

create policy "Super admins can manage projects"
on public.projects
for all
to authenticated
using (
  public.current_profile_role() =
    'super_admin'
)
with check (
  public.current_profile_role() =
    'super_admin'
);

-- ============================================================
-- 6. PERMISOS
-- ============================================================

grant select, insert, update, delete
on public.projects
to authenticated;

commit;