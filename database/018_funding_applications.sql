-- ============================================================
-- CULTURA ESTÁ
-- Migración 018
-- Postulación de proyectos a oportunidades de financiación
-- ============================================================

begin;

-- ============================================================
-- 1. TABLA DE POSTULACIONES
-- ============================================================

create table if not exists public.funding_applications (
  id uuid primary key default gen_random_uuid(),

  opportunity_id uuid not null
    references public.funding_opportunities(id)
    on delete cascade,

  project_id uuid not null
    references public.projects(id)
    on delete cascade,

  applicant_id uuid not null
    references public.profiles(id)
    on delete restrict,

  report_id uuid
    references public.experience_reports(id)
    on delete set null,

  requested_amount numeric(14, 2) not null default 0
    check (
      requested_amount >= 0
    ),

  proposal_summary text not null default '',

  use_of_funds text not null default '',

  expected_outcomes text not null default '',

  status text not null default 'draft'
    check (
      status in (
        'draft',
        'submitted',
        'accepted',
        'rejected',
        'withdrawn'
      )
    ),

  review_note text not null default '',

  reviewed_by uuid
    references public.profiles(id)
    on delete set null,

  submitted_at timestamptz,

  reviewed_at timestamptz,

  created_at timestamptz not null default now(),

  updated_at timestamptz not null default now(),

  unique (
    opportunity_id,
    project_id
  )
);

create index if not exists
  funding_applications_opportunity_idx
on public.funding_applications(
  opportunity_id
);

create index if not exists
  funding_applications_project_idx
on public.funding_applications(
  project_id
);

create index if not exists
  funding_applications_applicant_idx
on public.funding_applications(
  applicant_id
);

create index if not exists
  funding_applications_status_idx
on public.funding_applications(
  status
);

-- ============================================================
-- 2. PREPARAR REGISTRO
-- ============================================================

create or replace function public.prepare_funding_application_record()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    if new.applicant_id is null then
      new.applicant_id :=
        auth.uid();
    end if;
  end if;

  if tg_op = 'UPDATE'
    and new.applicant_id <>
      old.applicant_id
  then
    raise exception
      'No se puede cambiar el postulante';
  end if;

  if tg_op = 'UPDATE'
    and new.opportunity_id <>
      old.opportunity_id
  then
    raise exception
      'No se puede cambiar la oportunidad';
  end if;

  new.updated_at :=
    now();

  return new;
end;
$$;

drop trigger if exists
  funding_applications_prepare_record
on public.funding_applications;

create trigger
  funding_applications_prepare_record
before insert or update
on public.funding_applications
for each row
execute function
  public.prepare_funding_application_record();

-- ============================================================
-- 3. ROW LEVEL SECURITY
-- ============================================================

alter table public.funding_applications
enable row level security;

drop policy if exists
  "Applicants can view their applications"
on public.funding_applications;

drop policy if exists
  "Opportunity owners can view applications"
on public.funding_applications;

drop policy if exists
  "Admins can view all funding applications"
on public.funding_applications;

create policy
  "Applicants can view their applications"
on public.funding_applications
for select
to authenticated
using (
  applicant_id =
    auth.uid()
);

create policy
  "Opportunity owners can view applications"
on public.funding_applications
for select
to authenticated
using (
  exists (
    select 1
    from public.funding_opportunities
      as opportunities

    where opportunities.id =
      funding_applications.opportunity_id

      and opportunities.owner_id =
        auth.uid()
  )
);

create policy
  "Admins can view all funding applications"
on public.funding_applications
for select
to authenticated
using (
  public.current_profile_role() in (
    'ecosystem_admin',
    'media_admin',
    'super_admin'
  )
);

grant select
on public.funding_applications
to authenticated;

-- Las escrituras se realizan únicamente mediante
-- las funciones controladas de esta migración.

-- ============================================================
-- 4. FUNCIÓN INTERNA DE ELEGIBILIDAD
-- ============================================================

create or replace function public.is_project_eligible_for_funding(
  target_project_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.projects

    where projects.id =
      target_project_id

      and projects.owner_id =
        auth.uid()

      and (
        projects.workflow_status in (
          'eligible',
          'ecosystem_eligible',
          'ecosystem_approved',
          'ecosystem_accepted',
          'editorial_submitted',
          'editorial_review_requested',
          'media_review_requested',
          'published'
        )

        or exists (
          select 1
          from public.project_editorial_profiles
            as editorial

          where editorial.project_id =
            projects.id

            and editorial.status =
              'published'
        )
      )
  );
$$;

revoke all
on function public.is_project_eligible_for_funding(uuid)
from public;

grant execute
on function public.is_project_eligible_for_funding(uuid)
to authenticated;

-- ============================================================
-- 5. PROYECTOS DISPONIBLES PARA POSTULAR
-- ============================================================

create or replace function public.list_funding_project_options()
returns table (
  project_id uuid,
  project_title text,
  project_description text,
  project_category text,
  workflow_status text,
  is_eligible boolean
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
    projects.workflow_status,

    (
      projects.workflow_status in (
        'eligible',
        'ecosystem_eligible',
        'ecosystem_approved',
        'ecosystem_accepted',
        'editorial_submitted',
        'editorial_review_requested',
        'media_review_requested',
        'published'
      )

      or exists (
        select 1
        from public.project_editorial_profiles
          as editorial

        where editorial.project_id =
          projects.id

          and editorial.status =
            'published'
      )
    )

  from public.projects

  where projects.owner_id =
    auth.uid()

  order by
    projects.updated_at desc,
    projects.title;
$$;

revoke all
on function public.list_funding_project_options()
from public;

grant execute
on function public.list_funding_project_options()
to authenticated;

-- ============================================================
-- 6. REPORTES DISPONIBLES PARA ADJUNTAR
-- ============================================================

create or replace function public.list_project_funding_report_options(
  target_project_id uuid
)
returns table (
  report_id uuid,
  experience_title text,
  experience_slug text,
  report_summary text,
  published_at timestamptz
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  project_owner_id uuid;
begin
  select owner_id
  into project_owner_id
  from public.projects
  where id =
    target_project_id;

  if project_owner_id is null then
    raise exception
      'El proyecto no existe';
  end if;

  if project_owner_id <>
    auth.uid()
  then
    raise exception
      'No tienes permiso para consultar los reportes de este proyecto';
  end if;

  return query

  select
    reports.id,
    experiences.title,
    experiences.slug,
    reports.summary,
    reports.published_at

  from public.experience_reports
    as reports

  inner join public.experiences
    on experiences.id =
      reports.experience_id

  where reports.project_id =
    target_project_id

    and reports.status =
      'published'

  order by
    reports.published_at desc;
end;
$$;

revoke all
on function public.list_project_funding_report_options(uuid)
from public;

grant execute
on function public.list_project_funding_report_options(uuid)
to authenticated;

-- ============================================================
-- 7. DETALLE PÚBLICO DE LA OPORTUNIDAD
-- ============================================================

create or replace function public.get_published_funding_opportunity_by_id(
  target_opportunity_id uuid
)
returns table (
  id uuid,
  owner_name text,

  title text,
  summary text,
  description text,
  opportunity_type text,

  amount_min numeric,
  amount_max numeric,
  currency text,

  opens_at date,
  closes_at date,

  eligibility text,
  required_documents text[],

  published_at timestamptz,

  applications_count integer
)
language sql
stable
security definer
set search_path = public
as $$
  select
    opportunities.id,

    coalesce(
      nullif(
        profiles.full_name,
        ''
      ),
      profiles.email,
      'Financiador del ecosistema'
    ),

    opportunities.title,
    opportunities.summary,
    opportunities.description,
    opportunities.opportunity_type,

    opportunities.amount_min,
    opportunities.amount_max,
    opportunities.currency,

    opportunities.opens_at,
    opportunities.closes_at,

    opportunities.eligibility,
    opportunities.required_documents,

    opportunities.published_at,

    (
      select count(*)::integer
      from public.funding_applications
        as applications

      where applications.opportunity_id =
        opportunities.id

        and applications.status in (
          'submitted',
          'accepted'
        )
    )

  from public.funding_opportunities
    as opportunities

  left join public.profiles
    on profiles.id =
      opportunities.owner_id

  where opportunities.id =
    target_opportunity_id

    and opportunities.status =
      'published'

  limit 1;
$$;

revoke all
on function public.get_published_funding_opportunity_by_id(uuid)
from public;

grant execute
on function public.get_published_funding_opportunity_by_id(uuid)
to anon, authenticated;

-- ============================================================
-- 8. POSTULACIONES DEL USUARIO
-- ============================================================

create or replace function public.list_my_funding_applications(
  target_opportunity_id uuid
)
returns table (
  application_id uuid,
  opportunity_id uuid,

  project_id uuid,
  project_title text,
  project_category text,
  project_workflow_status text,

  report_id uuid,
  report_experience_title text,
  report_experience_slug text,

  requested_amount numeric,
  proposal_summary text,
  use_of_funds text,
  expected_outcomes text,

  application_status text,
  review_note text,

  submitted_at timestamptz,
  reviewed_at timestamptz,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    applications.id,
    applications.opportunity_id,

    projects.id,
    projects.title,
    projects.category,
    projects.workflow_status,

    reports.id,
    experiences.title,
    experiences.slug,

    applications.requested_amount,
    applications.proposal_summary,
    applications.use_of_funds,
    applications.expected_outcomes,

    applications.status,
    applications.review_note,

    applications.submitted_at,
    applications.reviewed_at,
    applications.created_at

  from public.funding_applications
    as applications

  inner join public.projects
    on projects.id =
      applications.project_id

  left join public.experience_reports
    as reports

    on reports.id =
      applications.report_id

  left join public.experiences
    on experiences.id =
      reports.experience_id

  where applications.opportunity_id =
    target_opportunity_id

    and applications.applicant_id =
      auth.uid()

  order by
    applications.created_at desc;
$$;

revoke all
on function public.list_my_funding_applications(uuid)
from public;

grant execute
on function public.list_my_funding_applications(uuid)
to authenticated;

-- ============================================================
-- 9. GUARDAR POSTULACIÓN
-- ============================================================

create or replace function public.save_funding_application(
  target_application_id uuid,
  target_opportunity_id uuid,
  target_project_id uuid,
  target_report_id uuid,

  target_requested_amount numeric,
  target_proposal_summary text,
  target_use_of_funds text,
  target_expected_outcomes text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  opportunity_record
    public.funding_opportunities%rowtype;

  project_owner_id uuid;

  current_application
    public.funding_applications%rowtype;

  saved_application_id uuid;
begin
  if auth.uid() is null then
    raise exception
      'Debes iniciar sesión para postular un proyecto';
  end if;

  select *
  into opportunity_record
  from public.funding_opportunities

  where id =
    target_opportunity_id;

  if opportunity_record.id is null then
    raise exception
      'La oportunidad no existe';
  end if;

  if opportunity_record.status <>
    'published'
  then
    raise exception
      'La oportunidad no está disponible';
  end if;

  if opportunity_record.closes_at is not null
    and opportunity_record.closes_at <
      current_date
  then
    raise exception
      'La oportunidad ya cerró';
  end if;

  select owner_id
  into project_owner_id
  from public.projects

  where id =
    target_project_id;

  if project_owner_id is null then
    raise exception
      'El proyecto no existe';
  end if;

  if project_owner_id <>
    auth.uid()
  then
    raise exception
      'Solo puedes postular proyectos propios';
  end if;

  if coalesce(
    target_requested_amount,
    0
  ) < 0
  then
    raise exception
      'El monto solicitado no puede ser negativo';
  end if;

  if target_report_id is not null
    and not exists (
      select 1
      from public.experience_reports
        as reports

      where reports.id =
        target_report_id

        and reports.project_id =
          target_project_id

        and reports.status =
          'published'
    )
  then
    raise exception
      'El reporte seleccionado no pertenece al proyecto o no está publicado';
  end if;

  if target_application_id is null then
    if exists (
      select 1
      from public.funding_applications

      where opportunity_id =
        target_opportunity_id

        and project_id =
          target_project_id
    ) then
      raise exception
        'Este proyecto ya tiene una postulación para esta oportunidad';
    end if;

    insert into public.funding_applications (
      opportunity_id,
      project_id,
      applicant_id,
      report_id,

      requested_amount,
      proposal_summary,
      use_of_funds,
      expected_outcomes,

      status
    )
    values (
      target_opportunity_id,
      target_project_id,
      auth.uid(),
      target_report_id,

      coalesce(
        target_requested_amount,
        0
      ),

      trim(
        coalesce(
          target_proposal_summary,
          ''
        )
      ),

      trim(
        coalesce(
          target_use_of_funds,
          ''
        )
      ),

      trim(
        coalesce(
          target_expected_outcomes,
          ''
        )
      ),

      'draft'
    )

    returning id
    into saved_application_id;

    return saved_application_id;
  end if;

  select *
  into current_application
  from public.funding_applications

  where id =
    target_application_id;

  if current_application.id is null then
    raise exception
      'La postulación no existe';
  end if;

  if current_application.applicant_id <>
    auth.uid()
  then
    raise exception
      'No tienes permiso para editar esta postulación';
  end if;

  if current_application.status not in (
    'draft',
    'rejected'
  ) then
    raise exception
      'La postulación no puede editarse desde su estado actual';
  end if;

  if exists (
    select 1
    from public.funding_applications

    where opportunity_id =
      target_opportunity_id

      and project_id =
        target_project_id

      and id <>
        target_application_id
  ) then
    raise exception
      'Este proyecto ya tiene otra postulación para esta oportunidad';
  end if;

  update public.funding_applications
  set
    project_id =
      target_project_id,

    report_id =
      target_report_id,

    requested_amount =
      coalesce(
        target_requested_amount,
        0
      ),

    proposal_summary =
      trim(
        coalesce(
          target_proposal_summary,
          ''
        )
      ),

    use_of_funds =
      trim(
        coalesce(
          target_use_of_funds,
          ''
        )
      ),

    expected_outcomes =
      trim(
        coalesce(
          target_expected_outcomes,
          ''
        )
      ),

    status =
      'draft',

    review_note =
      '',

    reviewed_by =
      null,

    reviewed_at =
      null,

    submitted_at =
      null

  where id =
    target_application_id

  returning id
  into saved_application_id;

  return saved_application_id;
end;
$$;

revoke all
on function public.save_funding_application(
  uuid,
  uuid,
  uuid,
  uuid,
  numeric,
  text,
  text,
  text
)
from public;

grant execute
on function public.save_funding_application(
  uuid,
  uuid,
  uuid,
  uuid,
  numeric,
  text,
  text,
  text
)
to authenticated;

-- ============================================================
-- 10. ENVIAR POSTULACIÓN
-- ============================================================

create or replace function public.submit_funding_application(
  target_application_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  application_record
    public.funding_applications%rowtype;

  opportunity_record
    public.funding_opportunities%rowtype;
begin
  select *
  into application_record
  from public.funding_applications

  where id =
    target_application_id;

  if application_record.id is null then
    raise exception
      'La postulación no existe';
  end if;

  if application_record.applicant_id <>
    auth.uid()
  then
    raise exception
      'No tienes permiso para enviar esta postulación';
  end if;

  if application_record.status not in (
    'draft',
    'rejected'
  ) then
    raise exception
      'La postulación no puede enviarse desde su estado actual';
  end if;

  select *
  into opportunity_record
  from public.funding_opportunities

  where id =
    application_record.opportunity_id;

  if opportunity_record.status <>
    'published'
  then
    raise exception
      'La oportunidad ya no está disponible';
  end if;

  if opportunity_record.closes_at is not null
    and opportunity_record.closes_at <
      current_date
  then
    raise exception
      'La oportunidad ya cerró';
  end if;

  if not public.is_project_eligible_for_funding(
    application_record.project_id
  ) then
    raise exception
      'El proyecto debe ser aceptado como elegible antes de postularse';
  end if;

  if application_record.requested_amount <=
    0
  then
    raise exception
      'Define el monto que solicita el proyecto';
  end if;

  if opportunity_record.amount_min is not null
    and application_record.requested_amount <
      opportunity_record.amount_min
  then
    raise exception
      'El monto solicitado es inferior al mínimo de la oportunidad';
  end if;

  if opportunity_record.amount_max is not null
    and application_record.requested_amount >
      opportunity_record.amount_max
  then
    raise exception
      'El monto solicitado supera el máximo de la oportunidad';
  end if;

  if trim(
    application_record.proposal_summary
  ) = ''
  then
    raise exception
      'Completa el resumen de la postulación';
  end if;

  if trim(
    application_record.use_of_funds
  ) = ''
  then
    raise exception
      'Explica cómo se utilizarán los recursos';
  end if;

  if trim(
    application_record.expected_outcomes
  ) = ''
  then
    raise exception
      'Completa los resultados esperados';
  end if;

  update public.funding_applications
  set
    status =
      'submitted',

    submitted_at =
      now(),

    review_note =
      '',

    reviewed_by =
      null,

    reviewed_at =
      null

  where id =
    target_application_id;
end;
$$;

revoke all
on function public.submit_funding_application(uuid)
from public;

grant execute
on function public.submit_funding_application(uuid)
to authenticated;

-- ============================================================
-- 11. COLA DEL FINANCIADOR
-- ============================================================

create or replace function public.list_funding_opportunity_applications(
  target_opportunity_id uuid
)
returns table (
  application_id uuid,
  opportunity_id uuid,
  opportunity_title text,

  applicant_id uuid,
  applicant_name text,
  applicant_email text,

  project_id uuid,
  project_title text,
  project_description text,
  project_category text,
  project_workflow_status text,

  report_id uuid,
  report_experience_title text,
  report_experience_slug text,

  requested_amount numeric,
  proposal_summary text,
  use_of_funds text,
  expected_outcomes text,

  application_status text,
  review_note text,

  submitted_at timestamptz,
  reviewed_at timestamptz,
  created_at timestamptz
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  requester_role text;
  opportunity_owner_id uuid;
begin
  requester_role :=
    coalesce(
      public.current_profile_role(),
      'member'
    );

  select owner_id
  into opportunity_owner_id
  from public.funding_opportunities

  where id =
    target_opportunity_id;

  if opportunity_owner_id is null then
    raise exception
      'La oportunidad no existe';
  end if;

  if opportunity_owner_id <>
      auth.uid()

    and requester_role not in (
      'ecosystem_admin',
      'media_admin',
      'super_admin'
    )
  then
    raise exception
      'No tienes permiso para revisar estas postulaciones';
  end if;

  return query

  select
    applications.id,
    applications.opportunity_id,
    opportunities.title,

    applications.applicant_id,

    coalesce(
      nullif(
        profiles.full_name,
        ''
      ),
      profiles.email,
      'Usuario del ecosistema'
    ),

    profiles.email,

    projects.id,
    projects.title,
    projects.description,
    projects.category,
    projects.workflow_status,

    reports.id,
    experiences.title,
    experiences.slug,

    applications.requested_amount,
    applications.proposal_summary,
    applications.use_of_funds,
    applications.expected_outcomes,

    applications.status,
    applications.review_note,

    applications.submitted_at,
    applications.reviewed_at,
    applications.created_at

  from public.funding_applications
    as applications

  inner join public.funding_opportunities
    as opportunities

    on opportunities.id =
      applications.opportunity_id

  inner join public.projects
    on projects.id =
      applications.project_id

  inner join public.profiles
    on profiles.id =
      applications.applicant_id

  left join public.experience_reports
    as reports

    on reports.id =
      applications.report_id

  left join public.experiences
    on experiences.id =
      reports.experience_id

  where applications.opportunity_id =
    target_opportunity_id

  order by
    case
      when applications.status =
        'submitted'
        then 0

      when applications.status =
        'accepted'
        then 1

      when applications.status =
        'rejected'
        then 2

      else 3
    end,

    applications.submitted_at desc nulls last,
    applications.created_at desc;
end;
$$;

revoke all
on function public.list_funding_opportunity_applications(uuid)
from public;

grant execute
on function public.list_funding_opportunity_applications(uuid)
to authenticated;

-- ============================================================
-- 12. DECISIÓN DEL FINANCIADOR
-- ============================================================

create or replace function public.review_funding_application(
  target_application_id uuid,
  accept_application boolean,
  reviewer_note text default ''
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  requester_role text;

  application_record
    public.funding_applications%rowtype;

  opportunity_owner_id uuid;
begin
  requester_role :=
    coalesce(
      public.current_profile_role(),
      'member'
    );

  select *
  into application_record
  from public.funding_applications

  where id =
    target_application_id;

  if application_record.id is null then
    raise exception
      'La postulación no existe';
  end if;

  select owner_id
  into opportunity_owner_id
  from public.funding_opportunities

  where id =
    application_record.opportunity_id;

  if opportunity_owner_id <>
      auth.uid()

    and requester_role not in (
      'ecosystem_admin',
      'media_admin',
      'super_admin'
    )
  then
    raise exception
      'No tienes permiso para decidir sobre esta postulación';
  end if;

  if application_record.status <>
    'submitted'
  then
    raise exception
      'La postulación no está pendiente de decisión';
  end if;

  update public.funding_applications
  set
    status =
      case
        when accept_application
          then 'accepted'
        else 'rejected'
      end,

    review_note =
      trim(
        coalesce(
          reviewer_note,
          ''
        )
      ),

    reviewed_by =
      auth.uid(),

    reviewed_at =
      now()

  where id =
    target_application_id;
end;
$$;

revoke all
on function public.review_funding_application(
  uuid,
  boolean,
  text
)
from public;

grant execute
on function public.review_funding_application(
  uuid,
  boolean,
  text
)
to authenticated;

commit;