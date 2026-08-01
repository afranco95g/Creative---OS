-- ============================================================
-- CULTURA ESTÁ
-- Migración 003
-- Usuarios, actores y permisos del ecosistema
-- ============================================================

begin;

-- ============================================================
-- 1. PERFILES Y ROLES DE ACCESO
-- ============================================================

alter table public.profiles
add column if not exists onboarding_path text
not null default 'person';

alter table public.profiles
add column if not exists onboarding_status text
not null default 'not_started';

alter table public.profiles
add column if not exists is_active boolean
not null default true;

-- Convertir roles anteriores al nuevo sistema.
update public.profiles
set role = case
  when role = 'collaborator' then 'member'
  when role = 'editor' then 'journalist'
  when role = 'admin' then 'ecosystem_admin'
  else role
end;

alter table public.profiles
drop constraint if exists profiles_role_check;

alter table public.profiles
add constraint profiles_role_check
check (
  role in (
    'member',
    'journalist',
    'media_admin',
    'ecosystem_admin',
    'super_admin'
  )
);

alter table public.profiles
drop constraint if exists profiles_onboarding_path_check;

alter table public.profiles
add constraint profiles_onboarding_path_check
check (
  onboarding_path in (
    'person',
    'space',
    'funder'
  )
);

alter table public.profiles
drop constraint if exists profiles_onboarding_status_check;

alter table public.profiles
add constraint profiles_onboarding_status_check
check (
  onboarding_status in (
    'not_started',
    'in_progress',
    'completed'
  )
);

-- ============================================================
-- 2. ROLES CREATIVOS DE LAS PERSONAS
-- ============================================================

alter table public.people
drop constraint if exists people_roles_check;

alter table public.people
add constraint people_roles_check
check (
  roles <@ array[
    'artist',
    'journalist',
    'photographer',
    'videographer',
    'designer',
    'producer',
    'manager',
    'cultural_manager',
    'curator',
    'educator',
    'researcher',
    'volunteer',
    'space_manager',
    'funder_representative',
    'brand_representative',
    'organization_member'
  ]::text[]
);

-- ============================================================
-- 3. FUNCIONES DE SEGURIDAD
-- ============================================================

create or replace function public.current_profile_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role
  from public.profiles
  where id = auth.uid();
$$;

revoke all
on function public.current_profile_role()
from public;

grant execute
on function public.current_profile_role()
to authenticated;

create or replace function public.make_unique_slug(
  source_value text
)
returns text
language plpgsql
security invoker
set search_path = public, extensions
as $$
declare
  base_slug text;
  unique_suffix text;
begin
  base_slug := lower(
    regexp_replace(
      coalesce(source_value, 'actor'),
      '[^a-zA-Z0-9]+',
      '-',
      'g'
    )
  );

  base_slug := trim(
    both '-'
    from base_slug
  );

  if base_slug = '' then
    base_slug := 'actor';
  end if;

  unique_suffix := substr(
    replace(
      gen_random_uuid()::text,
      '-',
      ''
    ),
    1,
    8
  );

  return base_slug || '-' || unique_suffix;
end;
$$;

-- Solo el super administrador puede asignar cualquier rol.
-- El administrador del medio únicamente puede asignar
-- periodistas o devolverlos a member.
create or replace function public.set_profile_role(
  target_profile_id uuid,
  requested_role text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  requesting_role text;
  target_current_role text;
begin
  requesting_role :=
    public.current_profile_role();

  select role
  into target_current_role
  from public.profiles
  where id = target_profile_id;

  if requested_role not in (
    'member',
    'journalist',
    'media_admin',
    'ecosystem_admin',
    'super_admin'
  ) then
    raise exception 'Rol no permitido';
  end if;

  if requesting_role = 'super_admin' then
    update public.profiles
    set role = requested_role
    where id = target_profile_id;

    return;
  end if;

  if requesting_role = 'media_admin'
    and target_current_role in (
      'member',
      'journalist'
    )
    and requested_role in (
      'member',
      'journalist'
    )
  then
    update public.profiles
    set role = requested_role
    where id = target_profile_id;

    return;
  end if;

  raise exception 'No tienes permisos para asignar este rol';
end;
$$;

revoke all
on function public.set_profile_role(uuid, text)
from public;

grant execute
on function public.set_profile_role(uuid, text)
to authenticated;

-- ============================================================
-- 4. SEGURIDAD DE PROFILES
-- ============================================================

drop policy if exists "Users can view their own profile"
on public.profiles;

drop policy if exists "Users can update their own profile"
on public.profiles;

drop policy if exists "Privileged staff can view profiles"
on public.profiles;

create policy "Users can view their own profile"
on public.profiles
for select
to authenticated
using (
  id = auth.uid()
);

create policy "Privileged staff can view profiles"
on public.profiles
for select
to authenticated
using (
  public.current_profile_role() in (
    'journalist',
    'media_admin',
    'ecosystem_admin',
    'super_admin'
  )
);

create policy "Users can update basic profile fields"
on public.profiles
for update
to authenticated
using (
  id = auth.uid()
)
with check (
  id = auth.uid()
);

-- Evita que una persona cambie su propio rol mediante
-- una actualización directa.
revoke update
on table public.profiles
from authenticated;

grant update (
  full_name,
  avatar_url,
  onboarding_path,
  onboarding_status
)
on public.profiles
to authenticated;

-- ============================================================
-- 5. ESPACIOS
-- ============================================================

create table if not exists public.spaces (
  id uuid primary key default gen_random_uuid(),

  name text not null,

  slug text not null unique,

  description text,

  city text,

  department text,

  country text not null default 'Colombia',

  address text,

  capacity integer,

  website_url text,

  instagram_url text,

  public_email text,

  space_types text[] not null default '{}',

  offers text[] not null default '{}',

  needs text[] not null default '{}',

  verified boolean not null default false,

  featured boolean not null default false,

  status text not null default 'draft'
    check (
      status in (
        'draft',
        'review',
        'published',
        'archived'
      )
    ),

  created_by uuid
    references public.profiles(id)
    on delete set null,

  created_at timestamptz not null default now(),

  updated_at timestamptz not null default now()
);

create index if not exists spaces_slug_idx
on public.spaces(slug);

create index if not exists spaces_status_idx
on public.spaces(status);

create index if not exists spaces_city_idx
on public.spaces(city);

create index if not exists spaces_types_idx
on public.spaces
using gin(space_types);

create table if not exists public.space_memberships (
  id uuid primary key default gen_random_uuid(),

  space_id uuid not null
    references public.spaces(id)
    on delete cascade,

  profile_id uuid not null
    references public.profiles(id)
    on delete cascade,

  role text not null default 'member'
    check (
      role in (
        'owner',
        'administrator',
        'editor',
        'member'
      )
    ),

  status text not null default 'active'
    check (
      status in (
        'invited',
        'active',
        'inactive'
      )
    ),

  created_at timestamptz not null default now(),

  unique (
    space_id,
    profile_id
  )
);

create index if not exists space_memberships_profile_idx
on public.space_memberships(profile_id);

create index if not exists space_memberships_space_idx
on public.space_memberships(space_id);

alter table public.spaces
enable row level security;

alter table public.space_memberships
enable row level security;

drop policy if exists "Public can view published spaces"
on public.spaces;

drop policy if exists "Members can view their spaces"
on public.spaces;

drop policy if exists "Staff can view spaces"
on public.spaces;

drop policy if exists "Users can create spaces"
on public.spaces;

drop policy if exists "Managers can update spaces"
on public.spaces;

drop policy if exists "Managers can delete spaces"
on public.spaces;

create policy "Public can view published spaces"
on public.spaces
for select
to anon, authenticated
using (
  status = 'published'
);

create policy "Members can view their spaces"
on public.spaces
for select
to authenticated
using (
  exists (
    select 1
    from public.space_memberships
    where space_memberships.space_id = spaces.id
      and space_memberships.profile_id = auth.uid()
      and space_memberships.status = 'active'
  )
);

create policy "Staff can view spaces"
on public.spaces
for select
to authenticated
using (
  public.current_profile_role() in (
    'journalist',
    'media_admin',
    'ecosystem_admin',
    'super_admin'
  )
);

create policy "Users can create spaces"
on public.spaces
for insert
to authenticated
with check (
  created_by = auth.uid()
);

create policy "Managers can update spaces"
on public.spaces
for update
to authenticated
using (
  public.current_profile_role() in (
    'ecosystem_admin',
    'super_admin'
  )
  or exists (
    select 1
    from public.space_memberships
    where space_memberships.space_id = spaces.id
      and space_memberships.profile_id = auth.uid()
      and space_memberships.status = 'active'
      and space_memberships.role in (
        'owner',
        'administrator'
      )
  )
)
with check (
  public.current_profile_role() in (
    'ecosystem_admin',
    'super_admin'
  )
  or exists (
    select 1
    from public.space_memberships
    where space_memberships.space_id = spaces.id
      and space_memberships.profile_id = auth.uid()
      and space_memberships.status = 'active'
      and space_memberships.role in (
        'owner',
        'administrator'
      )
  )
);

create policy "Managers can delete spaces"
on public.spaces
for delete
to authenticated
using (
  public.current_profile_role() in (
    'ecosystem_admin',
    'super_admin'
  )
  or exists (
    select 1
    from public.space_memberships
    where space_memberships.space_id = spaces.id
      and space_memberships.profile_id = auth.uid()
      and space_memberships.status = 'active'
      and space_memberships.role = 'owner'
  )
);

drop policy if exists "Users can view their space memberships"
on public.space_memberships;

drop policy if exists "Admins can manage space memberships"
on public.space_memberships;

create policy "Users can view their space memberships"
on public.space_memberships
for select
to authenticated
using (
  profile_id = auth.uid()
);

create policy "Admins can manage space memberships"
on public.space_memberships
for all
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

grant select
on public.spaces
to anon, authenticated;

grant insert, update, delete
on public.spaces
to authenticated;

grant select
on public.space_memberships
to authenticated;

-- ============================================================
-- 6. FINANCIADORES, MARCAS Y ORGANIZACIONES DE APOYO
-- ============================================================

create table if not exists public.funders (
  id uuid primary key default gen_random_uuid(),

  name text not null,

  slug text not null unique,

  funder_type text not null default 'other'
    check (
      funder_type in (
        'brand',
        'company',
        'foundation',
        'public_entity',
        'agency',
        'individual',
        'other'
      )
    ),

  description text,

  city text,

  country text not null default 'Colombia',

  website_url text,

  instagram_url text,

  public_email text,

  interests text[] not null default '{}',

  support_modes text[] not null default '{}',

  verified boolean not null default false,

  featured boolean not null default false,

  status text not null default 'draft'
    check (
      status in (
        'draft',
        'review',
        'published',
        'archived'
      )
    ),

  created_by uuid
    references public.profiles(id)
    on delete set null,

  created_at timestamptz not null default now(),

  updated_at timestamptz not null default now()
);

create index if not exists funders_slug_idx
on public.funders(slug);

create index if not exists funders_status_idx
on public.funders(status);

create index if not exists funders_type_idx
on public.funders(funder_type);

create index if not exists funders_interests_idx
on public.funders
using gin(interests);

create table if not exists public.funder_memberships (
  id uuid primary key default gen_random_uuid(),

  funder_id uuid not null
    references public.funders(id)
    on delete cascade,

  profile_id uuid not null
    references public.profiles(id)
    on delete cascade,

  role text not null default 'member'
    check (
      role in (
        'owner',
        'administrator',
        'representative',
        'member'
      )
    ),

  status text not null default 'active'
    check (
      status in (
        'invited',
        'active',
        'inactive'
      )
    ),

  created_at timestamptz not null default now(),

  unique (
    funder_id,
    profile_id
  )
);

create index if not exists funder_memberships_profile_idx
on public.funder_memberships(profile_id);

create index if not exists funder_memberships_funder_idx
on public.funder_memberships(funder_id);

alter table public.funders
enable row level security;

alter table public.funder_memberships
enable row level security;

drop policy if exists "Public can view published funders"
on public.funders;

drop policy if exists "Members can view their funders"
on public.funders;

drop policy if exists "Staff can view funders"
on public.funders;

drop policy if exists "Users can create funders"
on public.funders;

drop policy if exists "Managers can update funders"
on public.funders;

drop policy if exists "Managers can delete funders"
on public.funders;

create policy "Public can view published funders"
on public.funders
for select
to anon, authenticated
using (
  status = 'published'
);

create policy "Members can view their funders"
on public.funders
for select
to authenticated
using (
  exists (
    select 1
    from public.funder_memberships
    where funder_memberships.funder_id = funders.id
      and funder_memberships.profile_id = auth.uid()
      and funder_memberships.status = 'active'
  )
);

create policy "Staff can view funders"
on public.funders
for select
to authenticated
using (
  public.current_profile_role() in (
    'journalist',
    'media_admin',
    'ecosystem_admin',
    'super_admin'
  )
);

create policy "Users can create funders"
on public.funders
for insert
to authenticated
with check (
  created_by = auth.uid()
);

create policy "Managers can update funders"
on public.funders
for update
to authenticated
using (
  public.current_profile_role() in (
    'ecosystem_admin',
    'super_admin'
  )
  or exists (
    select 1
    from public.funder_memberships
    where funder_memberships.funder_id = funders.id
      and funder_memberships.profile_id = auth.uid()
      and funder_memberships.status = 'active'
      and funder_memberships.role in (
        'owner',
        'administrator'
      )
  )
)
with check (
  public.current_profile_role() in (
    'ecosystem_admin',
    'super_admin'
  )
  or exists (
    select 1
    from public.funder_memberships
    where funder_memberships.funder_id = funders.id
      and funder_memberships.profile_id = auth.uid()
      and funder_memberships.status = 'active'
      and funder_memberships.role in (
        'owner',
        'administrator'
      )
  )
);

create policy "Managers can delete funders"
on public.funders
for delete
to authenticated
using (
  public.current_profile_role() in (
    'ecosystem_admin',
    'super_admin'
  )
  or exists (
    select 1
    from public.funder_memberships
    where funder_memberships.funder_id = funders.id
      and funder_memberships.profile_id = auth.uid()
      and funder_memberships.status = 'active'
      and funder_memberships.role = 'owner'
  )
);

drop policy if exists "Users can view their funder memberships"
on public.funder_memberships;

drop policy if exists "Admins can manage funder memberships"
on public.funder_memberships;

create policy "Users can view their funder memberships"
on public.funder_memberships
for select
to authenticated
using (
  profile_id = auth.uid()
);

create policy "Admins can manage funder memberships"
on public.funder_memberships
for all
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

grant select
on public.funders
to anon, authenticated;

grant insert, update, delete
on public.funders
to authenticated;

grant select
on public.funder_memberships
to authenticated;

-- ============================================================
-- 7. TRIGGERS DE MEMBRESÍA
-- ============================================================

create or replace function public.create_space_owner_membership()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.created_by is not null then
    insert into public.space_memberships (
      space_id,
      profile_id,
      role,
      status
    )
    values (
      new.id,
      new.created_by,
      'owner',
      'active'
    )
    on conflict (
      space_id,
      profile_id
    )
    do nothing;
  end if;

  return new;
end;
$$;

drop trigger if exists spaces_create_owner_membership
on public.spaces;

create trigger spaces_create_owner_membership
after insert on public.spaces
for each row
execute function public.create_space_owner_membership();

create or replace function public.create_funder_owner_membership()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.created_by is not null then
    insert into public.funder_memberships (
      funder_id,
      profile_id,
      role,
      status
    )
    values (
      new.id,
      new.created_by,
      'owner',
      'active'
    )
    on conflict (
      funder_id,
      profile_id
    )
    do nothing;
  end if;

  return new;
end;
$$;

drop trigger if exists funders_create_owner_membership
on public.funders;

create trigger funders_create_owner_membership
after insert on public.funders
for each row
execute function public.create_funder_owner_membership();

drop trigger if exists spaces_set_updated_at
on public.spaces;

create trigger spaces_set_updated_at
before update on public.spaces
for each row
execute function public.set_updated_at();

drop trigger if exists funders_set_updated_at
on public.funders;

create trigger funders_set_updated_at
before update on public.funders
for each row
execute function public.set_updated_at();

-- ============================================================
-- 8. ACTUALIZAR CREACIÓN AUTOMÁTICA DE USUARIOS
-- ============================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  profile_name text;
  selected_path text;
  actor_name text;
begin
  profile_name := coalesce(
    nullif(
      new.raw_user_meta_data ->> 'full_name',
      ''
    ),
    nullif(
      new.raw_user_meta_data ->> 'name',
      ''
    ),
    split_part(
      coalesce(new.email, 'persona'),
      '@',
      1
    ),
    'Nueva persona'
  );

  selected_path := coalesce(
    nullif(
      new.raw_user_meta_data ->> 'onboarding_path',
      ''
    ),
    'person'
  );

  if selected_path not in (
    'person',
    'space',
    'funder'
  ) then
    selected_path := 'person';
  end if;

  actor_name := coalesce(
    nullif(
      new.raw_user_meta_data ->> 'actor_name',
      ''
    ),
    profile_name
  );

  insert into public.profiles (
    id,
    email,
    full_name,
    avatar_url,
    role,
    onboarding_path,
    onboarding_status,
    is_active
  )
  values (
    new.id,
    new.email,
    profile_name,
    coalesce(
      new.raw_user_meta_data ->> 'avatar_url',
      new.raw_user_meta_data ->> 'picture',
      ''
    ),
    'member',
    selected_path,
    'in_progress',
    true
  )
  on conflict (id)
  do update set
    email = excluded.email,
    full_name = excluded.full_name,
    onboarding_path = excluded.onboarding_path;

  -- Toda cuenta pertenece a una persona real.
  insert into public.people (
    profile_id,
    full_name,
    slug,
    created_by,
    status
  )
  values (
    new.id,
    profile_name,
    public.make_unique_slug(profile_name),
    new.id,
    'draft'
  )
  on conflict (profile_id)
  do nothing;

  -- Esa persona puede comenzar representando un espacio.
  if selected_path = 'space' then
    insert into public.spaces (
      name,
      slug,
      created_by,
      status
    )
    values (
      actor_name,
      public.make_unique_slug(actor_name),
      new.id,
      'draft'
    );
  end if;

  -- O puede comenzar representando un financiador o marca.
  if selected_path = 'funder' then
    insert into public.funders (
      name,
      slug,
      created_by,
      status
    )
    values (
      actor_name,
      public.make_unique_slug(actor_name),
      new.id,
      'draft'
    );
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created
on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();

-- ============================================================
-- 9. CREAR PERSONAS PARA CUENTAS EXISTENTES
-- ============================================================

insert into public.people (
  profile_id,
  full_name,
  slug,
  created_by,
  status
)
select
  profiles.id,
  coalesce(
    nullif(profiles.full_name, ''),
    split_part(profiles.email, '@', 1),
    'Persona'
  ),
  public.make_unique_slug(
    coalesce(
      nullif(profiles.full_name, ''),
      split_part(profiles.email, '@', 1),
      'Persona'
    )
  ),
  profiles.id,
  'draft'
from public.profiles
where not exists (
  select 1
  from public.people
  where people.profile_id = profiles.id
);

commit;