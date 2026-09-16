# Spec: Plataforma de Espacio — Fase 1A (piloto Oasis): datos, permisos y galería

## 1. Objetivo

Construir la capa de datos y servicios (sin UI todavía) que permite a un
responsable de un espacio (piloto: Oasis) crear salones, cargarles
inventario clasificado con fotos/video, y recibir solicitudes de reserva
con pago presencial — usando `spaces` y `space_memberships`, ya existentes,
como base.

## 2. Por qué ahora

Andrés va a fotografiar y catalogar el edificio de Oasis y necesita subir
ese contenido organizado según un modelo de datos real, no un prototipo
aparte. `spaces` hoy es una fila por aliado, sin soporte para varios
salones, inventario, galería, disponibilidad ni solicitudes — nada de eso
existe todavía. Esta spec es el piloto de validación de "Plataforma de
Espacio" (`Arquitectura final plataforma.docx`), igual que
`044_actor_service_categories.sql` fue el piloto de `service_categories`.

## 3. Archivos que se crean o se modifican

Creados:
- `database/045_space_rooms_inventory_gallery_bookings.sql` — ya escrito y
  pendiente de aplicar contra Supabase (ver sección 8).
- `services/spaces/spaceRoomService.ts`
- `services/spaces/spaceInventoryService.ts`
- `services/spaces/spaceMediaService.ts`
- `services/spaces/spaceBookingService.ts`
- `services/spaces/spaceFaqService.ts`

No se modifica ningún archivo existente en esta entrega.

## 4. Fuera de alcance

- Cualquier página de UI (admin de captura, galería pública, formulario de
  reserva). Es la Fase 1B, spec aparte — esta entrega es solo datos y
  servicios, para poder verificarla de forma aislada antes de construir
  encima.
- Pago en línea / pasarela — `payment_method` queda fijo en `'presencial'`
  por check constraint; no se construye integración de cobro.
- Motor de emparejamiento necesidad↔servicio (Fase 2/3 del documento de
  Aliados) — no se toca.
- Autorregistro de nuevos aliados-espacio — sigue fuera de alcance según
  decisión ya tomada en el documento de Aliados.
- Notificaciones (email/push) cuando cambia el estado de una solicitud de
  reserva — no se construyen en esta entrega.

## 5. Decisiones ya tomadas

- **Un salón (`space_rooms`) pertenece a un espacio (`spaces`).** Relación
  uno a muchos — Oasis es la fila en `spaces`, cada salón del edificio es
  una fila en `space_rooms`.
- **Quién puede administrar contenido de un salón:** se reutiliza
  `space_memberships` (ya existente) — cualquier miembro activo con rol
  `owner`, `administrator` o `editor` de ese `space_id`, o staff global
  (`ecosystem_admin`/`super_admin`). Se extrajo a la función
  `public.can_manage_space(space_id)` para no repetir el predicado en las
  seis tablas nuevas. Se incluye `editor` (a diferencia de la política de
  edición de `spaces` misma, que solo permite `owner`/`administrator`)
  porque cargar inventario y fotos es trabajo operativo diario, no un
  cambio de identidad del espacio.
- **Categorías de inventario son un vocabulario que crece, no un check
  constraint cerrado.** Tabla `space_inventory_categories`, sembrada con
  `audio`, `video`, `iluminacion`, `mobiliario`, `otro`. Cualquier
  responsable activo de al menos un espacio puede insertar una categoría
  nueva — decisión explícita de Andrés, distinta del patrón de
  `service_categories` (que sí es cerrado).
- **Cuentas para quien reserva: se reutiliza el sistema de autenticación
  del ecosistema (`profiles`), sin rol nuevo.** Cualquier persona con
  sesión iniciada en El Culebreo puede enviar una solicitud de reserva —
  decisión explícita de Andrés ("si inician sesión en el ecosistema ya
  estarían registrados").
- **Galería pública.** `space_media` es legible por `anon` cuando el salón
  y el espacio están publicados — decisión explícita de Andrés.
- **Disponibilidad sin PII pública.** `project_calendar_entries` (existente)
  no aplica aquí — está atada a proyectos, no a espacios. Se crean
  `space_room_blocked_dates` (bloqueos manuales, públicos, sin datos de
  cliente) y la función `public.list_room_availability(...)`, que expone
  únicamente rangos de fecha ocupados/bloqueados — nunca el nombre del
  solicitante ni el tipo de evento. Esos datos viven en
  `space_booking_requests`, con RLS restringido al propio solicitante y a
  quien administra el espacio.
- **Pago presencial, marcado manual.** `payment_method` fijo en
  `'presencial'` por constraint; `payment_status` (`pending`/`paid`) lo
  cambia manualmente quien administra el espacio. Sin pasarela.
- **Equipos solicitados en una reserva:** tabla de enlace
  `space_booking_request_items` (reserva ↔ ítem de inventario ↔ cantidad),
  no un array — permite auditar qué se pidió sin duplicar el catálogo.
- **Slugs de salón únicos por espacio, no globalmente** (`unique(space_id,
  slug)`) — dos aliados distintos pueden tener un salón llamado igual.

## 6. Interfaces y contratos que hay que respetar

- `public.current_profile_role()` y el patrón de RLS de `spaces` /
  `space_memberships` en `database/003_actor_accounts.sql` — no se
  reinventa, se extiende vía `can_manage_space(uuid)`.
- Patrón de subida a Storage: mismo enfoque que
  `services/agenda/experienceImageService.ts` (carpeta = `auth.uid()`,
  validación de tipo/tamaño en el cliente antes de subir, URL pública vía
  `getPublicUrl`). `spaceMediaService.ts` debe seguir ese mismo contrato:
  `uploadSpaceMedia(file: File, roomId: string, inventoryItemId?: string):
  Promise<SpaceMedia>`.
- Patrón de servicio con Zod: mismo enfoque que
  `services/courses/courseService.ts` — todo input de escritura se valida
  con un schema de Zod antes de llamar a Supabase.
- `lib/supabase/client.ts` para lectura/escritura desde componentes
  cliente — ningún servicio nuevo llama a Supabase directo desde un
  componente, todo pasa por `services/spaces/*`.

## 7. Tests que van a romperse a propósito

Ninguno. Esta entrega no toca ningún archivo existente ni ningún motor
cubierto por la suite actual (`npm test`).

## 8. Criterio de aceptación verificable

1. `npm run typecheck` limpio después de agregar los cinco archivos de
   `services/spaces/`.
2. La migración `045_space_rooms_inventory_gallery_bookings.sql` corre sin
   error contra una base con el esquema actual (`database/001` a `044` ya
   aplicadas) — verificable ejecutándola en el SQL Editor de Supabase o
   por el mecanismo que Andrés use para aplicar migraciones (no hay script
   `npm run db:*` en este repo todavía; se aplica manualmente).
3. Con un usuario de prueba con `space_memberships.role = 'owner'` sobre la
   fila de Oasis: puede insertar en `space_rooms`, `space_room_inventory`,
   `space_media` y `space_faqs` para un salón de Oasis; un usuario sin esa
   membresía no puede (falla por RLS).
4. Con `space_rooms.status = 'published'` y `spaces.status = 'published'`:
   un cliente **no autenticado** (`anon`) puede leer ese salón, su
   inventario, su galería y sus FAQ vía `select`.
5. Un usuario autenticado cualquiera puede insertar en
   `space_booking_requests` con `renter_profile_id = auth.uid()`; no puede
   leer una solicitud de otro usuario; el responsable del espacio sí puede
   leer y actualizar (`status`, `payment_status`) todas las solicitudes de
   sus salones.
6. `public.list_room_availability(room_id, desde, hasta)` devuelve rangos
   de fecha para `anon`, sin ninguna columna de `space_booking_requests`
   más allá de `starts_at`/`ends_at`.

## 9. Qué queda determinista y por qué

Todo lo de esta entrega es determinista: permisos vía RLS y funciones SQL
puras, sin interpretación de texto libre ni IA. `payment_status` lo decide
una persona (quien administra el espacio), nunca un sistema automático —
consistente con la regla del proyecto de que plata y estados de pago son
siempre deterministas y auditables.
