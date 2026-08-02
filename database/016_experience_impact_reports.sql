-- ============================================================
-- CULTURA ESTA
-- Migración 016
-- Reportes de resultados e impacto de experiencias
-- ============================================================

begin;

-- ============================================================
-- 1. TABLA DE REPORTES
-- ============================================================

create table if not exists public.experience_reports (
  id uuid primary key default gen_random_uuid(),

  experience_id uuid not null unique
    references public.experiences(id)
    on delete cascade,

  project_id uuid
    references public.projects(id)
    on delete set null,

  owner_id uuid not null
    references public.profiles(id)
    on delete restrict,

  summary text not null default '',

  outcomes text not null default '',

  learnings text not null default '',

  challenges text not null default '',

  next_steps text not null default '',

  revenue_cop numeric(14, 2) not null default 0
    check (
      revenue_cop >= 0
    ),

  expenses_cop numeric(14, 2) not null default 0
    check (
      expenses_cop >= 0
    ),

  evidence_urls text[] not null default '{}',

  status text not null default 'draft'
    check (
      status in (
        'draft',
        'submitted',
        'published',
        'rejected',
        'archived'
      )
    ),

  review_note text not null default '',

  reviewed_by uuid
    references public.profiles(id)
    on delete set null,

  reviewed_at timestamptz,

  published_at timestamptz,

  created_at timestamptz not null default now(),

  updated_at timestamptz not null default now()
);

create index if not exists
  experience_reports_experience_idx
on public.experience_reports(
  experience_id
);

create index if not exists
  experience_reports_project_idx
on public.experience_reports(
  project_id
);

create index if not exists
  experience_reports_owner_idx
on public.experience_reports(
  owner_id
);

create index if not exists
  experience_reports_status_idx
on public.experience_reports(
  status
);

-- ============================================================
-- 2. PREPARAR EL REPORTE
-- ============================================================

create or replace function public.prepare_experience_report_record()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  experience_owner_id uuid;
  related_project_id uuid;
begin
  select
    experiences.owner_id,
    experiences.project_id

  into
    experience_owner_id,
    related_project_id

  from public.experiences

  where experiences.id =
    new.experience_id;

  if experience_owner_id is null then
    raise exception
      'La experiencia relacionada no existe';
  end if;

  if tg_op = 'UPDATE'
    and new.experience_id <>
      old.experience_id
  then
    raise exception
      'No se puede cambiar la experiencia de un reporte existente';
  end if;

  new.owner_id :=
    experience_owner_id;

  new.project_id :=
    related_project_id;

  new.updated_at :=
    now();

  return new;
end;
$$;

drop trigger if exists
  experience_reports_prepare_record
on public.experience_reports;

create trigger
  experience_reports_prepare_record
before insert or update
on public.experience_reports
for each row
execute function
  public.prepare_experience_report_record();

-- ============================================================
-- 3. ROW LEVEL SECURITY
-- ============================================================

alter table public.experience_reports
enable row level security;

drop policy if exists
  "Public can view published experience reports"
on public.experience_reports;

drop policy if exists
  "Owners can view their experience reports"
on public.experience_reports;

drop policy if exists
  "Admins can view all experience reports"
on public.experience_reports;

drop policy if exists
  "Owners can create experience reports"
on public.experience_reports;

drop policy if exists
  "Owners can update editable experience reports"
on public.experience_reports;

drop policy if exists
  "Admins can manage experience reports"
on public.experience_reports;

create policy
  "Public can view published experience reports"
on public.experience_reports
for select
to anon, authenticated
using (
  status = 'published'
);

create policy
  "Owners can view their experience reports"
on public.experience_reports
for select
to authenticated
using (
  owner_id = auth.uid()
);

create policy
  "Admins can view all experience reports"
on public.experience_reports
for select
to authenticated
using (
  public.current_profile_role() in (
    'ecosystem_admin',
    'media_admin',
    'super_admin'
  )
);

create policy
  "Owners can create experience reports"
on public.experience_reports
for insert
to authenticated
with check (
  owner_id = auth.uid()

  and exists (
    select 1
    from public.experiences

    where experiences.id =
      experience_reports.experience_id

      and experiences.owner_id =
        auth.uid()
  )
);

create policy
  "Owners can update editable experience reports"
on public.experience_reports
for update
to authenticated
using (
  owner_id = auth.uid()

  and status in (
    'draft',
    'rejected'
  )
)
with check (
  owner_id = auth.uid()

  and status in (
    'draft',
    'rejected'
  )
);

create policy
  "Admins can manage experience reports"
on public.experience_reports
for all
to authenticated
using (
  public.current_profile_role() in (
    'ecosystem_admin',
    'media_admin',
    'super_admin'
  )
)
with check (
  public.current_profile_role() in (
    'ecosystem_admin',
    'media_admin',
    'super_admin'
  )
);

grant select
on public.experience_reports
to anon, authenticated;

grant insert, update
on public.experience_reports
to authenticated;

-- ============================================================
-- 4. ESPACIO DE TRABAJO DEL REPORTE
-- ============================================================

create or replace function public.get_experience_report_workspace(
  target_experience_id uuid
)
returns table (
  experience_id uuid,
  experience_title text,
  experience_slug text,
  experience_summary text,
  experience_status text,
  starts_at timestamptz,
  ends_at timestamptz,
  capacity integer,

  report_id uuid,
  report_status text,
  report_summary text,
  outcomes text,
  learnings text,
  challenges text,
  next_steps text,
  revenue_cop numeric,
  expenses_cop numeric,
  balance_cop numeric,
  evidence_urls text[],
  review_note text,
  published_at timestamptz,

  active_registrations integer,
  reserved_places integer,
  attended_places integer,
  cancelled_registrations integer,
  attendance_rate numeric,
  occupancy_rate numeric,

  is_owner boolean,
  can_review boolean
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  requester_role text;
  experience_owner_id uuid;
begin
  requester_role :=
    coalesce(
      public.current_profile_role(),
      'member'
    );

  select owner_id
  into experience_owner_id
  from public.experiences
  where id = target_experience_id;

  if experience_owner_id is null then
    raise exception
      'La experiencia no existe';
  end if;

  if experience_owner_id <> auth.uid()
    and requester_role not in (
      'ecosystem_admin',
      'media_admin',
      'super_admin'
    )
  then
    raise exception
      'No tienes permiso para consultar este reporte';
  end if;

  return query

  with registration_metrics as (
    select
      registrations.experience_id,

      count(*) filter (
        where registrations.status in (
          'registered',
          'attended'
        )
      )::integer
        as active_registrations,

      coalesce(
        sum(
          registrations.attendees_count
        ) filter (
          where registrations.status in (
            'registered',
            'attended'
          )
        ),
        0
      )::integer
        as reserved_places,

      coalesce(
        sum(
          registrations.attendees_count
        ) filter (
          where registrations.status =
            'attended'
        ),
        0
      )::integer
        as attended_places,

      count(*) filter (
        where registrations.status =
          'cancelled'
      )::integer
        as cancelled_registrations

    from public.experience_registrations
      as registrations

    where registrations.experience_id =
      target_experience_id

    group by
      registrations.experience_id
  )

  select
    experiences.id,
    experiences.title,
    experiences.slug,
    experiences.summary,
    experiences.status,
    experiences.starts_at,
    experiences.ends_at,
    experiences.capacity,

    reports.id,

    coalesce(
      reports.status,
      'not_started'
    ),

    coalesce(
      reports.summary,
      ''
    ),

    coalesce(
      reports.outcomes,
      ''
    ),

    coalesce(
      reports.learnings,
      ''
    ),

    coalesce(
      reports.challenges,
      ''
    ),

    coalesce(
      reports.next_steps,
      ''
    ),

    coalesce(
      reports.revenue_cop,
      0
    ),

    coalesce(
      reports.expenses_cop,
      0
    ),

    coalesce(
      reports.revenue_cop,
      0
    ) -
    coalesce(
      reports.expenses_cop,
      0
    ),

    coalesce(
      reports.evidence_urls,
      '{}'::text[]
    ),

    coalesce(
      reports.review_note,
      ''
    ),

    reports.published_at,

    coalesce(
      metrics.active_registrations,
      0
    ),

    coalesce(
      metrics.reserved_places,
      0
    ),

    coalesce(
      metrics.attended_places,
      0
    ),

    coalesce(
      metrics.cancelled_registrations,
      0
    ),

    case
      when coalesce(
        metrics.reserved_places,
        0
      ) = 0
        then 0

      else round(
        (
          coalesce(
            metrics.attended_places,
            0
          )::numeric
          /
          metrics.reserved_places::numeric
        ) * 100,
        1
      )
    end,

    case
      when experiences.capacity is null
        or experiences.capacity = 0
        then null

      else round(
        (
          coalesce(
            metrics.reserved_places,
            0
          )::numeric
          /
          experiences.capacity::numeric
        ) * 100,
        1
      )
    end,

    experiences.owner_id =
      auth.uid(),

    requester_role in (
      'ecosystem_admin',
      'media_admin',
      'super_admin'
    )

  from public.experiences

  left join public.experience_reports
    as reports

    on reports.experience_id =
      experiences.id

  left join registration_metrics
    as metrics

    on metrics.experience_id =
      experiences.id

  where experiences.id =
    target_experience_id

  limit 1;
end;
$$;

revoke all
on function public.get_experience_report_workspace(uuid)
from public;

grant execute
on function public.get_experience_report_workspace(uuid)
to authenticated;

-- ============================================================
-- 5. GUARDAR BORRADOR
-- ============================================================

create or replace function public.save_experience_report(
  target_experience_id uuid,
  target_summary text,
  target_outcomes text,
  target_learnings text,
  target_challenges text,
  target_next_steps text,
  target_revenue_cop numeric,
  target_expenses_cop numeric,
  target_evidence_urls text[]
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  requester_role text;
  experience_owner_id uuid;
  current_report_status text;
  saved_report_id uuid;
begin
  requester_role :=
    coalesce(
      public.current_profile_role(),
      'member'
    );

  select owner_id
  into experience_owner_id
  from public.experiences
  where id = target_experience_id;

  if experience_owner_id is null then
    raise exception
      'La experiencia no existe';
  end if;

  if experience_owner_id <> auth.uid()
    and requester_role not in (
      'ecosystem_admin',
      'media_admin',
      'super_admin'
    )
  then
    raise exception
      'No tienes permiso para editar este reporte';
  end if;

  if coalesce(
    target_revenue_cop,
    0
  ) < 0
  then
    raise exception
      'Los ingresos no pueden ser negativos';
  end if;

  if coalesce(
    target_expenses_cop,
    0
  ) < 0
  then
    raise exception
      'Los gastos no pueden ser negativos';
  end if;

  select status
  into current_report_status
  from public.experience_reports
  where experience_id =
    target_experience_id;

  if current_report_status is not null
    and current_report_status not in (
      'draft',
      'rejected'
    )
    and requester_role not in (
      'ecosystem_admin',
      'media_admin',
      'super_admin'
    )
  then
    raise exception
      'El reporte no puede editarse desde su estado actual';
  end if;

  insert into public.experience_reports (
    experience_id,
    summary,
    outcomes,
    learnings,
    challenges,
    next_steps,
    revenue_cop,
    expenses_cop,
    evidence_urls,
    status
  )
  values (
    target_experience_id,
    trim(
      coalesce(
        target_summary,
        ''
      )
    ),
    trim(
      coalesce(
        target_outcomes,
        ''
      )
    ),
    trim(
      coalesce(
        target_learnings,
        ''
      )
    ),
    trim(
      coalesce(
        target_challenges,
        ''
      )
    ),
    trim(
      coalesce(
        target_next_steps,
        ''
      )
    ),
    coalesce(
      target_revenue_cop,
      0
    ),
    coalesce(
      target_expenses_cop,
      0
    ),
    coalesce(
      target_evidence_urls,
      '{}'::text[]
    ),
    'draft'
  )

  on conflict (
    experience_id
  )
  do update set
    summary =
      excluded.summary,

    outcomes =
      excluded.outcomes,

    learnings =
      excluded.learnings,

    challenges =
      excluded.challenges,

    next_steps =
      excluded.next_steps,

    revenue_cop =
      excluded.revenue_cop,

    expenses_cop =
      excluded.expenses_cop,

    evidence_urls =
      excluded.evidence_urls,

    status =
      'draft',

    review_note =
      '',

    reviewed_by =
      null,

    reviewed_at =
      null,

    published_at =
      null

  returning id
  into saved_report_id;

  return saved_report_id;
end;
$$;

revoke all
on function public.save_experience_report(
  uuid,
  text,
  text,
  text,
  text,
  text,
  numeric,
  numeric,
  text[]
)
from public;

grant execute
on function public.save_experience_report(
  uuid,
  text,
  text,
  text,
  text,
  text,
  numeric,
  numeric,
  text[]
)
to authenticated;

-- ============================================================
-- 6. ENVIAR A REVISIÓN
-- ============================================================

create or replace function public.submit_experience_report(
  target_experience_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  requester_role text;
  experience_owner_id uuid;
  report_record public.experience_reports%rowtype;
begin
  requester_role :=
    coalesce(
      public.current_profile_role(),
      'member'
    );

  select owner_id
  into experience_owner_id
  from public.experiences
  where id =
    target_experience_id;

  if experience_owner_id is null then
    raise exception
      'La experiencia no existe';
  end if;

  if experience_owner_id <> auth.uid()
    and requester_role not in (
      'ecosystem_admin',
      'media_admin',
      'super_admin'
    )
  then
    raise exception
      'No tienes permiso para enviar este reporte';
  end if;

  select *
  into report_record
  from public.experience_reports
  where experience_id =
    target_experience_id;

  if report_record.id is null then
    raise exception
      'Primero debes guardar el reporte';
  end if;

  if report_record.status not in (
    'draft',
    'rejected'
  ) then
    raise exception
      'El reporte no puede enviarse desde su estado actual';
  end if;

  if trim(
    report_record.summary
  ) = ''
  then
    raise exception
      'Completa el resumen general';
  end if;

  if trim(
    report_record.outcomes
  ) = ''
  then
    raise exception
      'Completa los resultados alcanzados';
  end if;

  if trim(
    report_record.learnings
  ) = ''
  then
    raise exception
      'Completa los aprendizajes';
  end if;

  update public.experience_reports
  set
    status =
      'submitted',

    review_note =
      '',

    reviewed_by =
      null,

    reviewed_at =
      null

  where experience_id =
    target_experience_id;
end;
$$;

revoke all
on function public.submit_experience_report(uuid)
from public;

grant execute
on function public.submit_experience_report(uuid)
to authenticated;

-- ============================================================
-- 7. REVISIÓN ADMINISTRATIVA
-- ============================================================

create or replace function public.review_experience_report(
  target_experience_id uuid,
  approve_report boolean,
  reviewer_note text default ''
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  requester_role text;
  current_status text;
begin
  requester_role :=
    coalesce(
      public.current_profile_role(),
      'member'
    );

  if requester_role not in (
    'ecosystem_admin',
    'media_admin',
    'super_admin'
  ) then
    raise exception
      'No tienes permiso para revisar reportes';
  end if;

  select status
  into current_status
  from public.experience_reports
  where experience_id =
    target_experience_id;

  if current_status is null then
    raise exception
      'El reporte no existe';
  end if;

  if current_status <> 'submitted' then
    raise exception
      'El reporte no está pendiente de revisión';
  end if;

  update public.experience_reports
  set
    status =
      case
        when approve_report
          then 'published'
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
      now(),

    published_at =
      case
        when approve_report
          then now()
        else null
      end

  where experience_id =
    target_experience_id;
end;
$$;

revoke all
on function public.review_experience_report(
  uuid,
  boolean,
  text
)
from public;

grant execute
on function public.review_experience_report(
  uuid,
  boolean,
  text
)
to authenticated;

-- ============================================================
-- 8. REPORTE PÚBLICO
-- ============================================================

create or replace function public.get_published_experience_report(
  target_experience_slug text
)
returns table (
  experience_id uuid,
  experience_title text,
  experience_slug text,
  experience_summary text,
  starts_at timestamptz,
  ends_at timestamptz,
  city text,
  venue_name text,
  cover_image_url text,

  report_summary text,
  outcomes text,
  learnings text,
  challenges text,
  next_steps text,
  revenue_cop numeric,
  expenses_cop numeric,
  balance_cop numeric,
  evidence_urls text[],
  published_at timestamptz,

  active_registrations integer,
  reserved_places integer,
  attended_places integer,
  cancelled_registrations integer,
  attendance_rate numeric,
  occupancy_rate numeric,

  project_slug text,
  project_headline text
)
language sql
stable
security definer
set search_path = public
as $$
  with registration_metrics as (
    select
      registrations.experience_id,

      count(*) filter (
        where registrations.status in (
          'registered',
          'attended'
        )
      )::integer
        as active_registrations,

      coalesce(
        sum(
          registrations.attendees_count
        ) filter (
          where registrations.status in (
            'registered',
            'attended'
          )
        ),
        0
      )::integer
        as reserved_places,

      coalesce(
        sum(
          registrations.attendees_count
        ) filter (
          where registrations.status =
            'attended'
        ),
        0
      )::integer
        as attended_places,

      count(*) filter (
        where registrations.status =
          'cancelled'
      )::integer
        as cancelled_registrations

    from public.experience_registrations
      as registrations

    group by
      registrations.experience_id
  )

  select
    experiences.id,
    experiences.title,
    experiences.slug,
    experiences.summary,
    experiences.starts_at,
    experiences.ends_at,
    experiences.city,
    experiences.venue_name,
    experiences.cover_image_url,

    reports.summary,
    reports.outcomes,
    reports.learnings,
    reports.challenges,
    reports.next_steps,
    reports.revenue_cop,
    reports.expenses_cop,

    reports.revenue_cop -
    reports.expenses_cop,

    reports.evidence_urls,
    reports.published_at,

    coalesce(
      metrics.active_registrations,
      0
    ),

    coalesce(
      metrics.reserved_places,
      0
    ),

    coalesce(
      metrics.attended_places,
      0
    ),

    coalesce(
      metrics.cancelled_registrations,
      0
    ),

    case
      when coalesce(
        metrics.reserved_places,
        0
      ) = 0
        then 0

      else round(
        (
          coalesce(
            metrics.attended_places,
            0
          )::numeric
          /
          metrics.reserved_places::numeric
        ) * 100,
        1
      )
    end,

    case
      when experiences.capacity is null
        or experiences.capacity = 0
        then null

      else round(
        (
          coalesce(
            metrics.reserved_places,
            0
          )::numeric
          /
          experiences.capacity::numeric
        ) * 100,
        1
      )
    end,

    editorial.slug,

    coalesce(
      nullif(
        editorial.headline,
        ''
      ),
      projects.title
    )

  from public.experience_reports
    as reports

  inner join public.experiences
    on experiences.id =
      reports.experience_id

  left join registration_metrics
    as metrics

    on metrics.experience_id =
      experiences.id

  left join public.projects
    on projects.id =
      reports.project_id

    and projects.workflow_status =
      'published'

  left join public.project_editorial_profiles
    as editorial

    on editorial.project_id =
      projects.id

    and editorial.status =
      'published'

  where reports.status =
    'published'

    and experiences.slug =
      target_experience_slug

  limit 1;
$$;

revoke all
on function public.get_published_experience_report(text)
from public;

grant execute
on function public.get_published_experience_report(text)
to anon, authenticated;

commit;