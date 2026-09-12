# Spec corta: el nombre del proyecto va antes del bloque de apertura

**Versión 1 · 2026-09-11** · Nivel: **rápido** (un solo agente).
No toca plata, ni puntajes, ni tipos nuevos. Un archivo de código, un archivo de test.

---

## 1. Qué se construye

Que cuando el título de un proyecto sea un placeholder (`Proyecto sin nombre`,
`Sin título`, vacío…), la primera pregunta sea la del nombre — la que ya existe en
`STRATEGIC_QUESTIONS.identity.initial` — y no `AP-01` del bloque de apertura.

## 2. Por qué

Hoy el bloque de apertura tiene precedencia absoluta en `getNextBestQuestion`, y
ninguna de sus siete preguntas pide el nombre: `AP-01` es *"Cuéntame qué es, en una o
dos frases"*, con `intent: 'clarify_project_type'`. La pregunta del nombre existe y
tiene `intent: 'clarify_project_name'`, pero **nunca le llega el turno** mientras el
bloque no se agote.

Consecuencia real: un proyecto sin nombre se queda sin nombre para siempre, y todo
documento que genere — One Pager, Pitch, Propuesta — sale titulado
`Proyecto sin nombre`.

`CreateProjectScreen` exige título, así que por el flujo normal esto no pasa. Pero
`app/studio/projects/new/page.tsx` y `projectImportEngine` pueden crear proyectos por
otras vías, y ahí sí.

Es también la causa del fallo de `tests/muscoRuntimeIntegration.test.ts:47`, que
afirma justamente que *"un proyecto realmente sin nombre conserva la pregunta de
identidad"*. **El test tiene razón y el código está mal.** No se toca el test.

## 3. Archivos y qué cambia en cada uno

- `engines/questionEngine.ts` — en `getNextBestQuestion`, antes de consultar el bloque
  de apertura, se devuelve la pregunta del nombre si el título es un placeholder.

Nada más. `openingBlockEngine.ts` **no se toca**, y **ningún test se modifica**.

## 4. Decisiones ya tomadas

**El orden exacto en `getNextBestQuestion` queda:**

```
1. ¿El título es placeholder (isPlaceholderTitle) Y la intención
   'clarify_project_name' no está ya respondida ni ya preguntada?
      → devolver STRATEGIC_QUESTIONS.identity.initial
2. ¿Hay pregunta del bloque de apertura pendiente?
      → devolverla
3. Si no → la lógica actual de módulos débiles, sin cambios
```

El paso 1 reutiliza `isPlaceholderTitle` y los filtros de `previousIntents` /
`isQuestionAlreadyAnswered` que ya existen en la función, para que no se repita si la
persona ya la contestó o ya se le preguntó.

**No se agrega una octava pregunta al bloque.** La pregunta del nombre ya existe en
`STRATEGIC_QUESTIONS`; el problema era de precedencia, no de contenido. Meterla al
bloque duplicaría un texto que ya está escrito en otro lado.

**`AP-01` conserva `intent: 'clarify_project_type'`.** Es la intención honesta para
*"cuéntame qué es"*: pregunta qué es el proyecto, no cómo se llama. Cambiarla a
`clarify_project_name` haría pasar el test mintiendo sobre lo que la pregunta hace.

**No se toca `CreateProjectScreen`** ni se relaja su exigencia de título.

## 5. Cómo se verifica

1. `npm run typecheck` — sin errores.
2. `npm test` — **las 10 suites en verde, encadenadas, sin `&&` roto a mitad.** Pega la
   salida literal de la terminal en el reporte, no un resumen.
3. `tests/muscoRuntimeIntegration.test.ts` pasa **sin haber sido modificado**:
   `git diff --stat tests/muscoRuntimeIntegration.test.ts` → vacío.
4. `engines/openingBlockEngine.ts` no aparece en el diff.
5. Un caso nuevo en `tests/openingBlock.test.ts`: grafo con título real (no
   placeholder) y módulos vacíos → `getNextBestQuestion` devuelve el texto de `AP-01`.
   Esto protege que el paso 1 no se dispare en el flujo normal.

## 6. Qué no se toca

- El bloque de apertura, su orden y su regla de selección.
- La redacción de las siete preguntas (va en su propia entrega).
- `getQuestionIntent` y su consulta al bloque.
- Las 10 intenciones que `isQuestionAlreadyAnswered` todavía no cubre.
