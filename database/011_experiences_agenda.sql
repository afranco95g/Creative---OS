-- ============================================================
-- CULTURA ESTÁ
-- Migración 011
-- Experiencias, eventos y agenda cultural
-- ============================================================

begin;

-- ============================================================
-- 1. TABLA PRINCIPAL
-- ============================================================

create table if not exists public.experiences (
  id uuid primary key default gen_random_uuid(),

  owner_id uuid not null default auth.uid()
    references public.profiles(id)
    on delete restrict,

  project_id uuid
    references public.projects(id)
    on delete set null,

  host_space_id uuid
    references public.spaces(id)
    on delete set null,

  title text not null,

  slug text not null unique default '',

  summary text not null default '',

  description text not null default '',

  experience_type text not null default 'event'
    check (
      experience_type in (
        'event',
        'workshop',
        'class',
        'laboratory',
        'exhibition',
        'concert',
        'meeting',
        'activation',
        'residency',
        'call',
        'other'
      )
    ),

  city text,

  venue_name text,

  address text,

  starts_at timestamptz not null,

  ends_at timestamptz,

  capacity integer
    check (
      capacity is null
      or capacity >= 0
    ),

  ticket_url text,

  cover_image_url text,

  status text not null default 'draft'
    check (
      status in (
        'draft',
        'submitted',
        'published',
        'rejected',
        'cancelled',
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

  constraint experiences_date_order_check
  check (
    ends_at is null
    or ends_at > starts_at
  )
);

create index if not exists experiences_owner_idx
on public.experiences(owner_id);

create index if not exists experiences_project_idx
on public.experiences(project_id);

create index if not exists experiences_space_idx
on public.experiences(host_space_id);

create index if not exists experiences_status_idx
on public.experiences(status);

create index if not exists experiences_starts_at_idx
on public.experiences(starts_at);

-- ============================================================
-- 2. PREPARAR REGISTRO Y SLUG
-- ============================================================

create or replace function public.prepare_experience_record()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  slug_base text;
begin
  if new.id is null then
    new.id := gen_random_uuid();
  end if;

  if new.owner_id is null then
    new.owner_id := auth.uid();
  end if;

  if tg_op = 'UPDATE' then
    new.owner_id := old.owner_id;
  end if;

  if new.slug is null
    or trim(new.slug) = ''
  then
    slug_base :=
      lower(
        coalesce(
          nullif(trim(new.title), ''),
          'experiencia'
        )
      );

    slug_base :=
      translate(
        slug_base,
        'áéíóúüñ',
        'aeiouun'
      );

    slug_base :=
      regexp_replace(
        slug_base,
        '[^a-z0-9]+',
        '-',
        'g'
      );

    slug_base :=
      trim(
        both '-'
        from slug_base
      );

    new.slug :=
      coalesce(
        nullif(slug_base, ''),
        'experiencia'
      )
      || '-'
      || substring(
        new.id::text,
        1,
        8
      );
  end if;

  new.updated_at := now();

  return new;
end;
$$;

drop trigger if exists experiences_prepare_record
on public.experiences;

create trigger experiences_prepare_record
before insert or update
on public.experiences
for each row
execute function public.prepare_experience_record();

-- ============================================================
-- 3. ROW LEVEL SECURITY
-- ============================================================

alter table public.experiences
enable row level security;

drop policy if exists "Public can view published experiences"
on public.experiences;

drop policy if exists "Owners can view their experiences"
on public.experiences;

drop policy if exists "Admins can view all experiences"
on public.experiences;

drop policy if exists "Authenticated users can create experiences"
on public.experiences;

drop policy if exists "Owners can update editable experiences"
on public.experiences;

drop policy if exists "Admins can manage experiences"
on public.experiences;

create policy "Public can view published experiences"
on public.experiences
for select
to anon, authenticated
using (
  status = 'published'
);

create policy "Owners can view their experiences"
on public.experiences
for select
to authenticated
using (
  owner_id = auth.uid()
);

create policy "Admins can view all experiences"
on public.experiences
for select
to authenticated
using (
  public.current_profile_role() in (
    'ecosystem_admin',
    'media_admin',
    'super_admin'
  )
);

create policy "Authenticated users can create experiences"
on public.experiences
for insert
to authenticated
with check (
  owner_id = auth.uid()
  and status = 'draft'
);

create policy "Owners can update editable experiences"
on public.experiences
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

create policy "Admins can manage experiences"
on public.experiences
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
on public.experiences
to anon, authenticated;

grant insert, update
on public.experiences
to authenticated;

-- ============================================================
-- 4. ENVIAR EXPERIENCIA A REVISIÓN
-- ============================================================

create or replace function public.submit_experience_for_review(
  target_experience_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  experience_record public.experiences%rowtype;
  requester_role text;
begin
  requester_role :=
    coalesce(
      public.current_profile_role(),
      'member'
    );

  select *
  into experience_record
  from public.experiences
  where id = target_experience_id;

  if experience_record.id is null then
    raise exception
      'La experiencia no existe';
  end if;

  if experience_record.owner_id <> auth.uid()
    and requester_role not in (
      'ecosystem_admin',
      'media_admin',
      'super_admin'
    )
  then
    raise exception
      'No tienes permiso para enviar esta experiencia';
  end if;

  if experience_record.status not in (
    'draft',
    'rejected'
  ) then
    raise exception
      'La experiencia no se puede enviar desde su estado actual';
  end if;

  if trim(experience_record.title) = ''
    or trim(experience_record.summary) = ''
    or trim(
      coalesce(
        experience_record.city,
        ''
      )
    ) = ''
    or trim(
      coalesce(
        experience_record.venue_name,
        ''
      )
    ) = ''
  then
    raise exception
      'Completa título, resumen, ciudad y lugar antes de solicitar publicación';
  end if;

  update public.experiences
  set
    status = 'submitted',
    review_note = '',
    reviewed_by = null,
    reviewed_at = null
  where id = target_experience_id;
end;
$$;

revoke all
on function public.submit_experience_for_review(uuid)
from public;

grant execute
on function public.submit_experience_for_review(uuid)
to authenticated;

-- ============================================================
-- 5. REVISAR Y PUBLICAR
-- ============================================================

create or replace function public.review_experience_publication(
  target_experience_id uuid,
  approve_experience boolean,
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
      'No tienes permiso para revisar experiencias';
  end if;

  select status
  into current_status
  from public.experiences
  where id = target_experience_id;

  if current_status is null then
    raise exception
      'La experiencia no existe';
  end if;

  if current_status <> 'submitted' then
    raise exception
      'La experiencia no está pendiente de revisión';
  end if;

  if approve_experience then
    update public.experiences
    set
      status = 'published',
      review_note = coalesce(
        reviewer_note,
        ''
      ),
      reviewed_by = auth.uid(),
      reviewed_at = now(),
      published_at = now()
    where id = target_experience_id;
  else
    update public.experiences
    set
      status = 'rejected',
      review_note = coalesce(
        reviewer_note,
        ''
      ),
      reviewed_by = auth.uid(),
      reviewed_at = now(),
      published_at = null
    where id = target_experience_id;
  end if;
end;
$$;

revoke all
on function public.review_experience_publication(
  uuid,
  boolean,
  text
)
from public;

grant execute
on function public.review_experience_publication(
  uuid,
  boolean,
  text
)
to authenticated;

-- ============================================================
-- 6. EXPERIENCIAS ADMINISTRABLES
-- ============================================================

create or replace function public.list_manageable_experiences()
returns table (
  id uuid,
  owner_id uuid,
  owner_name text,
  title text,
  slug text,
  summary text,
  description text,
  experience_type text,
  city text,
  venue_name text,
  address text,
  starts_at timestamptz,
  ends_at timestamptz,
  capacity integer,
  ticket_url text,
  cover_image_url text,
  experience_status text,
  review_note text,
  project_id uuid,
  host_space_id uuid,
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
  reviewer_access boolean;
begin
  requester_role :=
    coalesce(
      public.current_profile_role(),
      'member'
    );

  reviewer_access :=
    requester_role in (
      'ecosystem_admin',
      'media_admin',
      'super_admin'
    );

  return query
  select
    experiences.id,
    experiences.owner_id,
    coalesce(
      nullif(profiles.full_name, ''),
      profiles.email,
      'Usuario del ecosistema'
    ),
    experiences.title,
    experiences.slug,
    experiences.summary,
    experiences.description,
    experiences.experience_type,
    experiences.city,
    experiences.venue_name,
    experiences.address,
    experiences.starts_at,
    experiences.ends_at,
    experiences.capacity,
    experiences.ticket_url,
    experiences.cover_image_url,
    experiences.status,
    experiences.review_note,
    experiences.project_id,
    experiences.host_space_id,
    experiences.published_at,
    experiences.owner_id = auth.uid(),
    reviewer_access

  from public.experiences

  left join public.profiles
    on profiles.id =
      experiences.owner_id

  where experiences.owner_id =
      auth.uid()
    or reviewer_access

  order by
    case
      when experiences.status = 'submitted'
        then 0
      when experiences.status = 'draft'
        then 1
      when experiences.status = 'rejected'
        then 2
      when experiences.status = 'published'
        then 3
      else 4
    end,
    experiences.starts_at;
end;
$$;

revoke all
on function public.list_manageable_experiences()
from public;

grant execute
on function public.list_manageable_experiences()
to authenticated;

-- ============================================================
-- 7. AGENDA PÚBLICA
-- ============================================================

create or replace function public.list_published_experiences(
  result_limit integer default 50
)
returns table (
  id uuid,
  title text,
  slug text,
  summary text,
  description text,
  experience_type text,
  city text,
  venue_name text,
  address text,
  starts_at timestamptz,
  ends_at timestamptz,
  capacity integer,
  ticket_url text,
  cover_image_url text,
  project_id uuid,
  host_space_id uuid
)
language sql
stable
security definer
set search_path = public
as $$
  select
    experiences.id,
    experiences.title,
    experiences.slug,
    experiences.summary,
    experiences.description,
    experiences.experience_type,
    experiences.city,
    experiences.venue_name,
    experiences.address,
    experiences.starts_at,
    experiences.ends_at,
    experiences.capacity,
    experiences.ticket_url,
    experiences.cover_image_url,
    experiences.project_id,
    experiences.host_space_id

  from public.experiences

  where experiences.status = 'published'
    and coalesce(
      experiences.ends_at,
      experiences.starts_at
    ) >= now()

  order by
    experiences.starts_at

  limit greatest(
    1,
    least(
      result_limit,
      100
    )
  );
$$;

revoke all
on function public.list_published_experiences(integer)
from public;

grant execute
on function public.list_published_experiences(integer)
to anon, authenticated;

commit;