# Spec: Flujo de caja dentro de Presupuesto vivo

**Versión 2 — amplía la v1.** La v1 prohibía tocar `types/` asumiendo que
`ProjectGraph` ya tenía dónde guardar `Ingreso[]`/`Fuente[]`. El constructor
leyó `engines/cashFlowEngine.ts` y `types/project.ts` como pedía la sección 5
y confirmó que no es así: `ProjectTools` (`types/project.ts:371-378`) solo
tiene `budgetLines`, `scheduleItems`, `grant`, `pendingQuestions?`,
`proposedFinancialSignals?`, `activeArea?` — ningún campo de ingresos ni
fuentes. Se detuvo sin escribir código, tal como se le pidió. Esta versión
autoriza el campo que falta.

## 1. Objetivo
La sub-pestaña "Presupuesto vivo" de components/ProjectToolsPanel.tsx muestra,
además de la tabla de líneas de presupuesto que ya tiene, un resumen del
análisis de flujo de caja que produce engines/cashFlowEngine.ts (Sprint 2).

## 2. Por qué ahora
El motor de flujo de caja ya existe y pasó auditoría (2 rondas, verificado).
No tiene ningún lugar visible en la interfaz — es la brecha original que
inició este trabajo ("ya creamos flujo de caja pero no está visible").

## 3. Archivos
- components/ProjectToolsPanel.tsx — el bloque `LivingBudget` gana una
  sección nueva (debajo de la tabla de líneas existente, no la reemplaza).
- types/project.ts — `ProjectTools` (línea 371-378) gana dos campos
  opcionales: `ingresos?: Ingreso[]` y `fuentes?: Fuente[]` (ver 5 para por
  qué opcionales, no obligatorios). `Ingreso`/`Fuente` ya existen en este
  mismo archivo (Sprint 2, línea 322 y 332) — no se crea ningún tipo nuevo,
  solo se referencian desde `ProjectTools`.
- core/projectEngine.ts — `createInitialProjectGraph()` (línea 65-94) agrega
  `ingresos: []` y `fuentes: []` al objeto `tools` que ya construye, junto a
  `budgetLines: []`/`scheduleItems: []`. Ninguna otra parte de la función
  cambia — ni el `title` placeholder, ni el orden de los demás campos (ver
  advertencia de CLAUDE.md sobre `createInitialProjectGraph`: no se toca
  nada relacionado con el título ni la precedencia de preguntas).
- `engines/cashFlowEngine.ts` y el resto de tipos de Sprint 2
  (AnalisisDeFlujo, Exposicion, ClaridadDelPresupuesto, FlujoDeCaja) **no
  se modifican** — se consumen tal como están.

## 4. Fuera de alcance
- No se toca Cronograma, Convocatorias, ni la sección de Documentos.
- No se agrega edición de Ingreso/Fuente en esta entrega — solo lectura
  del análisis. Crear/editar ingresos y fuentes (formulario, botones de
  agregar/borrar) es una spec futura. Esta entrega solo abre el campo de
  almacenamiento en el grafo; el proyecto arranca con `ingresos`/`fuentes`
  vacíos y así se quedan hasta que exista esa spec futura.
- No se resuelve la anotación pendiente de Sprint 2 (5.1 vs 5.5 de
  gastosNoElegibles) — eso espera revisión de la spec original.
- No se toca `core/repositories/workspaceRepository.ts` — ver 5 (campos
  opcionales) sobre por qué no hace falta.

## 5. Decisiones ya tomadas
- Antes de escribir código: LEE los exports reales de
  engines/cashFlowEngine.ts (nombres exactos de funciones, forma exacta
  de AnalisisDeFlujo/Exposicion/ClaridadDelPresupuesto) — no asumas la
  forma, este documento no la fija porque no se releyó el archivo final
  después de la auditoría.
- **`ProjectTools.ingresos` y `ProjectTools.fuentes` son opcionales**
  (`ingresos?: Ingreso[]`, `fuentes?: Fuente[]`), no obligatorios — mismo
  patrón que ya usan `pendingQuestions?`, `proposedFinancialSignals?` y
  `activeArea?` en esa misma interfaz (`types/project.ts:371-378`). La
  razón es concreta, no solo estilo: `core/repositories/workspaceRepository.ts:340-348`
  construye un `tools` de respaldo cuando un proyecto guardado antes de
  este cambio no trae `graph.tools` en absoluto. Si los campos fueran
  obligatorios, ese objeto literal dejaría de compilar y habría que tocar
  ese archivo — algo que esta spec no autoriza y no necesita. Con campos
  opcionales, un proyecto viejo simplemente no los trae (`undefined`), y
  el punto siguiente cubre cómo se lee eso sin romper.
- **`LivingBudget` lee `graph.tools.ingresos ?? []` y `graph.tools.fuentes
  ?? []`** al construir el `FlujoDeCaja` que le pasa a `analizarFlujo` —
  nunca asume que el arreglo existe, porque un proyecto creado antes de
  esta entrega no lo tiene. Con ambos vacíos, el análisis corre igual
  (motor ya probado para el caso sin ingresos) y el resultado es el
  estado vacío que ya describe el punto siguiente.
- La sección nueva dentro de LivingBudget muestra, como mínimo: el
  balance por las tres vistas (comprometido/aprobado/completo), la
  claridad del presupuesto (líneas sin fecha/valor/responsable, si las
  hay), y si aplica, la exposición/bloqueo por restricción de fuente —
  usando el texto de describirExposicion() tal cual lo devuelve el motor,
  sin reinterpretarlo.
- Si el proyecto no tiene ingresos con condición registrados (Ingreso[]
  vacío), se muestra un estado vacío invitando a agregarlos — nunca datos
  de ejemplo.
- Cualquier elemento nuevo usa exclusivamente los tokens ya en uso en
  ProjectToolsPanel.tsx (superficie, superficie-elevada, rojo-base,
  acento, borde, hueso) — cero hex crudo.

## 6. Interfaces y contratos
`Ingreso` y `Fuente` (`types/project.ts`, Sprint 2) se consumen tal como
están — no se les agrega ni quita ningún campo. Lo único nuevo es que
`ProjectTools` ahora los referencia como arreglos opcionales (ver 5). El
resto de `cashFlowEngine.ts` (funciones y tipos de análisis) se consume tal
como está. Si algún nombre no coincide con lo que describe este documento,
el nombre real del código gana; ese es precisamente el motivo del paso de
lectura del punto 5.
`ProjectGraph`/`ProjectTools` siguen siendo el contrato de
`ProjectToolsPanel`, `projectConsistencyEngine` y `financialAuthorityEngine`
— la adición es puramente aditiva (dos campos opcionales nuevos), ningún
campo existente de `ProjectTools` cambia de tipo ni de nombre.

## 7. Tests que van a romperse a propósito
Ninguno. Es una capa de presentación sobre un motor ya probado — no se
tocan tests existentes de cashFlow.test.ts, projectConsistencyEngine ni
financialAuthorityEngine.

## 8. Criterio de aceptación verificable
1. npm run typecheck — sin errores.
2. npm test — 11 suites en verde, ninguna modificada.
3. Presupuesto vivo, con datos de prueba que incluyan al menos un Ingreso
   con condición, muestra el balance de al menos una de las tres vistas
   sin lanzar error ni mostrar undefined/NaN en pantalla.
4. Cronograma, Convocatorias y Documentos siguen funcionando exactamente
   igual (no se tocó su código).
5. `grep -n "ingresos\|fuentes" types/project.ts` dentro del bloque de
   `ProjectTools` muestra los dos campos como opcionales (`?:`), no
   obligatorios.
6. Lectura del diff: `core/repositories/workspaceRepository.ts` **no
   aparece** — la opcionalidad de los campos hizo innecesario tocarlo.
7. Un `ProjectGraph` construido con `createInitialProjectGraph()` (sin
   pasar por `LivingBudget` con datos manuales) no lanza error al abrir
   Presupuesto vivo — el análisis corre con `ingresos: []`/`fuentes: []`
   y se ve el estado vacío del punto 5.

## 9. Qué queda determinista y por qué
Toda la lógica de cálculo ya es determinista (motor de Sprint 2, auditado).
Esta capa es puramente de presentación — no agrega ninguna decisión nueva
sobre plata, solo la muestra.
