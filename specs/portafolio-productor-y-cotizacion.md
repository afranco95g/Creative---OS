# Spec — Portafolio de productor, galería y "solicitar cotización"

**Camino: Completo.** Tipo nuevo (`portfolio_items`), toca permisos (RLS)
en tres tablas de actor distintas (`spaces`, `funders`, `people`), y son
más de 4 archivos. Por la regla del repo, esta no se construye en el mismo
aliento que las demás de hoy (isAgency, Fase 3, gestor cultural) sin pasar
por el ciclo constructor → auditor — un error de RLS aquí sería un actor
viendo o borrando el portafolio de otro.

**Estado (2026-09-17): construido.** Andrés confirmó "vamos con eso ya".
Migración `database/051_portfolio_items.sql` (tabla, RLS, función
`can_manage_actor`, columnas de contacto, bucket de storage),
`services/ecosystem/portfolioService.ts` (gestión) y
`services/public/publicEcosystem.ts` (lectura pública), UI de gestión
(`components/PortfolioManager.tsx`, montada en `WorkspaceHome.tsx`) y UI
pública (sección en el perfil de actor + `/portafolio` con la galería
completa). `npm run typecheck`, `npm test` y `eslint` limpios.

**Pendiente de Andrés:** correr la migración 051 contra la base real
(igual que la 050), y confirmar el resultado antes de considerarla
cerrada — no se ha probado RLS con dos actores reales cruzándose (queda
como verificación manual, no automatizada en este repo).

**Gap cerrado (2026-09-17):** `PortfolioManager.tsx` ahora incluye
"Graduar un proyecto exitoso" — cuando el actor tiene proyectos propios
con `workflow_status = 'published'` en la tabla `projects` (columnas
`actor_id`/`actor_type` ya existentes ahí, reutilizadas vía
`loadMyCloudProjects(actorId, actorType)`) que todavía no están en su
portafolio, aparece un listado con un botón "Agregar a la galería" por
cada uno. Al hacer clic, crea un `portfolio_items` con `source =
'project'` y `linkedProjectId` apuntando al proyecto — sin pedir subir
imagen (el proyecto ya tiene su propia información). "Tuvo éxito" sigue
siendo, a propósito, un juicio manual del actor: el sistema solo ofrece
los proyectos publicados como candidatos, la decisión de cuál graduar la
toma la persona, no un cálculo automático. `npm run typecheck`, `npm
test` y `eslint` limpios.

## Decisiones ya tomadas por Andrés (2026-09-17)

1. La cotización se envía por correo o por WhatsApp — cada actor elige
   cuál (o ambos) al configurar su perfil, y puede desactivar/reactivar
   cuando quiera.
2. La galería son proyectos con imágenes, videos y texto que sube el
   actor directamente, **o** un proyecto que se creó y lanzó con la
   plataforma en el ecosistema y tuvo éxito — ese puede pasar a formar
   parte de la galería.
3. (De la respuesta sobre Fase 1C, aplica también aquí por describir el
   mismo mecanismo de galería): se muestran 3 proyectos distintos, de
   forma aleatoria, cada día; al hacer clic en "ver más" se va a la
   galería completa.

## Qué se construye

### 1. Base de datos (migración nueva)

**Tabla `portfolio_items`:**
- `id uuid primary key default gen_random_uuid()`
- `actor_type text not null check (actor_type in ('space','funder','person'))`
- `actor_id uuid not null`
- `source text not null default 'custom' check (source in ('custom','project'))`
- `linked_project_id uuid references public.projects(id) on delete set null`
  — solo se usa cuando `source = 'project'`.
- `title text not null`
- `description text`
- `media_urls text[] not null default '{}'`
- `status text not null default 'published' check (status in ('draft','published'))`
- `created_at timestamptz not null default now()`
- Índice en `(actor_type, actor_id)`.
- Constraint de coherencia: si `source = 'project'`, `linked_project_id`
  no puede ser null; si `source = 'custom'`, debe ser null.

**RLS de `portfolio_items`:**
- Lectura pública: `status = 'published'` y el actor dueño también está
  publicado (mismo criterio que ya usan `spaces`/`funders` publicados).
- Escritura: solo quien administra ese actor — reutiliza los mismos
  criterios ya existentes: `space_memberships` (roles owner/administrator/
  editor, como en `045`), `funder_memberships` (mismo patrón), o
  `people.profile_id = auth.uid()` para actores tipo persona. Se escribe
  como una función `can_manage_actor(target_actor_type, target_actor_id)`
  que internamente hace el `case` entre las tres, para no repetir la
  lógica en cada policy.

**Columnas nuevas en `spaces`, `funders` y `people`:**
- `quote_contact_email_enabled boolean not null default false`
- `quote_contact_whatsapp_enabled boolean not null default false`
- `quote_contact_whatsapp_number text`
(el correo reutiliza el `public_email` que ya existe en las tres tablas —
no se duplica.)

### 2. TypeScript

- `services/ecosystem/portfolioService.ts`:
  - `listPortfolioItems(actorType, actorId)` — para el dueño, gestión
    completa (incluye `draft`).
  - `listPublicPortfolioGallery(actorType, actorId)` — público, solo
    `published`, con la rotación diaria de 3 (ver más abajo).
  - `createPortfolioItem(...)`, `updatePortfolioItem(...)`,
    `deletePortfolioItem(...)`.
  - `updateQuoteContactPreferences(actorType, actorId, prefs)`.
- **Rotación diaria determinista, no aleatoria de verdad:** para que los
  mismos 3 proyectos se vean todo el día (no cambien en cada visita) y
  sean distintos al día siguiente, se ordena por un hash determinista de
  `id + fecha de hoy (UTC)` en vez de `Math.random()` — mismo principio ya
  usado en el resto del producto (nada depende de la fecha de hoy dentro
  de un motor puro; aquí sí es intencional porque es "la foto del día",
  se calcula en la capa de servicio, no en un motor puro).

### 3. UI

- **Gestión (dentro del workspace del actor):** nueva sección para subir/
  editar items del portafolio (imágenes/video/texto), marcar cuáles
  provienen de un proyecto propio publicado y exitoso, y configurar los
  canales de cotización (checkbox email, checkbox WhatsApp + número).
- **Público (`app/ecosistema/[actorType]/[slug]/page.tsx`):** sección
  "Portafolio" con los 3 items del día + botón "Ver galería completa"
  (lleva a una vista con todos los `published`). Botón "Solicitar
  cotización" que abre `mailto:` o `https://wa.me/` según los canales que
  el actor tenga activos — si tiene ambos, se muestran los dos.

## Qué no se construye en esta entrega

- No hay flujo de mensajería interna (fue decisión explícita de Andrés:
  correo o WhatsApp, no un inbox dentro de la plataforma).
- No se construye ningún tipo de moderación/aprobación de items del
  portafolio — el actor publica directamente, igual que hoy con
  `service_categories`.
- No se decide todavía qué determina que un proyecto "tuvo éxito" para
  poder pasar a la galería — hoy se modela como una acción manual del
  actor (marca su propio proyecto como item de portafolio), no como un
  cálculo automático. Si Andrés quiere un criterio automático más
  adelante, es una iteración aparte.

## Criterio de aceptación

- Un actor no puede ver ni editar el portafolio de otro actor (verificado
  con al menos dos actores de prueba, uno intentando escribir sobre el
  otro y recibiendo error de RLS).
- Un visitante público ve como máximo 3 items por día en la vista
  resumida, siempre los mismos durante ese día, y distintos al día
  siguiente (verificado con fechas simuladas, no con `Date.now()` real).
- "Solicitar cotización" respeta exactamente los canales activos del
  actor — si desactiva WhatsApp, el botón deja de aparecer.
- `npm run typecheck`, `npm test`, `eslint` limpios; RLS probada con al
  menos un caso de intento de acceso cruzado.
