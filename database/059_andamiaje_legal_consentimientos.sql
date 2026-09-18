-- ============================================================
-- CULTURA ESTA (EL CULEBREO)
-- Migración 059
-- Andamiaje técnico de cumplimiento legal — tabla de
-- consentimientos (Ley 1581/2012, Habeas Data; Ley 527/1999,
-- validez del consentimiento electrónico).
--
-- Decisión de Andrés (2026-09-18): construir el andamiaje técnico
-- limpio ahora (tabla con timestamp + usuario, checkbox sin
-- pre-marcar en la UI). NO redactar texto legal definitivo — los
-- textos que ve el usuario quedan marcados como borrador, pendientes
-- de revisión jurídica formal (ver claude/EL CULEBREO - Estado y
-- cola de trabajo, punto 5: "la revisión legal sigue sin
-- contratar"). No soy abogado — este archivo NO cita ni redacta
-- artículos de ley en el sistema, solo guarda el hecho de que un
-- usuario aceptó un aviso, cuándo, y en qué contexto.
-- ============================================================

begin;

-- ============================================================
-- 1. CONSENTIMIENTOS (legal_consents)
-- ============================================================
-- Genérica y reutilizable a propósito: cualquier flujo futuro que
-- necesite un checkbox de autorización (postulación a vacante,
-- aceptar invitación, registrar datos de contacto) escribe aquí, en
-- vez de que cada feature invente su propia tabla de consentimiento.

create table if not exists public.legal_consents (
  id uuid primary key default gen_random_uuid(),

  profile_id uuid not null
    references public.profiles(id)
    on delete cascade,

  -- Vocabulario cerrado, crece cuando aparezca un nuevo tipo de
  -- consentimiento real (no se anticipa uno que no se necesita hoy).
  consent_type text not null
    check (consent_type in ('habeas_data')),

  -- En qué flujo se dio el consentimiento — referencia polimórfica
  -- de solo lectura (sin FK, porque apunta a tablas distintas según
  -- context_type). El registro es la prueba, no un vínculo operativo.
  context_type text not null
    check (context_type in ('vacancy_invitation')),

  context_id uuid not null,

  accepted boolean not null,

  accepted_at timestamptz not null default now(),

  created_at timestamptz not null default now()
);

create index if not exists legal_consents_profile_idx
on public.legal_consents(profile_id);

create index if not exists legal_consents_context_idx
on public.legal_consents(context_type, context_id);

-- ============================================================
-- 2. ROW LEVEL SECURITY
-- ============================================================
-- Escritura solo a través de funciones SECURITY DEFINER (como
-- accept_vacancy_invitation en la migración 060) — nunca un INSERT
-- directo del cliente, para que el registro de consentimiento nunca
-- se pueda separar del evento que certifica. Por eso no hay policy
-- de insert para authenticated aquí.

alter table public.legal_consents enable row level security;

drop policy if exists "Users can view their own consent records"
on public.legal_consents;
drop policy if exists "Admins can view all consent records"
on public.legal_consents;

-- El usuario ve su propio historial de consentimientos.
create policy "Users can view their own consent records"
on public.legal_consents
for select
to authenticated
using (
  profile_id = auth.uid()
);

-- El administrador del ecosistema puede consultarlos como prueba
-- ante un requerimiento (ej. de la Superintendencia de Industria y
-- Comercio) — de solo lectura, nunca de escritura ni borrado manual.
create policy "Admins can view all consent records"
on public.legal_consents
for select
to authenticated
using (
  public.current_profile_role() in ('ecosystem_admin', 'super_admin')
);

commit;
