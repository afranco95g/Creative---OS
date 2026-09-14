# El Culebreo — contexto operativo

Plataforma de ecosistema cultural (antes "Cultura Está"). Next.js 15 App Router + Supabase + TypeScript + Tailwind.

## Sistema de color

Tokens CSS en `app/globals.css`, conmutados por `[data-theme]` en `<html>` (ver `lib/theme.ts` para el script anti-flash).

| Token | Claro | Oscuro |
|---|---|---|
| `--superficie` | `#F2EEE8` | `#14110F` |
| `--superficie-elevada` | `#E8E3DA` | `#1E1A17` |
| `--texto-principal` | `#5C1A10` | `#FF8A1F` |
| `--texto-largo` | `#1A1512` | `#EDE9E1` |
| `--acento` | `#E2560A` | `#FF8A1F` |
| `--borde` | `#1A1512` | `#EDE9E1` |
| `--stencil-offset` | `#E2560A` | `#5C1A10` |

Tokens fijos en `tailwind.config.ts` (no cambian con el tema): `rojo-base #9A0E0E`, `rojo-profundo #4E0303`, `hueso #EDE9E1`, `naranja #FF8A1F`, `vinotinto #5C1A10`, `tinta #1A1512`.

`borderRadius` está forzado a `0` en **todas** las claves de la escala (`none` a `full`). Las clases `rounded-*` existentes no se tocan ni se quitan — ya no producen radio, así que son inertes por diseño. No agregar radio nuevo por fuera de esa escala.

## Convenciones de uso (obligatorias)

- CTA sólido → `bg-rojo-base` + `text-hueso`
- Borde de acento → `border-acento`
- Texto de énfasis → `text-texto-principal`
- Fondo de página → `bg-superficie` · tarjeta/elevado → `bg-superficie-elevada`
- Bordes → `border-borde` · texto secundario → `text-texto-largo`
- Caja de error rellena → `border-borde bg-rojo-base ... text-hueso`. **Nunca** `text-rojo-base` sobre `bg-rojo-base` — es un bug de contraste recurrente en este repo, revisarlo explícitamente en cada PR.
- Overlay de modal se queda en `bg-black/XX` (scrim). No es superficie temática, no se tokeniza.
- Nunca introducir un color crudo nuevo (`#...`, `text-white`, `bg-black` sin `/`, `lime-*`, `neutral-*`, `red-[0-9]*`) fuera de esta lista de tokens.

## Reglas de arquitectura

- **No hay ni habrá modelo de lenguaje externo en el producto.** Decisión tomada: sistema propio, reglas primero. Toda interpretación de texto va detrás de **una interfaz intercambiable**, para poder cambiar la implementación (reglas → clasificador propio → modelo) sin reescribir quien la consume.
- **Plata, puntajes y consistencia son siempre deterministas y auditables.** Nunca los decide un modelo. Es una restricción legal, no solo técnica.
- **Prohibido hardcodear ejemplos en código de producción.** Los ejemplos van en tests, nunca en strings que ve el usuario ni en un `if` que solo dispara para un caso concreto. Ya se limpiaron los casos conocidos (`turnInterpretationEngine.ts`, `questionEngine.ts`, `budgetSignalProcessor.ts`, `projectKnowledgeEngine.ts` — el `/zapato|calzado/` que forzaba `unit`/`project_type` según un solo ejemplo). La excepción legítima es `services/knowledge/KnowledgeQueryBuilder.ts` (`expansions`): es una tabla de expansión de palabra clave→categoría pensada para crecer con más entradas, no un caso hardcodeado — no confundir una todavía la una con la otra al auditar.
- **Fuente única de verdad de preguntas:** `questionEngine.STRATEGIC_QUESTIONS` es la única fuente — `engines/conversationStrategyEngine.ts` (el diccionario duplicado, desconectado, sin importadores) se borró. Si se necesita una estrategia de conversación en el futuro, debe leer de `STRATEGIC_QUESTIONS`, no crear un tercer diccionario.

## NO BORRAR NUNCA

Instrucción explícita del dueño del proyecto — se conservan a propósito aunque estén huérfanos o desconectados de la navegación:

- `components/ProjectPanel.tsx`
- `components/MobileNav.tsx`
- `components/DocumentsPanel.tsx`
- `components/ActorEnginePanel.tsx`
- `components/IppPanel.tsx`
- `components/LogPanel.tsx`
- `components/ChatPanel.tsx`
- `app/studio/projects/new/page.tsx`
- toda la carpeta `features/ecosystem/entities/` (prototipo viejo de CRUD genérico, desconectado de la navegación, conservado a propósito)

## Ciclo de trabajo por agentes

Ver `.claude/agents/constructor.md`, `.claude/agents/auditor.md`, `.claude/agents/revisor.md`. Topología: `spec → constructor → auditor → revisor arbitra → constructor corrige → auditor vuelve a verificar`, hasta que el auditor reporte limpio. Los hallazgos viajan siempre con archivo+línea+escenario concreto, nunca resumidos.

El orquestador es `/construir <ruta-a-la-spec>` (`.claude/commands/construir.md`).

### Dos caminos, elegidos por riesgo

El ciclo de tres agentes existe para **arbitrar desacuerdos**. Cuando no hay desacuerdo posible, es puro costo.

| Si el cambio toca... | Camino | Plantilla |
|---|---|---|
| Plata · puntajes que el usuario ve · datos personales · tipos nuevos o más de 4 archivos | **Completo**: constructor → auditor, y revisor **solo si hay desacuerdo** | `specs/_plantilla.md` |
| Nada de lo anterior | **Rápido**: un solo agente | `specs/_plantilla-corta.md` |

En caso de duda, completo. **El revisor no es un paso fijo: es el árbitro.**

**Tope: 2 vueltas.** Si a la segunda el auditor sigue reportando hallazgos REAL, el ciclo se detiene y lo que quede se escribe como spec nueva. Una tercera vuelta sobre el mismo contexto casi siempre produce un parche que compensa el error en vez de quitarlo — ya pasó una vez.

**La spec es proporcional al cambio.** Una spec de 300 líneas para un cambio de 40 hace que cada agente lea 300 líneas en cada vuelta.

### Reglas de verificación que no se negocian en ningún camino

- **La salida de `npm test` va literal al reporte, no resumida.** "10 suites OK" no es una verificación. Ya hubo un reporte que dijo "9 suites OK" con una suite en rojo, y se construyeron dos entregas encima de ese verde falso.
- **Un test no se reescribe para que pase.** Si un test fija un comportamiento que la spec decidió cambiar, se reescribe para verificar el nuevo — nunca se revierte código de producción para complacerlo.
- **Montaje sí, asertos no.** Se puede cambiar el *montaje* de un escenario para que represente un flujo real; **no** se puede debilitar, borrar ni retargetear un aserto existente. Si un aserto no pasa cambiando solo el montaje, se detiene y se reporta.
- **Los criterios de aceptación nombran ubicaciones, no cuentan coincidencias de texto.** "Esta función no llama a esta otra" es verificable; "este grep da 0 resultados" es frágil, porque una función puede usarse para dos cosas distintas y legítimas.

### Trampa conocida: el título placeholder

`createInitialProjectGraph()` devuelve un **título placeholder**, y hay lógica que decide qué pregunta sale primero según si el título es placeholder o real. Cualquier fixture de test construido con esa función depende implícitamente de eso. Tres archivos de test dependían de ello sin declararlo. Toda spec que cambie la precedencia de preguntas debe listar esos tests en su sección de archivos **desde el principio**.

**Ningún trabajo de código arranca sin una spec en `specs/`.** Si llega una instrucción sin spec, lo primero es escribir la spec y hacerla aprobar — no escribir código directamente. Una instrucción sin spec no es un atajo, es trabajo pendiente de especificar.

**Línea base verificada (2026-09-11):** `npm run typecheck` limpio y **10 suites** de `npm test` en verde: `Knowledge Query Builder`, `Kicks interpretation`, `Dobla y devora classification`, `Project Knowledge V2`, `Executive Engine V2.3`, `Executive Engine V2.4 Financial Authority`, `MUSCO runtime integration`, `Project seed extraction`, `Opening block`, `Answer routing`. Cualquier trabajo nuevo parte de ahí: si algo se rompe, lo rompimos nosotros.

**Cómo se actualiza esta línea base:** solo contra la salida literal de `npm test`, pegada en el reporte de la entrega que la movió. No contra el resumen de un agente.

**Advertencia sobre la suite de tests — cualquier agente que toque los motores debe heredar esto:** los tests `kicksInterpretation`, `doblaYDevoraClassification` y `muscoRuntimeIntegration` corresponden a tres proyectos reales específicos a los que se les cosieron los motores a mano. Pasan PORQUE el hardcodeo sigue ahí — por ejemplo `engines/turnInterpretationEngine.ts` tiene `if (/zapato|calzado/)` y una pregunta fija sobre "COP 80.000", y `kicksInterpretation.test.js` verifica justamente esa rama. Esa suite hoy protege lo que hay que desmontar. Cuando un trabajo generalice esos motores, esos tests DEBEN romperse y deben reescribirse para verificar el comportamiento general, con esos tres proyectos como ejemplos entre varios — no como el único caso. Romperlos en ese contexto es señal de progreso, no de regresión, siempre que la spec que autoriza el trabajo lo haya anticipado explícitamente en su sección "tests que van a romperse a propósito".

## Verificación

```powershell
npm run typecheck
npm test
```

CI en `.github/workflows/verificacion.yml` corre lo mismo en cada push/PR — no depender de que alguien lo corra a mano.
