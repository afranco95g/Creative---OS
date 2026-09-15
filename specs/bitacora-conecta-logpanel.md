# Spec corta: LogPanel reemplaza LivingLog bajo la key 'log'

## 1. Qué se construye

`components/LogPanel.tsx` se reescribe completo (toma `graph` como prop,
tokens de El Culebreo, combina eventos y decisiones) y reemplaza a la
función inline `LivingLog` bajo la key `'log'` del Sidebar en
`app/studio/projects/[projectId]/page.tsx`. Misma pestaña, mismo label,
cambia solo qué renderiza adentro.

## 2. Por qué

Instrucción directa del usuario, sobre un malentendido a corregir primero:
el usuario pidió esta conexión asumiendo que `LogPanel.tsx` "ya se
retokenizó en el sprint anterior" — verificado que es falso. El archivo en
disco hoy (`components/LogPanel.tsx:1-29`) es la versión original sin
props, importa `logEntries` de `lib/data.ts` (datos de ejemplo
hardcodeados, un proyecto ficticio "Charlie Gelato" — el tipo de caso que
CLAUDE.md prohíbe en código de producción) y sigue en el tema
acid/`text-white` anterior a El Culebreo. Pasar `graph={graph}` al
componente actual sería un error de typecheck inmediato: no acepta props.
Esta spec ejecuta la retokenización que se aprobó en principio en el turno
anterior (decisión: "Adaptar a tokens de El Culebreo") y que quedó
pendiente, y de una vez resuelve la conexión de navegación pedida ahora.

## 3. Archivos y qué cambia en cada uno

- `components/LogPanel.tsx` — se reemplaza el archivo completo (ver
  sección 4 para el código exacto). Deja de importar `lib/data`; ya no
  existe ninguna referencia a `logEntries` en el archivo.
- `app/studio/projects/[projectId]/page.tsx` — se agrega
  `import { LogPanel } from '@/components/LogPanel';`; el bloque
  `{activeView === 'log' && (<LivingLog graph={graph} />)}` (línea ~302-307)
  pasa a renderizar `<LogPanel graph={graph} />` en su lugar; la función
  `LivingLog` (líneas 687-770) se borra por completo — queda sin ningún
  otro uso en el archivo tras el cambio, y no está en la lista "NO BORRAR
  NUNCA" de CLAUDE.md (esa lista protege `components/LogPanel.tsx`, no
  esta función inline).

## 4. Decisiones ya tomadas

Reemplazo íntegro de `components/LogPanel.tsx`. Mantiene exactamente la
lógica ya aprobada dos turnos atrás (merge de `eventLog` + `decisions`,
orden descendente por `createdAt`, badge "Evento"/"Decisión", botón
"+ Nueva entrada" deshabilitado, estado vacío sin datos de ejemplo) y solo
cambia tres cosas respecto al bloque literal que se dio entonces, cada una
justificada porque el contexto cambió de "pantalla standalone" a
"contenido embebido dentro de `<main>` bajo `<div className=\"px-8
py-10\">`" (ver `app/studio/projects/[projectId]/page.tsx:263`):

1. **Contenedor**: `min-h-screen px-5 py-8 md:px-10` → `mx-auto max-w-5xl
   space-y-10`. El original asumía página completa; embebido dentro del
   `<div className="px-8 py-10">` que ya envuelve las 5 vistas del
   Sidebar, `min-h-screen` produciría un contenedor de altura completa
   anidado dentro de otro con padding — mismo contenedor que ya usa
   `LivingLog` hoy en el mismo slot.
2. **Encabezado**: se agrega el eyebrow `text-sm uppercase
   tracking-[0.25em] text-texto-principal` ("Bitácora Viva") y el título
   pasa a `text-4xl font-semibold tracking-tight md:text-5xl` — mismo
   patrón que usan `LivingLog`/`ExecutiveReview` para las demás vistas de
   este Sidebar (eyebrow + h1/h2 `font-semibold`, nunca `font-black`),
   para que las 5 pestañas se vean como un mismo sistema.
3. **Botón deshabilitado**: `acid-button` (definido en
   `app/globals.css:120-127`, fondo `#D7FF00`) no tiene equivalente en
   tokens ni tratamiento de `disabled` propio → `bg-rojo-base text-hueso`
   (mismo par que usan todos los botones primarios de la app) más
   `opacity-40 cursor-not-allowed` para que se vea inhabilitado incluso
   con el atributo `disabled` puesto.

Todo lo demás (colores de cuerpo/borde, estructura de timeline con línea
vertical y puntos, formato de fecha `es-CO`) se mapea 1:1 de clase acid a
token equivalente, sin cambiar layout. Código completo:

```tsx
'use client';

import { ProjectGraph } from '../types/project';

interface LogPanelProps {
  graph: ProjectGraph;
}

interface BitacoraEntry {
  id: string;
  kind: 'event' | 'decision';
  title: string;
  body: string;
  createdAt: string;
}

function buildBitacoraEntries(graph: ProjectGraph): BitacoraEntry[] {
  const eventos: BitacoraEntry[] = graph.eventLog.map((evento) => ({
    id: evento.id,
    kind: 'event',
    title: evento.title,
    body: evento.description,
    createdAt: evento.createdAt,
  }));

  const decisiones: BitacoraEntry[] = graph.decisions.map((decision) => ({
    id: decision.id,
    kind: 'decision',
    title: decision.title,
    body: decision.decision,
    createdAt: decision.createdAt,
  }));

  return [...eventos, ...decisiones].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

function formatearFecha(fechaIso: string): string {
  return new Date(fechaIso).toLocaleString('es-CO', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function LogPanel({ graph }: LogPanelProps) {
  const entradas = buildBitacoraEntries(graph);

  return (
    <section className="mx-auto max-w-5xl space-y-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.25em] text-texto-principal">Bitácora Viva</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight md:text-5xl">Historia del proyecto</h1>
          <p className="mt-4 max-w-3xl text-texto-largo">Registro vivo de decisiones, ideas y avances.</p>
        </div>
        <button className="shrink-0 rounded-full bg-rojo-base px-4 py-3 text-xs font-bold uppercase text-hueso opacity-40 cursor-not-allowed" disabled>
          + Nueva entrada
        </button>
      </div>

      {entradas.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-borde bg-superficie-elevada p-10">
          <h3 className="text-2xl font-semibold">Todavía no hay movimientos</h3>
          <p className="mt-3 max-w-2xl text-texto-largo">
            Todavía no hay eventos ni decisiones registradas para este proyecto.
          </p>
        </div>
      ) : (
        <div className="relative max-w-4xl space-y-5 pl-9 before:absolute before:bottom-0 before:left-3 before:top-0 before:w-px before:bg-acento/40">
          {entradas.map((entrada) => (
            <article
              key={entrada.id}
              className="relative rounded-3xl border border-borde bg-superficie-elevada p-6 before:absolute before:-left-[31px] before:top-7 before:h-4 before:w-4 before:rounded-full before:bg-rojo-base"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <h3 className="text-xl font-semibold">{entrada.title}</h3>
                <time className="text-xs text-texto-largo">{formatearFecha(entrada.createdAt)}</time>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-texto-largo">{entrada.body}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded-full border border-borde/20 bg-superficie px-3 py-1 text-[10px] font-semibold uppercase text-texto-principal">
                  {entrada.kind === 'event' ? 'Evento' : 'Decisión'}
                </span>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
```

En `page.tsx`: el `NAV_ITEMS`/`Sidebar.tsx` **no cambia** — mismo label
"Bitácora Viva", misma key `'log'`. Solo el bloque de render bajo
`activeView === 'log'` cambia de `<LivingLog graph={graph} />` a
`<LogPanel graph={graph} />`, y la función `LivingLog` se borra completa
(era la única consumidora de esa forma de armar el timeline; su lógica
queda reemplazada por `buildBitacoraEntries`).

## 5. Cómo se verifica

1. `npm run typecheck` — sin errores.
2. `npm test` — todo verde, sin modificar ningún test existente.
3. `grep -n "logEntries" components/LogPanel.tsx` — sin resultados.
4. `grep -n "function LivingLog" app/studio/projects/\[projectId\]/page.tsx` — sin resultados (función borrada).
5. `grep -n "LivingLog" app/studio/projects/\[projectId\]/page.tsx` — sin resultados (ni definición ni uso).
6. Lectura del diff de `page.tsx`: `NAV_ITEMS` en `components/Sidebar.tsx` no cambia (ni se toca ese archivo); el único cambio de render es la línea de `activeView === 'log'`.

## 6. Qué no se toca

- `components/DocumentsPanel.tsx` — sin conectar, tal como está.
- `components/ProjectToolsPanel.tsx` — sin cambios.
- `components/Sidebar.tsx` — sin cambios (mismo label, misma key, mismas 5 entradas de `NAV_ITEMS`).
- `lib/data.ts` — `logEntries` deja de importarse desde `LogPanel.tsx`, pero el export en sí no se borra (podría tener otros consumidores; no es parte de esta tarea verificarlo).
- Cualquier otro archivo del repo.
