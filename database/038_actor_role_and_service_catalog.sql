-- ============================================================
-- CULTURA ESTA
-- Migración 038
-- Rol del actor y catálogo de servicios en funders
-- ============================================================

begin;

-- ============================================================
-- 1. ROL DEL ACTOR (CAPACIDAD EN EL ECOSISTEMA)
-- ============================================================

alter table public.funders
add column if not exists role_type text
  check (
    role_type in (
      'productor',
      'marca',
      'patrocinador',
      'financiador',
      'organizacion'
    )
  );

-- ============================================================
-- 2. CATÁLOGO DE SERVICIOS
-- ============================================================

alter table public.funders
add column if not exists service_catalog text[] not null default '{}';

commit;
