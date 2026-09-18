# Wizard Híbrido de Creación de Proyectos

Estado: aprobado por Andrés (2026-09-18), pendiente de construir.
Migración base: `database/057_wizard_creacion_nature_y_vinculo_reserva.sql`
(pendiente de correr en Supabase).
Contexto completo: `claude/EL CULEBREO - Análisis Crítico Propuesta Nuevo
Funcionamiento` y `claude/EL CULEBREO - Diseño UX y Componentes, Wizard +
Vacantes + Vitrina por Rol (versión Claude)`, ambos en el proyecto de
claude.ai.

## Qué resuelve

Hoy existen dos caminos para "crear un proyecto" y no se hablan entre
sí:

- `/studio/projects/new` — un formulario de 2 pasos que llama a
  `workspaceStore.createProject(...)`, que **no tiene ninguna referencia
  a Supabase**. Un proyecto creado ahí no existe en `public.projects`.
- `ProducerChat.tsx` → `LivingWorkspace.tsx` → `projectController.ts` →
  `conversationEngine.ts`/`questionEngine.ts` — el motor conversacional
  real, que sí escribe en `public.projects` (campo `graph jsonb`).

Este wizard reemplaza el primer camino por un tramo corto y cerrado (2
pantallas) que entrega el control al segundo camino (el real) en vez de
competir con él. No modifica el motor conversacional.

## Alcance

**Sí incluye:**
- Pantalla 1: selector de `nature` (tarjetas: `live_event`, `talk`,
  `workshop`, `product`).
- Pantalla 2 (condicional — se omite si `nature = 'product'`): buscador
  de `space_rooms` con filtros de aforo y equipamiento
  (`space_inventory_categories`), que termina en una fila de
  `space_booking_requests` en estado `pending` con `project_id` ya
  seteado, o se omite ("decidir después").
- Creación de la fila en `public.projects` con `nature` ya seteado, y
  redirección a `/studio/projects/[projectId]` donde toma el control el
  motor conversacional existente.
- Retirar `/studio/projects/new` como punto de entrada (redirigir a este
  wizard, o eliminarlo).

**No incluye (fuera de alcance de esta spec):**
- Ningún cambio al motor conversacional, a `conversationEngine.ts` ni a
  `questionEngine.ts`.
- Pago o cobro automático de la reserva de espacio — sigue siendo una
  solicitud sujeta a aprobación, pago presencial (igual que hoy).
- Vacantes de proyecto ni matching de talento (spec aparte).
- Vitrina pública por rol (spec aparte).

## Modelo de datos (ya migrado en 057, no repetir aquí)

- `projects.nature text check (nature in ('live_event','talk','workshop','product'))`,
  nullable.
- `space_booking_requests.project_id uuid references projects(id) on
  delete set null`, nullable.

No se toca `category`, `workflow_status`, ni ninguna política de RLS
existente — ambas columnas son nullable y aditivas, ninguna política
nueva es necesaria (las políticas de `space_booking_requests` ya
permiten insert al `renter_profile_id = auth.uid()`; `project_id` es
solo informativo, no cambia quién puede ver o crear una fila).

## Componentes

```
components/
  projects/
    creation/
      ProjectCreationWizard.tsx      # contenedor, step state: 1 | 2 | 3
      Step1NatureSelector.tsx        # 4 tarjetas, onSelect(nature)
      Step2SpaceFinder.tsx           # filtros + resultados
        SpaceResultCard.tsx
        SpaceBookingConfirmModal.tsx # fecha/hora, confirma -> insert en space_booking_requests
      steps.ts                       # tipo ProjectWizardState, helpers
```

`ProjectWizardState`:
```ts
export type ProjectNature = 'live_event' | 'talk' | 'workshop' | 'product';

export interface ProjectWizardState {
  nature: ProjectNature | null;
  spaceRoomId: string | null;
  bookingRequestId: string | null; // se llena tras confirmar Paso 2, si aplica
}
```

Regla de salto: si `nature === 'product'`, el wizard va directo del Paso
1 al Paso 3 (crear proyecto y redirigir) — el Paso 2 nunca se muestra.

## Flujo de creación (Paso 3, sin pantalla propia)

1. `insert into public.projects (owner_id, title, nature, category, ...)
   values (..., 'Sin título', wizardState.nature, <mapeo nature->category
   por defecto>, ...)` — ver "Mapeo nature → category" abajo.
2. Si `wizardState.bookingRequestId` existe, hacer `update
   space_booking_requests set project_id = <nuevo project id> where id =
   bookingRequestId` (el booking se creó en el Paso 2 antes de saber el
   id del proyecto, porque el proyecto no existe todavía en ese punto —
   se linkea después, en la misma transacción de creación si es posible,
   o en dos pasos si no).
3. Redirigir a `/studio/projects/[projectId]`.

**Mapeo `nature` → `category` por defecto** (el creador puede cambiarlo
después desde el flujo conversacional, esto es solo un valor inicial
razonable, no una regla rígida):
- `live_event` → `event`
- `talk` → `cultural`
- `workshop` → `cultural`
- `product` → `product`

## Criterios de aceptación

- Un proyecto creado por el wizard existe de verdad en `public.projects`
  (verificable con un `select` directo), con `nature` seteado.
- Elegir `product` en el Paso 1 nunca muestra el Paso 2.
- Confirmar una sala en el Paso 2 crea una fila real en
  `space_booking_requests` con `status = 'pending'` y `project_id`
  apuntando al proyecto recién creado — verificable con un `select`
  cruzando ambas tablas.
- Omitir el Paso 2 ("decidir después") crea el proyecto sin ninguna fila
  en `space_booking_requests`.
- Visitar `/studio/projects/new` ya no crea nada que no exista en
  Supabase — redirige al wizard o fue eliminado.
- El motor conversacional (`ProducerChat.tsx` y lo que cuelga de él) no
  cambió ni una línea.
