-- ============================================================
-- CULTURA ESTA
-- Migración 019
-- Registro directo de personas, espacios, marcas y agencias
-- ============================================================

begin;

-- ============================================================
-- 1. AMPLIAR LOS TIPOS DE ONBOARDING
-- ============================================================

alter table public.profiles
drop constraint if exists profiles_onboarding_path_check;

alter table public.profiles
add constraint profiles_onboarding_path_check
check (
  onboarding_path in (
    'person',
    'space',
    'brand',
    'agency',
    'organization'
  )
);

-- ============================================================
-- 2. ACTUALIZAR CREACIÓN AUTOMÁTICA DE CUENTAS
-- ============================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  account_name text;
  selected_path text;
  actor_name text;
  selected_funder_type text;
begin
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
    'brand',
    'agency',
    'organization'
  ) then
    selected_path := 'person';
  end if;

  account_name := coalesce(
    nullif(
      new.raw_user_meta_data ->> 'account_name',
      ''
    ),
    nullif(
      new.raw_user_meta_data ->> 'full_name',
      ''
    ),
    nullif(
      new.raw_user_meta_data ->> 'name',
      ''
    ),
    split_part(
      coalesce(
        new.email,
        'cuenta'
      ),
      '@',
      1
    ),
    'Nueva cuenta'
  );

  actor_name := coalesce(
    nullif(
      new.raw_user_meta_data ->> 'actor_name',
      ''
    ),
    account_name
  );

  selected_funder_type :=
    case selected_path
      when 'brand' then 'brand'
      when 'agency' then 'agency'
      when 'organization' then 'other'
      else 'other'
    end;

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
    account_name,
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
    email =
      excluded.email,

    full_name =
      excluded.full_name,

    onboarding_path =
      excluded.onboarding_path;

  -- Solo se crea una ficha en people cuando
  -- la cuenta se registra como persona.
  if selected_path = 'person' then
    insert into public.people (
      profile_id,
      full_name,
      slug,
      created_by,
      status
    )
    values (
      new.id,
      actor_name,
      public.make_unique_slug(
        actor_name
      ),
      new.id,
      'draft'
    )
    on conflict (
      profile_id
    )
    do nothing;
  end if;

  -- Una cuenta de espacio crea directamente
  -- el espacio y recibe la membresía owner
  -- mediante spaces_create_owner_membership.
  if selected_path = 'space' then
    insert into public.spaces (
      name,
      slug,
      created_by,
      status
    )
    values (
      actor_name,
      public.make_unique_slug(
        actor_name
      ),
      new.id,
      'draft'
    );
  end if;

  -- Marcas, agencias y organizaciones utilizan
  -- la infraestructura existente de funders.
  if selected_path in (
    'brand',
    'agency',
    'organization'
  ) then
    insert into public.funders (
      name,
      slug,
      funder_type,
      created_by,
      status
    )
    values (
      actor_name,
      public.make_unique_slug(
        actor_name
      ),
      selected_funder_type,
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

commit;