# Spec: la respuesta va al módulo de la pregunta que se hizo

**Versión 1 · 2026-09-11** · Nivel: **completo** (toca puntajes que el usuario ve).

Reemplaza la spec del catch-all que estaba anunciada. Al leer el código que quedó
después de `no-se-sin-colateral`, el problema resultó ser más grande y más simple de
lo que yo había descrito.

---

## 1. Objetivo

Que la respuesta del usuario se guarde en el módulo de **la pregunta que el sistema
acaba de hacerle**, y que cuando no hay pregunta pendiente y nada se reconoce, **no se
guarde nada** en vez de inventarse un módulo.

## 2. Por qué ahora

Hoy hay **dos mecanismos compitiendo** por decidir dónde cae una respuesta, y ninguno
de los dos mira qué se preguntó:

1. `engines/conversationEngine.ts` — si ningún listado de palabras clave matchea,
   `if (patches.length === 0)` aplica el texto crudo del usuario y **+12 puntos al
   módulo más débil del grafo**.
2. `core/projectController.ts`, `inferContextualAnswerActions` — si el
   `recommendedModule` de `executiveBrain` no se actualizó en el turno, le aplica el
   texto crudo **a ese** módulo.

El módulo más débil y el módulo recomendado son dos cosas, y **ninguna de las dos es
el módulo de la pregunta que se hizo.**

### 2.1 La consecuencia: el sistema desvía sus propias respuestas

El sistema pregunta *"¿Quién va a estar del otro lado?"*. El usuario contesta *"gente
que patina en Bogotá"*. Si ese texto no matchea la lista de palabras clave de
audiencia, **la respuesta no se guarda en `community`**: se guarda en el módulo más
débil, que puede ser cualquiera.

No es un caso raro. Es lo que pasa cada vez que alguien contesta con palabras que no
están en las listas — es decir, la mayoría de las veces, porque las listas son cortas
y el español es largo.

### 2.2 Y desactiva preguntas del bloque de apertura, en silencio

`isQuestionAlreadyAnswered` da una pregunta por respondida si su módulo tiene
contenido. Entonces un "hola", un "gracias" o cualquier mensaje que el sistema no
entienda escribe texto en un módulo cualquiera — y **esa pregunta del bloque ya no se
vuelve a hacer nunca** en ese proyecto.

Lo que lo vuelve serio es cuándo dispara: el respaldo solo corre cuando **nada**
matcheó. O sea, **el sistema da una pregunta por respondida justamente en los turnos
en que no entendió nada.** Y el usuario no tiene cómo enterarse: ve que el productor
ejecutivo dejó de preguntarle por qué quiere hacer su proyecto, y asume que ya lo sabe.

### 2.3 Por qué se puede arreglar ahora y no antes

`no-se-sin-colateral` dejó dos piezas que no existían: el parámetro
`sinPatchDeRespaldo` en `extractProjectPatchesFromMessage`, y
`encontrarPreguntaDeAperturaPreguntada` / `encontrarPreguntaPorTexto`, que saben leer
el historial y decir qué se preguntó. Con eso, arreglar el ruteo es pequeño.

## 3. Archivos que se crean o se modifican

**Se crea:**
- `tests/answerRouting.test.ts`

**Se modifican:**
- `engines/questionEngine.ts` — exporta el mapa inverso intención → módulo.
- `engines/conversationEngine.ts` — el patch de respaldo recibe el módulo destino en
  vez de calcularlo; si no lo recibe, no aplica ningún patch.
- `core/projectController.ts` — calcula el módulo de la pregunta hecha y lo pasa;
  el respaldo de `recommendedModule` no corre si hubo pregunta.
- `package.json` — el test nuevo entra al script `test`.

Nada fuera de esta lista sin preguntar.

## 4. Fuera de alcance

- **La redacción nueva de las preguntas de apertura** (`Cuéntame qué es…`,
  `¿Qué viste que hacía falta?`, `¿Tienes locación…?`, `AP-05b`). Va en su propia
  entrega para que este diff sea solo de comportamiento.
- **Ampliar las listas de palabras clave** de `conversationEngine`. Esta entrega
  arregla a dónde va lo que no matchea, no cuánto matchea.
- **`executiveBrain.resolveRecommendedModule`.** Se deja exactamente como está; solo
  se condiciona cuándo se usa su resultado como destino de una respuesta.
- **Cubrir las 10 intenciones que faltan** en `isQuestionAlreadyAnswered`.
- **La migración visual de `CreateProjectScreen.tsx`**, todavía pendiente.

## 5. Decisiones ya tomadas

### 5.1 Cómo se sabe cuál es el módulo de la pregunta hecha

En `core/projectController.ts`, función nueva:

```ts
function moduloDeLaPreguntaHecha(
  messages: ConversationMessage[]
): ProjectModuleId | null;
```

Tres pasos, en orden:

1. Si `encontrarPreguntaDeAperturaPreguntada(messages)` devuelve algo → su `.modulo`.
2. Si no, se toma el texto de la última pregunta igual que hace esa función
   (`response.nextQuestion` del último mensaje `producer`, o su `content`), se pasa por
   `getQuestionIntent(texto)`, y se busca el módulo en el mapa inverso de 5.2. Si la
   intención es `'other'` o no está en el mapa → `null`.
3. Si no hay ningún mensaje `producer` previo → `null`.

**El paso 3 es el que arregla lo de 2.2:** el primer mensaje de un usuario no responde
a ninguna pregunta, así que no debe escribir en ningún módulo.

### 5.2 El mapa inverso

`engines/questionEngine.ts` ya tiene `MODULE_INTENTS: Partial<Record<ProjectModuleId,
QuestionIntent>>`. Se agrega, derivado de él **en tiempo de módulo y no a mano**, para
que no puedan desincronizarse:

```ts
export const MODULO_POR_INTENCION: Partial<Record<QuestionIntent, ProjectModuleId>>;
```

Si dos módulos comparten intención — hoy `generalObjective` y `specificObjectives`
comparten `'clarify_objective'` — **gana el primero en orden de declaración de
`MODULE_INTENTS`**, y eso se escribe como comentario junto a la construcción del mapa.
Es arbitrario pero estable, y el caso solo importa cuando la pregunta no es del bloque
de apertura.

### 5.3 El patch de respaldo recibe su destino

```ts
export interface OpcionesDeExtraccion {
  sinPatchDeRespaldo?: boolean;
  moduloDeRespaldo?: ProjectModuleId | null;
}
```

El bloque final de `extractProjectPatchesFromMessage` queda:

- `sinPatchDeRespaldo: true` → no se aplica nada. (Comportamiento actual para "no sé".)
- `moduloDeRespaldo` con un módulo → se aplica ahí, con los mismos 12 puntos y el
  mismo texto de hoy.
- `moduloDeRespaldo` en `null` o ausente → **no se aplica nada.**

**El `getWeakModules(graph, 1)[0]?.id || 'context'` de hoy se borra.** Ese es el
mecanismo que inventaba el destino.

**Los 12 puntos se conservan.** Una respuesta real a una pregunta real es contenido
real y debe contar. Lo que estaba mal era el destino, no el puntaje.

**Llamar con dos argumentos sigue haciendo lo de antes**, para no romper
`tests/kicksInterpretation.test.ts`, que llama directo. En ese caso no hay opciones,
no hay `moduloDeRespaldo`, y por lo tanto **no hay patch de respaldo** — lo cual es
correcto: sin historial de conversación no se sabe qué se preguntó, así que no hay a
dónde mandar la respuesta. El test de kicks no depende del patch de respaldo; sus seis
asertos son sobre `interpretTurn` y señales financieras.

### 5.4 El respaldo de `recommendedModule` se condiciona

En `inferContextualAnswerActions`, **si `moduloDeLaPreguntaHecha` devolvió un módulo,
la función retorna `[]` antes de llegar al bloque de `recommendedModule`.**

Sin esto, el arreglo empeora las cosas: la respuesta se guardaría bien en el módulo de
la pregunta **y además** el respaldo la copiaría al `recommendedModule`, que es un
segundo módulo. Dos copias del mismo texto en dos sitios distintos.

**No se borra nada de esa función.** El camino de `recommendedModule` sigue existiendo
y sigue corriendo cuando no hubo pregunta — que es el caso para el que se escribió.

### 5.5 Qué NO cambia

- Las listas de palabras clave y sus puntajes, intactas. Cuando algo matchea, se
  comporta igual que hoy.
- `executiveBrain`, intacto.
- El camino de "no sé" de `no-se-sin-colateral`, intacto: se decide antes y sigue
  ganando.
- Ningún módulo cambia de nombre, ningún tipo existente cambia de forma.

## 6. Interfaces y contratos

- `extractProjectPatchesFromMessage(message, graph)` con **dos** argumentos: idéntico
  a hoy salvo que ya no aplica patch de respaldo (5.3). Es el único cambio de
  comportamiento en esa firma y está justificado ahí.
- `processConversationTurn` — recibe y pasa `OpcionesDeExtraccion` sin más cambios.
- `processProjectMessage(state, input)` — firma intacta.
- `interpretTurn` — no se toca.
- `MODULE_INTENTS` — no se modifica; solo se deriva de él.
- `inferContextualAnswerActions` — gana un parámetro; no se reestructura.

## 7. Tests que van a romperse a propósito

**Ninguno.** Los 9 archivos actuales deben pasar sin modificarse.

El riesgo real está en `muscoRuntimeIntegration` y `executiveEngineV23`, que corren
turnos por el controlador y podrían depender de dónde caía el respaldo. **Si alguno
falla, no se reescribe:** se reporta cuál, con el aserto exacto, porque significa que
algún test estaba pinchando el destino equivocado como si fuera correcto — y eso hay
que verlo antes de decidir.

## 8. Criterio de aceptación verificable

1. `npm run typecheck` — limpio.
2. `npm test` — 10 suites, **sin modificar ningún test existente**.
3. `grep -n "getWeakModules" engines/conversationEngine.ts` → **sin resultados.**
4. `tests/answerRouting.test.ts` cubre, por `processProjectMessage`:
   - **a) El caso que hoy falla.** Proyecto vacío → T1 describe el proyecto → el
     sistema pregunta `AP-02` → T2 responde `gente que patina en Bogotá` (texto que no
     matchea ninguna lista de audiencia). **`community` debe contener esa respuesta.**
     Y el único módulo que cambió en el turno debe ser `community`.
   - **b) Mensaje sin pregunta previa.** Proyecto vacío → primer mensaje `hola`.
     **Ningún módulo cambia de contenido ni de puntaje.**
   - **c) No se desactiva una pregunta por accidente.** Igual que (b), y después
     `seleccionarPreguntaDeApertura` debe seguir devolviendo `AP-01`.
   - **d) Sin copia doble.** En el escenario (a), ningún otro módulo — en particular el
     `recommendedModule` de `executiveInsight` — contiene el texto de la respuesta.
   - **e) Lo que matchea sigue igual.** Un mensaje que sí matchea una lista de palabras
     clave cae donde caía antes, con el mismo puntaje.
5. `grep -n "moduloDeRespaldo" engines/conversationEngine.ts core/projectController.ts`
   → aparece en ambos.
6. Lectura de `inferContextualAnswerActions`: la salida temprana de 5.4 está antes del
   bloque de `recommendedModule`, y ese bloque **sigue existiendo completo**.
7. Diff: `components/CreateProjectScreen.tsx` y `engines/executiveBrain.ts` **no
   aparecen.**

## 9. Qué queda determinista y por qué

El destino de una respuesta pasa de calcularse (el módulo más débil, que depende del
estado de los 21 módulos y del orden de inserción) a **leerse** (la pregunta que está
en el historial). Un dato leído es reproducible y explicable; uno calculado sobre un
ranking de puntajes empatados no lo es — de hecho fue exactamente lo que hizo fallar la
traza manual de la entrega anterior.

Después de esto, la respuesta a *"¿por qué este texto quedó en este módulo?"* es
siempre la misma frase: **porque es el módulo de la pregunta que se te hizo.** Y
cuando no hay pregunta, no hay módulo y no se guarda nada, que es la única respuesta
honesta cuando el sistema no entendió.

Puntajes: los 12 puntos del respaldo no cambian de magnitud, cambian de destino. El
porcentaje de preparación deja de subir por texto que cayó en un módulo al azar, así
que el número se vuelve defendible — hoy incluye ruido que nadie puede rastrear.

Plata: no se toca. `budgetSignalProcessor` no aparece en la lista de archivos.

---

# APÉNDICE — Enmiendas autorizadas durante el ciclo (2026-09-11)

Las tres salieron de contradicciones reales que el constructor detectó y reportó
en vez de resolver por su cuenta. **El texto de las secciones 5.1, 7 y 8.3 de
arriba quedó desactualizado; manda este apéndice.**

## Enmienda 1 — a la sección 5.1: dos situaciones, no un mismo `null`

`moduloDeLaPreguntaHecha` colapsaba dos casos distintos, y solo uno justifica
apagar el fallback. La firma final es:

```ts
function resultadoDePreguntaHecha(messages: ConversationMessage[]): {
  huboPregunta: boolean;
  modulo: ProjectModuleId | null;
}
```

| Caso | Patch de respaldo | Fallback de `recommendedModule` |
|---|---|---|
| `huboPregunta: false` | no se aplica | **no corre** |
| `huboPregunta: true`, `modulo` presente | al módulo de la pregunta | **no corre** (evita copia doble) |
| `huboPregunta: true`, `modulo: null` | no se aplica | **sí corre**, como antes |

El tercer caso es el que la sección 5.4 original habría destruido: la frase de
cierre de `getNextBestQuestion` tiene intención `'other'` y no mapea a ningún
módulo, pero el usuario **sí** está respondiendo. Apagar el fallback ahí tiraría
esa respuesta.

## Enmienda 2 — a la sección 8.3: un call site, no un conteo de texto

La redacción original ("sin resultados") no contemplaba un segundo uso legítimo de
`getWeakModules`, en `buildProducerResponse`, para el campo `gaps` — sin relación
con el ruteo. **No se borró**: está fuera de la lista de la sección 3, y dejar
`gaps: []` haría que la función devuelva un valor falso para cualquier llamador
futuro. Redacción definitiva:

> En `engines/conversationEngine.ts`, `getWeakModules` debe tener exactamente
> **un call site**, dentro de `buildProducerResponse`. El `import` no cuenta como
> uso. El bloque final de `extractProjectPatchesFromMessage` no debe llamarlo ni
> calcular su módulo destino de ninguna otra forma.

**Deuda anotada, no resuelta aquí:** `buildProducerResponse` calcula `gaps` y ese
valor siempre se descarta, porque `core/projectController.ts` lo sobrescribe con
`buildGapList(nextGraph)`. Es trabajo muerto.

## Enmienda 3 — a la sección 7: sí se rompen tests, y por qué

La sección 7 decía "Ninguno" y estaba equivocada. Los escenarios 8, 9 y 10 de
`openingBlock.test.ts` **fijaban un accidente**: el contenido de T1 caía en
`identity` porque el patch de respaldo elegía el módulo más débil, e `identity` es
el primero en el orden de inserción de `createInitialProjectGraph()`. Nunca fue
conducta correcta; era una coincidencia que el test convirtió en contrato.

Autorizado: **cambiar el montaje, nunca los asertos.** El escenario 10 excedió eso
—retargeteó asertos de `purpose`/AP-03 a `problem`/AP-04 cuando el montaje mínimo
alcanzaba— y el auditor lo pescó. Se revirtió.
