# Spec corta: no preseleccionar el primer espacio alfabético en /workspace/espacio

## 1. Qué se construye

`SpaceCaptureManager` deja de precargar automáticamente el primer espacio del
listado (alfabéticamente "Club del Cafe") cuando el usuario administra más de
un espacio. En su lugar arranca sin selección, con un placeholder explícito,
y solo auto-selecciona cuando hay exactamente un espacio disponible.

## 2. Por qué

`components/spaces/SpaceCaptureManager.tsx:23` inicializa
`selectedSpaceId` con `initialSpaces[0]?.id`. `app/workspace/espacio/page.tsx:28-32`
trae los espacios rentables ordenados `name ascending`, y "Club del Cafe" es
alfabéticamente el primero entre los cuatro aliados. Resultado: cualquier
staff (`ecosystem_admin`/`super_admin`, que ve todos los espacios por RLS)
entra a `/workspace/espacio` y siempre cae en Club del Café por defecto, sin
importar cuál espacio quería administrar. Confirmado por Andrés
(`andres95.francog@gmail.com`, `super_admin` — ver `specs/super-admin-andres.md`).

No es un bug de permisos (RLS ya restringe escritura por `can_manage_space`,
`database/045_space_rooms_inventory_gallery_bookings.sql`), es un default de
UI equivocado.

## 3. Archivos y qué cambia en cada uno

- `components/spaces/SpaceCaptureManager.tsx` — estado inicial de
  `selectedSpaceId`, opción placeholder en el `<select>`, y el mensaje del
  panel "Salones" cuando no hay espacio seleccionado.

Nada fuera de esta lista sin preguntar.

## 4. Decisiones ya tomadas

- Estado inicial: `selectedSpaceId = initialSpaces.length === 1 ? (initialSpaces[0]?.id ?? '') : ''`.
  Con un solo espacio (caso típico de un miembro no-staff) se sigue
  auto-seleccionando — no tiene sentido forzar un clic extra cuando no hay
  ambigüedad posible.
- El `<select>` de línea 116-129: cuando `selectedSpaceId === ''`, agregar
  como primera opción `<option value="" disabled>Selecciona un espacio</option>`,
  seleccionada por defecto (para que el `<select>` no muestre engañosamente
  el nombre del primer espacio del arreglo mientras no hay selección real).
  Cuando `selectedSpaceId !== ''` no se agrega esa opción — se mantiene el
  comportamiento actual.
- El bloque de "Salones" (línea 163-165, `{!rooms.length && !loadingRooms ? ...}`):
  cuando `selectedSpaceId === ''` el texto debe ser
  "Selecciona un espacio para ver sus salones." en vez de
  "Todavía no hay salones en este espacio." (ese mensaje se reserva para
  cuando sí hay espacio elegido y de verdad no tiene salones).
- No se toca `app/workspace/espacio/page.tsx` ni el orden `name ascending` de
  la consulta — el orden alfabético en el `<select>` es correcto y esperado,
  el problema es solo el auto-select.
- No se agrega persistencia de "último espacio visto" (localStorage, query
  param, etc.) — fuera de alcance, no lo pidió el reporte.

## 5. Cómo se verifica

1. `npm run typecheck` — sin errores.
2. `npm test` — todo verde, sin modificar ningún test existente.
3. Lectura de diff: `selectedSpaceId` ya no se inicializa incondicionalmente
   con `initialSpaces[0]?.id` — la condición de arriba debe estar presente
   literalmente en el archivo.
4. Lectura de diff: existe una rama en el JSX del `<select>` que renderiza
   `<option value="" disabled>` solo cuando `selectedSpaceId === ''`.

## 6. Qué no se toca

- `app/workspace/espacio/page.tsx` (la consulta y su orden).
- Las políticas RLS de `spaces` / `space_memberships` / `space_rooms`.
- `SpaceRoomInventoryPanel`, `SpaceRoomMediaPanel`, `services/spaces/spaceRoomService.ts`.
- El botón "Publicar salón" (`text-rojo-base` sin `bg-rojo-base` de fondo —
  no es el bug de contraste conocido, no aplica aquí).
