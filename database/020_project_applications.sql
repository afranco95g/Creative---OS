-- ============================================================
-- CULTURA ESTA
-- Migración 020
-- Aplicaciones seguras de proyectos al ecosistema
-- ============================================================

begin;

-- ============================================================
-- 1. FUNCIÓN COMÚN: ¿LA CUENTA PUEDE ADMINISTRAR ESTE ACTOR?
-- ============================================================

create or replace function public.can_manage_workspace_actor(
  target_actor_type text,
  target_actor_id uuid,
  target_profile_id uuid default auth.uid()
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    case target_actor_type
      when 'person' then
        exists (
          select 1
          from public.people
          where people.id = target_actor_id
            and people.profile_id = target_profile_id
        )

      when 'space' then
        exists (
          select 1
          from public.space_memberships
          where space_memberships.space_id = target_actor_id
            and space_memberships.profile_id = target_profile_id
            and space_memberships.status = 'active'
            and space_memberships.role in (
              'owner',
              'administrator',
              'editor'
            )
        )

      when 'funder' then
        exists (
          select 1
          from public.funder_memberships
          where funder_memberships.funder_id = target_actor_id
            and funder_memberships.profile_id = target_profile_id
            and funder_memberships.status = 'active'
            and funder_memberships.role in (
              'owner',
              'administrator',
              'representative'
            )
        )

      else false
    end;
$$;

revoke all
on function public.can_manage_workspace_actor(
  text,
  uuid,
  uuid
)
from public;

grant execute
on function public.can_manage_workspace_actor(
  text,
  uuid,
  uuid
)
to authenticated;

-- ============================================================
-- 2. TABLA DE APLICACIONES
-- ============================================================

create table if not exists public.project_applications (
  id uuid primary key default gen_random_uuid(),

  project_id uuid not null unique
    references public.projects(id)
    on delete cascade,

  applicant_profile_id uuid not null default auth.uid()
    references public.profiles(id)
    on delete restrict,

  actor_type text not null
    check (
      actor_type in (
        'person',
        'space',
        'funder'
      )
    ),

  actor_id uuid not null,

  application_type text not null
    check (
      application_type in (
        'creative_project',
        'experience',
        'product',
        'campaign',
        'activation',
        'call',
        'editorial_story',
        'other'
      )
    ),

  requested_routes text[] not null default '{}'
    check (
      requested_routes <@ array[
        'ecosystem_connections',
        'cultural_calendar',
        'ticket_distribution',
        'brand_activation',
        'space_match',
        'funding_opportunity',
        'editorial_consideration',
        'other'
      ]::text[]
    ),

  public_summary text not null default '',

  ecosystem_offer text not null default '',

  ecosystem_needs text not null default '',

  target_audience text not null default '',

  geographic_scope text not null default '',

  -- Fotografía controlada de módulos no sensibles.
  snapshot jsonb not null default '{}'::jsonb,

  -- Solo se usa cuando application_type = product.
  product_details jsonb,

  -- Solo se usa cuando application_type = experience.
  experience_details jsonb,

  -- Se usa para campaign o activation.
  campaign_details jsonb,

  status text not null default 'draft'
    check (
      status in (
        'draft',
        'submitted',
        'under_review',
        'changes_requested',
        'accepted',
        'rejected',
        'withdrawn',
        'archived'
      )
    ),

  decision text
    check (
      decision is null
      or decision in (
        'connections',
        'experience',
        'ticket_distribution',
        'brand_activation',
        'funding',
        'editorial_referral',
        'changes_required',
        'not_eligible'
      )
    ),

  reviewer_profile_id uuid
    references public.profiles(id)
    on delete set null,

  reviewer_note text,

  submitted_at timestamptz,

  reviewed_at timestamptz,

  created_at timestamptz not null default now(),

  updated_at timestamptz not null default now()
);

create index if not exists project_applications_project_idx
on public.project_applications(project_id);

create index if not exists project_applications_applicant_idx
on public.project_applications(applicant_profile_id);

create index if not exists project_applications_actor_idx
on public.project_applications(actor_type, actor_id);

create index if not exists project_applications_status_idx
on public.project_applications(status);

create index if not exists project_applications_type_idx
on public.project_applications(application_type);

drop trigger if exists project_applications_set_updated_at
on public.project_applications;

create trigger project_applications_set_updated_at
before update on public.project_applications
for each row
execute function public.set_updated_at();

-- ============================================================
-- 3. SNAPSHOT SEGURO DEL PROYECTO
-- ============================================================

create or replace function public.build_project_application_snapshot(
  target_project_id uuid
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  project_record public.projects%rowtype;
begin
  select *
  into project_record
  from public.projects
  where id = target_project_id;

  if project_record.id is null then
    raise exception
      'El proyecto no existe';
  end if;

  return jsonb_build_object(
    'projectTitle',
      project_record.title,

    'projectDescription',
      project_record.description,

    'projectCategory',
      project_record.category,

    'projectStage',
      project_record.stage,

    'projectProgress',
      project_record.progress,

    'identity',
      coalesce(
        project_record.graph #>>
          '{modules,identity,content}',
        ''
      ),

    'purpose',
      coalesce(
        project_record.graph #>>
          '{modules,purpose,content}',
        ''
      ),

    'problem',
      coalesce(
        project_record.graph #>>
          '{modules,problem,content}',
        ''
      ),

    'context',
      coalesce(
        project_record.graph #>>
          '{modules,context,content}',
        ''
      ),

    'community',
      coalesce(
        project_record.graph #>>
          '{modules,community,content}',
        ''
      ),

    'generalObjective',
      coalesce(
        project_record.graph #>>
          '{modules,generalObjective,content}',
        ''
      ),

    'specificObjectives',
      coalesce(
        project_record.graph #>>
          '{modules,specificObjectives,content}',
        ''
      ),

    'activities',
      coalesce(
        project_record.graph #>>
          '{modules,activities,content}',
        ''
      ),

    'timeline',
      coalesce(
        project_record.graph #>>
          '{modules,timeline,content}',
        ''
      ),

    'allies',
      coalesce(
        project_record.graph #>>
          '{modules,allies,content}',
        ''
      ),

    'sustainability',
      coalesce(
        project_record.graph #>>
          '{modules,sustainability,content}',
        ''
      ),

    'impact',
      coalesce(
        project_record.graph #>>
          '{modules,impact,content}',
        ''
      ),

    'kpis',
      coalesce(
        project_record.graph #>>
          '{modules,kpis,content}',
        ''
      )
  );
end;
$$;

revoke all
on function public.build_project_application_snapshot(uuid)
from public;

-- ============================================================
-- 4. ROW LEVEL SECURITY
-- ============================================================

alter table public.project_applications
enable row level security;

drop policy if exists "Applicants can view their applications"
on public.project_applications;

drop policy if exists "Ecosystem admins can view applications"
on public.project_applications;

drop policy if exists "Applicants can create applications"
on public.project_applications;

drop policy if exists "Applicants can update editable applications"
on public.project_applications;

drop policy if exists "Applicants can delete draft applications"
on public.project_applications;

create policy "Applicants can view their applications"
on public.project_applications
for select
to authenticated
using (
  applicant_profile_id = auth.uid()
);

create policy "Ecosystem admins can view applications"
on public.project_applications
for select
to authenticated
using (
  public.current_profile_role() in (
    'ecosystem_admin',
    'super_admin'
  )
);

create policy "Applicants can create applications"
on public.project_applications
for insert
to authenticated
with check (
  applicant_profile_id = auth.uid()

  and exists (
    select 1
    from public.projects
    where projects.id =
      project_applications.project_id
      and projects.owner_id = auth.uid()
  )

  and public.can_manage_workspace_actor(
    actor_type,
    actor_id,
    auth.uid()
  )

  and status = 'draft'
);

create policy "Applicants can update editable applications"
on public.project_applications
for update
to authenticated
using (
  applicant_profile_id = auth.uid()
  and status in (
    'draft',
    'changes_requested'
  )
)
with check (
  applicant_profile_id = auth.uid()
  and status in (
    'draft',
    'changes_requested'
  )
);

create policy "Applicants can delete draft applications"
on public.project_applications
for delete
to authenticated
using (
  applicant_profile_id = auth.uid()
  and status = 'draft'
);

-- ============================================================
-- 5. PERMISOS DE TABLA
-- ============================================================

revoke all
on public.project_applications
from anon, authenticated;

grant select
on public.project_applications
to authenticated;

grant insert (
  project_id,
  actor_type,
  actor_id,
  application_type,
  requested_routes,
  public_summary,
  ecosystem_offer,
  ecosystem_needs,
  target_audience,
  geographic_scope,
  product_details,
  experience_details,
  campaign_details
)
on public.project_applications
to authenticated;

grant update (
  application_type,
  requested_routes,
  public_summary,
  ecosystem_offer,
  ecosystem_needs,
  target_audience,
  geographic_scope,
  product_details,
  experience_details,
  campaign_details
)
on public.project_applications
to authenticated;

grant delete
on public.project_applications
to authenticated;

-- ============================================================
-- 6. ENVIAR A REVISIÓN
-- ============================================================

create or replace function public.submit_project_application(
  target_application_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  application_record public.project_applications%rowtype;
  project_record public.projects%rowtype;
  wholesale_price numeric;
  proposed_ticket_price numeric;
begin
  select *
  into application_record
  from public.project_applications
  where id = target_application_id;

  if application_record.id is null then
    raise exception
      'La aplicación no existe';
  end if;

  if application_record.applicant_profile_id <> auth.uid() then
    raise exception
      'No tienes permiso para enviar esta aplicación';
  end if;

  if application_record.status not in (
    'draft',
    'changes_requested'
  ) then
    raise exception
      'La aplicación no se puede enviar desde su estado actual';
  end if;

  if trim(application_record.public_summary) = ''
    or trim(application_record.ecosystem_offer) = ''
    or trim(application_record.ecosystem_needs) = ''
    or trim(application_record.target_audience) = ''
    or cardinality(application_record.requested_routes) = 0
  then
    raise exception
      'Completa el resumen, la oferta, las necesidades, el público y al menos una ruta solicitada';
  end if;

  select *
  into project_record
  from public.projects
  where id = application_record.project_id
    and owner_id = auth.uid();

  if project_record.id is null then
    raise exception
      'No tienes acceso al proyecto relacionado';
  end if;

  if not public.can_manage_workspace_actor(
    application_record.actor_type,
    application_record.actor_id,
    auth.uid()
  ) then
    raise exception
      'Ya no tienes permiso para actuar desde esta identidad';
  end if;

  if application_record.application_type = 'product' then
    if application_record.product_details is null then
      raise exception
        'Completa la información comercial del producto';
    end if;

    wholesale_price :=
      nullif(
        application_record.product_details ->>
          'wholesalePrice',
        ''
      )::numeric;

    proposed_ticket_price :=
      nullif(
        application_record.product_details ->>
          'proposedTicketPrice',
        ''
      )::numeric;

    if wholesale_price is null
      or proposed_ticket_price is null
      or wholesale_price < 0
      or proposed_ticket_price <= wholesale_price
    then
      raise exception
        'El precio integrado al ticket debe ser mayor que el precio mayorista';
    end if;

    application_record.product_details :=
      jsonb_set(
        application_record.product_details,
        '{marginPerUnit}',
        to_jsonb(
          proposed_ticket_price -
          wholesale_price
        ),
        true
      );
  end if;

  update public.project_applications
  set
    snapshot =
      public.build_project_application_snapshot(
        application_record.project_id
      ),

    product_details =
      application_record.product_details,

    status = 'submitted',

    decision = null,

    reviewer_profile_id = null,

    reviewer_note = null,

    submitted_at = now(),

    reviewed_at = null

  where id = target_application_id;

  update public.projects
  set
    workflow_status =
      'eligibility_requested'

  where id =
      application_record.project_id

    and owner_id =
      auth.uid()

    and workflow_status in (
      'private',
      'eligibility_rejected'
    );
end;
$$;

revoke all
on function public.submit_project_application(uuid)
from public;

grant execute
on function public.submit_project_application(uuid)
to authenticated;

-- ============================================================
-- 7. MARCAR COMO EN REVISIÓN
-- ============================================================

create or replace function public.start_project_application_review(
  target_application_id uuid
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
      'member'
    );

  if requester_role not in (
    'ecosystem_admin',
    'super_admin'
  ) then
    raise exception
      'No tienes permiso para revisar aplicaciones';
  end if;

  update public.project_applications
  set
    status = 'under_review',
    reviewer_profile_id = auth.uid()

  where id = target_application_id
    and status = 'submitted';

  if not found then
    raise exception
      'La aplicación no está disponible para iniciar revisión';
  end if;
end;
$$;

revoke all
on function public.start_project_application_review(uuid)
from public;

grant execute
on function public.start_project_application_review(uuid)
to authenticated;

-- ============================================================
-- 8. DECIDIR UNA APLICACIÓN
-- ============================================================

create or replace function public.review_project_application(
  target_application_id uuid,
  requested_status text,
  requested_decision text,
  requested_note text default ''
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  requester_role text;
  application_record public.project_applications%rowtype;
begin
  requester_role :=
    coalesce(
      public.current_profile_role(),
      'member'
    );

  if requester_role not in (
    'ecosystem_admin',
    'super_admin'
  ) then
    raise exception
      'No tienes permiso para decidir aplicaciones';
  end if;

  if requested_status not in (
    'accepted',
    'changes_requested',
    'rejected'
  ) then
    raise exception
      'Estado de decisión no permitido';
  end if;

  if requested_decision not in (
    'connections',
    'experience',
    'ticket_distribution',
    'brand_activation',
    'funding',
    'editorial_referral',
    'changes_required',
    'not_eligible'
  ) then
    raise exception
      'Decisión no permitida';
  end if;

  if requested_status = 'changes_requested'
    and requested_decision <> 'changes_required'
  then
    raise exception
      'Una solicitud de cambios debe usar la decisión changes_required';
  end if;

  if requested_status = 'rejected'
    and requested_decision <> 'not_eligible'
  then
    raise exception
      'Un rechazo debe usar la decisión not_eligible';
  end if;

  if requested_status = 'accepted'
    and requested_decision in (
      'changes_required',
      'not_eligible'
    )
  then
    raise exception
      'La decisión seleccionada no corresponde a una aceptación';
  end if;

  select *
  into application_record
  from public.project_applications
  where id = target_application_id;

  if application_record.id is null then
    raise exception
      'La aplicación no existe';
  end if;

  if application_record.status not in (
    'submitted',
    'under_review'
  ) then
    raise exception
      'La aplicación no está pendiente de decisión';
  end if;

  if requested_status in (
    'changes_requested',
    'rejected'
  )
    and trim(coalesce(requested_note, '')) = ''
  then
    raise exception
      'Explica los ajustes requeridos o el motivo del rechazo';
  end if;

  update public.project_applications
  set
    status = requested_status,

    decision = requested_decision,

    reviewer_profile_id = auth.uid(),

    reviewer_note =
      nullif(
        trim(
          coalesce(
            requested_note,
            ''
          )
        ),
        ''
      ),

    reviewed_at = now()

  where id = target_application_id;

  update public.projects
  set
    workflow_status =
      case
        when requested_status = 'accepted'
          then 'eligible'
        else 'eligibility_rejected'
      end,

    eligibility_note =
      nullif(
        trim(
          coalesce(
            requested_note,
            ''
          )
        ),
        ''
      )

  where id =
      application_record.project_id

    and workflow_status =
      'eligibility_requested';
end;
$$;

revoke all
on function public.review_project_application(
  uuid,
  text,
  text,
  text
)
from public;

grant execute
on function public.review_project_application(
  uuid,
  text,
  text,
  text
)
to authenticated;

-- ============================================================
-- 9. COLA SEGURA PARA ADMINISTRACIÓN
-- ============================================================

create or replace function public.list_project_applications_for_review()
returns table (
  application_id uuid,
  project_id uuid,
  applicant_profile_id uuid,
  applicant_name text,
  applicant_email text,
  actor_type text,
  actor_id uuid,
  actor_name text,
  application_type text,
  requested_routes text[],
  public_summary text,
  ecosystem_offer text,
  ecosystem_needs text,
  target_audience text,
  geographic_scope text,
  snapshot jsonb,
  product_details jsonb,
  experience_details jsonb,
  campaign_details jsonb,
  application_status text,
  application_decision text,
  reviewer_note text,
  submitted_at timestamptz,
  created_at timestamptz
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

  if requester_role not in (
    'ecosystem_admin',
    'super_admin'
  ) then
    raise exception
      'No tienes permiso para consultar esta cola';
  end if;

  return query
  select
    applications.id,

    applications.project_id,

    applications.applicant_profile_id,

    coalesce(
      nullif(profiles.full_name, ''),
      profiles.email,
      'Cuenta del ecosistema'
    ),

    coalesce(
      profiles.email,
      ''
    ),

    applications.actor_type,

    applications.actor_id,

    case applications.actor_type
      when 'person' then
        coalesce(
          (
            select people.full_name
            from public.people
            where people.id =
              applications.actor_id
          ),
          'Persona'
        )

      when 'space' then
        coalesce(
          (
            select spaces.name
            from public.spaces
            where spaces.id =
              applications.actor_id
          ),
          'Espacio'
        )

      when 'funder' then
        coalesce(
          (
            select funders.name
            from public.funders
            where funders.id =
              applications.actor_id
          ),
          'Marca u organización'
        )

      else 'Actor'
    end,

    applications.application_type,

    applications.requested_routes,

    applications.public_summary,

    applications.ecosystem_offer,

    applications.ecosystem_needs,

    applications.target_audience,

    applications.geographic_scope,

    applications.snapshot,

    applications.product_details,

    applications.experience_details,

    applications.campaign_details,

    applications.status,

    applications.decision,

    applications.reviewer_note,

    applications.submitted_at,

    applications.created_at

  from public.project_applications
    as applications

  left join public.profiles
    on profiles.id =
      applications.applicant_profile_id

  where applications.status in (
    'submitted',
    'under_review'
  )

  order by
    applications.submitted_at asc nulls last,
    applications.created_at asc;
end;
$$;

revoke all
on function public.list_project_applications_for_review()
from public;

grant execute
on function public.list_project_applications_for_review()
to authenticated;

commit;