# Spec: "no sé" sin colateral — eliminar la reversión en vez de corregirla

**Versión 1 · 2026-09-11**
Corrige el punto que quedó abierto del run de `bloque-de-apertura-y-extraccion.md` v2.
Es una entrega pequeña y de una sola cosa. No agrega funcionalidad.

---

## 1. Objetivo

Que un "no sé" a una pregunta del bloque de apertura **no genere ningún patch
colateral**, de modo que no haya nada que revertir — y borrar
`revertirModulosColateralesDeRespuestaNoSe` junto con el problema que intentaba
compensar.

## 2. Por qué ahora

El run anterior dejó el flujo correcto en el caso común y roto en un caso frecuente.
El diagnóstico del auditor es correcto en la mecánica. Esta spec agrega tres cosas
que ese diagnóstico no tenía, y las tres cambian el arreglo.

### 2.1 La causa raíz no es la condición, es el mecanismo

`revertirModulosColateralesDeRespuestaNoSe` es un **mecanismo compensatorio**:
deja que `extractProjectPatchesFromMessage` escriba basura y después la deshace. Eso
es frágil por construcción, porque para deshacerla hay que distinguir el patch
legítimo del colateral, y cuando los dos caen en el mismo módulo **esa distinción no
existe**. La condición `moduleId !== moduloDeLaPreguntaRespondida` no está mal
escrita: está resolviendo un problema que no se puede resolver ahí.

Corregir la condición deja el mecanismo en pie y con él la clase de error. La salida
es que el patch colateral **no se genere**. Entonces no hay nada que revertir, no hay
evento fantasma que filtrar, y no hay concatenación que evitar — los tres síntomas
desaparecen juntos porque tenían una sola causa.

### 2.2 La colisión es estructural, no mala suerte

El auditor dice que el caso es "común" y tiene razón, pero la razón importa.

El catch-all elige el módulo más débil con `getWeakModules`, que ordena por puntaje
con `sort` estable sobre `Object.values(graph.modules)`. Con todos los puntajes
empatados en 0, el orden resultante es el **orden de inserción** de
`createInitialProjectGraph`: `identity`, `purpose`, `problem`, `context`,
`community`, …

El bloque de apertura pregunta por prioridad: `AP-01` → `identity`,
`AP-02` → `community`, `AP-03` → `purpose`, `AP-04` → `problem`.

**Las dos listas empiezan por los mismos módulos.** `identity`, `purpose` y `problem`
son los tres primeros del orden de inserción y son los módulos de `AP-01`, `AP-03` y
`AP-04`. Así que la coincidencia entre "el módulo de la pregunta activa" y "el módulo
más débil" no es un accidente de un caso de prueba: es lo que pasa casi siempre en
los primeros turnos de cualquier proyecto nuevo. Es el camino normal, no el borde.

### 2.3 El turno que falla es el tercero, pero con AP-03, no AP-04

El escenario del auditor nombra `AP-04` / `problem`. Siguiendo el orden de inserción,
no cuadra, y la diferencia importa porque de ella depende que el test nuevo falle de
verdad antes del arreglo.

Traza real del escenario propuesto:

- **T1** `Es un EP de música electrónica que estoy grabando.` → `identity` queda con
  contenido y puntaje. Ahora el más débil es `purpose` (índice 1, puntaje 0).
- **T2** `no sé` a `AP-02` (`community`). El catch-all golpea **`purpose`**, no
  `problem`. `purpose !== community` → **se revierte bien.** `community` queda en
  `Sin respuesta por ahora.`, puntaje 0. Este turno está correcto.
- **T3** `AP-02` quedó respondida, así que por prioridad sigue **`AP-03`**
  (`purpose`, prioridad 80), no `AP-04` (`problem`, 70). `purpose` volvió a 0 con la
  reversión de T2, así que sigue siendo el más débil. `no sé` a `AP-03` → el catch-all
  golpea `purpose`, que **es** el módulo de la pregunta respondida → la condición lo
  excluye de la reversión → sobrevive con el texto crudo y +12, y después el patch
  legítimo se concatena encima.

Resultado: `purpose.content === "no sé\n\nSin respuesta por ahora."`,
`purpose.score === 12`, más un evento que afirma que `purpose` "se fortaleció".
Dos incisos de la spec anterior violados, 5.3: *"texto literal"* y *"el puntaje no
sube"*.

### 2.4 Los escenarios 8 y 9 que se escribieron para probar el arreglo son vacíos

Esto es lo más importante de esta sección, porque es un problema de método y no de
código.

`tests/openingBlock.test.ts` escenarios 8 y 9 **sí** corren dos turnos reales por
`processProjectMessage` — eso está bien. Pero asertan sobre el módulo `problem`,
y según 2.3 el colateral de T2 cae en `purpose`. Asertan que un módulo que nadie
tocó no cambió. **Pasan con el arreglo y pasan sin él.**

Es decir: la función de reversión pudo no haber sido ejercida nunca por los tests
que se escribieron para ella. Por eso el arreglo "pasó" con tests verdes y el defecto
siguió vivo.

La lección es generalizable y entra como regla en la sección 5.4: **cuando lo que
hay que probar es que algo *no* cambió, se compara el mapa completo de módulos, no
un módulo adivinado.** Un aserto que nombra el módulo a mano puede quedar vacío sin
que nadie lo note; uno que recorre los 21 no.

> Nota de verificación: 2.3 y 2.4 salen de leer el código, no de ejecutarlo — el
> registro de npm está bloqueado en el entorno donde se escribió esta spec, así que
> no se pudo correr `npm test`. El primer paso del constructor es **confirmar la traza
> ejecutándola** (sección 8, paso 1). Si resulta que el colateral de T2 cae en otro
> módulo, el arreglo de esta spec no cambia: cambia solo qué módulo nombra la traza.

## 3. Archivos que se crean o se modifican

**Se modifican:**

- `engines/conversationEngine.ts` — `extractProjectPatchesFromMessage` acepta un
  tercer parámetro opcional que desactiva el catch-all. `processConversationTurn` lo
  recibe y lo pasa.
- `core/projectController.ts` — decide ese parámetro **antes** de llamar a
  `processConversationTurn`, y **borra** `revertirModulosColateralesDeRespuestaNoSe`
  junto con su bloque de comentario y su llamada.
- `core/actionEngine.ts` — el patch de "no sé" se construye con `operation: 'set'`.
- `core/projectEngine.ts` — `applyPatch` no describe como "se fortaleció" un patch
  que no subió el puntaje.
- `tests/openingBlock.test.ts` — se reescriben los escenarios 8 y 9 para que no
  puedan quedar vacíos, y se agrega el escenario 10 de tres turnos.

**No se crea ningún archivo.**

## 4. Fuera de alcance

- **El catch-all en sí.** `if (patches.length === 0) addPatch(getWeakModules(graph,1)[0]?.id ?? 'context', 12)` escribe el texto crudo del usuario en un módulo que el usuario no eligió, con 12 puntos inventados, cada vez que un mensaje no matchea ninguna lista de palabras clave. Es un problema más grande que este y toca todo el producto, no solo el bloque de apertura. **No se toca aquí** más que para poder desactivarlo. Queda anotado como deuda con nombre propio.
- **El orden de inserción de los módulos** en `createInitialProjectGraph`. Cambiarlo movería el desempate de `getWeakModules` y con eso el comportamiento de medio producto. No.
- **Hacer determinista el desempate de `getWeakModules`.** Debería serlo explícitamente y no por estabilidad de `sort`, pero eso es otra entrega y tiene sus propios tests que ajustar.
- **La migración visual de `CreateProjectScreen.tsx`**, que sigue pendiente de la entrega anterior.

## 5. Decisiones ya tomadas

### 5.1 La firma del parámetro nuevo

```ts
export interface OpcionesDeExtraccion {
  /** Cuando es true, NO se aplica el patch de respaldo al módulo más débil
   *  si ninguna lista de palabras clave matcheó. El turno puede entonces
   *  terminar con cero patches, y eso es correcto. */
  sinPatchDeRespaldo?: boolean;
}

export function extractProjectPatchesFromMessage(
  message: string,
  graph: ProjectGraph,
  opciones?: OpcionesDeExtraccion
): ProjectPatch[];
```

El parámetro es **opcional y su ausencia conserva el comportamiento de hoy.** Eso es
lo que mantiene intacto a `tests/kicksInterpretation.test.ts`, que llama a esta
función directamente con dos argumentos.

`processConversationTurn` recibe y pasa el mismo objeto de opciones. Si tiene otros
llamadores, se dejan sin tocar: el parámetro opcional los cubre.

**Nombre `sinPatchDeRespaldo` y no `sinCatchAll`**, porque lo que se desactiva no es
una categoría genérica sino específicamente el patch de respaldo de las líneas
494-501. Un nombre que describa el mecanismo y no su jerga hace que el próximo que
lo lea entienda qué apaga.

### 5.2 Quién decide, y cuándo

En `processProjectMessage`, **antes** de llamar a `processConversationTurn`:

```
respuestaNoSeDeApertura =
  encontrarPreguntaDeAperturaPreguntada(currentState.messages) !== null
  && esRespuestaNoSe(cleanInput)
```

y se pasa `{ sinPatchDeRespaldo: respuestaNoSeDeApertura }`.

Los dos datos ya están disponibles en ese punto — `currentState.messages` y
`cleanInput` — así que no hace falta reordenar nada del turno. El valor se calcula
una sola vez y se reutiliza para la acción contextual de 5.3, en vez de volver a
llamar a `encontrarPreguntaDeAperturaPreguntada`, que hoy se llama dos veces en el
mismo turno con el mismo resultado.

### 5.3 Qué se borra

`revertirModulosColateralesDeRespuestaNoSe` completa: la función, su bloque de
comentario de 24 líneas, la llamada, y la variable `conversationGraph` vuelve a ser
`conversationResult.nextGraph` directo.

**No se deja la función "por si acaso" ni comentada.** Con el patch de respaldo
apagado no hay colateral, y una función de reversión que nunca corre es una trampa
para quien lea el archivo después.

El comentario que sí se conserva, reescrito: por qué se apaga el patch de respaldo
en este caso. Eso es lo que un lector futuro necesita saber.

### 5.4 El patch de "no sé" usa `set`

En `actionEngine.updateModule`, el patch de "no sé" hoy se arma con
`operation: 'strengthen'`. Con el patch de respaldo apagado el módulo va a estar
vacío y `mergeContent` devuelve `next` cuando `!previous`, así que el resultado sería
correcto — **pero por una garantía que vive en otro archivo.**

`'set'` hace que *"se guarda el texto literal"* se cumpla en el momento de escribir,
sin depender de que el módulo esté vacío. Esto importa porque la spec dice "texto
literal" y un invariante local es auditable leyendo una línea; uno que depende de
alcanzabilidad hay que demostrarlo.

**Cómo:** `ProjectAction` de tipo `update_module` gana un campo opcional
`operation?: ProjectPatch['operation']`, con default `'strengthen'` para no cambiar
ningún llamador existente. La acción de "no sé" lo pasa como `'set'`.

### 5.5 El evento no puede decir "se fortaleció" si nada se fortaleció

`applyPatch` arma siempre:

```
description: `Se fortaleció ${currentModule.title} a partir de una conversación.`
```

`eventLog` se expone como `recentEvents` y se renderiza en el panel "Workspace vivo",
así que esto es texto que el usuario lee. Para un "no sé" es falso.

**Cómo:** cuando `patch.scoreBoost === 0`, la descripción es
`Se registró una respuesta sin puntaje en ${currentModule.title}.` y el título del
evento es `${currentModule.title} registrado` en vez de `actualizado`. El resto
igual.

**Riesgo aceptado y por qué:** cualquier otro llamador que pase `scoreBoost: 0`
también cambia de texto. Es correcto para ellos por la misma razón, así que se
condiciona sobre el puntaje y no se agrega un campo nuevo para distinguir el caso.
El default de `scoreBoost` es 20 y el único cero conocido es el de "no sé".

### 5.6 Cómo quedan los tests

**Escenario 8 se reescribe así:** en vez de nombrar `problem`, compara el mapa
completo. Tras el `no sé`, **el único módulo cuyo `content`, `score` o `updatedAt`
cambió respecto al turno anterior debe ser `community`.** El mensaje de error lista
los módulos que cambiaron de más. Ese aserto no puede quedar vacío.

**Escenario 9 se reescribe igual:** los eventos nuevos del turno cuyo `moduleId`
exista deben tener todos `moduleId === 'community'`. No se nombra `problem`.

**Escenario 10, nuevo — el que reproduce el defecto.** Tres turnos reales por
`processProjectMessage`:

1. `Es un EP de música electrónica que estoy grabando.`
2. `no sé` → se verifica que la pregunta pendiente era `AP-02`.
3. `no sé` → se verifica que la pregunta pendiente era `AP-03`, y luego:
   - `purpose.content === SIN_RESPUESTA_POR_AHORA` **exactamente**, sin concatenación;
   - `purpose.score === 0`;
   - el único módulo cambiado en el turno es `purpose`;
   - los eventos nuevos del turno no describen a `purpose` como fortalecido.

**El escenario 10 tiene que fallar antes del arreglo.** Si pasa antes, la traza de
2.3 está mal y hay que corregirla — el constructor la ajusta con lo que observe
ejecutando, y lo reporta, pero no la omite ni relaja los asertos.

**Ningún test se reescribe para que pase.** Si alguno de los 9 existentes se rompe,
es una regresión (sección 7).

## 6. Interfaces y contratos que hay que respetar

- `extractProjectPatchesFromMessage(message, graph)` con **dos** argumentos debe
  seguir comportándose exactamente como hoy. Es el contrato que protege a
  `kicksInterpretation`.
- `processProjectMessage(state, input)` — firma intacta.
- `applyPatch(graph, patch)` — firma intacta. Solo cambia el texto de dos campos del
  evento cuando `scoreBoost === 0`.
- `ProjectAction` de tipo `update_module` — el campo `operation` es **opcional** con
  default `'strengthen'`. Ningún llamador existente se modifica.
- `seleccionarPreguntaDeApertura`, `BLOQUE_DE_APERTURA`, `esRespuestaNoSe` y
  `SIN_RESPUESTA_POR_AHORA` — no se tocan. Esta entrega no cambia el bloque de
  apertura ni la regla de selección.
- `getWeakModules` — no se toca.

## 7. Tests que van a romperse a propósito

**Ninguno de los 9 existentes.**

Los escenarios 8 y 9 de `openingBlock` se **reescriben para que sean más estrictos**,
no porque fallen. Según 2.4 hoy pasan vacíos y después del cambio pasan con
contenido. Si alguno de los dos falla tras reescribirlo, no es una consecuencia
esperada: es que el arreglo no está completo.

`kicksInterpretation` no debe romperse, y el parámetro opcional de 5.1 es justamente
lo que lo garantiza. Si se rompe, la firma se implementó mal.

## 8. Criterio de aceptación verificable

En este orden:

1. **Antes de arreglar nada:** escribir el escenario 10 y correr `npm test`. **Debe
   fallar**, y el constructor debe reportar el mensaje de error exacto. Si pasa, se
   corrige la traza de 2.3 con lo observado y se reporta la discrepancia antes de
   seguir.
2. `npm run typecheck` — sin errores.
3. `npm test` — 10 escenarios en `openingBlock` y los 8 archivos de test pasando.
4. `grep -rn "revertirModulosColateralesDeRespuestaNoSe" .` (sin `node_modules`) →
   **sin resultados.**
5. `grep -n "moduloDeLaPreguntaRespondida" core/projectController.ts` → **sin
   resultados.**
6. `grep -n "Se fortaleció" core/projectEngine.ts` → sigue existiendo, pero dentro de
   una rama condicionada al puntaje.
7. Lectura de `tests/openingBlock.test.ts`: **ni el escenario 8 ni el 9 nombran un
   módulo concreto como "el que no debió cambiar".** Si aparece `'problem'` escrito a
   mano en ese rol, la entrega se devuelve — es exactamente el defecto de 2.4.
8. Lectura del diff: `components/CreateProjectScreen.tsx` **no aparece.**

## 9. Qué queda determinista y por qué

Esta entrega **aumenta** el determinismo, y vale la pena nombrar por qué, porque es
el argumento que justifica borrar la reversión en vez de arreglarla.

Un mecanismo compensatorio hace que el estado final dependa de dos pasos que tienen
que coincidir: lo que se escribió y lo que se deshizo. Cuando coinciden, el resultado
es correcto; cuando no — y aquí no coinciden porque los dos patches caen en el mismo
módulo — el resultado depende de **en qué orden se aplicaron**, que es precisamente
lo que un sistema auditable no puede tener. Apagar el patch de respaldo deja un solo
camino de escritura: un "no sé" produce exactamente un patch, en un módulo, con
puntaje 0 y texto literal. Eso se puede afirmar leyendo una función.

El `operation: 'set'` de 5.4 va en la misma dirección: convierte una propiedad que
hoy se cumple por el estado del grafo en una que se cumple por la operación.

Plata: **no se toca ningún cálculo financiero.** `budgetSignalProcessor` no aparece
en la lista de archivos. El único efecto de esta entrega sobre puntajes es hacer que
un puntaje que no debía subir, no suba.
