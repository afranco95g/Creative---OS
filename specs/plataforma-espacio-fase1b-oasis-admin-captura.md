# Spec: Plataforma de Espacio — Fase 1B: UI de captura (piloto Oasis)

## 1. Objetivo

Página de admin donde quien administra un espacio (Oasis, piloto) crea
salones, les carga inventario clasificado y sube fotos/video desde el
celular — sobre la capa de datos y servicios ya construida en Fase 1A
(`database/045_...sql`, `services/spaces/*`, ya aplicada en Supabase).

## 2. Por qué ahora

Fase 1A dejó tablas y servicios pero ningún lugar donde usarlos. Andrés
necesita, hoy o en los próximos días, pararse en un salón de Oasis y subir
lo que fotografía sin pasar por el SQL Editor de Supabase a mano.

## 3. Archivos que se crean o se modifican

Creados:
- `app/admin/espacios/page.tsx` — server component, guardia de acceso,
  carga inicial de espacios.
- `components/admin/SpaceCaptureManager.tsx` — client component,
  orquestador: selector de espacio, lista/creación de salones.
- `components/admin/SpaceRoomInventoryPanel.tsx` — client component:
  inventario del salón seleccionado (listar, crear categoría nueva,
  crear/editar/borrar ítems).
- `components/admin/SpaceRoomMediaPanel.tsx` — client component: galería
  del salón seleccionado (subir foto/video, opcionalmente asociado a un
  ítem de inventario; borrar; reordenar solo moviendo arriba/abajo, sin
  drag-and-drop).

No se modifica ningún archivo existente.

## 4. Fuera de alcance

- Galería pública (para alguien sin sesión, ej. un cliente potencial) —
  Fase 1C.
- Formulario de reserva para quien alquila — Fase 1C.
- FAQ — no tiene UI en esta entrega (se puede cargar por SQL Editor si
  urge antes de Fase 1C; no bloquea la captura de fotos).
- Bloqueos manuales de calendario (`space_room_blocked_dates`) — sin UI en
  esta entrega.
- Reordenar galería por arrastrar y soltar — solo botones arriba/abajo.
- Edición de la fila `spaces` misma (nombre, dirección, etc.) — ya existe
  en otro lugar del producto o se hace por SQL Editor si hace falta.

## 5. Decisiones ya tomadas

- **Ruta y guardia de acceso:** `app/admin/espacios/page.tsx`, mismo
  patrón que `app/admin/productos/page.tsx` — `canAccessWorkspace()` +
  `access.capabilities.canManageEcosystem`; si no, `redirect`. No se crea
  un sistema de acceso nuevo.
- **Selector de espacio:** dropdown simple con los espacios que
  `canAccessWorkspace` más `Staff can view spaces` (RLS) le permiten ver
  al usuario — no se filtra a "solo Oasis", cualquier espacio del
  ecosistema usa la misma pantalla. Cargado server-side en `page.tsx`.
- **Un salón se crea en estado `draft` por defecto** y se publica con un
  botón explícito ("Publicar salón" → `updateRoom(id, { status:
  'published' })`). Nunca se publica automáticamente al crear.
- **Categorías de inventario:** un `<select>` con las categorías
  existentes (`listInventoryCategories()`) más una opción "+ Nueva
  categoría" que abre un campo de texto y llama a
  `createInventoryCategory()` — la categoría queda disponible
  inmediatamente para ese ítem y para el resto del vocabulario.
- **Subida de media:** un `<input type="file" accept="image/*,video/mp4,video/quicktime">`
  reutilizando `uploadSpaceMedia()` tal cual — sin recorte ni compresión
  del lado del cliente en esta entrega (fuera de alcance: procesamiento
  de imagen/video).
- **Errores de Supabase** (RLS, validación de Zod) se muestran como texto
  plano debajo del formulario correspondiente — mismo patrón que
  `ProductReviewManager.tsx` (`setMessage(error ? error.message : '...')`).
- **Colores y estilos:** solo tokens de `CLAUDE.md` — ningún color crudo
  nuevo. `AdminSectionHeader` para el encabezado de página, igual que el
  resto de `app/admin/*`.

## 6. Interfaces y contratos que hay que respetar

- Todas las funciones de `services/spaces/*` (Fase 1A) se consumen tal
  cual están, sin modificarlas: `listRoomsForSpace`, `createRoom`,
  `updateRoom`, `listInventoryCategories`, `createInventoryCategory`,
  `listInventoryForRoom`, `createInventoryItem`, `updateInventoryItem`,
  `deleteInventoryItem`, `listMediaForRoom`, `uploadSpaceMedia`,
  `deleteSpaceMedia`, `reorderSpaceMedia`.
- `canAccessWorkspace()` de `services/auth/workspace.ts` — mismo contrato
  que ya consume `app/admin/productos/page.tsx`.
- `AdminSectionHeader` (`components/admin/AdminSectionHeader.tsx`) — se
  usa sin modificar su interfaz.

## 7. Tests que van a romperse a propósito

Ninguno. No se toca ningún archivo cubierto por la suite actual.

## 8. Criterio de aceptación verificable

1. `npm run typecheck` limpio.
2. Un usuario `super_admin` (o con `canManageEcosystem`) entra a
   `/admin/espacios`, elige un espacio, crea un salón, le agrega al menos
   un ítem de inventario en una categoría existente, crea una categoría
   nueva y agrega un segundo ítem con ella, sube al menos una foto, y
   publica el salón — todo sin recargar la página ni error en consola.
3. Un usuario sin `canManageEcosystem` que visita `/admin/espacios` es
   redirigido a `/acceso-denegado` (mismo comportamiento que
   `/admin/productos`).
4. `grep -rn "#[0-9a-fA-F]\{3,6\}\|text-white\|bg-black[^/]" components/admin/SpaceCaptureManager.tsx components/admin/SpaceRoomInventoryPanel.tsx components/admin/SpaceRoomMediaPanel.tsx app/admin/espacios/page.tsx` no devuelve resultados — ningún color crudo nuevo.

## 9. Qué queda determinista y por qué

Toda la lógica de esta entrega es CRUD determinista sobre los servicios de
Fase 1A — sin interpretación de texto libre ni IA. No hay lógica de plata
ni puntajes en esta UI (el pago se marca en Fase 1C, en el flujo de
reservas).
