-- ============================================================
-- CULTURA ESTÁ
-- Migración 002: personas del ecosistema cultural
-- ============================================================

-- 1. Crear tabla de personas
create table if not exists public.people (
  id uuid primary key default gen_random_uuid(),

  -- Cuenta asociada dentro de Cultura Está.
  -- Puede ser null porque una persona puede existir en el
  -- ecosistema sin tener todavía una cuenta de usuario.
  profile_id uuid unique
    references public.profiles(id)
    on delete set null,

  full_name text not null,

  slug text not null unique,

  headline text,

  biography text,

  avatar_url text,

  city text,

  department text,

  country text not null default 'Colombia',

  website_url text,

  instagram_url text,

  youtube_url text,

  linkedin_url text,

  public_email text,

  roles text[] not null default '{}'
    check (
      roles <@ array[
        'artist',
        'journalist',
        'photographer',
        'videographer',
        'designer',
        'producer',
        'manager',
        'educator',
        'volunteer',
        'organization_member'
      ]::text[]
    ),

  skills text[] not null default '{}',

  interests text[] not null default '{}',

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

-- 2. Crear índices para búsquedas frecuentes
create index if not exists people_profile_id_idx
on public.people(profile_id);

create index if not exists people_slug_idx
on public.people(slug);

create index if not exists people_status_idx
on public.people(status);

create index if not exists people_city_idx
on public.people(city);

create index if not exists people_roles_idx
on public.people
using gin(roles);

create index if not exists people_skills_idx
on public.people
using gin(skills);

-- 3. Activar Row Level Security
alter table public.people enable row level security;

-- 4. Eliminar políticas anteriores para permitir
-- volver a ejecutar esta migración
drop policy if exists "Public can view published people"
on public.people;

drop policy if exists "Users can view their own person record"
on public.people;

drop policy if exists "Users can update their own person record"
on public.people;

drop policy if exists "Admins can manage people"
on public.people;

-- 5. Cualquier persona puede consultar perfiles publicados
create policy "Public can view published people"
on public.people
for select
to anon, authenticated
using (
  status = 'published'
);

-- 6. Un usuario autenticado puede ver su propia ficha,
-- aunque todavía esté en borrador o revisión
create policy "Users can view their own person record"
on public.people
for select
to authenticated
using (
  profile_id = (select auth.uid())
);

-- 7. Cada usuario puede actualizar su propia ficha,
-- pero no puede verificarse ni destacarse a sí mismo
create policy "Users can update their own person record"
on public.people
for update
to authenticated
using (
  profile_id = (select auth.uid())
)
with check (
  profile_id = (select auth.uid())
  and verified = false
  and featured = false
);

-- 8. Administradores pueden crear, consultar,
-- modificar y eliminar cualquier ficha
create policy "Admins can manage people"
on public.people
for all
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.role in (
        'admin',
        'super_admin'
      )
  )
)
with check (
  exists (
    select 1
    from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.role in (
        'admin',
        'super_admin'
      )
  )
);

-- 9. Actualizar updated_at automáticamente
drop trigger if exists people_set_updated_at
on public.people;

create trigger people_set_updated_at
before update on public.people
for each row
execute function public.set_updated_at();