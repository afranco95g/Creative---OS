# Spec corta: redacción de las preguntas de apertura

**Versión 1 · 2026-09-11** · Nivel: **rápido** (un solo agente).
Fuente de la redacción: `claude/EL CULEBREO - Redacción de las preguntas de apertura` v3.

---

## 1. Qué se construye

Las siete preguntas del bloque de apertura quedan con su redacción corregida, y
las que pueden nombrar el oficio de la persona lo nombran: *"¿Tienes locación para
tu **concierto**?"* en vez de *"para tu proyecto"*.

## 2. Por qué

Tres de las siete estaban mal escritas y el dueño del producto las rechazó una por
una:

- `AP-02` era `¿Quién va a estar del otro lado?` — una metáfora que hay que
  descifrar antes de poder contestar, y quien hace un disco no tiene a nadie "del
  otro lado" de nada.
- `AP-04` era `¿Qué falta hoy para esa gente, que esto viene a atender?` — son dos
  preguntas, y la subordinada afirma que el proyecto atiende una carencia antes de
  que la persona lo diga.
- `AP-03` y `AP-07` dicen **"esto"** cuando el sistema ya sabe qué está haciendo
  la persona.

La regla que manda, en palabras del dueño: *"las preguntas deben ser claras, lo más
sencillas para el usuario; la idea es ayudarlo, no confundirlo, ni llevarlo a que
no use la plataforma."*

## 3. Archivos y qué cambia en cada uno

- `engines/openingBlockEngine.ts` — los textos, la función de sustitución del
  oficio, y el campo `arquetipos` en `AP-05`.
- `tests/openingBlock.test.ts` — los asertos que comparan texto de pregunta, más
  los tres casos nuevos de la sección 5.
- `tests/answerRouting.test.ts` — **enmienda del 2026-09-11**: entra a la lista.
  Ver sección 4.5.

**Los tests que comparan texto de pregunta SÍ se actualizan**, porque el texto es
justamente lo que esta entrega cambia. Los asertos de *comportamiento* (selección,
prerrequisitos, "no sé", precedencia) **no se tocan**: si uno falla, te detienes y
reportas.

Nada más fuera de esta lista. No se toca `questionEngine.ts`.

## 4. Decisiones ya tomadas

### 4.1 Los textos

`[oficio]` es la palabra de la disciplina, o `proyecto` si no hay disciplina.

| Código | Redacción | Con contexto |
|---|---|---|
| `AP-01` | `Cuéntame qué es, en una o dos frases.` | — |
| `AP-02` | `¿Para quién está pensado tu [oficio]?` | — |
| `AP-03` | `¿Qué te hizo querer hacer tu [oficio]?` | — |
| `AP-04` | `¿Qué viste que hacía falta?` | `¿Qué viste que les hacía falta a [RESPUESTA_AP02]?` |
| `AP-05` | `¿Tienes locación para tu [oficio]?` | — |
| `AP-06` | `¿Qué ya tienes hecho?` | — |
| `AP-07` | `¿Quién tiene que decir que sí?` | — |

`AP-01` **no** lleva oficio: es lo que la pregunta está averiguando.
`AP-07` **no** lleva oficio: *"¿para que tu taller pase?"* queda torcido, así que se
resuelve quitando el "esto" en lugar de reemplazarlo.
Las nueve opciones de `AP-07` no cambian.

### 4.2 Cómo se resuelve `[oficio]`

```ts
function palabraDelOficio(graph: ProjectGraph): string;
```

Lee `graph.knowledge?.projectType.primaryType`. Un `switch` **exhaustivo** sobre
todos los miembros de `ProjectType`, con `default: 'proyecto'`.

**Si `primaryType` está vacío, la palabra es `proyecto` y la pregunta funciona
igual.** Eso es deliberado: la función degrada a la palabra neutra y nunca bloquea.
Si en la práctica `primaryType` casi siempre viene vacío, el oficio no va a
aparecer — y **propagar la disciplina que extrae `projectSeedExtractor` hasta el
grafo es otra entrega**, no esta. No inventes esa propagación aquí.

La sustitución es un `replace` de un marcador en una cadena, igual que la
contextualización de `AP-04` que ya existe. No se genera lenguaje.

### 4.3 `AP-05` no se le pregunta a quien no tiene lugar

`AP-05` gana `arquetipos` y solo aplica donde hay un lugar: familia evento
(concierto, festival, exposición, activación, taller, residencia) más rodaje y
montaje. Un disco, un libro o un poemario no tienen locación y preguntárselo
confunde.

Si `primaryType` está vacío, **`AP-05` sí se hace** con la palabra `proyecto`: sin
saber la disciplina no se puede descartar, y es mejor preguntar de más que perder
el dato.

### 4.5 Enmienda del 2026-09-11 — `encontrarPreguntaPorTexto` y `tests/answerRouting.test.ts`

Durante la construcción apareció una dependencia oculta no declarada en la
sección 3 original: `tests/answerRouting.test.ts` compara el texto de AP-02 por
igualdad literal contra `BLOQUE_DE_APERTURA`, y con el marcador `[oficio]` sin
resolver en el array estático esa comparación deja de ser válida. Es la misma
clase de trampa que documenta `CLAUDE.md` sobre el título placeholder: un
fixture de test que depende implícitamente de un detalle no declarado.

Resolución, autorizada por el dueño del producto:

- **Requisito funcional (no opcional):** `encontrarPreguntaPorTexto` debe
  reconocer una pregunta cuyo marcador `[oficio]` ya fue sustituido por
  cualquier palabra, con el mismo mecanismo por el que ya reconoce hoy la
  versión contextualizada de `AP-04` (`plantillaConContexto` con
  `[RESPUESTA_AP02]`). No es opcional porque `getQuestionIntent` (que
  `resultadoDePreguntaHecha` en `core/projectController.ts` usa para decidir en
  qué módulo se guarda la respuesta) depende de esa función. Sin esto, la
  intención cae en `'other'`, no mapea a módulo, y las respuestas dejan de
  guardarse donde corresponde — en silencio, sin que ningún test actual lo
  detecte.
- Casos nuevos en `tests/openingBlock.test.ts` que prueban ese requisito:
  - `getQuestionIntent('¿Para quién está pensado tu taller?') === 'clarify_audience'`
  - `getQuestionIntent('¿Qué te hizo querer hacer tu taller?') === 'clarify_purpose'`
  - `getQuestionIntent('¿Tienes locación para tu concierto?') === 'clarify_location'`
- `tests/answerRouting.test.ts` — **un solo cambio**: la comparación de
  igualdad literal del texto de AP-02 (línea ~45-48) pasa a
  `encontrarPreguntaPorTexto(t1.response.nextQuestion ?? '')?.codigo === 'AP-02'`.
  Ningún otro aserto de ese archivo se toca.

### 4.4 No se agrega `AP-05b`

El documento v3 proponía una pregunta de seguimiento (`¿Dónde queda?`) condicionada
a que `AP-05` se respondiera afirmativamente. **Queda fuera.** Requiere un
`requiere` condicionado a un valor —algo que el modelo hoy no tiene— y dos
preguntas sobre locación en la apertura son más ceremonia de la que el dato merece.
El lugar preciso se pide en la rama de convocatoria, donde sí hace falta con
municipio y código.

## 5. Cómo se verifica

1. `npm run typecheck` — sin errores.
2. `npm test` — 10 suites en verde. **Pega la salida literal de la terminal**, no
   un resumen.
3. `grep -n "del otro lado\|viene a atender\|hacer esto\|parte ya existe" engines/`
   → **sin resultados.**
4. Casos nuevos en `tests/openingBlock.test.ts`:
   - **Sin disciplina** (`primaryType` vacío) → `AP-02` se devuelve como
     `¿Para quién está pensado tu proyecto?`
   - **Con disciplina** → `AP-02` contiene la palabra del oficio y **no** contiene
     la palabra `proyecto`.
   - **`AP-05` con obra sin lugar** → con una disciplina de la familia obra sin
     lugar, `seleccionarPreguntaDeApertura` **nunca** devuelve `AP-05`, y el bloque
     igual se agota correctamente (no se queda colgado esperándola).
5. Los asertos de comportamiento de los escenarios 1 al 12 siguen pasando sin
   modificarse. Declara explícitamente en el reporte cuáles asertos cambiaste y
   confirma que todos son de texto de pregunta, ninguno de comportamiento.

## 6. Qué no se toca

- `questionEngine.ts`, `getQuestionIntent` y las intenciones declaradas de cada
  pregunta. `AP-01` conserva `clarify_project_type`.
- La regla de selección: prerrequisitos, prioridades, "no sé", precedencia del
  nombre.
- `projectSeedExtractor` y la propagación de la disciplina al grafo.
- Cualquier otro archivo de test.
