# Plantilla corta — para cambios rápidos

## Antes de escribir la spec: ¿rápido o completo?

Solo hay dos caminos.

### COMPLETO — constructor + auditor

Cuando el cambio toca **cualquiera** de estas cuatro cosas:

- plata (montos, fórmulas, presupuesto, flujo de caja)
- puntajes o cualquier número que el usuario vea
- datos personales
- tipos nuevos, o más de 4 archivos

Usa `_plantilla.md`, la larga, con sus nueve secciones.

**El revisor solo entra si el constructor y el auditor no se ponen de acuerdo.** No es
un tercer paso fijo: es el árbitro, y si no hay pelea no hace falta.

### RÁPIDO — un solo agente

Todo lo demás. Usa esta plantilla.

---

## Dos reglas que valen para los dos caminos

**Tope de dos rondas.** Si a la segunda el auditor sigue encontrando algo, no se hace
una tercera: se escribe una spec nueva para lo que quedó. Una tercera ronda sobre el
mismo contexto casi siempre produce un parche que compensa el error en vez de
quitarlo — ya pasó una vez, con el bug del "no sé".

**La spec es proporcional al cambio.** Una spec de 300 líneas para un cambio de 40
hace que el agente lea 300 líneas en cada ronda. Si el cambio cabe en este camino, la
spec cabe en una página.

**Lo que no cambia nunca, en ninguno de los dos:** `npm run typecheck` y `npm test`
corren siempre, ningún test existente se reescribe para que pase, y todo cambio en
plata queda cubierto por un test que lo demuestre. Las garantías legales vienen de la
spec y de los tests, no de cuántos agentes leyeron el código.

---

# Spec corta: [nombre]

## 1. Qué se construye

Una o dos frases. Qué queda distinto cuando esto termine.

## 2. Por qué

Qué está roto o bloqueado hoy. Dos o tres frases, con la ruta y la línea si se saben.

## 3. Archivos y qué cambia en cada uno

- `ruta/archivo.ts` — qué cambia, en una línea.

Nada fuera de esta lista sin preguntar.

## 4. Decisiones ya tomadas

Lo que el agente NO decide: nombres, textos exactos, firmas, casos borde. Si algo no
está aquí y no es obvio del código, se detiene y pregunta.

## 5. Cómo se verifica

Comandos concretos y qué debe salir: un `grep` con su resultado esperado, un test
nuevo con su aserto, o una lectura de diff con una condición clara.

1. `npm run typecheck` — sin errores.
2. `npm test` — todo verde, **sin modificar ningún test existente**.
3. …

## 6. Qué no se toca

Explícito. Lo que parece relacionado y no entra.
