-- ============================================================
-- CULTURA ESTA
-- Migración 050
-- "gestor" como sexto valor de funders.role_type
-- ============================================================

begin;

alter table public.funders
drop constraint if exists funders_role_type_check;

alter table public.funders
add constraint funders_role_type_check
  check (
    role_type in (
      'productor',
      'marca',
      'patrocinador',
      'financiador',
      'organizacion',
      'gestor'
    )
  );

commit;
