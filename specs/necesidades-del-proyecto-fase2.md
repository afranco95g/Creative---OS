# Spec corta: necesidades del proyecto (Fase 2 del motor de emparejamiento)

## 1. Qué se construye

Un proyecto puede declarar qué necesita, usando el mismo vocabulario
cerrado de 12 categorías que ya usan `funders.service_categories` y
`spaces.service_categories` (migración 044) — para que necesidades de
proyecto y servicios de aliados hablen el mismo idioma. Nueva pestaña
"Necesidades" en `ProjectToolsPanel.tsx`, con selección múltiple por
botones (mismo patrón que "Roles creativos"/"Habilidades" en
`MyEcosystemDashboard.tsx`).

## 2. Por qué

Es Fase 2 del motor de emparejamiento necesidad↔servicio (documento de
Aliados, sección 7): Fase 3 (el cruce automático) no tiene nada que cruzar
sin que el proyecto primero declare sus necesidades. Andrés confirmó
(2026-09-17) arrancar por Fase 2 antes que las dos fases a la vez, para no
construir una spec larga sin nada que verificar en el camino.

**Confirmado antes de escribir esta spec:** `ProjectGraph.graph` se guarda
completo como `jsonb` en Supabase (`database/004_projects.sql`, columna
`graph jsonb not null`) — agregar un campo nuevo a `ProjectTools` no
requiere ninguna migración de base de datos, es solo un cambio de tipo
TypeScript. El vocabulario de 12 categorías hoy solo existe como constraint
SQL (`database/044_actor_service_categories.sql`) — no hay ninguna
constante TypeScript que lo represente todavía (confirmado por grep: cero
resultados de `service_categories` fuera de SQL y de
`services/spaces/spaceInventoryService.ts`, que es un vocabulario distinto
y extensible, no este).

## 3. Archivos y qué cambia en cada uno

- `services/ecosystem/serviceCategories.ts` — nuevo. Constante exportada
  `SERVICE_CATEGORIES` (`[key, label] as const`, las 12 categorías exactas
  de la migración 044 / documento de Aliados sección 3) — fuente única de
  verdad en TypeScript para este vocabulario, reutilizable por Fase 3 y por
  cualquier formulario futuro de aliados.
- `types/project.ts` — `ProjectTools` gana `needs?: string[]`.
- `core/projectEngine.ts` — `createInitialProjectGraph()` inicializa
  `tools.needs: []` (mismo patrón que `objectives`/`activities`).
- `components/ProjectToolsPanel.tsx` — nueva pestaña `needs` → "Necesidades",
  agregada al array `tabs` y a la lista de `{active === ... ? ... : null}`.
  Componente `ProjectNeeds({ graph, onChange })`: botones toggle sobre
  `SERVICE_CATEGORIES`, mismo estilo visual que "Roles creativos".

## 4. Decisiones ya tomadas

- Las 12 categorías y sus claves son exactamente las de
  `database/044_actor_service_categories.sql` /
  `EL CULEBREO - Aliados y modelo de necesidades-servicios (borrador).md`
  sección 3 — no se renombra ni se reordena ninguna.
- `needs` es una lista (`string[]`) — un proyecto puede necesitar varias
  cosas a la vez, igual que `people.skills`.
- No hay botón para agregar una categoría nueva — este vocabulario sigue
  cerrado, igual que `service_categories` en `funders`/`spaces`.
- La pestaña se llama "Necesidades" (no "Necesidades del proyecto", ya es
  obvio por contexto — mismo criterio de nombres cortos que usan las demás
  pestañas: "Presupuesto vivo", "Cronograma").
- Esta entrega NO construye el cruce contra los aliados (Fase 3) — el tab
  de "Necesidades" solo declara la lista, no muestra ningún aliado
  sugerido todavía.

## 5. Cómo se verifica

1. `npm run typecheck` — sin errores.
2. `npm test` — todo verde, sin modificar ningún test existente.
3. `grep -c "\[" services/ecosystem/serviceCategories.ts` sobre las líneas
   de categorías — 12 entradas, ni una más ni una menos.
4. `npx eslint components/ProjectToolsPanel.tsx services/ecosystem/serviceCategories.ts core/projectEngine.ts types/project.ts` — 0 errores nuevos.
5. Lectura de diff: `createInitialProjectGraph()` inicializa `needs: []`
   igual que los demás arrays de `tools`.

## 6. Qué no se toca

- Fase 3 (motor de emparejamiento propiamente dicho, cruce
  necesidad↔servicio, sub-tab "Aliados sugeridos") — spec propia, después
  de esta.
- `funders.service_categories` / `spaces.service_categories` — no se tocan,
  solo se lee su vocabulario para replicarlo en TypeScript.
- Ningún proyecto existente se migra ni se completa automáticamente con
  necesidades — el campo nace vacío, el usuario lo llena.
