# Spec: bloque de apertura y extracción de la pantalla 1

**Versión 2 · 2026-09-11** — reemplaza la v1 del mismo día.
Deriva de `claude/EL CULEBREO - Arquetipos de proyecto (Fase B)` v4, secciones 3 y 4.

**Qué cambió frente a la v1.** Andrés aclaró que las preguntas se eligen **según la
necesidad y la preparación del proyecto, en ambas ramas**. La v1 modelaba el bloque
de apertura como una secuencia fija de seis preguntas con precedencia absoluta, y
eso era un guion. En la v2 el bloque **no es una secuencia**: es el resultado de una
regla de selección. Cambian la sección 5.1 (la tabla gana dos columnas), la 5.2
(el tipo), la 5.4 (de "precedencia" a "selección"), la 6 y la 8.

Esta es la primera entrega de la Fase B. No construye arquetipos ni ramas de
intención: construye la conversación universal que va antes de cualquier rama, y
**el mecanismo de selección** que las ramas van a reutilizar.

---

## 1. Objetivo

Que el texto libre de la pantalla 1 se lea una sola vez y alimente el resto —
nombre, disciplina y lugar llegan a la pantalla 2 ya extraídos y editables — y que
después el sistema elija cada pregunta **por lo que el proyecto necesita y por lo
que está en condiciones de responder**, nunca por una lista fija ni por lo que ya
se sabe.

## 2. Por qué ahora

Hoy la persona escribe en la pantalla 1 "quiero sacar mi EP *Ruido Blanco* en
Medellín en marzo" y la pantalla 2 le presenta un campo de nombre **vacío** y
siete botones de categoría con `'other'` por defecto. `onCreate(title,
description, category)` no extrae nada del texto. Esa es, literalmente, la queja
original: *"si desde un principio la persona ya mencionó el nombre, en el
siguiente paso ya tiene que tener ahí el nombre que la persona le dijo."*

Después del primer paso el problema se repite por otra vía:
`getNextBestQuestion` elige por puntaje de módulo débil y **nunca lee**
`graph.knowledge.projectType.primaryType`, aunque `isQuestionAlreadyAnswered` sí lo
consulta. `isQuestionAlreadyAnswered` solo cubre 8 de 22 intenciones, así que las
otras 14 se pueden preguntar aunque la respuesta ya esté en el grafo.

Y hay un tercer problema que la v1 de esta spec iba a introducir y la v2 evita:
**un guion fijo.** Seis preguntas en orden inmutable funcionan el primer día y
fallan el día cincuenta, cuando la persona vuelve con cuatro de las seis ya
contestadas y el sistema la camina por todas igual. La regla de selección da el
mismo comportamiento el primer día y el correcto después.

Sin esta entrega, además, el bloque sería **peor** que lo de hoy: preguntas fijas
sin extracción es un formulario. La extracción no es una mejora del bloque, es su
requisito — y por eso van juntas, en ese orden.

## 3. Archivos que se crean o se modifican

**Se crean:**

- `engines/projectSeedExtractor.ts` — función pura que lee el texto libre de la
  pantalla 1 y devuelve candidatos. Determinista, reglas y regex, sin modelo.
- `engines/openingBlockEngine.ts` — las siete preguntas como datos, más la regla
  de selección y la contextualización con la respuesta previa.
- `tests/projectSeedExtraction.test.ts`
- `tests/openingBlock.test.ts`

**Se modifican:**

- `components/CreateProjectScreen.tsx` — al pasar de paso 1 a paso 2 se corre el
  extractor; el campo de nombre llega precargado y editable, la categoría llega
  preseleccionada, y se muestra de dónde salió cada dato. **Solo esto.** No se
  toca el estilo (ver sección 4).
- `engines/questionEngine.ts` — tres cambios: (a) `getNextBestQuestion` consulta
  primero la selección del bloque; (b) `isQuestionAlreadyAnswered` cubre las
  intenciones del bloque; (c) se borra el fixture filtrado en `impact.deepen`.
- `engines/turnInterpretationEngine.ts` — las tres reglas cableadas al proyecto de
  zapatos se reemplazan por reglas generales. La firma de `interpretTurn` no cambia.
- `package.json` — se agregan los dos tests nuevos al script `test`.

El constructor no toca nada fuera de esta lista sin detenerse a preguntar.

## 4. Fuera de alcance

- **La migración visual de `CreateProjectScreen.tsx`.** El archivo sigue en
  `bg-[#050505]` y `#D9FF00`. Hay que migrarlo, pero **no en esta entrega**: mezclar
  un reemplazo mecánico de tokens con cambios de comportamiento hace que el auditor
  no pueda leer el diff. Queda como la entrega inmediatamente siguiente.
- **El re-peso de la prioridad según la intención.** Esta entrega construye el
  mecanismo de selección con `prioridadBase` estática. Que la prioridad **suba o
  baje según lo que el portero de la intención exige** — lo que hace que la
  necesidad sea dinámica — requiere las listas de exigencias por intención, que son
  la entrega siguiente. Ver sección 5.4.3: el mecanismo queda listo para recibirlas
  sin reescribir la función.
- **Los arquetipos y las ramas de intención.**
- **El esquema completo de 14 campos de `DefinicionDePregunta`.** Esta entrega usa
  el subconjunto que el bloque necesita (5.2). El esquema completo entra cuando se
  reescriba el banco de las 21 preguntas estratégicas.
- **La rúbrica de madurez 0–6 y los pesos por dimensión.** Ver 5.4.4: la
  preparación en esta entrega es "¿se puede preguntar ya?", no "¿qué tan bien está
  respondido?". Lo segundo necesita la rúbrica y es otra entrega.
- **El `gate` duro/blando.** Ninguna pregunta del bloque de apertura bloquea.
- **`conversationStrategyEngine.ts`**, que tiene un segundo banco `QUESTIONS`
  duplicado con redacción distinta. Hay que unificarlo, no aquí. No se borra nada.
- **Pedir evidencia.** `evidenciaMinima` no aplica: ninguna de las siete se prueba
  con un documento.

## 5. Decisiones ya tomadas

### 5.1 Las siete preguntas, textuales

`prioridadBase` es 100 para lo primero. `requiere` son los códigos que deben estar
respondidos antes de que la pregunta se pueda hacer.

| Código | Pregunta | Intención | Módulo | `requiere` | `prioridadBase` |
|---|---|---|---|---|---|
| `AP-01` | `¿Qué es? Cuéntamelo en una o dos frases.` | `clarify_project_type` | `identity` | — | 100 |
| `AP-02` | `¿Quién va a estar del otro lado?` | `clarify_audience` | `community` | — | 90 |
| `AP-03` | `¿Qué te hizo querer hacer esto?` | `clarify_purpose` | `purpose` | — | 80 |
| `AP-04` | `¿Qué falta hoy para esa gente, que esto viene a atender?` | `clarify_problem` | `problem` | `AP-02` | 70 |
| `AP-05` | `¿Dónde pasa?` | `clarify_location` | `context` | — | 60 |
| `AP-06` | `¿Qué parte ya existe?` | `clarify_phase` *(nueva)* | `activities` | — | 50 |
| `AP-07` | `¿Quién tiene que decir sí para que esto pase?` | `clarify_intent` *(nueva)* | `opportunities` | `AP-01` | 40 |

`clarify_phase` y `clarify_intent` se agregan a la unión `QuestionIntent`.

**Por qué esos dos `requiere` y no más.** `AP-04` habla de "esa gente": sin `AP-02`
la pregunta no tiene sujeto. `AP-07` pregunta quién tiene que decir sí a *algo*:
sin `AP-01` no hay algo. Las otras cinco se pueden hacer en cualquier momento, y
por eso su orden lo decide la prioridad y no una dependencia.

**Versión contextualizada.** `AP-04` tiene una segunda redacción que se usa cuando
`AP-02` tiene contenido real:

`¿Qué les falta hoy a [RESPUESTA_AP02], que esto viene a atender?`

El placeholder se reemplaza con el contenido del módulo `community`, recortado a 80
caracteres en el último límite de palabra. Si el contenido está vacío, es
`Sin respuesta por ahora.` (ver 5.3), o pasa de 80 caracteres sin un espacio donde
cortar, se usa la redacción base. **Es interpolación de un valor ya guardado, no
generación de texto.**

Ninguna otra pregunta lleva versión contextualizada en esta entrega.

**`AP-07` se presenta con opciones**, porque nombrarlo en frío es difícil. Las
nueve del documento v4, en este orden, con la última siempre visible:
`El Estado (una convocatoria pública)` · `CoCrea o un fondo privado` · `Una marca
(patrocinio)` · `Un espacio que me programe` · `Alguien que me compre` · `Un aliado
o coproductor` · `Yo, voy a crear el fondo` · `El Estado, para formalizarme` ·
`Todavía no sé`.

La respuesta se guarda como `intencion` en el módulo `opportunities`. **No ramifica
nada en esta entrega** — se guarda para que la siguiente la consuma.

### 5.2 Tipo de la pregunta del bloque

```ts
export interface PreguntaDeApertura {
  codigo: string;
  pregunta: string;
  plantillaConContexto: string | null;
  opciones: string[] | null;
  intent: QuestionIntent;
  modulo: ProjectModuleId;
  requiere: string[];        // preparación: qué debe estar respondido antes
  prioridadBase: number;     // necesidad: qué tan urgente es hoy
  necesidad: string;         // qué necesidad del proyecto atiende, en una frase
  aceptaNoSe: true;
}
```

`aceptaNoSe` es `true` literal en las siete: es una invariante del bloque, no una
configuración.

`necesidad` es texto corto y legible, pensado para que el panel de herramientas
pueda decir después *"esto te falta para X"*. Valores:
`AP-01` `Saber qué es el proyecto` ·
`AP-02` `Saber para quién es` ·
`AP-03` `Tener el origen del proyecto contado con palabras propias` ·
`AP-04` `Saber qué necesidad atiende` ·
`AP-05` `Ubicar el proyecto en un territorio` ·
`AP-06` `Saber en qué estado real está` ·
`AP-07` `Saber a quién hay que convencer`.

### 5.3 Qué hace "no sé"

Si la respuesta, normalizada, es una de `no se` · `no sé` · `ninguna` · `ninguno` ·
`nada` · `todavia no` · `todavía no` · `no aplica` (sola, no dentro de una frase
más larga), entonces:

- la pregunta se marca **respondida**, no pendiente;
- se guarda en el módulo el texto literal `Sin respuesta por ahora.`;
- el puntaje del módulo **no sube**;
- **no se vuelve a preguntar**;
- si otra pregunta la tenía en `requiere`, el requisito **queda satisfecho** — la
  persona ya tuvo la oportunidad de contestar y no se le insiste. En ese caso la
  pregunta dependiente usa su redacción base, no la contextualizada.

Esta es una decisión de producto, no un detalle: un sistema que le exige
justificación social a alguien que está haciendo un disco se vuelve la burocracia
que intenta reemplazar. La postura consciente funciona preguntando, no exigiendo
una buena respuesta.

### 5.4 La regla de selección

Esto reemplaza la "precedencia" de la v1. **No hay secuencia fija.**

#### 5.4.1 La función

```ts
export function seleccionarPreguntaDeApertura(
  graph: ProjectGraph
): PreguntaDeApertura | null;
```

Pasos, en este orden:

1. **Descartar lo respondido.** Se quitan las preguntas cuya intención ya está
   satisfecha según 5.5. *(Esto es preparación: lo que ya se sabe no se pregunta.)*
2. **Descartar lo que todavía no se puede preguntar.** Se quitan las que tengan en
   `requiere` algún código no respondido. *(Esto también es preparación: una
   pregunta sin sus prerrequisitos no es respondible.)*
3. **Ordenar por necesidad.** De las que quedan, `prioridadBase` de mayor a menor.
4. **Desempatar por `codigo` ascendente.** No hay empates con los valores de 5.1,
   pero el desempate va escrito para que la función sea determinista cuando la
   entrega siguiente modifique las prioridades.
5. Devolver la primera, o `null` si no queda ninguna.

#### 5.4.2 Cómo se conecta con `getNextBestQuestion`

```
1. seleccionarPreguntaDeApertura(graph)  → si devuelve algo, esa es la pregunta
2. si devuelve null                      → la lógica actual de módulos débiles, sin cambios
```

La lógica existente de `previousIntents`, `previousQuestions` y `getWeakModules`
**no se modifica**: deja de ser la primera en decidir y sigue siendo la que
continúa cuando el bloque se agota.

#### 5.4.3 Por qué `requiere` y `prioridadBase` son campos separados

Parecen redundantes con los valores de 5.1, porque la prioridad sola ya produce el
orden correcto en un proyecto vacío. No lo son, y la razón es la entrega siguiente.

Cuando entren las exigencias por intención, la prioridad **va a cambiar según lo
que el portero pide**: a quien va a una convocatoria pública le va a subir `AP-04`
(qué necesidad atiende) porque el Estado lo exige; a quien busca que lo programen le
va a subir `AP-02` (para quién es) porque el espacio quiere saber qué público
trae. En ese momento `AP-04` puede quedar por encima de `AP-02`, **y el
prerrequisito es lo único que evita que se pregunte "¿qué les falta a esa gente?"
antes de saber quién es esa gente.**

La prioridad expresa urgencia y es lo que se va a mover. El prerrequisito expresa
que la pregunta no tiene sentido todavía, y no se mueve nunca. Mezclarlos en un
solo número haría que el re-peso de la entrega siguiente produjera preguntas sin
sujeto.

#### 5.4.4 Qué significa "preparación" en esta entrega, y qué no

Preparación aquí es binaria y auditable: **¿está respondido?** y **¿están sus
prerrequisitos respondidos?** Nada más.

Lo que **no** es, y queda para la entrega de la rúbrica: *qué tan bien* está
respondido. Hoy el sistema tiene un puntaje por módulo que es un promedio plano sin
rúbrica escrita, y por eso no sirve para decidir si una respuesta alcanza. Usar ese
número aquí sería construir sobre algo que ya sabemos que no se puede auditar. Se
deja por fuera a propósito, no por olvido.

### 5.5 Cómo se sabe que una pregunta del bloque ya está respondida

`isQuestionAlreadyAnswered` se extiende con los casos que faltan. Regla única:
**una pregunta del bloque está respondida si su módulo tiene contenido no vacío**,
más los casos que ya existen:

| Intención | Condición |
|---|---|
| `clarify_project_type` | `Boolean(graph.knowledge?.projectType.primaryType)` **o** `hasModule('identity')` |
| `clarify_audience` | sin cambios |
| `clarify_purpose` | `hasModule('purpose')` |
| `clarify_problem` | `hasModule('problem')` |
| `clarify_location` | sin cambios |
| `clarify_phase` | `hasModule('activities')` |
| `clarify_intent` | `hasModule('opportunities')` |

Nótese que `Sin respuesta por ahora.` **es** contenido no vacío, que es justo lo
que hace que "no sé" cuente como respondida sin un campo extra.

Los casos existentes (`clarify_project_name`, `clarify_date`, `clarify_quantity`,
`clarify_budget`, `clarify_responsibility`) **no se tocan**. Las 10 intenciones
restantes siguen cayendo en `default: return false` — cubrirlas es otra entrega.

### 5.6 Lo que extrae `projectSeedExtractor`

```ts
export interface SemillaDeProyecto {
  nombreCandidato:     { valor: string; razon: string } | null;
  disciplinaCandidata: { valor: string; razon: string } | null;
  lugarCandidato:      { valor: string; razon: string } | null;
  intencionCandidata:  { valor: string; razon: string } | null;
}

export function extraerSemilla(textoLibre: string): SemillaDeProyecto;
```

`razon` es el fragmento del texto original que disparó la detección. **Se muestra
al usuario.** Nada se acepta en silencio.

**Nombre.** En este orden, primera coincidencia gana:
1. Texto entre comillas dobles, simples o angulares: `"Ruido Blanco"`, `«Ruido Blanco»`.
2. Después de `se llama`, `lo llamo`, `lo llamé`, `titulado`, `que se llama`.
3. Secuencia de 1 a 4 palabras con mayúscula inicial que no esté al comienzo de una
   oración y no sea un topónimo de la lista de lugares ni un mes.
4. Si nada coincide: `null`. **No se inventa un nombre a partir de la descripción.**

**Disciplina.** Por vocabulario, sobre el texto normalizado (minúsculas, sin
tildes). Se devuelve el arquetipo con más términos encontrados; si hay empate,
`null`. Los términos van en un mapa exportado `TERMINOS_POR_DISCIPLINA`, una sola
fuente de verdad, para que la siguiente entrega lo amplíe sin tocar la lógica:

- `musical`: `ep`, `album`, `disco`, `sencillo`, `single`, `cancion`, `canciones`,
  `banda`, `concierto`, `gira`, `master`, `mezcla`, `sello`
- `audiovisual`: `cortometraje`, `largometraje`, `documental`, `serie`, `pelicula`,
  `rodaje`, `guion`, `tratamiento`, `post`, `montaje`
- `escenicas`: `obra de teatro`, `montaje escenico`, `danza`, `dramaturgia`,
  `temporada`, `sala`, `funcion`
- `visuales`: `exposicion`, `muestra`, `galeria`, `curaduria`, `instalacion`,
  `mural`, `obra plastica`
- `editorial`: `libro`, `novela`, `poemario`, `manuscrito`, `editorial`, `tiraje`,
  `fanzine`, `revista`
- `diseno`: `coleccion`, `prototipo`, `identidad`, `marca de ropa`, `diseno de`
- `videojuegos`: `videojuego`, `juego`, `build`, `gdd`
- `patrimonio`: `patrimonio`, `saberes`, `salvaguarda`, `tradicion`, `portador`
- `artesania`: `artesania`, `artesanal`, `oficio`, `tejido`, `ceramica`

Mapeo de disciplina a `WorkspaceProject['category']` para preseleccionar el botón:
`musical|audiovisual|escenicas|visuales|editorial` → `'artistic'`;
`diseno|artesania|videojuegos` → `'product'`; `patrimonio` → `'cultural'`; sin
disciplina → `'other'` (el comportamiento de hoy).

**Lugar.** Por lista explícita de topónimos colombianos, sobre texto normalizado,
con la palabra completa: las 32 capitales departamentales más `bogota`, `medellin`,
`cali`, `barranquilla`, `cartagena`, `bucaramanga`, `pereira`, `manizales`,
`santa marta`, `cucuta`, `ibague`, `villavicencio`, `pasto`, `monteria`, `neiva`,
`armenia`, `popayan`, `valledupar`, `sincelejo`, `tunja`, `riohacha`, `florencia`,
`quibdo`, `yopal`, `mocoa`, `leticia`, `arauca`, `inirida`, `mitu`,
`puerto carreno`, `san andres`, `choco`, `guajira`, `amazonas`, `pacifico`,
`caribe`. También captura lo que sigue a `en la ciudad de` y a `en el municipio de`.
Se devuelve en la capitalización original del texto.

Se usa lista y no una regla general porque `en marzo` y `en tres meses` también
siguen a `en`, y una regla laxa produciría lugares falsos. Es mejor no detectar que
detectar mal: lo que no se detecte, lo pregunta `AP-05`.

**Intención.** Por frases, no por palabras sueltas: `convocatoria`, `aplicar a`,
`postular`, `estimulos` → `convocatoria_publica`; `cocrea`, `beneficio tributario`
→ `convocatoria_privada`; `patrocinio`, `patrocinador`, `marca que` → `patrocinio`;
`que me programen`, `tocar en`, `presentarme en` → `programacion`; `vender`,
`venta`, `comprador` → `venta`. Si no hay coincidencia, `null` y `AP-07` se hace.

### 5.7 Qué cambia en la pantalla 2

- El campo de nombre llega con `nombreCandidato.valor` si existe, y vacío si no.
  **Siempre editable.** El botón `Crear Mesa de Producción` sigue exigiendo título.
- La categoría llega preseleccionada según 5.6. **Siempre cambiable.**
- Debajo de cada dato precargado, una línea de texto pequeño con la forma
  `Lo tomé de: "<razon>"`. Si no se extrajo nada, no se muestra nada — ni un
  mensaje de que no se encontró.
- El encabezado de paso 2 cambia de `Démosle una primera identidad.` a
  `Confirmemos lo que entendí.` cuando hubo al menos una extracción; si no hubo
  ninguna, se queda como está hoy.
- No se agrega ningún campo nuevo. Las siete preguntas pasan en el chat, no aquí.

### 5.8 Las reglas generales que reemplazan las cableadas

En `turnInterpretationEngine.ts`:

| Hoy | Pasa a ser |
|---|---|
| `if (/zapato\|calzado/) → product: 'calzado'` | la disciplina de `extraerSemilla`, cuando exista → `field: 'discipline'` |
| `['skate','bmx','deportes extremos'].filter(...)` | lo que siga a `para `, `dirigido a `, `para gente que `, `para personas que `, hasta el final de la frase o un punto → `field: 'audience'` |
| `recommendedNextQuestion` con `cada zapato` | `Cuando dices que cada unidad cuesta COP <monto>, ¿ese valor incluye únicamente materiales y fabricación, o también mano de obra, empaque, transporte, impuestos, diseño, comercialización y una parte de los gastos de la operación?` |

La regla de `brand_identity` ya es general; **se deja como está**.
`summaryParts` deja de decir `un producto de calzado` y dice `un proyecto de
<disciplina>` cuando hay disciplina, o `Registré nueva información del proyecto`
cuando no.

El monto de la pregunta de desglose se toma del `financialSignal` de tipo `cost`
que ya se detecta, formateado con `toLocaleString('es-CO')` como ya se hace.

### 5.9 El fixture filtrado

En `questionEngine.ts`, `STRATEGIC_QUESTIONS.impact.deepen` contiene hoy la frase
`Ya definimos que se busca reducir plástico de un solo uso.` — contenido de un
proyecto de prueba que se le muestra a todos los usuarios. Se borra esa frase y
queda la pregunta sin ella. No se reescribe el resto de la pregunta.

## 6. Interfaces y contratos que hay que respetar

- `interpretTurn(input, graph, patches): TurnInterpretation` — **la firma no
  cambia** y el tipo `TurnInterpretation` tampoco. Solo cambia cómo se llenan
  `explicitFacts`, `inferredFacts`, `recommendedNextQuestion` y `understoodSummary`.
- `getNextBestQuestion(graph, messages): string` — la firma no cambia. Sigue
  devolviendo un string, nunca `null`. Si el bloque terminó y la lógica de módulos
  se agota, sigue devolviendo la frase de cierre de hoy.
- `isQuestionAlreadyAnswered(intent, graph): boolean` — se extiende el `switch`,
  no se reestructura la función.
- `seleccionarPreguntaDeApertura(graph): PreguntaDeApertura | null` es la
  **interfaz que la entrega siguiente va a extender**, y por eso su forma importa
  más que su implementación actual: recibe el grafo, devuelve una pregunta o nada,
  y no tiene efectos. Cuando entren las exigencias por intención, lo único que
  cambia es de dónde sale `prioridadBase` — no la firma ni los pasos 1, 2, 4 y 5.
  **El constructor no debe colapsar los cinco pasos en un `if/else` encadenado
  sobre los siete códigos**, porque eso es exactamente el guion que la v2 evita.
- `extraerSemilla(textoLibre: string): SemillaDeProyecto` es la otra **interfaz
  pensada para ser intercambiable.** Si algún día la extracción deja de ser regex,
  se reemplaza la implementación de esta función y nada más. Por eso no recibe el
  grafo y no tiene efectos: entra un string, sale un objeto.
- `onCreate(title, description, category)` en `CreateProjectScreen` — **la firma no
  cambia.** Propagar la semilla completa al grafo es parte de la entrega siguiente.
- `BLOQUE_DE_APERTURA: PreguntaDeApertura[]` se exporta desde
  `openingBlockEngine.ts` como **datos**, no como funciones que construyen strings.

## 7. Tests que van a romperse a propósito

**Ninguno.** Y eso es una restricción de diseño, no una observación.

`tests/kicksInterpretation.test.ts` verifica hoy seis cosas sobre el mensaje del
proyecto de zapatos. Las tres financieras vienen de `budgetSignalProcessor`, que no
se toca. Las otras tres dependen de las reglas que esta entrega generaliza, y
**las tres tienen que seguir pasando**:

- `audience` debe seguir conteniendo `bmx`: la regla general de `para <...>` captura
  `deportistas extremos, skate y BMX` del mensaje de prueba. Si se extrae sobre el
  texto normalizado, el valor contiene `bmx` en minúscula, que es lo que compara.
- `brand_identity === false`: esa regla no cambia.
- `recommendedNextQuestion` debe seguir conteniendo `mano de obra`: la redacción
  general de 5.8 la conserva; lo que se quita es `zapato`.

**Que los siete tests sigan verdes es la prueba de que la generalización es real y
no un borrado.** Si el constructor rompe `kicksInterpretation`, la salida correcta
no es editar el test: es corregir la regla general hasta que el caso específico
quede cubierto por ella. Un test que se rompe aquí es una regresión, no una
consecuencia esperada.

## 8. Criterio de aceptación verificable

El auditor comprueba, en este orden:

1. `npm run typecheck` — sin errores.
2. `npm test` — los 7 tests existentes pasan **más** los 2 nuevos. Nueve en total.
3. `grep -n "zapato\|calzado\|skate\|bmx" engines/` — **sin resultados.**
4. `grep -n "plastico de un solo uso" engines/questionEngine.ts` — **sin resultados.**
5. `tests/projectSeedExtraction.test.ts` cubre, como mínimo:
   - `quiero sacar mi EP "Ruido Blanco" en Medellín en marzo` → nombre
     `Ruido Blanco`, disciplina `musical`, lugar `Medellín`, intención `null`.
   - `voy a aplicar a la convocatoria de estímulos con un documental en Quibdó` →
     nombre `null`, disciplina `audiovisual`, lugar `Quibdó`, intención
     `convocatoria_publica`.
   - `quiero hacer algo bonito` → los cuatro campos en `null`. **Este caso es el
     importante:** comprueba que el extractor no inventa.
   - `en marzo quiero montar la obra en tres meses` → lugar `null`. Comprueba que
     `en <mes>` y `en <duración>` no se toman por lugares.
6. `tests/openingBlock.test.ts` cubre, como mínimo:
   - **Proyecto vacío** → `seleccionarPreguntaDeApertura` devuelve `AP-01`.
   - **Solo `identity` con contenido** → devuelve `AP-02`, no `AP-01`.
   - **Preparación: prerrequisito.** Grafo con `identity`, `purpose`, `context`,
     `activities` y `opportunities` llenos y `community` y `problem` vacíos →
     devuelve `AP-02`, y **nunca `AP-04`**. Este es el aserto que protege contra
     preguntar "¿qué les falta a esa gente?" sin saber quién es esa gente, y el que
     tiene que seguir pasando cuando la entrega siguiente suba la prioridad de
     `AP-04`.
   - **Contextualización.** `community` con `gente que patina en Bogotá` → la
     pregunta devuelta para `AP-04` **contiene** ese texto.
   - **"No sé" satisface el prerrequisito.** `community` con
     `Sin respuesta por ahora.` → `AP-04` **sí** se puede devolver, y con la
     redacción **base**, no la contextualizada.
   - **Bloque agotado.** Los siete módulos con contenido → la función devuelve
     `null`, y `getNextBestQuestion` devuelve algo no vacío que **no es** ninguno de
     los siete textos (cae a la lógica de módulos débiles, que sigue funcionando).
   - **"No sé" no sube el puntaje.** Respuesta `no sé` en `AP-03` → `AP-03` no se
     vuelve a devolver y el puntaje del módulo `purpose` no subió.
7. Lectura del código de `openingBlockEngine.ts`: los cinco pasos de 5.4.1 son
   identificables como pasos. Si la selección está escrita como una cadena de
   `if` sobre los siete códigos, la entrega se devuelve — ver sección 6.
8. Lectura del diff de `CreateProjectScreen.tsx`: **no contiene ningún cambio de
   clase de Tailwind.** Si aparece una, la entrega se devuelve — es la sección 4.

## 9. Qué queda determinista y por qué

**Todo.** Esta entrega no introduce ninguna interpretación probabilística.

`extraerSemilla` es regex y listas explícitas: la misma entrada produce siempre la
misma salida, y cada salida trae en `razon` el fragmento exacto del texto que la
disparó. Un usuario puede ver por qué el sistema creyó que su proyecto se llama así,
y corregirlo en el mismo paso. Eso es lo que hace que la extracción sea auditable y
no una adivinanza: **no hay ningún valor extraído que el usuario no vea antes de que
se guarde.**

La selección de pregunta es un filtro, un orden y un desempate sobre una lista de
siete. No hay puntaje nuevo, no hay umbral de confianza, no hay aleatoriedad. Dado
un grafo, la pregunta siguiente es siempre la misma y se puede explicar en una
frase: *"te pregunto esto porque es lo que más falta de lo que ya se puede
preguntar."* El desempate por `codigo` está escrito justamente para que eso siga
siendo cierto cuando las prioridades cambien.

La contextualización de `AP-04` es interpolación de una cadena ya guardada en el
grafo, recortada en un límite de palabra. No genera lenguaje: mueve texto que el
usuario escribió.

Plata: esta entrega **no toca ningún cálculo financiero.**
`budgetSignalProcessor` no se modifica y los tres asertos de monto del test de kicks
siguen siendo la prueba de eso. Lo único que cambia en terreno financiero es la
**redacción** de una pregunta de desglose, no la detección ni la aritmética.

La frontera que esto protege es la que ya está en `CLAUDE.md`: plata, puntajes y
consistencia son deterministas y auditables, por razón legal y no solo técnica. Si
en el futuro se quiere reemplazar la extracción por algo no determinista, el único
punto de cambio es la implementación de `extraerSemilla` — y ahí habrá que decidir
explícitamente qué se le muestra al usuario antes de guardar, que es la pregunta que
esta entrega ya responde con `razon`.
