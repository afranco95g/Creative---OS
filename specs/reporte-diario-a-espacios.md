# Spec — Reporte diario a espacios (reservas + estrategias de posicionamiento)

**Camino: Completo.** Toca notificaciones/correo (superficie nueva de
datos personales — a quién se le manda qué), necesita infraestructura
que hoy no existe en el repo (correo, notificación en plataforma, cron),
y son varios archivos nuevos. No se construye a ciegas: quedan dos
preguntas bloqueantes para Andrés antes de escribir código de envío real
(ver "Bloqueado por" más abajo). Lo que sí se puede definir y dejar listo
sin esas respuestas es el contenido del reporte y su generación.

## Decisión ya tomada por Andrés (2026-09-17)

Canal: **en la plataforma y por correo**, los dos — no uno u otro.

## Qué debe contener el reporte diario de un espacio

Por la respuesta original de Andrés sobre Fase 1C:

1. Las solicitudes de reserva del día (`space_booking_requests` con
   `created_at` de ese día, o `starts_at` de ese día — a definir, ver
   pregunta abajo) — sala, quién, fecha/hora, estado.
2. Si no hubo solicitudes ese día: mensaje explícito "no hubo novedades"
   (no un reporte vacío o ausente).
3. "Estrategias para posicionar el espacio o el servicio" — Andrés
   confirmó que esto debe ser una **regla determinista**, no contenido
   generado por IA. Ejemplo suyo: "tu categoría más vista no tiene
   fotos, agrégalas". Esto requiere las métricas de uso de la
   plataforma (clics, visitas, tiempo, scroll) que Andrés pidió en la
   misma respuesta — **una funcionalidad hoy inexistente, exclusiva de
   una futura suscripción "Pro"**. Sin esas métricas, no hay datos para
   generar la regla. Este punto 3 depende de que las métricas de uso
   existan primero — no está en el alcance de esta entrega, queda
   documentado como dependencia, no como pendiente de esta spec.

## Lo que ya existe y se puede reutilizar

- `space_booking_requests` (migración 045): `id, room_id,
  renter_profile_id, event_type, starts_at, ends_at, special_requests,
  extra_staff_requested, status ('pending'|'confirmed'|'rejected'|
  'cancelled'), payment_method, payment_status, confirmed_by,
  created_at, updated_at`. El flujo de aprobación del espacio (punto 3
  de la respuesta original de Andrés, "le debe llegar confirmación del
  espacio") **ya está construido**: `services/spaces/
  spaceBookingService.ts` tiene `confirmBookingRequest`,
  `rejectBookingRequest`, `cancelOwnBookingRequest`,
  `markBookingAsPaid`. No hay nada que construir ahí — el reporte diario
  es una capa de encima (resumen + notificación), no reemplaza ese flujo.

## Lo que NO existe hoy (confirmado por búsqueda exhaustiva en el repo)

- Envío de correo: cero referencias a Resend, SendGrid, Nodemailer, SMTP
  o cualquier proveedor de correo transaccional.
- Notificaciones dentro de la plataforma: no existe ninguna tabla
  `notifications` en ninguna migración, ni ningún componente de bandeja/
  campanita.
- Programación (cron): no existe `pg_cron`, cron de Vercel, ni ningún
  endpoint protegido pensado para ser llamado por un scheduler externo.
  (Se descartó una falsa alarma: la palabra "scheduled" sí aparece en el
  repo, pero como valor de estado de contenido editorial en
  `database/023_editorial_cms.sql`, sin relación con esto.)

## Bloqueado por (necesito que Andrés decida esto antes de construir el envío)

1. **Proveedor de correo.** El repo no tiene ninguno integrado. Sugerido:
   Resend (se integra bien con Next.js, tiene dominio verificado y buen
   trato de deliverability) — pero es la decisión de Andrés, no la mía:
   implica una cuenta, credenciales, y un dominio remitente
   (`notificaciones@elculebreo...` o el que se decida).
2. **Mecanismo de programación diaria.** No hay cron en el repo hoy.
   Opciones reales, cada una con su costo/riesgo:
   - **Vercel Cron** (si el proyecto está en Vercel) — más simple, un
     `vercel.json` con el horario y una ruta protegida que se ejecuta.
   - **Supabase `pg_cron`** — corre dentro de la base, no depende del
     hosting del frontend, pero exige lógica de envío de correo
     también accesible desde la base (edge function o webhook).
   - **Scheduler externo** (cron-job.org, GitHub Actions con cron, etc.)
     golpeando una ruta API protegida por un secreto — más control, más
     piezas sueltas para mantener.
   Necesito saber en qué está desplegado el proyecto hoy (¿Vercel?) para
   recomendar con criterio en vez de adivinar.

## Qué se puede construir ya, sin esperar esas respuestas

- La función pura que arma el contenido del reporte de un espacio para
  un día dado: `buildSpaceDailyReport(spaceId, date, bookings)` →
  `{ hasNovedades: boolean, bookings: [...], espacioLabel }`. Sin
  estrategias de posicionamiento todavía (dependen de las métricas Pro,
  fuera de alcance aquí).
- La tabla `space_daily_reports` (o el nombre que se decida) para dejar
  un registro histórico de qué se envió cada día — útil aunque el canal
  de envío todavía no esté conectado, y necesaria de todas formas para
  no reenviar el mismo reporte dos veces si el cron se reintenta.
- Una superficie mínima de "notificación en plataforma": una tabla
  `notifications` genérica (no solo para este caso — reutilizable a
  futuro) con `id, profile_id, title, body, read_at, created_at,
  related_type, related_id`, y un ícono de campanita en el header que
  lista las no leídas. Esto de todas formas hacía falta para cualquier
  notificación futura del producto, no es exclusivo de este reporte.

## Qué no se construye en esta entrega

- El envío real de correo (bloqueado, ver arriba).
- La programación automática diaria (bloqueada, ver arriba).
- Las "estrategias de posicionamiento" (dependen de las métricas Pro,
  que no existen todavía — es una entrega aparte).

## Criterio de aceptación (para cuando se desbloquee)

- Un espacio sin solicitudes ese día recibe explícitamente "no hubo
  novedades", nunca silencio.
- El mismo reporte no se envía dos veces para el mismo espacio y el
  mismo día, incluso si el disparador se ejecuta más de una vez.
- La notificación en plataforma y el correo llegan con el mismo
  contenido (una sola fuente de verdad: `buildSpaceDailyReport`).
- `npm run typecheck`, `npm test`, `eslint` limpios.
