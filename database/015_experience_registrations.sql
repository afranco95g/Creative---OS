-- ============================================================
-- CULTURA ESTÁ
-- Migración 015
-- Inscripciones, asistentes y entradas digitales
-- ============================================================

begin;

-- ============================================================
-- 1. TABLA DE INSCRIPCIONES
-- ============================================================

create table if not exists public.experience_registrations (
  id uuid primary key default gen_random_uuid(),

  experience_id uuid not null
    references public.experiences(id)
    on delete cascade,

  user_id uuid
    references public.profiles(id)
    on delete set null,

  attendee_name text not null,

  attendee_email text not null,

  attendee_phone text,

  attendees_count integer not null default 1
    check (
      attendees_count >= 1
      and attendees_count <= 10
    ),

  status text not null default 'registered'
    check (
      status in (
        'registered',
        'attended',
        'cancelled'
      )
    ),

  ticket_token uuid not null unique
    default gen_random_uuid(),

  ticket_code text not null unique
    default (
      'CE-' ||
      upper(
        substring(
          replace(
            gen_random_uuid()::text,
            '-',
            ''
          ),
          1,
          12
        )
      )
    ),

  checked_in_at timestamptz,

  created_at timestamptz not null
    default now(),

  updated_at timestamptz not null
    default now()
);

create index if not exists
  experience_registrations_experience_idx
on public.experience_registrations(
  experience_id
);

create index if not exists
  experience_registrations_user_idx
on public.experience_registrations(
  user_id
);

create index if not exists
  experience_registrations_status_idx
on public.experience_registrations(
  status
);

create index if not exists
  experience_registrations_ticket_token_idx
on public.experience_registrations(
  ticket_token
);

create unique index if not exists
  experience_registrations_active_email_idx
on public.experience_registrations (
  experience_id,
  lower(
    trim(
      attendee_email
    )
  )
)
where status in (
  'registered',
  'attended'
);

-- ============================================================
-- 2. UPDATED AT
-- ============================================================

drop trigger if exists
  experience_registrations_set_updated_at
on public.experience_registrations;

create trigger
  experience_registrations_set_updated_at
before update
on public.experience_registrations
for each row
execute function public.set_updated_at();

-- ============================================================
-- 3. ROW LEVEL SECURITY
-- ============================================================

alter table public.experience_registrations
enable row level security;

drop policy if exists
  "Users can view their registrations"
on public.experience_registrations;

drop policy if exists
  "Experience managers can view registrations"
on public.experience_registrations;

create policy
  "Users can view their registrations"
on public.experience_registrations
for select
to authenticated
using (
  user_id = auth.uid()
);

create policy
  "Experience managers can view registrations"
on public.experience_registrations
for select
to authenticated
using (
  exists (
    select 1
    from public.experiences

    where experiences.id =
      experience_registrations.experience_id

      and (
        experiences.owner_id =
          auth.uid()

        or public.current_profile_role() in (
          'ecosystem_admin',
          'media_admin',
          'super_admin'
        )
      )
  )
);

grant select
on public.experience_registrations
to authenticated;

-- No se concede INSERT o UPDATE directo.
-- Las modificaciones se hacen mediante funciones controladas.

-- ============================================================
-- 4. DISPONIBILIDAD PÚBLICA
-- ============================================================

create or replace function public.get_experience_registration_availability(
  target_experience_id uuid
)
returns table (
  capacity integer,
  registered_count integer,
  remaining integer,
  registration_open boolean
)
language sql
stable
security definer
set search_path = public
as $$
  select
    experiences.capacity,

    coalesce(
      sum(
        case
          when registrations.status in (
            'registered',
            'attended'
          )
          then registrations.attendees_count
          else 0
        end
      ),
      0
    )::integer
      as registered_count,

    case
      when experiences.capacity is null
        then null

      else greatest(
        experiences.capacity -
        coalesce(
          sum(
            case
              when registrations.status in (
                'registered',
                'attended'
              )
              then registrations.attendees_count
              else 0
            end
          ),
          0
        )::integer,
        0
      )
    end
      as remaining,

    (
      experiences.status = 'published'

      and experiences.starts_at > now()

      and (
        experiences.capacity is null

        or coalesce(
          sum(
            case
              when registrations.status in (
                'registered',
                'attended'
              )
              then registrations.attendees_count
              else 0
            end
          ),
          0
        ) < experiences.capacity
      )
    )
      as registration_open

  from public.experiences

  left join public.experience_registrations
    as registrations

    on registrations.experience_id =
      experiences.id

  where experiences.id =
    target_experience_id

  group by
    experiences.id,
    experiences.capacity,
    experiences.status,
    experiences.starts_at;
$$;

revoke all
on function public.get_experience_registration_availability(uuid)
from public;

grant execute
on function public.get_experience_registration_availability(uuid)
to anon, authenticated;

-- ============================================================
-- 5. INSCRIPCIÓN PÚBLICA
-- ============================================================

create or replace function public.register_for_experience(
  target_experience_id uuid,
  target_attendee_name text,
  target_attendee_email text,
  target_attendee_phone text default null,
  target_attendees_count integer default 1
)
returns table (
  registration_id uuid,
  ticket_token uuid,
  ticket_code text,
  registration_status text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  experience_record public.experiences%rowtype;

  registration_record
    public.experience_registrations%rowtype;

  normalized_name text;
  normalized_email text;
  normalized_phone text;

  occupied_capacity integer;
begin
  normalized_name :=
    trim(
      coalesce(
        target_attendee_name,
        ''
      )
    );

  normalized_email :=
    lower(
      trim(
        coalesce(
          target_attendee_email,
          ''
        )
      )
    );

  normalized_phone :=
    nullif(
      trim(
        coalesce(
          target_attendee_phone,
          ''
        )
      ),
      ''
    );

  if normalized_name = '' then
    raise exception
      'Escribe el nombre de la persona asistente';
  end if;

  if normalized_email = '' then
    raise exception
      'Escribe un correo electrónico';
  end if;

  if normalized_email !~*
    '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$'
  then
    raise exception
      'El correo electrónico no es válido';
  end if;

  if target_attendees_count < 1
    or target_attendees_count > 10
  then
    raise exception
      'La cantidad de asistentes debe estar entre 1 y 10';
  end if;

  -- Bloquea temporalmente la experiencia para evitar
  -- sobreventa cuando dos personas se registran al mismo tiempo.
  select *
  into experience_record
  from public.experiences
  where id = target_experience_id
  for update;

  if experience_record.id is null then
    raise exception
      'La actividad no existe';
  end if;

  if experience_record.status <> 'published' then
    raise exception
      'La actividad no está disponible para inscripción';
  end if;

  if experience_record.starts_at <= now() then
    raise exception
      'La inscripción para esta actividad ya cerró';
  end if;

  if exists (
    select 1
    from public.experience_registrations

    where experience_id =
      target_experience_id

      and lower(
        trim(
          attendee_email
        )
      ) = normalized_email

      and status in (
        'registered',
        'attended'
      )
  ) then
    raise exception
      'Este correo ya tiene una inscripción activa';
  end if;

  select
    coalesce(
      sum(
        attendees_count
      ),
      0
    )::integer
  into occupied_capacity
  from public.experience_registrations

  where experience_id =
    target_experience_id

    and status in (
      'registered',
      'attended'
    );

  if experience_record.capacity is not null
    and (
      occupied_capacity +
      target_attendees_count
    ) > experience_record.capacity
  then
    raise exception
      'No hay suficientes cupos disponibles';
  end if;

  insert into public.experience_registrations (
    experience_id,
    user_id,
    attendee_name,
    attendee_email,
    attendee_phone,
    attendees_count,
    status
  )
  values (
    target_experience_id,
    auth.uid(),
    normalized_name,
    normalized_email,
    normalized_phone,
    target_attendees_count,
    'registered'
  )
  returning *
  into registration_record;

  return query
  select
    registration_record.id,
    registration_record.ticket_token,
    registration_record.ticket_code,
    registration_record.status;
end;
$$;

revoke all
on function public.register_for_experience(
  uuid,
  text,
  text,
  text,
  integer
)
from public;

grant execute
on function public.register_for_experience(
  uuid,
  text,
  text,
  text,
  integer
)
to anon, authenticated;

-- ============================================================
-- 6. ENTRADA DIGITAL PÚBLICA
-- ============================================================

create or replace function public.get_public_experience_ticket(
  target_ticket_token uuid
)
returns table (
  registration_id uuid,
  registration_status text,
  ticket_code text,

  attendee_name text,
  attendee_email text,
  attendees_count integer,

  experience_id uuid,
  experience_title text,
  experience_slug text,

  starts_at timestamptz,
  ends_at timestamptz,

  venue_name text,
  city text,
  address text,

  checked_in_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    registrations.id,
    registrations.status,
    registrations.ticket_code,

    registrations.attendee_name,
    registrations.attendee_email,
    registrations.attendees_count,

    experiences.id,
    experiences.title,
    experiences.slug,

    experiences.starts_at,
    experiences.ends_at,

    experiences.venue_name,
    experiences.city,
    experiences.address,

    registrations.checked_in_at

  from public.experience_registrations
    as registrations

  inner join public.experiences
    on experiences.id =
      registrations.experience_id

  where registrations.ticket_token =
    target_ticket_token

  limit 1;
$$;

revoke all
on function public.get_public_experience_ticket(uuid)
from public;

grant execute
on function public.get_public_experience_ticket(uuid)
to anon, authenticated;

-- ============================================================
-- 7. LISTADO DE ASISTENTES PARA EL ORGANIZADOR
-- ============================================================

create or replace function public.list_experience_attendees(
  target_experience_id uuid
)
returns table (
  registration_id uuid,
  attendee_name text,
  attendee_email text,
  attendee_phone text,
  attendees_count integer,
  registration_status text,
  ticket_code text,
  checked_in_at timestamptz,
  created_at timestamptz
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
      'La actividad no existe';
  end if;

  if experience_owner_id <> auth.uid()
    and requester_role not in (
      'ecosystem_admin',
      'media_admin',
      'super_admin'
    )
  then
    raise exception
      'No tienes permiso para consultar estos asistentes';
  end if;

  return query
  select
    registrations.id,
    registrations.attendee_name,
    registrations.attendee_email,
    registrations.attendee_phone,
    registrations.attendees_count,
    registrations.status,
    registrations.ticket_code,
    registrations.checked_in_at,
    registrations.created_at

  from public.experience_registrations
    as registrations

  where registrations.experience_id =
    target_experience_id

  order by
    case
      when registrations.status = 'registered'
        then 0
      when registrations.status = 'attended'
        then 1
      else 2
    end,

    registrations.created_at;
end;
$$;

revoke all
on function public.list_experience_attendees(uuid)
from public;

grant execute
on function public.list_experience_attendees(uuid)
to authenticated;

-- ============================================================
-- 8. CAMBIAR ESTADO DE UNA INSCRIPCIÓN
-- ============================================================

create or replace function public.update_experience_registration_status(
  target_registration_id uuid,
  target_status text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  requester_role text;

  registration_record
    public.experience_registrations%rowtype;

  experience_record
    public.experiences%rowtype;

  occupied_capacity integer;
begin
  requester_role :=
    coalesce(
      public.current_profile_role(),
      'member'
    );

  if target_status not in (
    'registered',
    'attended',
    'cancelled'
  ) then
    raise exception
      'Estado de inscripción no válido';
  end if;

  select *
  into registration_record
  from public.experience_registrations

  where id =
    target_registration_id;

  if registration_record.id is null then
    raise exception
      'La inscripción no existe';
  end if;

  select *
  into experience_record
  from public.experiences

  where id =
    registration_record.experience_id

  for update;

  if experience_record.owner_id <> auth.uid()
    and requester_role not in (
      'ecosystem_admin',
      'media_admin',
      'super_admin'
    )
  then
    raise exception
      'No tienes permiso para modificar esta inscripción';
  end if;

  if registration_record.status = 'cancelled'
    and target_status in (
      'registered',
      'attended'
    )
  then
    select
      coalesce(
        sum(
          attendees_count
        ),
        0
      )::integer
    into occupied_capacity
    from public.experience_registrations

    where experience_id =
      registration_record.experience_id

      and id <>
        registration_record.id

      and status in (
        'registered',
        'attended'
      );

    if experience_record.capacity is not null
      and (
        occupied_capacity +
        registration_record.attendees_count
      ) > experience_record.capacity
    then
      raise exception
        'No hay cupos suficientes para reactivar esta inscripción';
    end if;
  end if;

  update public.experience_registrations
  set
    status =
      target_status,

    checked_in_at =
      case
        when target_status = 'attended'
          then now()
        else null
      end

  where id =
    target_registration_id;
end;
$$;

revoke all
on function public.update_experience_registration_status(
  uuid,
  text
)
from public;

grant execute
on function public.update_experience_registration_status(
  uuid,
  text
)
to authenticated;

commit;