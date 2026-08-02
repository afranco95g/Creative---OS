-- ============================================================
-- CULTURA ESTA
-- Migración 001: perfiles, roles y creación automática
-- ============================================================

-- 1. Crear tabla pública de perfiles
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,

  email text,

  full_name text,

  avatar_url text,

  role text not null default 'member'
    check (
      role in (
        'member',
        'collaborator',
        'editor',
        'admin',
        'super_admin'
      )
    ),

  created_at timestamptz not null default now(),

  updated_at timestamptz not null default now()
);

-- 2. Activar Row Level Security
alter table public.profiles enable row level security;

-- 3. Eliminar políticas anteriores en caso de volver a ejecutar
drop policy if exists "Users can view their own profile"
on public.profiles;

drop policy if exists "Users can update their own profile"
on public.profiles;

-- 4. Permitir que cada usuario vea su propio perfil
create policy "Users can view their own profile"
on public.profiles
for select
to authenticated
using (
  (select auth.uid()) = id
);

-- 5. Permitir que cada usuario actualice su propio perfil
create policy "Users can update their own profile"
on public.profiles
for update
to authenticated
using (
  (select auth.uid()) = id
)
with check (
  (select auth.uid()) = id
);

-- 6. Función para actualizar updated_at automáticamente
create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- 7. Trigger para actualizar updated_at
drop trigger if exists profiles_set_updated_at
on public.profiles;

create trigger profiles_set_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

-- 8. Función para crear un perfil cuando nace un usuario
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (
    id,
    email,
    full_name,
    avatar_url,
    role
  )
  values (
    new.id,
    new.email,
    coalesce(
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name',
      ''
    ),
    coalesce(
      new.raw_user_meta_data ->> 'avatar_url',
      new.raw_user_meta_data ->> 'picture',
      ''
    ),
    'member'
  );

  return new;
end;
$$;

-- 9. Trigger asociado a auth.users
drop trigger if exists on_auth_user_created
on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();