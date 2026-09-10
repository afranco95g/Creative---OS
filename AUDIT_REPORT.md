# Informe de Auditoría Técnica — "El Culebreo" (ex "Cultura Está")

Fecha: 2026-09-09
Alcance: auditoría de solo-lectura del repositorio en `C:\Projects\Creative-OS\Cultura-esta\Cultura-esta`, rama `main`. No se modificó código ni infraestructura.
Stack verificado: Next.js `^15.0.3` (App Router) + React `19.0.0` + TypeScript `5.6.3`, Supabase (`@supabase/ssr` + `@supabase/supabase-js`), hospedado en Vercel (proyecto `cultura-esta-plataforma-test`). Sin frameworks de test dedicados (tests hechos con `node:assert` + `tsc`).

---

## Resumen ejecutivo

El producto tiene una capa de Intelligence (`engines/`) genuinamente desacoplada de React/Next, y varias capacidades centrales (registro, proyectos, experiencias, agenda, editorial/noticias, catálogo de productos) están conectadas a datos reales de Supabase, no a mocks. Sin embargo, el modelo de datos genérico documentado (Actor/Relación/Oportunidad/Evento/Conocimiento) **nunca se implementó como tal**: no existen las tablas `actors`, `relationships`, `opportunities`, `recommendations`, `decisions` ni `domain_events` genéricas — solo hay instancias concretas y dispersas (`people`/`spaces`/`funders`, FKs directas, `financial_domain_events` acotado a finanzas). No hay Ecosystem Kernel ni bus de eventos: la app opera por invocación directa en cascada, con un sistema de persistencia paralelo en `localStorage` del navegador (`core/repositories/*`) desconectado de Supabase salvo sincronización diferida. Dos capacidades declaradas — **IA de afinidad** y **Reputación** — no existen en absoluto en el código. La compra de tickets es en realidad un registro gratuito (RSVP), sin pasarela de pago. En seguridad, el hallazgo más serio es una dependencia **crítica** (Next.js 15.0.3 con RCE no autenticado) y una arquitectura donde varios formularios admin escriben directo a Supabase desde el cliente sin validación de payload, dependiendo 100% de RLS como única barrera. No existe ningún mecanismo de borrado de cuenta/GDPR: un borrado hoy dejaría PII huérfana en al menos 3 tablas. No hay CI ni backups automatizados de base de datos verificables desde el repo. El nombre "Cultura Está" sigue presente en ~90 ocurrencias, incluyendo un identificador funcional de workspace y el nombre del proyecto en Vercel.

---

## 1. Arquitectura de 5 capas y Ecosystem Kernel

### 1.1 Estructura real por carpeta y capa

| Carpeta | Contenido principal | Capa real |
|---|---|---|
| `app/` | ~35 rutas (admin/, agenda/, ecosistema/, oportunidades/, proyectos/, studio/, workspace/, api/knowledge) | Presentation, con fugas de Data Layer |
| `components/` | 22 en raíz + subcarpetas admin/agenda/ecosystem/editorial/funding/products/projects/public/reviews/workspace | Presentation, con lógica de negocio y acceso directo a Supabase mezclados |
| `features/` | `ecosystem/entities`, `review/{services,types}`, `workspace/{config,types}` | Product Layer nominal, muy subdesarrollado frente a lo prescrito (media, calendar, experiences, dashboard no existen como `features/`) |
| `engines/` | 28 archivos (conversationEngine, financialAuthorityEngine, projectKnowledgeEngine, questionEngine, executive*, knowledge*) | Intelligence Layer |
| `core/` | `projectController.ts`, `projectStore.ts`, `projectEngine.ts`, `actionEngine.ts`, `entities/`, `kernel/` (DI de plugins), `repositories/*Repository.ts`, `providers/WorkspaceProvider.tsx` (React), `workspaceStore.ts` | Domain Layer + Data Layer (repos localStorage) + un provider React colado |
| `lib/` | `data.ts`, `featureFlags.ts`, `supabase/{client,server,proxy}.ts` | Data Layer (infra Supabase) |
| `services/` | admin/agenda/auth/ecosystem/editorial/funding/knowledge/people/projects/public | Data Layer — es el seam correcto cuando se usa |
| `types/`, `data/`, `config/` | contratos de dominio, seeds estáticos, definiciones de actores | Domain/Data Layer |
| `hooks/` | wrappers React de engines/stores | Presentation (puente React↔Domain) |

### 1.2 Veredictos por capa

| Capa | Veredicto | Evidencia clave |
|---|---|---|
| Presentation (app/, components/) | **NEEDS REVISION** | `components/ProjectToolsPanel.tsx:75` reimplementa el cálculo financiero que ya existe en `engines/financialAuthorityEngine.ts:8`; `components/admin/BudgetManager.tsx:16` y 7 componentes más llaman `supabase.from/rpc` directo desde componentes cliente, saltándose `services/`. |
| Product Layer (features/) | **PASS WITH FINDINGS** | Existe la carpeta pero no las subcarpetas prescritas (`media`, `calendar`, `experiences`, `dashboard`); esa funcionalidad vive repartida en `components/` y `services/` por dominio. Gap de organización, no de lógica rota. |
| Intelligence Layer (engines/) | **PASS** | `conversationEngine.ts`, `financialAuthorityEngine.ts`, `projectKnowledgeEngine.ts`, `questionEngine.ts` no importan `react` ni `next` — son funciones puras ejecutables en Node. |
| Domain Layer (core/) | **PASS WITH FINDINGS** | `projectController.ts`/`projectStore.ts` son domain-puro, pero `core/providers/WorkspaceProvider.tsx:9` importa React dentro de `core/`, y `core/repositories/*` (workspaceRepository.ts:545,565,596,623,640 y otros) usan `window.localStorage` directo, acoplando el Domain Layer al navegador. |
| Data Layer (Supabase, services/, database/) | **PASS WITH FINDINGS** | `lib/supabase/*` y `services/*` son un seam limpio, pero no es la única puerta de entrada: `components/` la esquiva (ver Presentation). |

### 1.3 Ecosystem Kernel / bus de eventos de dominio

**No existe.** Lo que aparece bajo `core/kernel/` es un contenedor de inyección de dependencias para plugins de esquema de entidades (`core/kernel/{kernel.ts, plugin.ts, plugin-registry.ts, service-token.ts}`), no un bus de eventos ecosistémico. El único mecanismo de eventos de dominio real está acotado al subdominio financiero: `FinancialDomainEvent` (`types/financialAuthority.ts`, `engines/financialAuthorityEngine.ts:20-22`) y la tabla `public.financial_domain_events` (`database/036_financial_authority_v2.sql:39`, reconciliada en `037_reconcile_financial_authority.sql:108`). No hay `EventBus`, `emit(`, `publish(`, ni tipos genéricos para `ProjectCreated`, `ExperiencePublished`, `TicketPurchased`, `SpaceAvailabilityUpdated`, `BrandJoined`, `StoryPublished`, `CollaborationAccepted` — ninguno de estos eventos prescritos existe en el código.

El sistema opera por **invocación directa en cascada**, no por eventos: `app/*/page.tsx` → `services/*` (patrón correcto) o directo a `components/*` cliente que llama Supabase (patrón incorrecto). Además existen **dos sistemas de persistencia paralelos y desconectados**: uno en Supabase (`services/`, `database/`) y otro en `localStorage` del navegador (`core/repositories/*`), sincronizados de forma diferida vía `core/persistenceCoordinator.ts`, sin un bus que los reconcilie salvo el caso puntual financiero.

---

## 2. Rename Manifest — "Cultura Está" / variantes

Búsqueda exhaustiva case-insensitive en todo el repo (excluyendo `node_modules`, `.next`, `.git`): **~90 ocurrencias en 74 archivos**. No se encontró ningún bucket de storage, tabla o esquema con el nombre literal `cultura_esta`. No hay `.env` real trackeado en git. En git history solo un commit lo menciona (`acd18de Correct Cultura Esta brand name`); solo existe la rama `main`.

### Código (identificadores funcionales — riesgo si se renombra sin migrar datos)
- [types/workspace.ts:8](types/workspace.ts#L8) — `'cultura-esta'` como id de tipo de workspace
- [core/repositories/workspaceRepository.ts:32-33](core/repositories/workspaceRepository.ts#L32-L33) — `id: 'cultura-esta', name: 'Cultura Esta'`
- [features/workspace/config/workspace-contexts.ts:29-30](features/workspace/config/workspace-contexts.ts#L29-L30) — mismo id/nombre
- [components/ProjectToolsPanel.tsx:85](components/ProjectToolsPanel.tsx#L85) — `UID:${i.id}@culturaesta` y `PRODID:-//Cultura Esta//Creative OS//ES` en export `.ics`
- [services/editorial/editorialCmsService.ts:22](services/editorial/editorialCmsService.ts#L22) — byline por defecto `'Cultura Esta'`
- [components/editorial/EditorialPostEditor.tsx:9](components/editorial/EditorialPostEditor.tsx#L9) — mismo default
- [data/media/stories.ts:46](data/media/stories.ts#L46) — `author: 'Cultura Esta'`
- [data/workspace/modules.ts:61,205](data/workspace/modules.ts#L61) — strings descriptivos

**`id: 'cultura-esta'` es la ocurrencia de mayor riesgo**: es una clave literal usada como identificador de contexto/workspace en 3 archivos; renombrarla sin plan de migración podría romper referencias guardadas (localStorage de usuarios existentes, enlaces).

### Config / Infraestructura
- `.vercel/project.json` (local, no versionado): `"projectName":"cultura-esta-plataforma-test"`, org `team_KR68FTBkCKARVJg2iGNwnSFg` — **el proyecto de hosting sigue con el nombre viejo**.
- Contraste: `package.json` → `"name": "creative-os-real"`; `.env.example` → `NEXT_PUBLIC_SITE_URL=https://creative-os-beta-cyan.vercel.app`; remote git → `github.com/afranco95g/Creative---OS.git`. Ninguno de estos tres usa "cultura".

### DB schema
- Encabezado boilerplate `-- CULTURA ESTA` en **25 migraciones** (`001` a `030`, lista completa en el hallazgo del agente de rename).
- [database/025_cultura_esta_brand_name.sql:10](database/025_cultura_esta_brand_name.sql#L10) — `alter column byline set default 'Cultura Esta'`
- [database/025_cultura_esta_brand_name.sql:13-14](database/025_cultura_esta_brand_name.sql#L13-L14) — `update ... set byline = replace(byline, 'Cultura Esta', 'Cultura Esta')` — **replace no-op**, artefacto de una migración de rebrand que nunca se completó con el nombre nuevo.
- [database/023_editorial_cms.sql:17](database/023_editorial_cms.sql#L17) — default de columna `byline text not null default 'Cultura Esta'`
- El archivo de migración `database/025_cultura_esta_brand_name.sql` tiene el nombre viejo en su propio nombre de archivo.

### Contenido/copy visible al usuario (máxima visibilidad — SEO y UI)
- [app/layout.tsx:18,21](app/layout.tsx#L18) — **metadata SEO global**: `default: 'Cultura Esta'`, `template: '%s | Cultura Esta'` — aparece en cada pestaña del navegador.
- [app/admin/page.tsx:69](app/admin/page.tsx#L69) — badge `"CULTURA ESTA"`.
- [components/admin/TicketingManager.tsx:71](components/admin/TicketingManager.tsx#L71) — label `"Margen Cultura Esta"` en formulario de pricing.
- Además ~30 archivos más bajo `app/` (page.tsx de agenda, ecosistema, oportunidades, proyectos, login, registro, acceso-denegado, reportes, revisión-editorial, workspace) y `components/public/*`, `components/reviews/*`, `components/agenda/*`, `components/workspace/*`.

### Documentación
- `README.md:4`, `biblioteca_creative_os/README.md:3`, `docs/architecture/{relationships,entity-relationship-diagram,core-data-model,bounded-contexts}.md`, `docs/architecture/REMOTE_DATABASE_MIGRATION_DRIFT_V2_4.md:11`.

*(Nota: "cultura-local" en `ProjectToolsPanel.tsx:69` y "MinCulturas" en la biblioteca son falsos positivos — programas gubernamentales reales, no la marca del producto.)*

---

## 3. Matriz de Capacidades — Estado Real

| Capacidad | Veredicto | Evidencia |
|---|---|---|
| 1. Registrarse | ✅ Funcional | [app/login/page.tsx:68](app/login/page.tsx#L68) `supabase.auth.signInWithPassword`; [app/registro/page.tsx:238](app/registro/page.tsx#L238) `supabase.auth.signUp`, con tipos de cuenta persona/espacio/marca/agencia/org |
| 2. Crear proyecto | ✅ Funcional (con salvedad) | Se crea local-first en `localStorage` ([core/repositories/workspaceRepository.ts:596](core/repositories/workspaceRepository.ts#L596)) y se sincroniza a Supabase de forma diferida ([core/persistenceCoordinator.ts:59](core/persistenceCoordinator.ts#L59)) — ver riesgo de doble persistencia en §1.3 |
| 3. Publicar experiencia | ✅ Funcional | [services/agenda/experienceService.ts:323](services/agenda/experienceService.ts#L323) `submit_experience_for_review` → `:347` `review_experience_publication` (RPC real con workflow de aprobación) |
| 4. Comprar ticket | 🟡 Parcial | Es **registro/RSVP gratuito**, no cobro: [services/agenda/experienceRegistrationService.ts:170](services/agenda/experienceRegistrationService.ts#L170) `register_for_experience` con control de aforo y check-in, pero cero integraciones de pago (sin Stripe, sin tabla de órdenes/transacciones) |
| 5. Recomendar aliados | 🟡 Parcial | Solo un dashboard de tendencias agregadas para superadmin ([app/admin/inteligencia/page.tsx:11](app/admin/inteligencia/page.tsx#L11), tabla `ecosystem_signals`), con umbral de privacidad de 3 proyectos. Ningún usuario final recibe sugerencias de aliados concretos para su proyecto |
| 6. IA de afinidad | 🔴 No existe | [core/projectController.ts:486](core/projectController.ts#L486) solo clasifica tipo de decisión por regex (`/aliado\|marca\|espacio\|proveedor/`); no hay score/ranking/weight de compatibilidad actor↔proyecto en ningún engine |
| 7. Distribución de productos | ✅ Funcional (gestión de catálogo) | [app/productos/gestionar/page.tsx:2](app/productos/gestionar/page.tsx#L2) CRUD real vía Supabase, con revisión admin (`ProductReviewManager`) |
| 8. Reputación | 🔴 No existe | Búsqueda exhaustiva de reputación/rating/trust_score/karma: 0 resultados de lógica; solo un flag booleano manual `verified`/`featured` en `types/workspace.ts`, sin cómputo derivado |
| 9. Agenda (calendario) | ✅ Funcional | [components/admin/MasterCalendar.tsx:17](components/admin/MasterCalendar.tsx#L17) `list_master_calendar` RPC + inserción/cancelación real en `project_calendar_entries` |
| 10. Noticias (medio) | ✅ Funcional | [services/public/publicEditorial.ts:5-6](services/public/publicEditorial.ts#L5-L6) + [app/medio/[slug]/page.tsx:4](app/medio/%5Bslug%5D/page.tsx#L4) — estados de publicación, SEO/JSON-LD `NewsArticle`, revelación de patrocinio |

**Resumen: 5 funcionales, 2 parciales, 2 inexistentes.** Las dos inexistentes (IA de afinidad, reputación) son justamente las que el "Living Product Blueprint" presenta como diferenciadores del producto frente a un CRUD cultural genérico.

---

## 4. Modelo de Datos: gaps y divergencias

### 4.1 Comparación contra la lista mínima v0.1

| Esperada | Estado real |
|---|---|
| `users` | No existe como tal; equivalente `profiles` (+ `auth.users` de Supabase) |
| `actors` | **No existe** — reemplazado por tablas concretas: `people`, `spaces`, `funders` |
| `actor_capabilities` / `actor_needs` | **No existen** — aproximado por arrays `offers`/`needs` embebidos en `spaces` |
| `actor_goals` | **No existe** |
| `projects` | Existe, nombre exacto |
| `project_members` | **No existe** con ese nombre; equivalentes: `project_actor_links`, `space_memberships`, `funder_memberships` |
| `project_needs` / `project_resources` | **No existen**; parcialmente cubierto por `project_budget_lines` (solo financiero) |
| `relationships` | **No existe** como tabla genérica — relaciones son FKs directas puntuales |
| `opportunities` | **No existe** genérica; solo `funding_opportunities` (acotado a convocatorias de fondeo) |
| `recommendations` / `decisions` / `outcomes` / `changes` | **No existen** en absoluto (lo más cercano a `decisions` es `financial_proposals`) |
| `context_snapshots` | No existe con ese nombre; `project_snapshots` es equivalente parcial |
| `domain_events` | **No existe** genérico; solo `financial_domain_events`, acotado a finanzas |
| `evidence` | No existe como tabla; es una columna `jsonb` dentro de `project_budget_lines` |

**Conclusión:** el modelo Actor-Proyecto-Relación-Oportunidad-Evento genérico documentado en v0.1 nunca se implementó en SQL. El schema real es dominio-específico y fragmentado, sin las tablas abstractas de razonamiento que el Core conceptual del producto exige.

### 4.2 Relación Actor–Proyecto–Espacio–Marca–Experiencia–Oportunidad

No hay tabla `actors` central ni FK polimórfica limpia: `products.owner_actor_type`+`owner_actor_id` y `editorial_posts.related_actor_type`+`related_actor_id` usan "polimorfismo manual" (`text`+`uuid` sin FK real ni `CHECK` de validación contra `people/spaces/funders`) — divergencia de integridad referencial. "Marca" no existe como concepto propio (lo cubre `spaces`). El grafo real: Actor↔Proyecto vía `project_actor_links`; Proyecto↔Experiencia y Experiencia↔Espacio vía FK directa; Oportunidad de fondeo conectada solo a `funding_applications`, desconectada del resto del grafo salvo FKs puntuales.

### 4.3 Autoría / propiedad intelectual — hallazgo crítico

La mayoría de tablas de contenido sí registran autoría: `projects.owner_id`, `experiences.owner_id`, `spaces.created_by`, `funders.created_by`, `editorial_posts.{created_by,updated_by,published_by}`, `financial_proposals.created_by`. **Pero `knowledge_sources` y `knowledge_chunks` (la biblioteca de conocimiento/RAG) no tienen ningún campo de autoría de usuario** ([database/032_project_sync_and_knowledge.sql:21-32](database/032_project_sync_and_knowledge.sql#L21-L32)) — solo `author` como texto bibliográfico libre del documento, no un `uuid` de quien lo subió. Esto es relevante directamente para la política de propiedad intelectual sobre material subido por terceros: hoy **no es técnicamente posible atribuir cada documento de la biblioteca a quien lo cargó**.

### 4.4 RLS y tablas huérfanas (relacionado al modelo de datos)

RLS confirmado habilitado en: `profiles`, `people`, `projects`, `spaces`/`space_memberships`/`funders`/`funder_memberships`, `editorial_posts`/`editorial_media_assets`/`homepage_sections`, `project_budget_lines`/`financial_proposals`/`financial_domain_events`. **Sin RLS habilitado**: `knowledge_sources`, `knowledge_chunks`, `knowledge_retrieval_logs`, `knowledge_ingestion_logs`, `funding_opportunities`, `funding_applications`, `experience_registrations`, `experience_reports`, `project_actor_links`, `project_editorial_profiles`, `project_reanalysis_audits`, `project_calendar_entries`, `ticket_type_products` — ver detalle de riesgo en §5.

Tablas sin ninguna referencia `.from('tabla')` en `app/`, `core/`, `engines/`, `services/`, `components/` (posiblemente no conectadas a ningún flujo de UI activo): `funding_opportunities`, `funding_applications`, `experience_registrations`, `experience_reports`, `project_actor_links`, `knowledge_retrieval_logs`, `knowledge_ingestion_logs`, `project_reanalysis_audits`, `project_editorial_profiles`, `experience_products`.

---

## 5. Hallazgos de Seguridad (por severidad)

### 🔴 Crítico

**S1 — Next.js 15.0.3 con múltiples CVEs de RCE/SSRF/DoS no autenticados.**
`npm audit`: 9 vulnerabilidades (1 moderada, 7 altas, **1 crítica**). Incluye RCE no autenticado en servidores Windows-hosted, RCE en Image Optimization API con AVIF, DoS y SSRF en Server Actions, SSRF en rewrites vía hostname de destino controlado por atacante, y exposición no autenticada de endpoints internos de Server Functions. Transitivas: `postcss` (XSS, path traversal vía sourcemaps) y `sharp` (libvips/libheif). Explotable sin autenticación en cualquier despliegue público. **Acción inmediata**: `npm audit fix` / actualizar a la última patch de Next.js 15.x.

**S2 — Escrituras directas cliente→Supabase sin validación de payload, dependiendo solo de RLS.**
[components/admin/BudgetManager.tsx:14-16](components/admin/BudgetManager.tsx#L14) y al menos 7 componentes más (`TicketingManager.tsx`, `ProductReviewManager.tsx`, `TaxRulesManager.tsx`, `ProfileAccessManager.tsx`, `MasterCalendar.tsx`, `BudgetSuggestion.tsx`, `EcosystemSignalConsent.tsx`) son `'use client'` y ejecutan `supabase.from(...).update/insert` directo desde el navegador con la clave pública, sin esquema de validación (no hay `zod` ni validación manual en el repo). La política RLS `"Project owners manage budget"` ([database/037_reconcile_financial_authority.sql:344-349](database/037_reconcile_financial_authority.sql#L344-L349)) permite `for all` al owner sin restringir **qué columnas** puede tocar — un owner autenticado podría, vía DevTools, forzar `status`/`total`/`vat` sin pasar por el workflow de revisión.

### 🟠 Alto

**S3 — Middleware de rutas protegidas no cubre todos los árboles sensibles.**
[middleware.ts](middleware.ts) / [lib/supabase/proxy.ts:38-43](lib/supabase/proxy.ts#L38-L43): `protectedPrefixes = ['/admin','/studio','/workspace','/mi-ecosistema']`. Faltan `/gestion-financiacion`, `/gestion-agenda`, `/revision-ecosistema`, `/revision-editorial`, `/revision-actores`. Hoy cada `page.tsx` de esos árboles implementa su propio check (`canAccessWorkspace()`), así que **no hay bypass activo hoy**, pero no hay red de seguridad centralizada — cualquier página nueva que olvide el check queda expuesta sin aviso.

**S4 — Sin rate limiting en ningún endpoint.**
Cero resultados de `rate-limit|throttle` en todo el repo. [app/api/knowledge/health/route.ts:5](app/api/knowledge/health/route.ts#L5) es **público, sin auth y sin límite**, invocable indefinidamente. `app/api/knowledge/search/route.ts` está autenticado pero también sin límite de tasa — riesgo de abuso de costos si consulta proveedores externos (OpenAlex).

**S5 — Validación de input inexistente en Server Actions/API routes.**
Ningún `zod` ni validación de rango/tipo en el repo. `app/api/knowledge/search/route.ts:6` solo valida existencia de `query`, no valida `projectId` (¿UUID?) ni `purpose` (whitelist) antes de pasarlos a `buildKnowledgeQuery`.

### 🟡 Medio

**S6 — Migraciones duplicadas de tablas de conocimiento con RLS inconsistente entre sí.**
`database/032_project_sync_and_knowledge.sql:21-44` y `database/034_knowledge_engine_metadata.sql:6-62` ambas crean (`if not exists`) `knowledge_sources/knowledge_chunks/knowledge_retrieval_logs` con políticas RLS distintas (una usa `is_active`, la otra `is_active and status='active'`) — ambigüedad sobre qué regla gobierna en el remoto según orden real de aplicación. Coherente con lo ya documentado en `docs/architecture/REMOTE_DATABASE_MIGRATION_DRIFT_V2_4.md`.

**S7 — Tablas sin RLS habilitado (ver también §4.4).**
`knowledge_sources`, `knowledge_chunks`, `knowledge_retrieval_logs`, `knowledge_ingestion_logs`, `funding_opportunities`, `funding_applications`, `experience_registrations` (contiene PII de asistentes: nombre/email/teléfono), `experience_reports`, `project_actor_links`, `project_editorial_profiles`, `project_reanalysis_audits`, `project_calendar_entries`, `ticket_type_products`. Sin RLS + clave `anon` pública, cualquiera con la URL/anon-key podría potencialmente leer/escribir estas tablas dependiendo de los grants por defecto de Postgres/PostgREST — **requiere verificación directa en el proyecto Supabase real** (no confirmable 100% solo desde el SQL de migración si hay grants adicionales revocados).

**S8 — Endpoint de salud interno expuesto sin autenticación.**
`app/api/knowledge/health/route.ts:5` expone conteos de documentos/chunks y estado de proveedores externos sin `auth.getUser()`. Riesgo bajo por sí solo pero información operativa interna innecesariamente pública.

### 🟢 Bajo / hallazgos positivos

**S9 — Verificación de rol admin correctamente server-side.** `services/auth/workspace.ts:34-154` (`canAccessWorkspace()`) hace `auth.getUser()` + consulta a `profiles` en Server Component, y se refuerza en RLS vía `current_profile_role()` (`security definer`, basado en `auth.uid()`). Patrón correcto, aunque repetido copy-paste en ~15 archivos (mismo riesgo de omisión que S3).

**S10 — Sin PII en logs de texto plano** en el código auditado (`console.error` solo imprime `error.message` de Supabase, no payloads de usuario).

**S11 — Secretos correctamente aislados.** `SUPABASE_SERVICE_ROLE_KEY` solo aparece en scripts CLI de administración (`scripts/financial-migration-preview.ts`, `scripts/knowledge-admin.ts`), fuera del bundle de Next.js. Ningún `.env` real trackeado en git.

**No verificable desde el repo:** configuración de Supabase Auth (MFA, políticas de contraseña, proveedores), reglas de WAF/rate-limit de Vercel Edge, grants efectivos de PostgREST sobre las tablas sin RLS (S7) — requiere acceso al dashboard de Supabase y Vercel.

---

## 6. Datos Personales y Borrado

### 6.1 Mapa de datos personales

| Tabla | Campos con PII |
|---|---|
| `profiles` | `email`, `full_name`, `avatar_url` |
| `people` | `full_name`, `biography`, `avatar_url`, `city`, `department`, `country`, redes sociales, `public_email` |
| `spaces` | `name`, `city`, `department`, `address`, `public_email` |
| `experience_registrations` | `attendee_name`, `attendee_email`, `attendee_phone` (texto plano) |
| `projects.graph` / `projects.messages` (jsonb libre) | Contenido de proyecto y mensajería sin columnas dedicadas — cualquier PII incrustada ahí no es auditable por columna |
| `ecosystem_signals` | `source_actor_id`, con flags `is_anonymized`/`consent_scope`/`revoked_at` |

### 6.2 Mecanismo de borrado — no existe

Ninguna función RPC ni ruta implementa borrado o anonimización de actor/usuario completo. No hay endpoint "delete account" ni `delete_user`/`gdpr_erase`.

### 6.3 Qué pasaría hoy si se pide borrar los datos de un actor

**Sería un borrado parcial e inconsistente**, no limpio:
- `profiles.id → auth.users.id`: `ON DELETE CASCADE` → borra `profiles`.
- `projects.owner_id → profiles.id`: `ON DELETE CASCADE` → borra el proyecto completo (incluye `graph`/`messages`).
- `people.profile_id → profiles.id`: `ON DELETE SET NULL` → **la persona queda huérfana y pública** en vez de borrarse.
- `experience_registrations.user_id → profiles.id`: `ON DELETE SET NULL` → **nombre/email/teléfono del asistente quedan intactos en texto plano**, desconectados del usuario.
- `ecosystem_signals.source_actor_id`: **sin FK** → identificador huérfano no limpiable declarativamente.
- Contenido dentro de `projects.graph`/`messages` de coautores puede seguir citando al actor borrado (texto libre).

**Qué se necesitaría construir:** una función RPC transaccional que (1) anonimice `people` y `experience_registrations` en vez de dejarlos huérfanos, (2) agregue FK explícita desde `ecosystem_signals.source_actor_id` con estrategia de limpieza, (3) trate `projects.graph`/`messages` como riesgo de PII embebida no estructurada, y (4) documente qué pasa con archivos en Storage (avatares, adjuntos).

Sobre el motor de conocimiento/recomendación: no hay motor que persista modelos entrenados por actor. `ecosystem_signals` ya nace con `is_anonymized`/`consent_scope`/`revoked_at` — es la pieza más cercana a "desidentificar sin romper el aprendizaje colectivo", pero al no tener FK desde `source_actor_id`, hoy no hay garantía de que borrar/desidentificar el actor origen limpie esas señales agregadas.

---

## 7. Tests e Infraestructura

- **Tests**: `npm test` compila y corre 7 suites (`.test.ts` → `.test-tools/`) con `node:assert`, cubriendo lógica pura de `engines/`/`core/` (clasificación de proyectos, motor financiero, motor de preguntas). **Sin tests** de autenticación, políticas RLS, rutas API HTTP, ni UI/e2e. No hay Jest/Playwright/Cypress en `devDependencies`.
- **CI/CD**: No existe. Sin `.github/workflows/` ni ningún otro pipeline.
- **Ambientes**: Un solo proyecto Vercel (`cultura-esta-plataforma-test`) y una sola URL de Supabase en `.env.example` — sin evidencia de separación dev/staging/prod desde el repo. No verificable si existen proyectos Supabase distintos por ambiente — requiere dashboard de Supabase/Vercel.
- **Backups**: `financial:backup` no es un backup real — exporta manualmente 9 tablas a JSON local, omite `people`, `spaces`, `funders`, `experiences`, `knowledge_chunks`, `ecosystem_signals`, `auth.users`. Sin cron ni automatización. No hay backup automatizado de la base completa verificable desde el repo — si Supabase tiene PITR/backups a nivel de plataforma, no es verificable desde el repo.

---

## 8. Lista priorizada — qué falta para que el software cumpla lo que dice la documentación de producto

1. **Actualizar Next.js** a la última patch 15.x (CVE crítico RCE no autenticado) — trivial, alto impacto.
2. **Decidir el rename real**: mover `id: 'cultura-esta'` a un identificador nuevo con plan de migración de datos existentes, renombrar el proyecto en Vercel, actualizar `app/layout.tsx` (SEO) y limpiar el replace no-op en `025_cultura_esta_brand_name.sql`.
3. **Construir el flujo de borrado de cuenta/GDPR**: RPC transaccional que anonimice `people`/`experience_registrations`, FK real en `ecosystem_signals.source_actor_id`, política sobre `projects.graph`/`messages`.
4. **Habilitar RLS** en las 12 tablas identificadas sin políticas (`knowledge_*`, `funding_*`, `experience_registrations`, etc.) y resolver la duplicidad de migraciones 032/034.
5. **Cerrar el gap de autoría en `knowledge_sources`/`knowledge_chunks`**: agregar `uploaded_by` — bloqueante para cualquier política de propiedad intelectual sobre la biblioteca.
6. **Decidir el modelo de datos genérico**: o se formaliza `actors`/`relationships`/`opportunities`/`domain_events` como tablas reales (alineado al Core conceptual documentado), o se actualiza la documentación de producto para reflejar el modelo concreto (`people`/`spaces`/`funders` + FKs puntuales) que realmente existe — hoy documentación y esquema están desalineados.
7. **Construir un motor real de IA de afinidad** y de **reputación** — ambos 🔴 inexistentes, y son los diferenciadores declarados del producto frente a un CRUD cultural genérico.
8. **Decidir sobre "comprar ticket"**: si el producto requiere cobro real, falta integrar una pasarela de pago; hoy es RSVP gratuito.
9. **Añadir validación de payload server-side** (zod u equivalente) en formularios admin que hoy escriben directo a Supabase desde el cliente, y mover esas escrituras a `services/` en vez de componentes.
10. **Ampliar `protectedPrefixes` del middleware** a los árboles de gestión/revisión, y añadir rate limiting mínimo en endpoints públicos (`/api/knowledge/health`, calendario, medio).
11. **Configurar CI** (typecheck + test en cada PR) y **backups automatizados reales** de la base completa (hoy no hay ninguno de los dos).
12. **Consolidar la persistencia**: decidir si `core/repositories/*` (localStorage) sigue existiendo como capa local-first permanente o se migra todo a Supabase vía `services/`, para eliminar el riesgo de doble fuente de verdad.
