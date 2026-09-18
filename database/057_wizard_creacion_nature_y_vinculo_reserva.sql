-- ============================================================
-- CULTURA ESTA (EL CULEBREO)
-- Migración 057
-- Base para el Wizard Híbrido de Creación de Proyectos: tipo de
-- entregable del proyecto y vínculo opcional entre una reserva
-- de espacio y el proyecto que la originó.
-- Ver claude/EL CULEBREO - Diseño UX y Componentes, Wizard +
-- Vacantes + Vitrina por Rol (versión Claude) y specs/wizard-
-- creacion-proyectos-hibrido.md
-- ============================================================

begin;

-- ============================================================
-- 1. projects.nature — tipo de entregable, para el Paso 1 del wizard
-- ============================================================
-- Independiente de "category" (que sigue siendo la taxonomía
-- editorial de publicación: cultural/product/event/social/
-- artistic/business/other). "nature" responde una pregunta
-- distinta y más operativa: qué se va a producir, para decidir
-- si el Paso 2 (espacios) del wizard aplica o no.

alter table public.projects
  add column if not exists nature text
    check (
      nature is null
      or nature in ('live_event', 'talk', 'workshop', 'product')
    );

comment on column public.projects.nature is
  'Tipo de entregable elegido en el Paso 1 del wizard de creación (live_event, talk, workshop, product). Nullable: los proyectos creados antes de esta migración, o por otras vías, no tienen valor. No reemplaza a "category" (taxonomía editorial de publicación) — son dos preguntas distintas.';

-- ============================================================
-- 2. space_booking_requests.project_id — de qué proyecto vino
-- ============================================================
-- Nullable a propósito: una reserva puede seguir haciéndose
-- directamente desde el perfil del espacio, sin pasar por el
-- wizard de creación de proyectos, igual que hoy.

alter table public.space_booking_requests
  add column if not exists project_id uuid
    references public.projects(id)
    on delete set null;

create index if not exists space_booking_requests_project_idx
on public.space_booking_requests(project_id)
where project_id is not null;

comment on column public.space_booking_requests.project_id is
  'Proyecto que originó esta solicitud de reserva, cuando se creó desde el Paso 2 del wizard de creación de proyectos. NULL para reservas hechas directamente desde el perfil del espacio.';

commit;
