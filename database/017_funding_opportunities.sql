-- ============================================================
-- CULTURA ESTÁ
-- Migración 017
-- Oportunidades de financiación
-- ============================================================

begin;

-- ============================================================
-- 1. TABLA PRINCIPAL
-- ============================================================

create table if not exists public.funding_opportunities (
  id uuid primary key default gen_random_uuid(),

  owner_id uuid not null
    references public.profiles(id)
    on delete restrict,

  title text not null default '',

  summary text not null default '',

  description text not null default '',

  opportunity_type text not null default 'grant'
    check (
      opportunity_type in (
        'grant',
        'sponsorship',
        'commission',
        'partnership',
        'residency',
        'call',
        'other'
      )
    ),

  amount_min numeric(14, 2)
    check (
      amount_min is null
      or amount_min >= 0
    ),

  amount_max numeric(14, 2)
    check (
      amount_max is null
      or amount_max >= 0
    ),

  currency text not null default 'COP'
    check (
      currency in (
        'COP',
        'USD',
        'EUR'
      )
    ),

  opens_at date,

  closes_at date,

  eligibility text not null default '',

  required_documents text[] not null default '{}',

  status text not null default 'draft'
    check (
      status in (
        'draft',
        'submitted',
        'published',
        'rejected',
        'closed',
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

  updated_at timestamptz not null default now(),

  check (
    amount_min is null
    or amount_max is null
    or amount_max >= amount_min
  ),

  check (
    opens_at is null
    or closes_at is null
    or closes_at >= opens_at
  )
);

create index if not exists
  funding_opportunities_owner_idx
on public.funding_opportunities(
  owner_id
);

create index if not exists
  funding_opportunities_status_idx
on public.funding_opportunities(
  status
);

create index if not exists
  funding_opportunities_closes_at_idx
on public.funding_opportunities(
  closes_at
);

-- ============================================================
-- 2. PREPARAR REGISTRO
-- ============================================================

create or replace function public.prepare_funding_opportunity_record()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    if new.owner_id is null then
      new.owner_id :=
        auth.uid();
    end if;
  end if;

  if tg_op = 'UPDATE'
    and new.owner_id <>
      old.owner_id
  then
    raise exception
      'No se puede cambiar el propietario de una oportunidad';
  end if;

  new.updated_at :=
    now();

  return new;
end;
$$;

drop trigger if exists
  funding_opportunities_prepare_record
on public.funding_opportunities;

create trigger
  funding_opportunities_prepare_record
before insert or update
on public.funding_opportunities
for each row
execute function
  public.prepare_funding_opportunity_record();

-- ============================================================
-- 3. ROW LEVEL SECURITY
-- ============================================================

alter table public.funding_opportunities
enable row level security;

drop policy if exists
  "Public can view published opportunities"
on public.funding_opportunities;

drop policy if exists
  "Owners can view their opportunities"
on public.funding_opportunities;

drop policy if exists
  "Admins can view all opportunities"
on public.funding_opportunities;

drop policy if exists
  "Users can create opportunities"
on public.funding_opportunities;

drop policy if exists
  "Owners can update editable opportunities"
on public.funding_opportunities;

drop policy if exists
  "Admins can manage opportunities"
on public.funding_opportunities;

create policy
  "Public can view published opportunities"
on public.funding_opportunities
for select
to anon, authenticated
using (
  status = 'published'
);

create policy
  "Owners can view their opportunities"
on public.funding_opportunities
for select
to authenticated
using (
  owner_id = auth.uid()
);

create policy
  "Admins can view all opportunities"
on public.funding_opportunities
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
  "Users can create opportunities"
on public.funding_opportunities
for insert
to authenticated
with check (
  owner_id = auth.uid()
  and status = 'draft'
);

create policy
  "Owners can update editable opportunities"
on public.funding_opportunities
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
  "Admins can manage opportunities"
on public.funding_opportunities
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
on public.funding_opportunities
to anon, authenticated;

grant insert, update
on public.funding_opportunities
to authenticated;

-- ============================================================
-- 4. LISTADO ADMINISTRATIVO
-- ============================================================

create or replace function public.list_manageable_funding_opportunities()
returns table (
  id uuid,
  owner_id uuid,
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

  opportunity_status text,
  review_note text,
  published_at timestamptz,

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
begin
  requester_role :=
    coalesce(
      public.current_profile_role(),
      'member'
    );

  return query

  select
    opportunities.id,
    opportunities.owner_id,

    coalesce(
      nullif(
        profiles.full_name,
        ''
      ),
      profiles.email,
      'Usuario del ecosistema'
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

    opportunities.status,
    opportunities.review_note,
    opportunities.published_at,

    opportunities.owner_id =
      auth.uid(),

    requester_role in (
      'ecosystem_admin',
      'media_admin',
      'super_admin'
    )

  from public.funding_opportunities
    as opportunities

  left join public.profiles
    on profiles.id =
      opportunities.owner_id

  where
    opportunities.owner_id =
      auth.uid()

    or requester_role in (
      'ecosystem_admin',
      'media_admin',
      'super_admin'
    )

  order by
    opportunities.created_at desc;
end;
$$;

revoke all
on function public.list_manageable_funding_opportunities()
from public;

grant execute
on function public.list_manageable_funding_opportunities()
to authenticated;

-- ============================================================
-- 5. GUARDAR BORRADOR
-- ============================================================

create or replace function public.save_funding_opportunity(
  target_opportunity_id uuid,

  target_title text,
  target_summary text,
  target_description text,
  target_opportunity_type text,

  target_amount_min numeric,
  target_amount_max numeric,
  target_currency text,

  target_opens_at date,
  target_closes_at date,

  target_eligibility text,
  target_required_documents text[]
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  requester_role text;

  current_record
    public.funding_opportunities%rowtype;

  saved_id uuid;
begin
  requester_role :=
    coalesce(
      public.current_profile_role(),
      'member'
    );

  if auth.uid() is null then
    raise exception
      'Debes iniciar sesión para crear una oportunidad';
  end if;

  if target_opportunity_type not in (
    'grant',
    'sponsorship',
    'commission',
    'partnership',
    'residency',
    'call',
    'other'
  ) then
    raise exception
      'El tipo de oportunidad no es válido';
  end if;

  if target_currency not in (
    'COP',
    'USD',
    'EUR'
  ) then
    raise exception
      'La moneda seleccionada no es válida';
  end if;

  if coalesce(
    target_amount_min,
    0
  ) < 0
  then
    raise exception
      'El monto mínimo no puede ser negativo';
  end if;

  if coalesce(
    target_amount_max,
    0
  ) < 0
  then
    raise exception
      'El monto máximo no puede ser negativo';
  end if;

  if target_amount_min is not null
    and target_amount_max is not null
    and target_amount_max <
      target_amount_min
  then
    raise exception
      'El monto máximo debe ser mayor o igual al mínimo';
  end if;

  if target_opens_at is not null
    and target_closes_at is not null
    and target_closes_at <
      target_opens_at
  then
    raise exception
      'La fecha de cierre debe ser posterior a la apertura';
  end if;

  if target_opportunity_id is null then
    insert into public.funding_opportunities (
      owner_id,

      title,
      summary,
      description,
      opportunity_type,

      amount_min,
      amount_max,
      currency,

      opens_at,
      closes_at,

      eligibility,
      required_documents,

      status
    )
    values (
      auth.uid(),

      trim(
        coalesce(
          target_title,
          ''
        )
      ),

      trim(
        coalesce(
          target_summary,
          ''
        )
      ),

      trim(
        coalesce(
          target_description,
          ''
        )
      ),

      target_opportunity_type,

      target_amount_min,
      target_amount_max,
      target_currency,

      target_opens_at,
      target_closes_at,

      trim(
        coalesce(
          target_eligibility,
          ''
        )
      ),

      coalesce(
        target_required_documents,
        '{}'::text[]
      ),

      'draft'
    )

    returning id
    into saved_id;

    return saved_id;
  end if;

  select *
  into current_record
  from public.funding_opportunities
  where id =
    target_opportunity_id;

  if current_record.id is null then
    raise exception
      'La oportunidad no existe';
  end if;

  if current_record.owner_id <>
      auth.uid()

    and requester_role not in (
      'ecosystem_admin',
      'media_admin',
      'super_admin'
    )
  then
    raise exception
      'No tienes permiso para editar esta oportunidad';
  end if;

  if current_record.status not in (
    'draft',
    'rejected'
  ) then
    raise exception
      'La oportunidad no puede editarse desde su estado actual';
  end if;

  update public.funding_opportunities
  set
    title =
      trim(
        coalesce(
          target_title,
          ''
        )
      ),

    summary =
      trim(
        coalesce(
          target_summary,
          ''
        )
      ),

    description =
      trim(
        coalesce(
          target_description,
          ''
        )
      ),

    opportunity_type =
      target_opportunity_type,

    amount_min =
      target_amount_min,

    amount_max =
      target_amount_max,

    currency =
      target_currency,

    opens_at =
      target_opens_at,

    closes_at =
      target_closes_at,

    eligibility =
      trim(
        coalesce(
          target_eligibility,
          ''
        )
      ),

    required_documents =
      coalesce(
        target_required_documents,
        '{}'::text[]
      ),

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

  where id =
    target_opportunity_id

  returning id
  into saved_id;

  return saved_id;
end;
$$;

revoke all
on function public.save_funding_opportunity(
  uuid,
  text,
  text,
  text,
  text,
  numeric,
  numeric,
  text,
  date,
  date,
  text,
  text[]
)
from public;

grant execute
on function public.save_funding_opportunity(
  uuid,
  text,
  text,
  text,
  text,
  numeric,
  numeric,
  text,
  date,
  date,
  text,
  text[]
)
to authenticated;

-- ============================================================
-- 6. ENVIAR A REVISIÓN
-- ============================================================

create or replace function public.submit_funding_opportunity(
  target_opportunity_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  opportunity_record
    public.funding_opportunities%rowtype;
begin
  select *
  into opportunity_record
  from public.funding_opportunities

  where id =
    target_opportunity_id;

  if opportunity_record.id is null then
    raise exception
      'La oportunidad no existe';
  end if;

  if opportunity_record.owner_id <>
    auth.uid()
  then
    raise exception
      'No tienes permiso para enviar esta oportunidad';
  end if;

  if opportunity_record.status not in (
    'draft',
    'rejected'
  ) then
    raise exception
      'La oportunidad no puede enviarse desde su estado actual';
  end if;

  if trim(
    opportunity_record.title
  ) = ''
  then
    raise exception
      'Completa el título';
  end if;

  if trim(
    opportunity_record.summary
  ) = ''
  then
    raise exception
      'Completa el resumen';
  end if;

  if trim(
    opportunity_record.description
  ) = ''
  then
    raise exception
      'Completa la descripción';
  end if;

  if trim(
    opportunity_record.eligibility
  ) = ''
  then
    raise exception
      'Completa los criterios de elegibilidad';
  end if;

  update public.funding_opportunities
  set
    status =
      'submitted',

    review_note =
      '',

    reviewed_by =
      null,

    reviewed_at =
      null

  where id =
    target_opportunity_id;
end;
$$;

revoke all
on function public.submit_funding_opportunity(uuid)
from public;

grant execute
on function public.submit_funding_opportunity(uuid)
to authenticated;

-- ============================================================
-- 7. REVISIÓN ADMINISTRATIVA
-- ============================================================

create or replace function public.review_funding_opportunity(
  target_opportunity_id uuid,
  approve_opportunity boolean,
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
      'No tienes permiso para revisar oportunidades';
  end if;

  select status
  into current_status
  from public.funding_opportunities
  where id =
    target_opportunity_id;

  if current_status is null then
    raise exception
      'La oportunidad no existe';
  end if;

  if current_status <>
    'submitted'
  then
    raise exception
      'La oportunidad no está pendiente de revisión';
  end if;

  update public.funding_opportunities
  set
    status =
      case
        when approve_opportunity
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
        when approve_opportunity
          then now()
        else null
      end

  where id =
    target_opportunity_id;
end;
$$;

revoke all
on function public.review_funding_opportunity(
  uuid,
  boolean,
  text
)
from public;

grant execute
on function public.review_funding_opportunity(
  uuid,
  boolean,
  text
)
to authenticated;

-- ============================================================
-- 8. LISTADO PÚBLICO
-- ============================================================

create or replace function public.list_published_funding_opportunities()
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

  published_at timestamptz
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

    opportunities.published_at

  from public.funding_opportunities
    as opportunities

  left join public.profiles
    on profiles.id =
      opportunities.owner_id

  where
    opportunities.status =
      'published'

    and (
      opportunities.closes_at is null
      or opportunities.closes_at >=
        current_date
    )

  order by
    opportunities.closes_at asc nulls last,
    opportunities.published_at desc;
$$;

revoke all
on function public.list_published_funding_opportunities()
from public;

grant execute
on function public.list_published_funding_opportunities()
to anon, authenticated;

commit;