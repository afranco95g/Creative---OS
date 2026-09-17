# Spec corta: conectar `checkDependencyConsistency()` a la pestaña "Objetivos y actividades"

## 1. Qué se construye

La pestaña "Objetivos y actividades" (`ObjectivesAndActivities` en
`components/ProjectToolsPanel.tsx`) muestra, arriba de "Objetivos", los
hallazgos de `checkDependencyConsistency()` — hoy el motor existe
(`engines/projectDependencyEngine.ts`) pero ningún componente lo llama ni
muestra sus `DependencyFinding`.

## 2. Por qué

Pendiente #6 de la bitácora del proyecto, confirmada por Andrés hoy
(2026-09-17) como la mejora concreta a priorizar del "motor de creación de
proyecto". El motor detecta tres casos: un vínculo actividad↔presupuesto
que apunta a algo borrado (`orphan_budget_link`), un ítem de cronograma
vinculado a una actividad borrada (`orphan_schedule_item`), y una actividad
sin ningún vínculo (`activity_without_link`, informativo). Hoy esos
hallazgos no le llegan a Andrés de ninguna forma.

**Confirmado leyendo el código antes de escribir esta spec:** borrar una
actividad (`removeActivity`, línea ~188 de `ProjectToolsPanel.tsx`) ya
limpia sus vínculos correctamente (no genera huérfanos). El caso real que sí
puede generar un `orphan_budget_link` es borrar una línea desde "Presupuesto
vivo" (`LivingBudget`, botón de la última columna de la tabla) — ese borrado
no toca `activityBudgetLinks`. Es exactamente el caso que la bitácora ya
tenía anotado como pendiente de decidir, con la recomendación **reportar, no
borrar** (mismo principio que rige el resto del proyecto) — esta spec
implementa esa recomendación, no la reabre.

## 3. Archivos y qué cambia en cada uno

- `components/ProjectToolsPanel.tsx` — dentro de `ObjectivesAndActivities`:
  se llama `checkDependencyConsistency(graph.tools)` (memoizado con
  `useMemo`, dependiente de `graph.tools`) y, si hay hallazgos, se renderiza
  una sección "Consistencia" antes de "Objetivos" con un `<article>` por
  hallazgo (mismo estilo visual que las demás tarjetas del archivo:
  `rounded-2xl border border-borde/10 bg-superficie-elevada p-5`, borde
  `border-acento` para diferenciarla como aviso). Cada hallazgo muestra
  `finding.message` y, cuando aplica, un botón que resuelve el caso
  reutilizando funciones que **ya existen** en este mismo componente — no
  se escribe lógica de mutación nueva:
  - `orphan_budget_link` → botón "Quitar vínculo", llama
    `unlinkBudgetLine(finding.relatedId)` (el `relatedId` de este tipo de
    hallazgo ya es el id del vínculo, confirmado leyendo
    `projectDependencyEngine.ts` línea 30).
  - `orphan_schedule_item` → botón "Quitar vínculo", llama
    `unlinkScheduleItem(finding.relatedId)` (el `relatedId` es el id del
    ítem de cronograma, confirmado línea 46).
  - `activity_without_link` → sin botón, es informativo (la actividad no
    tiene nada roto, solo no está vinculada todavía).
  Se agrega el import de `checkDependencyConsistency` desde
  `@/engines/projectDependencyEngine` y de `DependencyFinding` desde
  `@/types/project`.

## 4. Decisiones ya tomadas

- No se toca `removeActivity`, `LivingBudget`, ni ninguna función de
  mutación existente — se reutilizan tal cual.
- No se agrega ninguna limpieza automática al borrar una línea de
  presupuesto — reportar, no borrar, es la decisión ya tomada.
- El cálculo de hallazgos es 100% derivado (`useMemo`), no se guarda estado
  de hallazgos en el grafo del proyecto ni en Supabase.
- Los tres tipos de hallazgo se muestran juntos, sin agrupar por tipo —
  la lista rara vez va a tener más de unos pocos elementos en un proyecto
  real.
- Si no hay hallazgos, no se muestra la sección "Consistencia" en absoluto
  (ni un estado vacío) — no vale la pena el ruido visual para el caso
  común (proyecto consistente).

## 5. Cómo se verifica

1. `npm run typecheck` — sin errores.
2. `npm test` — todo verde, sin modificar ningún test existente
   (`tests/projectDependencyEngine.test.ts` no se toca — el motor no
   cambia, solo se consume).
3. `grep -n "checkDependencyConsistency" components/ProjectToolsPanel.tsx`
   — presente.
4. `npx eslint components/ProjectToolsPanel.tsx` — 0 errores nuevos.
5. Lectura de diff: `unlinkBudgetLine`/`unlinkScheduleItem` no se
   redefinen, se usan las funciones ya declaradas en
   `ObjectivesAndActivities`.

## 6. Qué no se toca

- `engines/projectDependencyEngine.ts` no se modifica — el motor ya está
  correcto y probado.
- No se construye ninguna limpieza automática de vínculos huérfanos al
  borrar una línea de presupuesto (ver sección 4).
- No se agrega esta verificación a ningún otro lugar del producto (por
  ejemplo, al guardar o al exportar un documento ejecutivo) — solo a esta
  pestaña, que es donde vive la información relevante para resolverlo.
