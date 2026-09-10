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
- **Prohibido hardcodear ejemplos en código de producción.** Es el pecado original de este repo: `engines/turnInterpretationEngine.ts` tiene `if (/zapato|calzado/)` y una pregunta fija sobre "COP 80.000"; `engines/questionEngine.ts` tiene una pregunta que afirma "Ya definimos que se busca reducir plástico de un solo uso". Los ejemplos van en tests, nunca en strings que ve el usuario. Pendiente de limpiar donde se toque ese código.
- **Fuente única de verdad:** hoy existen dos diccionarios de preguntas duplicados con redacción distinta — `questionEngine.STRATEGIC_QUESTIONS` y `conversationStrategyEngine.QUESTIONS`. Cualquier trabajo sobre preguntas debe unificarlos, no agregar un tercero.

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

## Verificación

```powershell
npm run typecheck
npm test
```

CI en `.github/workflows/verificacion.yml` corre lo mismo en cada push/PR — no depender de que alguien lo corra a mano.
