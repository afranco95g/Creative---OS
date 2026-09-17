# Spec corta: Generalizar la herramienta de espacios a los cuatro aliados-espacio

## 1. Qué se construye

La herramienta de salones/inventario/galería (Fase 1B) deja de vivir en
`/admin/espacios` (solo staff) y pasa a `/workspace/espacio` — accesible
también a cualquier cuenta con membresía activa en `space_memberships`, no
solo `ecosystem_admin`/`super_admin`. El selector de espacio se filtra a
los aliados que realmente tienen espacio físico alquilable, no a
cualquier fila de `spaces`.

## 2. Por qué

Andrés confirmó dos cosas el 2026-09-17: (a) esta herramienta "va a vivir
en el perfil" de cada actor-espacio, no en el panel de staff — hoy solo
él, como `super_admin`, puede entrar; (b) de los seis aliados
fundacionales, solo cuatro son espacio físico alquilable (Stainless
Space, Oasis, Taller 108, Club del Café — `service_categories` incluye
`audiovisual_production_space`, `events_space`, `coworking_space` o
`equipment_rental`). Hojalata es un actor tipo productor (diseño,
estampado, impresión, acompañamiento de proyectos) — no tiene salones,
queda explícitamente fuera, con su propia herramienta pendiente de
diseñar (portafolio + solicitud de cotización, spec aparte, no esta).

## 3. Archivos y qué cambia en cada uno

- `app/admin/espacios/page.tsx` — se borra (movido).
- `app/workspace/espacio/page.tsx` — nuevo. Mismo contenido que el
  anterior, pero: (a) usa `canAccessSpaceTools()` en vez de
  `canAccessWorkspace().capabilities.canManageEcosystem` como guardia;
  (b) la consulta a `spaces` agrega
  `.overlaps('service_categories', ['audiovisual_production_space','events_space','coworking_space','equipment_rental'])`.
- `services/spaces/spaceAccessService.ts` — nuevo. Exporta
  `canAccessSpaceTools()`: autenticado + (`current_profile_role()` en
  `ecosystem_admin`/`super_admin`, o al menos una fila activa en
  `space_memberships` para ese `profile_id`). Devuelve
  `{ authenticated, canAccess, isStaff }`.
- `components/spaces/SpaceCaptureManager.tsx`,
  `SpaceRoomInventoryPanel.tsx`, `SpaceRoomMediaPanel.tsx` — movidos
  desde `components/admin/` (mismo contenido, misma lógica — ya no son
  herramientas exclusivas de admin, el nombre de carpeta lo refleja).
  Import interno entre ellos se ajusta a la nueva ruta.

Nada fuera de esta lista sin preguntar.

## 4. Decisiones ya tomadas

- El vocabulario de categorías "espacio alquilable" para el filtro es
  exactamente: `audiovisual_production_space`, `events_space`,
  `coworking_space`, `equipment_rental` — las mismas cuatro que ya
  describen a Stainless Space, Oasis, Taller 108 y Club del Café en
  `044_actor_service_categories.sql`. No se crea una columna ni un
  vocabulario nuevo — es un filtro sobre `service_categories`, ya
  existente.
- `canAccessSpaceTools()` no reemplaza `canAccessWorkspace()` en ningún
  otro lugar del producto — es una guardia nueva, específica de esta
  pantalla.
- Mientras no existan cuentas propias de cada aliado, el único usuario
  real que pasa la guardia es Andrés (`super_admin`) — comportamiento
  esperado, no un caso a manejar especialmente.
- Ningún cambio de esquema ni de RLS — `can_manage_space()` y las
  políticas de `045_space_rooms_inventory_gallery_bookings.sql` ya
  soportan esto sin tocarlas.

## 5. Cómo se verifica

1. `npm run typecheck` — sin errores.
2. `npm test` — las 14 suites siguen en verde, **sin modificar ningún
   test existente**.
3. `grep -rn "canManageEcosystem" app/workspace/espacio/page.tsx` no
   devuelve nada — la guardia vieja no quedó pegada.
4. `grep -rln "components/admin/SpaceCaptureManager\|components/admin/SpaceRoomInventoryPanel\|components/admin/SpaceRoomMediaPanel" app components` no
   devuelve nada — no quedó ninguna referencia a la ruta vieja.
5. Con un usuario `super_admin`: entra a `/workspace/espacio` y el
   selector muestra Stainless Space, Oasis, Taller 108 y Club del Café —
   nunca Hojalata, Imagine ni OCB.

## 6. Qué no se toca

- El esquema de datos (`045_...sql`) y los servicios de
  `services/spaces/*` — solo se mueve quién los usa y desde dónde.
- La lógica de `canAccessWorkspace()` para el resto de `/admin/*`.
- Cualquier herramienta para Hojalata o para actores tipo productor —
  spec aparte, no construida hoy.
