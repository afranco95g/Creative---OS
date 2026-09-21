# Spec: Escrituras admin validadas server-side (reemplazo de supabase.from() directo en 7 componentes cliente)

Todas las secciones son obligatorias. Si una sección no aplica, se escribe
explícitamente "ninguno"/"ninguna" y por qué.

## 1. Objetivo

Mover las escrituras a Supabase (`insert`/`update`/`upsert`) de 7 componentes
`'use client'` desde una llamada directa `supabase.from(...)` en el navegador
a una función `services/` server-only validada con `zod`, expuesta por una
ruta API, sin cambiar el comportamiento visible para el usuario.

## 2. Por qué ahora

Auditoría del 2026-09-21 (`AUDIT_REPORT_2026-09-21.md`, hallazgo S2) encontró
que 7 componentes escriben directo del navegador a tablas reales sin ningún
esquema de validación entre el formulario y la base — el payload que arma el
form llega tal cual a Supabase, y RLS es la única barrera. En al menos un
caso (`BudgetManager.tsx`) el formulario puede enviar cualquier valor de
`status` (incluidos estados que en teoría solo debería poder poner el
workflow de revisión, como `approved`/`paid`/`executed`), porque no hay
whitelist de qué puede setear el cliente en la creación. Esto choca contra la
restricción que ya declara `CLAUDE.md`: "Plata, puntajes y consistencia son
siempre deterministas y auditables" — hoy no hay un modelo decidiendo esos
valores, pero tampoco hay nadie validándolos.

No se está pidiendo "un patch por componente": se pide un patrón único,
reutilizable, para que los 7 casos queden resueltos de la misma forma y no
se vuelva a repetir en el próximo componente admin que se escriba.

## 3. Archivos que se crean o se modifican

**Se crean:**
- `lib/validation/adminWriteAuth.ts` — helper único: recibe la `Request`,
  hace `auth.getUser()` + verificación de rol server-side (reusa
  `canAccessWorkspace()` de `services/auth/workspace.ts`, no lo duplica), y
  devuelve el `profile`/`role` o lanza 401/403. Todas las rutas nuevas de
  esta entrega lo llaman primero.
- `services/admin/budgetLineService.ts` — valida y escribe en
  `project_budget_lines` (usado hoy por `BudgetManager.tsx` y
  `BudgetSuggestion.tsx`) y en `financial_scenarios` (usado por
  `BudgetManager.tsx`).
- `services/admin/calendarEntryService.ts` — valida y escribe en
  `project_calendar_entries` (usado hoy por `MasterCalendar.tsx`).
- `services/admin/commercialPolicyService.ts` — valida y escribe en
  `commercial_policies` (usado hoy por `ProductReviewManager.tsx`).
- `services/admin/taxRuleService.ts` — valida y escribe en `tax_rules`
  (usado hoy por `TaxRulesManager.tsx`).
- `services/admin/ticketingService.ts` — valida y escribe en `ticket_types`
  y `ticket_type_products` (usado hoy por `TicketingManager.tsx`).
- `services/products/productOwnerService.ts` — valida y escribe en
  `products` (usado hoy por `ProductOwnerManager.tsx`).
- `app/api/admin/budget-lines/route.ts` (POST, PATCH)
- `app/api/admin/calendar-entries/route.ts` (POST, PATCH)
- `app/api/admin/commercial-policies/route.ts` (POST, PATCH)
- `app/api/admin/tax-rules/route.ts` (POST, PATCH)
- `app/api/admin/ticketing/route.ts` (POST, PATCH)
- `app/api/products/owner/route.ts` (POST, PATCH)

**Se modifican:**
- `components/admin/BudgetManager.tsx` — `create()`, `update()` y el
  `asyncCreate` de `ScenarioPanel` pasan de `supabase.from(...)` a
  `fetch('/api/admin/budget-lines', ...)` (y su contraparte de escenarios).
  El resto del componente (estado local, render, export CSV) no cambia.
- `components/admin/MasterCalendar.tsx` — mismas 3 llamadas
  (`insert`/`update`×2) pasan a `fetch('/api/admin/calendar-entries', ...)`.
- `components/admin/ProductReviewManager.tsx` — `insert`/`update` de
  `commercial_policies` pasan a `fetch('/api/admin/commercial-policies', ...)`.
- `components/admin/TaxRulesManager.tsx` — `insert`/`update` de `tax_rules`
  pasan a `fetch('/api/admin/tax-rules', ...)`.
- `components/admin/TicketingManager.tsx` — `insert`/`update` de
  `ticket_types` y el `insert` de `ticket_type_products` pasan a
  `fetch('/api/admin/ticketing', ...)`.
- `components/products/ProductOwnerManager.tsx` — `insert`/`update` de
  `products` pasan a `fetch('/api/products/owner', ...)`.
- `components/projects/BudgetSuggestion.tsx` — su `insert` en
  `project_budget_lines` pasa a `fetch('/api/admin/budget-lines', ...)`
  (mismo endpoint que `BudgetManager.tsx`, mismo esquema).

## 4. Fuera de alcance

- **`ProfileAccessManager.tsx` y `EcosystemSignalConsent.tsx`**: ya llaman
  `supabase.rpc(...)` (`manage_profile_access`, `share_ecosystem_signal`,
  `revoke_ecosystem_signal`), no `supabase.from(...)`. Una función Postgres
  con nombre es un límite de validación distinto — legítimo, no el mismo
  problema que S2 describe. Se listan aparte para decidir en otra entrega si
  conviene envolverlas también; esta spec no las toca.
- **RLS de las tablas involucradas** (`project_budget_lines`,
  `project_calendar_entries`, `commercial_policies`, `tax_rules`,
  `ticket_types`, `ticket_type_products`, `products`, `financial_scenarios`):
  esta entrega no cambia ninguna política RLS. El objetivo es que la
  aplicación deje de depender *solo* de RLS, no reemplazar RLS.
  S7 (tablas sin RLS) es un hallazgo separado, no se toca aquí.
- **Recalcular el cálculo financiero duplicado** entre
  `ProjectToolsPanel.tsx:75` y `engines/financialAuthorityEngine.ts` (ya
  señalado en `AUDIT_REPORT.md` original) — no es parte de esta entrega.
- **Ninguna pasarela de pago, ningún cambio de UI/diseño.**
- **`reset-mi-password.local.js`**: se resolvió aparte (fuera de código, es
  limpieza de git), no es parte de esta spec.

## 5. Decisiones ya tomadas

- El patrón es: componente cliente → `fetch` a una ruta en `app/api/` →
  la ruta llama a una función en `services/<dominio>/` → esa función valida
  con `zod` y usa el cliente Supabase server-side (`lib/supabase/server.ts`,
  no el cliente público). El componente nunca vuelve a importar `supabase`
  de `@/lib/supabase/client` para escribir (sí puede seguir usándolo para
  `select` de solo lectura si ya lo hacía, eso no es parte del hallazgo).
- Cada ruta nueva llama primero a `lib/validation/adminWriteAuth.ts` — no se
  duplica el chequeo de rol copiado a mano en cada route handler.
- **Los campos de estado/workflow no entran en el schema de creación.** Para
  `project_budget_lines`, el `status` en `insert` solo puede ser
  `'estimated'` o `'quoted'` (los estados `approved/committed/invoiced/
  paid/cancelled/executed` se mueven vía el workflow de revisión que ya
  existe, no vía este formulario). El `update` de `status` desde
  `BudgetManager.tsx` (el `<select>` en la tabla) se limita en el schema del
  PATCH a la transición `estimated → quoted` — cualquier otra transición la
  rechaza la ruta con 400. Si Andrés necesita que el owner pueda mover más
  estados desde ahí, es una decisión de producto que se toma en la revisión
  de esta spec, no algo que el constructor decida solo.
- Los mensajes de error que devuelven las rutas van en español, mismo tono
  que el `message` state que ya usan estos componentes
  (ej. "El valor unitario no puede ser negativo." en vez del mensaje crudo
  de zod).
- Nombre de carpeta: `app/api/admin/<recurso>/route.ts`, seedeado con la
  convención que ya usa `app/api/knowledge/`.
- No se introduce ninguna librería nueva — `zod` ya está en `dependencies`.

## 6. Interfaces y contratos que hay que respetar

- Las 7 rutas nuevas devuelven `{ data }` en éxito y `{ error: string }` en
  fallo (mismo shape que hoy manejan los componentes vía
  `const { data, error } = await supabase...`), para minimizar el cambio en
  la lógica de cada componente más allá de swapear la llamada.
- `services/auth/workspace.ts` → `canAccessWorkspace()` es la función
  existente que ya hace `auth.getUser()` + rol; `adminWriteAuth.ts` la
  reusa, no la reimplementa.
- Los tipos `Line`, `Scenario`, etc. que ya declaran los componentes
  (`interface Line{...}` dentro de `BudgetManager.tsx`) se mueven a
  `services/admin/budgetLineService.ts` como la fuente de tipos, y el
  componente los importa desde ahí en vez de redeclararlos — evita que
  servicio y componente diverjan en forma silenciosa.
- `engines/financialAuthorityEngine.ts` no se modifica ni se llama desde
  esta entrega — el cálculo de escenarios (`calculate_financial_scenario`)
  sigue siendo un RPC de Postgres, fuera de esta spec.

## 7. Tests que van a romperse a propósito

Ninguno. Ninguna de las 10 suites de la línea base verificada
(`npm test`, `CLAUDE.md`) ejercita estos 7 componentes ni las tablas que
tocan directamente — son suites sobre `engines/`/`core/` puro
(clasificación de proyectos, motor financiero, motor de preguntas), no sobre
componentes React ni rutas API HTTP. Si el auditor encuentra que alguna sí
los toca indirectamente, se detiene y se reporta antes de continuar — no
estaba anticipado aquí.

## 8. Criterio de aceptación verificable

1. `grep -rn "supabase\.from(" components/admin/BudgetManager.tsx
   components/admin/MasterCalendar.tsx components/admin/ProductReviewManager.tsx
   components/admin/TaxRulesManager.tsx components/admin/TicketingManager.tsx
   components/products/ProductOwnerManager.tsx
   components/projects/BudgetSuggestion.tsx` da 0 resultados de
   `insert`/`update`/`upsert` (puede seguir habiendo `select` si ya existía).
2. Cada una de las 6 rutas nuevas, llamada sin `Authorization`/sesión válida,
   responde 401 — caso de prueba concreto por ruta.
3. Cada una de las 6 rutas nuevas, llamada con un payload que viola el
   schema (ej. `unit_value: -100`, `status: 'paid'` en creación), responde
   400 con el mensaje en español correspondiente — caso de prueba concreto
   por ruta, no un grep de texto.
4. `npm run typecheck` limpio y `npm test` con las mismas 10 suites en
   verde — salida literal pegada en el reporte de la entrega, no resumida.
5. Prueba manual: crear una línea de presupuesto desde `/gestion-financiacion`
   (o donde viva `BudgetManager` en la UI) con la sesión de un owner real
   sigue funcionando igual que antes para el usuario.

## 9. Qué queda determinista y por qué

Toda esta entrega es validación de rango/tipo/enum con `zod` — determinista
y auditable de punta a punta, sin interpretación de texto libre en ningún
punto. No hay ningún modelo ni heurística decidiendo valores de plata,
puntajes ni estados: el schema es la única fuente de verdad de qué payload
es válido, y vive en `services/`, no repetido por componente.
