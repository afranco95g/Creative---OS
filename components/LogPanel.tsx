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
