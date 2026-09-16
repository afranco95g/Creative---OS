-- ============================================================
-- CULTURA ESTA
-- Migración 047
-- Backfill puntual: crear la fila faltante en public.profiles
-- (y public.people) para andres.francog@oda.foundation
--
-- El trigger handle_new_user() (database/003_actor_accounts.sql,
-- líneas 977-1119) no se disparó para esta cuenta. Esta migración
-- replica exactamente esa misma lógica, como operación puntual
-- sobre un id ya conocido y confirmado en auth.users, en vez de
-- como trigger. No asigna role = 'super_admin' — eso lo hace
-- exclusivamente database/046_super_admin_andres.sql, que se corre
-- después de esta.
-- ============================================================

begin;

do $$
declare
  v_id uuid := '3d6e0af5-a036-45ec-bb07-2825a323c891';
  v_email text;
  v_raw_meta jsonb;
  v_profile_name text;
  v_selected_path text;
  v_already_exists boolean;
begin
  select email, raw_user_meta_data
  into v_email, v_raw_meta
  from auth.users
  where id = v_id;

  if v_email is null then
    raise exception
      'Cuenta no encontrada en auth.users para id % — no se puede hacer backfill de un usuario que no existe.', v_id;
  end if;

  select exists (
    select 1
    from public.profiles
    where id = v_id
  )
  into v_already_exists;

  if v_already_exists then
    raise notice
      'public.profiles ya tiene una fila para id % (email %) — no se modifica nada.', v_id, v_email;
  else
    v_profile_name := coalesce(
      nullif(
        v_raw_meta ->> 'full_name',
        ''
      ),
      nullif(
        v_raw_meta ->> 'name',
        ''
      ),
      split_part(
        coalesce(v_email, 'persona'),
        '@',
        1
      ),
      'Nueva persona'
    );

    v_selected_path := coalesce(
      nullif(
        v_raw_meta ->> 'onboarding_path',
        ''
      ),
      'person'
    );

    if v_selected_path not in (
      'person',
      'space',
      'funder'
    ) then
      v_selected_path := 'person';
    end if;

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
      v_id,
      v_email,
      v_profile_name,
      coalesce(
        v_raw_meta ->> 'avatar_url',
        v_raw_meta ->> 'picture',
        ''
      ),
      'member',
      v_selected_path,
      'in_progress',
      true
    );

    insert into public.people (
      profile_id,
      full_name,
      slug,
      created_by,
      status
    )
    values (
      v_id,
      v_profile_name,
      public.make_unique_slug(v_profile_name),
      v_id,
      'draft'
    )
    on conflict (profile_id)
    do nothing;

    raise notice
      'public.profiles y public.people creados para id % (email %, full_name %, onboarding_path %).', v_id, v_email, v_profile_name, v_selected_path;
  end if;
end $$;

commit;
