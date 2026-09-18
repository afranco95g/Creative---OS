-- ============================================================
-- CULTURA ESTA (EL CULEBREO)
-- Migración 059
-- Vacantes de proyecto + invitaciones + matching por rol.
-- Paso 3 del diseño aprobado (2026-09-18): ver
-- claude/EL CULEBREO - Diseño UX y Componentes, Wizard + Vacantes +
-- Vitrina por Rol (proyecto de claude.ai), sección 2, y
-- specs/vacantes-de-proyecto-y-matching-por-rol.md.
--
-- No reemplaza project_actor_links (quién participa en el proyecto,
-- a nivel de todo el proyecto) — lo complementa a nivel de vacante
-- puntual, con estado propio y una acción real de invitar/aceptar.
-- ============================================================

begin;

-- ============================================================
-- 1. VACANTES (project_vacancies)
-- ============================================================

create table if not exists public.project_vacancies (
  id uuid primary key default gen_random_uuid(),

  project_id uuid not null
    references public.projects(id)
    on delete cascade,

  title text not null,

  -- Texto libre, validado en la aplicación (no un check constraint)
  -- contra los 16 valores de people.roles — evita mantener un
  -- tercer vocabulario de rol en paralelo. Si diverge algún día, la
  -- fuente de verdad sigue siendo people.roles, no esta columna.
  role_needed text,

  description text not null default '',

  status text not null default 'open'
    check (status in ('open', 'filled', 'cancelled')),

  filled_by_person_id uuid
    references public.people(id)
    on delete set null,

  created_by uuid
    references public.profiles(id)
    on delete set null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists project_vacancies_project_idx
on public.project_vacancies(project_id);

create index if not exists project_vacancies_status_idx
on public.project_vacancies(status);

create trigger project_vacancies_set_updated_at
before update on public.project_vacancies
for each row
execute function public.set_updated_at();

-- ============================================================
-- 2. INVITACIONES (project_vacancy_invitations)
-- ============================================================

create table if not exists public.project_vacancy_invitations (
  id uuid primary key default gen_random_uuid(),

  vacancy_id uuid not null
    references public.project_vacancies(id)
    on delete cascade,

  candidate_person_id uuid not null
    references public.people(id)
    on delete cascade,

  status text not null default 'suggested'
    check (status in ('suggested', 'invited', 'accepted', 'declined')),

  invited_by uuid
    references public.profiles(id)
    on delete set null,

  created_at timestamptz not null default now(),
  responded_at timestamptz,

  unique (vacancy_id, candidate_person_id)
);

create index if not exists project_vacancy_invitations_vacancy_idx
on public.project_vacancy_invitations(vacancy_id);

create index if not exists project_vacancy_invitations_candidate_idx
on public.project_vacancy_invitations(candidate_person_id);

-- ============================================================
-- 3. PERMISOS REUTILIZABLES
-- ============================================================

create or replace function public.can_manage_project(
  target_project_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.current_profile_role() in ('ecosystem_admin', 'super_admin')
    or exists (
      select 1
      from public.projects
      where projects.id = target_project_id
        and projects.owner_id = auth.uid()
    );
$$;

revoke all on function public.can_manage_project(uuid) from public;
grant execute on function public.can_manage_project(uuid) to authenticated;

-- ============================================================
-- 4. ACEPTAR/RECHAZAR UNA INVITACIÓN (transacción atómica)
-- ============================================================
-- Al aceptar: (1) marca la invitación aceptada, (2) marca la
-- vacante llena con filled_by_person_id, (3) crea la fila en
-- project_actor_links que ya existe (person_id = candidato,
-- relationship_label = título de la vacante) — el proyecto termina
-- con el mismo registro de "quién participa" que usa todo el resto
-- del sistema. Es una función (no tres escrituras sueltas desde el
-- cliente) para que las tres cosas pasen juntas o ninguna pase.
--
-- accept_consent_given: registra en el mismo movimiento la
-- aceptación del aviso de habeas data (migración 060) — no se puede
-- aceptar una invitación sin ese consentimiento explícito.

create or replace function public.accept_vacancy_invitation(
  target_invitation_id uuid,
  habeas_data_consent_given boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  invitation record;
  vacancy record;
  candidate_profile_id uuid;
begin
  if not habeas_data_consent_given then
    raise exception 'Debes aceptar el aviso de tratamiento de datos para continuar.';
  end if;

  select * into invitation
  from public.project_vacancy_invitations
  where id = target_invitation_id
  for update;

  if invitation is null then
    raise exception 'La invitación no existe.';
  end if;

  if invitation.status <> 'invited' then
    raise exception 'Esta invitación ya no está disponible para responder.';
  end if;

  select profile_id into candidate_profile_id
  from public.people
  where id = invitation.candidate_person_id;

  if candidate_profile_id is distinct from auth.uid() then
    raise exception 'No tienes permiso para responder esta invitación.';
  end if;

  select * into vacancy
  from public.project_vacancies
  where id = invitation.vacancy_id
  for update;

  if vacancy is null or vacancy.status <> 'open' then
    raise exception 'Esta vacante ya no está abierta.';
  end if;

  update public.project_vacancy_invitations
  set status = 'accepted', responded_at = now()
  where id = target_invitation_id;

  update public.project_vacancies
  set filled_by_person_id = invitation.candidate_person_id,
      status = 'filled'
  where id = vacancy.id;

  insert into public.project_actor_links (
    project_id, person_id, relationship_label, created_by
  ) values (
    vacancy.project_id, invitation.candidate_person_id, vacancy.title, auth.uid()
  );

  insert into public.legal_consents (
    profile_id, consent_type, context_type, context_id, accepted
  ) values (
    auth.uid(), 'habeas_data', 'vacancy_invitation', target_invitation_id, true
  );
end;
$$;

revoke all on function public.accept_vacancy_invitation(uuid, boolean) from public;
grant execute on function public.accept_vacancy_invitation(uuid, boolean) to authenticated;

create or replace function public.decline_vacancy_invitation(
  target_invitation_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  invitation record;
  candidate_profile_id uuid;
begin
  select * into invitation
  from public.project_vacancy_invitations
  where id = target_invitation_id
  for update;

  if invitation is null then
    raise exception 'La invitación no existe.';
  end if;

  select profile_id into candidate_profile_id
  from public.people
  where id = invitation.candidate_person_id;

  if candidate_profile_id is distinct from auth.uid() then
    raise exception 'No tienes permiso para responder esta invitación.';
  end if;

  update public.project_vacancy_invitations
  set status = 'declined', responded_at = now()
  where id = target_invitation_id
    and status = 'invited';
end;
$$;

revoke all on function public.decline_vacancy_invitation(uuid) from public;
grant execute on function public.decline_vacancy_invitation(uuid) to authenticated;

-- ============================================================
-- 5. ROW LEVEL SECURITY
-- ============================================================

alter table public.project_vacancies enable row level security;
alter table public.project_vacancy_invitations enable row level security;

drop policy if exists "Public can view open vacancies of published projects"
on public.project_vacancies;
drop policy if exists "Project owners can view their vacancies"
on public.project_vacancies;
drop policy if exists "Project owners can manage their vacancies"
on public.project_vacancies;

-- Cualquiera ve las vacantes abiertas de un proyecto ya publicado
-- (público, informativo) — misma visibilidad que el resto del
-- perfil público del proyecto.
create policy "Public can view open vacancies of published projects"
on public.project_vacancies
for select
to anon, authenticated
using (
  status = 'open'
  and exists (
    select 1 from public.projects
    where projects.id = project_vacancies.project_id
      and projects.workflow_status = 'published'
  )
);

-- El dueño del proyecto (o admin) ve todas sus vacantes,
-- publicado o no.
create policy "Project owners can view their vacancies"
on public.project_vacancies
for select
to authenticated
using (
  public.can_manage_project(project_id)
);

create policy "Project owners can manage their vacancies"
on public.project_vacancies
for all
to authenticated
using (
  public.can_manage_project(project_id)
)
with check (
  public.can_manage_project(project_id)
);

drop policy if exists "Candidates can view their own invitations"
on public.project_vacancy_invitations;
drop policy if exists "Project owners can view invitations to their vacancies"
on public.project_vacancy_invitations;
drop policy if exists "Project owners can create invitations"
on public.project_vacancy_invitations;
drop policy if exists "Project owners can update invitations"
on public.project_vacancy_invitations;

-- El candidato ve sus propias invitaciones (bandeja de "te
-- sugirieron para este proyecto", dentro de su dashboard privado).
create policy "Candidates can view their own invitations"
on public.project_vacancy_invitations
for select
to authenticated
using (
  exists (
    select 1 from public.people
    where people.id = project_vacancy_invitations.candidate_person_id
      and people.profile_id = auth.uid()
  )
);

-- El dueño del proyecto ve las invitaciones de sus propias vacantes.
create policy "Project owners can view invitations to their vacancies"
on public.project_vacancy_invitations
for select
to authenticated
using (
  exists (
    select 1 from public.project_vacancies
    where project_vacancies.id = project_vacancy_invitations.vacancy_id
      and public.can_manage_project(project_vacancies.project_id)
  )
);

-- Solo el dueño del proyecto invita candidatos a sus propias
-- vacantes.
create policy "Project owners can create invitations"
on public.project_vacancy_invitations
for insert
to authenticated
with check (
  exists (
    select 1 from public.project_vacancies
    where project_vacancies.id = project_vacancy_invitations.vacancy_id
      and public.can_manage_project(project_vacancies.project_id)
  )
);

-- El dueño del proyecto puede editar/retirar una invitación que
-- todavía no fue respondida (aceptar/rechazar pasa siempre por las
-- funciones de arriba, nunca por un UPDATE directo del candidato).
create policy "Project owners can update invitations"
on public.project_vacancy_invitations
for update
to authenticated
using (
  exists (
    select 1 from public.project_vacancies
    where project_vacancies.id = project_vacancy_invitations.vacancy_id
      and public.can_manage_project(project_vacancies.project_id)
  )
)
with check (
  exists (
    select 1 from public.project_vacancies
    where project_vacancies.id = project_vacancy_invitations.vacancy_id
      and public.can_manage_project(project_vacancies.project_id)
  )
);

commit;
