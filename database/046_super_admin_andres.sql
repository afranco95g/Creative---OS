-- ============================================================
-- CULTURA ESTA
-- Migración 046
-- Asignar rol super_admin a las cuentas de Andres
-- ============================================================

begin;

do $$
declare
  v_gmail_id uuid;
  v_oda_id uuid;
  v_gmail_role text;
  v_oda_role text;
begin
  select id into v_gmail_id
  from public.profiles
  where email = 'andres95.francog@gmail.com'
  limit 1;

  if v_gmail_id is null then
    raise exception
      'Perfil no encontrado en public.profiles para email andres95.francog@gmail.com — la cuenta debe existir antes de correr esta migración.';
  end if;

  select id into v_oda_id
  from public.profiles
  where email = 'andres.francog@oda.foundation'
  limit 1;

  if v_oda_id is null then
    raise exception
      'Perfil no encontrado en public.profiles para email andres.francog@oda.foundation — la cuenta debe existir antes de correr esta migración.';
  end if;

  update public.profiles
  set role = 'super_admin'
  where email in (
    'andres95.francog@gmail.com',
    'andres.francog@oda.foundation'
  );

  select role into v_gmail_role
  from public.profiles
  where email = 'andres95.francog@gmail.com';

  select role into v_oda_role
  from public.profiles
  where email = 'andres.francog@oda.foundation';

  raise notice 'andres95.francog@gmail.com -> role = %', v_gmail_role;
  raise notice 'andres.francog@oda.foundation -> role = %', v_oda_role;
end $$;

commit;
