# Spec: bloque de apertura y extracción de la pantalla 1

**Versión 1 · 2026-09-11**
Deriva de `claude/EL CULEBREO - Arquetipos de proyecto (Fase B)` v3, secciones 3 y 4.
Esta es la primera entrega de la Fase B. No construye arquetipos ni ramas de
intención: construye la conversación universal que va antes de cualquier rama.

---

## 1. Objetivo

Que el texto libre de la pantalla 1 se lea una sola vez y alimente el resto —
nombre, disciplina y lugar llegan a la pantalla 2 ya extraídos y editables — y que
después corra un bloque fijo de seis preguntas, una a la vez, cada una citando la
respuesta anterior, sin volver a preguntar nada que ya se sepa.

## 2. Por qué ahora

Hoy la persona escribe en la pantalla 1 "quiero sacar mi EP *Ruido Blanco* en
Medellín en marzo" y la pantalla 2 le presenta un campo de nombre **vacío** y
siete botones de categoría con `'other'` por defecto. `onCreate(title,
description, category)` no extrae nada del texto. Esa es, literalmente, la queja
original: *"si desde un principio la persona ya mencionó el nombre, en el
siguiente paso ya tiene que tener ahí el nombre que la persona le dijo."*

Y después del primer paso el problema se repite por otra vía:
`getNextBestQuestion` elige la pregunta por puntaje de módulo débil y **nunca lee**
`graph.knowledge.projectType.primaryType`, aunque `isQuestionAlreadyAnswered` sí lo
consulta. `isQuestionAlreadyAnswered` solo cubre 8 de 22 intenciones, así que las
otras 14 se pueden preguntar aunque la respuesta ya esté en el grafo.

Sin esta entrega, el bloque de apertura sería **peor** que lo de hoy: seis preguntas
fijas sin extracción es un formulario. La extracción no es una mejora del bloque,
es su requisito — y por eso van en la misma entrega, en ese orden.

## 3. Archivos que se crean o se modifican

**Se crean:**

- `engines/projectSeedExtractor.ts` — función pura que lee el texto libre de la
  pantalla 1 y devuelve candidatos. Determinista, reglas y regex, sin modelo.
- `engines/openingBlockEngine.ts` — las seis preguntas y la bisagra como datos,
  más la selección de la siguiente y la contextualización con la respuesta previa.
- `tests/projectSeedExtraction.test.ts`
- `tests/openingBlock.test.ts`

**Se modifican:**

- `components/CreateProjectScreen.tsx` — al pasar de paso 1 a paso 2 se corre el
  extractor; el campo de nombre llega precargado y editable, la categoría llega
  preseleccionada, y se muestra de dónde salió cada dato. **Solo esto.** No se
  toca el estilo (ver sección 4).
- `engines/questionEngine.ts` — tres cambios: (a) `getNextBestQuestion` consulta
  primero el bloque de apertura; (b) `isQuestionAlreadyAnswered` cubre las
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
- **Los arquetipos y las ramas de intención.** El bloque de apertura es universal;
  lo que viene después de la bisagra es otra entrega.
- **El esquema completo de 14 campos de `DefinicionDePregunta`.** Esta entrega usa
  el subconjunto que el bloque necesita (sección 5.2). El esquema completo entra
  cuando se reescriba el banco de las 21 preguntas estratégicas.
- **El `gate` duro/blando, la rúbrica 0–6 y los pesos.** Ninguna pregunta del
  bloque de apertura bloquea. El modelo de madurez es otra entrega.
- **`conversationStrategyEngine.ts`**, que tiene un segundo banco `QUESTIONS`
  duplicado con redacción distinta. Hay que unificarlo, no aquí. No se borra nada.
- **Pedir evidencia.** `evidenciaMinima` no aplica al bloque de apertura: ninguna
  de las seis se prueba con un documento.

## 5. Decisiones ya tomadas

### 5.1 Las seis preguntas y la bisagra, textuales

En este orden exacto. Son los strings que van al código.

| Código | Pregunta | Intención | Módulo |
|---|---|---|---|
| `AP-01` | `¿Qué es? Cuéntamelo en una o dos frases.` | `clarify_project_type` | `identity` |
| `AP-02` | `¿Quién va a estar del otro lado?` | `clarify_audience` | `community` |
| `AP-03` | `¿Qué te hizo querer hacer esto?` | `clarify_purpose` | `purpose` |
| `AP-04` | `¿Qué falta hoy para esa gente, que esto viene a atender?` | `clarify_problem` | `problem` |
| `AP-05` | `¿Dónde pasa?` | `clarify_location` | `context` |
| `AP-06` | `¿Qué parte ya existe?` | `clarify_phase` *(nueva)* | `activities` |
| `AP-07` | `¿Quién tiene que decir sí para que esto pase?` | `clarify_intent` *(nueva)* | `opportunities` |

`clarify_phase` y `clarify_intent` se agregan a la unión `QuestionIntent`.

**Versión contextualizada.** `AP-04` tiene una segunda redacción que se usa cuando
`AP-02` ya está respondida:

`¿Qué les falta hoy a [RESPUESTA_AP02], que esto viene a atender?`

El placeholder se reemplaza con el contenido del módulo `community`, recortado a
80 caracteres en el último límite de palabra. Si el contenido está vacío o pasa de
80 caracteres sin un espacio donde cortar, se usa la redacción base. **Es
interpolación de un valor ya guardado, no generación de texto.**

Ninguna otra pregunta del bloque lleva versión contextualizada en esta entrega.

**`AP-07` se presenta con opciones**, porque nombrarlo en frío es difícil. Las
nueve del documento v3, en este orden, con la última siempre visible:
`El Estado (una convocatoria pública)` · `CoCrea o un fondo privado` · `Una marca
(patrocinio)` · `Un espacio que me programe` · `Alguien que me compre` · `Un aliado
o coproductor` · `Yo, voy a crear el fondo` · `El Estado, para formalizarme` ·
`Todavía no sé`.

La respuesta se guarda como `intencion` en el módulo `opportunities`. **No ramifica
nada en esta entrega** — se guarda para que la siguiente la consuma.

### 5.2 Tipo de la pregunta del bloque

Subconjunto del esquema de la sección 4 del documento v3:

```ts
export interface PreguntaDeApertura {
  codigo: string;
  pregunta: string;
  plantillaConContexto: string | null;
  opciones: string[] | null;
  intent: QuestionIntent;
  modulo: ProjectModuleId;
  aceptaNoSe: true;
}
```

`aceptaNoSe` es `true` literal en las siete: es una invariante del bloque, no una
configuración.

### 5.3 Qué hace "no sé"

Si la respuesta, normalizada, es una de `no se` · `no sé` · `ninguna` · `ninguno` ·
`nada` · `todavia no` · `todavía no` · `no aplica` (sola, no dentro de una frase
más larga), entonces:

- la pregunta se marca **respondida**, no pendiente;
- se guarda en el módulo el texto literal `Sin respuesta por ahora.`;
- el puntaje del módulo **no sube**;
- **no se vuelve a preguntar** en el bloque.

Esta es una decisión de producto, no un detalle: un sistema que le exige
justificación social a alguien que está haciendo un disco se vuelve la burocracia
que intenta reemplazar. La postura consciente funciona preguntando, no exigiendo
una buena respuesta.

### 5.4 El orden de precedencia en `getNextBestQuestion`

```
1. ¿Queda alguna pregunta del bloque de apertura sin responder?  → devolverla
2. Si no                                                          → la lógica actual de módulos débiles, sin cambios
```

El bloque se recorre en el orden de la tabla 5.1, saltando las que ya están
respondidas según 5.5. La lógica existente de `previousIntents`, `previousQuestions`
y `getWeakModules` **no se modifica**: solo deja de ser la primera en decidir.

### 5.5 Cómo se sabe que una pregunta del bloque ya está respondida

`isQuestionAlreadyAnswered` se extiende con los casos que faltan. Regla única y
literal: **una pregunta del bloque está respondida si su módulo tiene contenido no
vacío**, más los casos que ya existen:

| Intención | Condición |
|---|---|
| `clarify_project_type` | `Boolean(graph.knowledge?.projectType.primaryType)` **o** `hasModule('identity')` |
| `clarify_audience` | sin cambios |
| `clarify_purpose` | `hasModule('purpose')` |
| `clarify_problem` | `hasModule('problem')` |
| `clarify_location` | sin cambios |
| `clarify_phase` | `hasModule('activities')` |
| `clarify_intent` | `hasModule('opportunities')` |

Los casos existentes (`clarify_project_name`, `clarify_date`, `clarify_quantity`,
`clarify_budget`, `clarify_responsibility`) **no se tocan**. Las 10 intenciones
restantes siguen cayendo en `default: return false` — cubrirlas es otra entrega.

### 5.6 Lo que extrae `projectSeedExtractor`

```ts
export interface SemillaDeProyecto {
  nombreCandidato:   { valor: string; razon: string } | null;
  disciplinaCandidata: { valor: string; razon: string } | null;
  lugarCandidato:    { valor: string; razon: string } | null;
  intencionCandidata: { valor: string; razon: string } | null;
}

export function extraerSemilla(textoLibre: string): SemillaDeProyecto;
```

`razon` es el fragmento del texto original que disparó la detección. **Se muestra
al usuario.** Nada se acepta en silencio.

**Nombre.** En este orden, primera coincidencia gana:
1. Texto entre comillas dobles, simples o angulares: `"Ruido Blanco"`, `«Ruido Blanco»`.
2. Después de `se llama`, `lo llamo`, `lo llamé`, `titulado`, `que se llama`.
3. Secuencia de 1 a 4 palabras con mayúscula inicial que no esté al comienzo de
   una oración y no sea un topónimo conocido (ver lista de lugares abajo) ni un mes.
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

El mapeo de disciplina a `WorkspaceProject['category']` para preseleccionar el
botón: `musical|audiovisual|escenicas|visuales|editorial` → `'artistic'`;
`diseno|artesania|videojuegos` → `'product'`; `patrimonio` → `'cultural'`; sin
disciplina → `'other'` (el comportamiento de hoy).

**Lugar.** Por lista explícita de topónimos colombianos, sobre texto normalizado,
con la palabra completa: las 32 capitales departamentales más `bogota`, `medellin`,
`cali`, `barranquilla`, `cartagena`, `bucaramanga`, `pereira`, `manizales`,
`santa marta`, `cucuta`, `ibague`, `villavicencio`, `pasto`, `monteria`,
`neiva`, `armenia`, `popayan`, `valledupar`, `sincelejo`, `tunja`, `riohacha`,
`florencia`, `quibdo`, `yopal`, `mocoa`, `leticia`, `arauca`, `inirida`,
`mitu`, `puerto carreno`, `san andres`, `choco`, `guajira`, `amazonas`,
`pacifico`, `caribe`. También captura lo que sigue a `en la ciudad de` y a
`en el municipio de`. Se devuelve en la capitalización original del texto.

Se usa lista y no una regla general porque `en marzo` y `en tres meses` también
siguen a `en`, y una regla laxa produciría lugares falsos. Es mejor no detectar
que detectar mal: lo que no se detecte, lo pregunta `AP-05`.

**Intención.** Por frases, no por palabras sueltas: `convocatoria`, `aplicar a`,
`postular`, `estimulos` → `convocatoria_publica`; `cocrea`, `beneficio
tributario` → `convocatoria_privada`; `patrocinio`, `patrocinador`, `marca que` →
`patrocinio`; `que me programen`, `tocar en`, `presentarme en` → `programacion`;
`vender`, `venta`, `comprador` → `venta`. Si no hay coincidencia, `null` y la
pregunta `AP-07` se hace.

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
- No se agrega ningún campo nuevo a la pantalla 2. Las seis preguntas del bloque
  pasan en el chat, no en este formulario.

### 5.8 Las reglas generales que reemplazan las cableadas

En `turnInterpretationEngine.ts`, las tres reglas de zapatos se reemplazan por
reglas que no nombran ningún proyecto:

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
`Ya definimos que se busca reducir plástico de un solo uso.` — es contenido de un
proyecto de prueba que se le muestra a todos los usuarios. Se borra esa frase y
queda la pregunta sin ella. No se reescribe el resto de la pregunta.

## 6. Interfaces y contratos que hay que respetar

- `interpretTurn(input: string, graph: ProjectGraph, patches: ProjectPatch[]):
  TurnInterpretation` — **la firma no cambia** y el tipo `TurnInterpretation`
  tampoco. Solo cambia cómo se llenan `explicitFacts`, `inferredFacts`,
  `recommendedNextQuestion` y `understoodSummary`.
- `getNextBestQuestion(graph: ProjectGraph, messages: ConversationMessage[]):
  string` — la firma no cambia. Sigue devolviendo un string, nunca `null`. Si el
  bloque terminó y la lógica de módulos se agota, sigue devolviendo la frase de
  cierre que ya devuelve hoy.
- `isQuestionAlreadyAnswered(intent, graph): boolean` — se extiende el `switch`,
  no se reestructura la función.
- `onCreate(title, description, category)` en `CreateProjectScreen` — **la firma no
  cambia.** La semilla extraída no se propaga por una firma nueva en esta entrega;
  lo que la extracción logra aquí es precargar la pantalla 2. Propagar la semilla
  completa al grafo es parte de la entrega siguiente, y por eso `extraerSemilla` se
  escribe como función pura y exportada: para que la llame otro sitio después.
- `extraerSemilla(textoLibre: string): SemillaDeProyecto` es la **interfaz pensada
  para ser intercambiable.** Si algún día la extracción deja de ser regex, se
  reemplaza la implementación de esta función y nada más. Por eso no recibe el
  grafo y no tiene efectos: entra un string, sale un objeto.
- `PreguntaDeApertura` y el arreglo `BLOQUE_DE_APERTURA` se exportan desde
  `openingBlockEngine.ts` como datos, no como funciones que construyen strings.

## 7. Tests que van a romperse a propósito

**Ninguno.** Y eso es una restricción de diseño, no una observación.

`tests/kicksInterpretation.test.ts` verifica hoy seis cosas sobre el mensaje del
proyecto de zapatos. Las tres financieras vienen de `budgetSignalProcessor`, que no
se toca. Las otras tres dependen de las reglas que esta entrega generaliza, y
**las tres tienen que seguir pasando**:

- `audience` debe seguir conteniendo `bmx`: la regla general de `para <...>` captura
  `deportistas extremos, skate y BMX` del mensaje de prueba. Si se extrae sobre el
  texto normalizado, el valor contiene `bmx` en minúscula, que es lo que el test
  compara.
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
5. `tests/projectSeedExtraction.test.ts` cubre, como mínimo, estos casos:
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
   - Grafo recién creado → la primera pregunta que devuelve `getNextBestQuestion`
     es exactamente el texto de `AP-01`.
   - Grafo con `community` lleno con `gente que patina en Bogotá` → la pregunta
     `AP-04` que se devuelve es la contextualizada y **contiene** ese texto.
   - Grafo con los siete módulos del bloque llenos → `getNextBestQuestion`
     **no** devuelve ninguno de los siete textos del bloque, y devuelve algo no
     vacío (cae a la lógica de módulos débiles, que sigue funcionando).
   - Respuesta `no sé` en `AP-03` → `AP-03` no se vuelve a devolver, y el puntaje
     del módulo `purpose` no subió.
7. Lectura del diff de `CreateProjectScreen.tsx`: **no contiene ningún cambio de
   clase de Tailwind.** Si aparece una, la entrega se devuelve — es la sección 4.

## 9. Qué queda determinista y por qué

**Todo.** Esta entrega no introduce ninguna interpretación probabilística.

`extraerSemilla` es regex y listas explícitas: la misma entrada produce siempre la
misma salida, y cada salida trae en `razon` el fragmento exacto del texto que la
disparó. Un usuario puede ver por qué el sistema creyó que su proyecto se llama
así, y corregirlo en el mismo paso. Eso es lo que hace que la extracción sea
auditable y no una adivinanza: **no hay ningún valor extraído que el usuario no vea
antes de que se guarde.**

El bloque de apertura es un arreglo ordenado y una condición de "módulo con
contenido". No hay puntaje nuevo, no hay ranking, no hay umbral de confianza.

La contextualización de `AP-04` es interpolación de una cadena ya guardada en el
grafo, recortada en un límite de palabra. No genera lenguaje: mueve texto que el
usuario escribió.

Plata: esta entrega **no toca ningún cálculo financiero.**
`budgetSignalProcessor` no se modifica y los tres asertos de monto del test de
kicks siguen siendo la prueba de eso. Lo único que cambia en terreno financiero es
la **redacción** de una pregunta de desglose, no la detección ni la aritmética.

La frontera que esto protege es la que ya está escrita en `CLAUDE.md`: plata,
puntajes y consistencia son deterministas y auditables, por razón legal y no solo
técnica. Si en el futuro se quiere reemplazar la extracción por algo no
determinista, el único punto de cambio es la implementación de `extraerSemilla` —
y ahí habrá que decidir explícitamente qué se le muestra al usuario antes de
guardar, que es la pregunta que esta entrega ya responde con `razon`.
