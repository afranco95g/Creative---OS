---
description: Ejecuta el ciclo completo constructor → auditor → revisor sobre una spec de specs/, hasta reporte limpio o 3 vueltas.
argument-hint: <ruta-a-la-spec>
---

# /construir

Orquesta el ciclo de trabajo por agentes de El Culebreo sobre la spec en
`$ARGUMENTS`, sin que el usuario tenga que invocar a cada agente a mano.

Topología (definida en `CLAUDE.md` y en cada agente):

```
spec → constructor → auditor → revisor arbitra → constructor corrige → auditor vuelve a verificar
```

Máximo 3 vueltas de auditor→revisor→constructor. Si a la tercera vuelta el
auditor sigue reportando hallazgos REAL, el ciclo se DETIENE — no se intenta
una cuarta vez, no se baja el estándar, no se marca como terminado. Se reporta
al usuario qué quedó sin resolver.

## Paso 1 — Leer y validar la spec

Lee el archivo en `$ARGUMENTS`. Verifica que estén TODAS las secciones
obligatorias de `specs/_plantilla.md`:

1. Objetivo
2. Por qué ahora
3. Archivos que se crean o se modifican
4. Fuera de alcance
5. Decisiones ya tomadas
6. Interfaces y contratos que hay que respetar
7. Tests que van a romperse a propósito
8. Criterio de aceptación verificable
9. Qué queda determinista y por qué

Para cada sección, verifica que tenga contenido real, no un placeholder vacío
ni una frase genérica que no decide nada (p. ej. "que funcione bien" en la
sección 8 no cuenta como criterio verificable; una sección 4 o 7 vacía sin la
palabra explícita "ninguno" no cuenta como completa).

**Si falta una sección, está vacía, o una decisión relevante no aparece en la
sección 5 y no es obvia del código existente: DETENTE aquí.** No invoques al
constructor. Pregúntale al usuario específicamente qué falta — cita la sección
y qué tipo de decisión hace falta. Inventar la decisión por tu cuenta para
poder seguir es exactamente el error que este comando existe para prevenir.

Si la spec pasa la validación, continúa.

## Paso 2 — Invocar al constructor

Invoca el agente `constructor` (subagent_type: constructor) pasándole la ruta
completa de la spec y su contenido íntegro. Pídele que implemente exactamente
lo que la spec define y que corra `npm run typecheck` antes de reportar
terminado.

Espera su reporte completo (qué archivos tocó, por qué, salida de typecheck).

## Paso 3 — Invocar al auditor

Invoca el agente `auditor` (subagent_type: auditor) sobre el trabajo recién
entregado. Dale la ruta de la spec para que pueda verificar el criterio de
aceptación de la sección 8, y pídele explícitamente:

- Salida completa de `npm run typecheck` y `npm test`.
- Si algún test falló, que compare contra la sección 7 de la spec ("tests que
  van a romperse a propósito") antes de reportarlo como regresión. Un test que
  la spec anticipó que se rompería NO es un hallazgo de regresión.
- Lista de hallazgos con archivo+línea+escenario concreto, ordenada por
  severidad, o "reporte limpio" explícito si no hay nada.

## Paso 4 — Invocar al revisor para arbitrar

Si el auditor no reportó "reporte limpio", invoca el agente `revisor`
(subagent_type: revisor) con la lista completa de hallazgos del auditor, sin
resumir. Pídele veredicto REAL / NO ES REAL / FUERA DE ALCANCE para cada uno,
con argumento.

Si el auditor reportó limpio, salta al Paso 6 (fin del ciclo).

## Paso 5 — Devolver al constructor y repetir

Toma únicamente los hallazgos con veredicto **REAL** del revisor, en su
formato archivo+línea+escenario intacto — no los resumas, no los reformules a
un nivel más abstracto.

**Guardarraíl obligatorio — léelo antes de escribir la instrucción al
constructor:**

> Si un hallazgo REAL apunta a un test que la spec listó en su sección 7
> ("tests que van a romperse a propósito"), la corrección correcta es
> reescribir ese test para que verifique el comportamiento nuevo que la spec
> pide — **nunca** revertir el código de producción para que el test viejo
> vuelva a pasar. Revertir código para complacer un test que fija un
> comportamiento que la spec decidió cambiar es la peor salida posible del
> ciclo, y es una tentación real bajo presión de "dejarlo en verde". Si tienes
> dudas sobre si un hallazgo cae en este caso, revisa la sección 7 de la spec
> antes de decidir, no asumas.

Invoca de nuevo al agente `constructor` con esa lista arbitrada y el
guardarraíl de arriba. Cuando termine, vuelve al Paso 3.

Esto cuenta como una vuelta. Lleva la cuenta: máximo 3 vueltas de
auditor→revisor→constructor. Si tras la tercera vuelta el auditor sigue
reportando hallazgos REAL sin resolver, DETENTE — no hagas una cuarta vuelta.
Repórtalo como bloqueado en el Paso 6.

## Paso 6 — Reporte final al usuario

Sin importar si el ciclo cerró limpio o se detuvo por el límite de vueltas,
entrega:

- Qué se construyó (archivos tocados, resumen de la spec).
- Qué encontró el auditor en cada pasada (o "reporte limpio").
- Qué arbitró el revisor en cada pasada (REAL / NO ES REAL / FUERA DE ALCANCE,
  con el argumento de cada uno).
- Cuántas vueltas tomó el ciclo.
- La salida completa de `npm run typecheck` y `npm test` de la última pasada
  del auditor.
- Si el ciclo se detuvo sin cerrar limpio: qué hallazgos REAL quedaron sin
  resolver, archivo+línea+escenario, para que el usuario decida cómo seguir.
