# Spec — Atribución de un egreso a una fuente de financiación específica

**Camino:** Completo (dinero, motor financiero protegido).

## Decisión de Andrés (2026-09-17)

Confirmó explícitamente que sí quiere que un egreso pueda declararse como
pagado por una fuente específica, con el caso de uso que él mismo planteó
como ejemplo: si una fuente restringida "pide devolución" o rendición de
cuentas, el sistema debe poder mostrar exactamente qué se pagó con su
plata.

## Choque con un contrato ya bloqueado — resuelto sin romperlo

`specs/flujo-de-caja-con-condiciones.md`, sección 6: **"`ProjectBudgetLine`
no se modifica. Ni un campo."** — es el contrato con `ProjectToolsPanel`,
`projectConsistencyEngine` y `financialAuthorityEngine`. Agregar
`fuenteId` directamente a `ProjectBudgetLine` habría roto ese candado.

**Solución: mismo patrón ya usado para actividad↔presupuesto.** Igual que
`ProjectActivityBudgetLink` vincula una actividad a una línea de
presupuesto sin tocar `ProjectBudgetLine` ni `ProjectActivity`, se agrega
`ProjectBudgetLineFuenteLink { id; budgetLineId; fuenteId }` como tabla de
vínculo aparte en `ProjectTools.fuenteLinks`. `ProjectBudgetLine` queda
exactamente igual — el candado de la spec de flujo de caja sigue
respetado.

## Qué se construye

### 1. `types/project.ts`
- `ProjectBudgetLineFuenteLink { id: ID; budgetLineId: ID; fuenteId: ID }`.
- `ProjectTools.fuenteLinks?: ProjectBudgetLineFuenteLink[]`.

### 2. `engines/cashFlowEngine.ts`
- `FlujoDeCaja.fuenteLinks?: ProjectBudgetLineFuenteLink[]` (opcional, se
  trata como `[]` si no viene).
- **Curva de la bolsa "propio":** hoy resta TODOS los egresos, sin
  excepción. Pasa a restar solo los egresos de líneas **sin** vínculo a
  una fuente — los que sí tienen vínculo dejan de contar como gasto de la
  bolsa propia.
- **Curva de cada fuente (`porBolsa[fuente.id]`):** hoy solo suma sus
  ingresos, nunca resta nada. Pasa a restar también los egresos de las
  líneas vinculadas a esa fuente específica.
- **Compatibilidad hacia atrás, garantizada por diseño:** cuando
  `fuenteLinks` está vacío o no viene (el caso de todos los proyectos y
  tests existentes hoy), ninguna línea tiene vínculo → el comportamiento
  es idéntico, bit a bit, al de hoy. Los tests existentes
  (`tests/cashFlow.test.ts` y los que dependen de él) no se tocan y deben
  seguir pasando sin modificarse — es el mismo criterio que ya usa la
  spec original para probar que una extracción es fiel.
- **Nuevo campo en `AnalisisDeFlujo`: `gastosAtribuidosNoElegibles`.**
  Distinto de `gastosNoElegibles` (que sigue existiendo tal cual, sin
  tocar — es el heurístico post-bloqueo que ya existía). Este nuevo campo
  es exacto, no heurístico: para cada vínculo real de `fuenteLinks`, si la
  fuente es `restringida` y la categoría de esa línea no está en
  `categoriasElegibles`, se reporta — siempre, no solo cuando ya hay un
  bloqueo detectado, porque ahora sí hay un dato real de causalidad
  egreso→fuente (la razón original para no calcular esto — "no hay
  atribución real" — deja de aplicar exactamente para las líneas que sí
  tienen vínculo).

### 3. UI (`components/ProjectToolsPanel.tsx`, `LivingBudget`)
- Cada línea de presupuesto gana un selector para asignarle una fuente (de
  las que ya existen en `graph.tools.fuentes`) o dejarla "Sin fuente
  asignada" (comportamiento de hoy).
- Se muestra una alerta cuando `gastosAtribuidosNoElegibles` no está
  vacío, con el concepto de la línea y el nombre de la fuente.

## Gap cerrado (2026-09-17)

Andrés confirmó que sí quería la UI de alta manual de fuentes ("vamos con
el Gap del punto 4"). Se construyó `FuentesManager` dentro de
`components/ProjectToolsPanel.tsx` (pestaña "Presupuesto vivo", antes de
la tabla de líneas): permite crear, editar y borrar `Fuente`s —
nombre, `tipo` (selector con los 7 valores de `TipoDeFuente`), marcar
`restringida` (y con eso elegir sus `categoriasElegibles` de entre las
categorías de presupuesto que ya existen en el proyecto), y los dos
campos opcionales `aporteMinimoInicioCop`/`fechaInicioEjecucion`. Reutiliza
`setTools()` igual que el resto del panel — no hay tabla ni migración
nueva, `Fuente` ya vivía en `ProjectGraph['tools']`. El selector de
atribución por línea de presupuesto y el resumen de flujo de caja ahora
tienen de dónde poblarse sin depender de una conversación con el
Productor Ejecutivo.

**Nota de alcance, no resuelta aquí:** los `Ingreso`s (`graph.tools.ingresos`,
el otro lado de `fuenteId`) tampoco tienen UI de alta manual — el resumen
de flujo de caja solo se activa si `ingresos` ya viene poblado. Es el
mismo tipo de gap que este, pero sobre `Ingreso` en vez de `Fuente`, y no
fue lo que se pidió en esta ronda. Queda para cuando Andrés lo priorice.

## Qué no se toca

- `ProjectBudgetLine` — sigue exactamente igual, cero campos nuevos.
- `gastosNoElegibles` (el heurístico existente) — sin cambios.
- Ningún test existente se modifica.

## Criterio de aceptación

- Con `fuenteLinks` vacío/ausente, `analizarFlujo` produce exactamente el
  mismo resultado que antes de esta entrega (mismos números, para las
  mismas entradas que ya prueban los tests existentes).
- Con una línea vinculada a una fuente restringida cuya categoría no es
  elegible, `gastosAtribuidosNoElegibles` la reporta, sin necesidad de que
  haya un bloqueo de saldo general.
- Con una línea vinculada a una fuente sin restricción, esa línea deja de
  contar contra la bolsa "propio" y empieza a contar contra la bolsa de
  esa fuente.
- `npm run typecheck`, `npm test` (incluyendo los tests nuevos), `eslint`
  limpios.
