'use client';

import { FormEvent, useMemo, useState } from 'react';
import {
  ExecutiveMemoryItem,
  ExecutiveMemoryType,
} from '../types/executiveMemory';

interface ExecutiveMemoryPanelProps {
  projectId: string;
  memories: ExecutiveMemoryItem[];
  detectedCandidates: {
    type: ExecutiveMemoryType;
    summary: string;
    reason?: string;
    confidence?: number;
  }[];
  onCreateMemory: (
    type: ExecutiveMemoryType,
    summary: string,
    reason: string
  ) => void;
  onProposeDetectedCandidate: (
    candidate: {
      type: ExecutiveMemoryType;
      summary: string;
      reason?: string;
      confidence?: number;
    }
  ) => void;
  onProposeAllDetectedCandidates: () => void;
  onConfirmMemory: (memoryId: string) => void;
  onRejectMemory: (memoryId: string) => void;
  onArchiveMemory: (memoryId: string) => void;
}

const MEMORY_TYPES: {
  id: ExecutiveMemoryType;
  label: string;
}[] = [
  { id: 'decision', label: 'Decisión' },
  { id: 'hypothesis', label: 'Hipótesis' },
  { id: 'constraint', label: 'Restricción' },
  { id: 'criterion', label: 'Criterio' },
  { id: 'risk', label: 'Riesgo' },
  { id: 'opportunity', label: 'Oportunidad' },
  { id: 'commitment', label: 'Compromiso' },
  { id: 'contradiction', label: 'Contradicción' },
  { id: 'direction-change', label: 'Cambio de dirección' },
  { id: 'learning', label: 'Aprendizaje' },
  { id: 'priority', label: 'Prioridad' },
  { id: 'open-question', label: 'Pregunta abierta' },
];

export function ExecutiveMemoryPanel({
  projectId,
  memories,
  detectedCandidates,
  onCreateMemory,
  onProposeDetectedCandidate,
  onProposeAllDetectedCandidates,
  onConfirmMemory,
  onRejectMemory,
  onArchiveMemory,
}: ExecutiveMemoryPanelProps) {
  const [type, setType] =
    useState<ExecutiveMemoryType>('decision');

  const [summary, setSummary] = useState('');
  const [reason, setReason] = useState('');

  const projectMemories = useMemo(() => {
    return memories.filter(
      (memory) => memory.projectId === projectId
    );
  }, [memories, projectId]);

  const proposedMemories = projectMemories.filter(
    (memory) => memory.status === 'proposed'
  );

  const activeMemories = projectMemories.filter(
    (memory) =>
      memory.status === 'active' ||
      memory.status === 'confirmed'
  );

  function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const cleanSummary = summary.trim();

    if (!cleanSummary) return;

    onCreateMemory(
      type,
      cleanSummary,
      reason.trim()
    );

    setSummary('');
    setReason('');
    setType('decision');
  }

  return (
    <section className="rounded-3xl border border-borde bg-superficie-elevada p-7">
      <div className="flex flex-wrap items-start justify-between gap-6">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-texto-largo">
            Executive Memory
          </p>

          <h2 className="mt-3 text-2xl font-semibold text-texto-largo">
            Memoria ejecutiva
          </h2>

          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-texto-largo">
            Registra decisiones, hipótesis, criterios y aprendizajes que deben
            seguir influyendo en el proyecto.
          </p>
        </div>

        <div className="rounded-2xl border border-borde bg-superficie px-5 py-4">
          <p className="text-xs text-texto-largo">
            Recuerdos activos
          </p>

          <p className="mt-1 text-2xl font-semibold text-texto-principal">
            {activeMemories.length}
          </p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="mt-8 space-y-5 rounded-2xl border border-borde bg-superficie-elevada p-6"
      >
        <div className="grid gap-5 md:grid-cols-[220px_1fr]">
          <label className="block">
            <span className="mb-2 block text-xs uppercase tracking-[0.18em] text-texto-largo">
              Tipo de recuerdo
            </span>

            <select
              value={type}
              onChange={(event) =>
                setType(
                  event.target.value as ExecutiveMemoryType
                )
              }
              className="w-full rounded-2xl border border-borde bg-superficie px-5 py-4 text-sm text-texto-largo outline-none transition focus:border-acento"
            >
              {MEMORY_TYPES.map((item) => (
                <option
                  key={item.id}
                  value={item.id}
                >
                  {item.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block text-xs uppercase tracking-[0.18em] text-texto-largo">
              Qué debe recordar Creative OS
            </span>

            <input
              value={summary}
              onChange={(event) =>
                setSummary(event.target.value)
              }
              placeholder="Ejemplo: validar la marca mediante activaciones antes de abrir un local."
              className="w-full rounded-2xl border border-borde bg-superficie px-5 py-4 text-sm text-texto-largo outline-none transition placeholder:text-texto-largo focus:border-acento"
            />
          </label>
        </div>

        <label className="block">
          <span className="mb-2 block text-xs uppercase tracking-[0.18em] text-texto-largo">
            Por qué importa
          </span>

          <textarea
            value={reason}
            onChange={(event) =>
              setReason(event.target.value)
            }
            placeholder="Explica por qué este recuerdo debería influir en futuras decisiones."
            className="min-h-[100px] w-full resize-none rounded-2xl border border-borde bg-superficie px-5 py-4 text-sm leading-relaxed text-texto-largo outline-none transition placeholder:text-texto-largo focus:border-acento"
          />
        </label>

        <button
          type="submit"
          disabled={!summary.trim()}
          className="rounded-full bg-rojo-base px-5 py-2.5 text-sm font-bold text-hueso transition hover:shadow-stencil disabled:cursor-not-allowed disabled:opacity-40"
        >
          Proponer recuerdo
        </button>
      </form>
      <div className="mt-8 rounded-2xl border border-borde bg-superficie-elevada p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-texto-largo">
              Detección automática
            </p>

            <h3 className="mt-2 text-lg font-semibold text-texto-largo">
              Recuerdos candidatos
            </h3>

            <p className="mt-2 text-sm leading-relaxed text-texto-largo">
              Creative OS encontró posibles decisiones, hipótesis, riesgos o
              prioridades dentro de la conversación. Revísalas antes de
              incorporarlas a la memoria ejecutiva.
            </p>
          </div>

          {detectedCandidates.length > 0 && (
            <button
              type="button"
              onClick={onProposeAllDetectedCandidates}
              className="rounded-full border border-acento px-4 py-2 text-xs font-bold text-texto-principal transition hover:bg-rojo-base hover:text-hueso"
            >
              Proponer todos
            </button>
          )}
        </div>

        <div className="mt-5 space-y-4">
          {detectedCandidates.length === 0 && (
            <div className="rounded-2xl border border-dashed border-borde p-5">
              <p className="text-sm text-texto-largo">
                No se detectaron nuevos recuerdos candidatos.
              </p>
            </div>
          )}

          {detectedCandidates.map((candidate, index) => (
            <article
              key={`${candidate.type}-${candidate.summary}-${index}`}
              className="rounded-2xl border border-borde bg-superficie p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.16em] text-texto-principal">
                    {getMemoryTypeLabel(candidate.type)}
                  </p>

                  <p className="mt-3 text-sm font-medium leading-relaxed text-texto-largo">
                    {candidate.summary}
                  </p>

                  {candidate.reason && (
                    <p className="mt-3 text-sm leading-relaxed text-texto-largo">
                      {candidate.reason}
                    </p>
                  )}

                  {candidate.confidence !== undefined && (
                    <p className="mt-4 text-xs text-texto-largo">
                      Confianza estimada:{' '}
                      {Math.round(candidate.confidence * 100)}%
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() =>
                    onProposeDetectedCandidate(candidate)
                  }
                  className="rounded-full bg-rojo-base px-4 py-2 text-xs font-bold text-hueso transition hover:shadow-stencil"
                >
                  Proponer
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>
    
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <MemoryColumn
          title="Pendientes de validación"
          emptyMessage="No hay recuerdos pendientes."
          memories={proposedMemories}
          onConfirmMemory={onConfirmMemory}
          onRejectMemory={onRejectMemory}
          onArchiveMemory={onArchiveMemory}
        />

        <MemoryColumn
          title="Memoria activa"
          emptyMessage="Todavía no hay recuerdos confirmados."
          memories={activeMemories}
          onConfirmMemory={onConfirmMemory}
          onRejectMemory={onRejectMemory}
          onArchiveMemory={onArchiveMemory}
        />
      </div>
    </section>
  );
}

interface MemoryColumnProps {
  title: string;
  emptyMessage: string;
  memories: ExecutiveMemoryItem[];
  onConfirmMemory: (memoryId: string) => void;
  onRejectMemory: (memoryId: string) => void;
  onArchiveMemory: (memoryId: string) => void;
}

function MemoryColumn({
  title,
  emptyMessage,
  memories,
  onConfirmMemory,
  onRejectMemory,
  onArchiveMemory,
}: MemoryColumnProps) {
  return (
    <div>
      <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-texto-largo">
        {title}
      </h3>

      <div className="mt-4 space-y-4">
        {memories.length === 0 && (
          <div className="rounded-2xl border border-dashed border-borde p-5">
            <p className="text-sm text-texto-largo">
              {emptyMessage}
            </p>
          </div>
        )}

        {memories.map((memory) => (
          <MemoryCard
            key={memory.id}
            memory={memory}
            onConfirmMemory={onConfirmMemory}
            onRejectMemory={onRejectMemory}
            onArchiveMemory={onArchiveMemory}
          />
        ))}
      </div>
    </div>
  );
}

interface MemoryCardProps {
  memory: ExecutiveMemoryItem;
  onConfirmMemory: (memoryId: string) => void;
  onRejectMemory: (memoryId: string) => void;
  onArchiveMemory: (memoryId: string) => void;
}

function MemoryCard({
  memory,
  onConfirmMemory,
  onRejectMemory,
  onArchiveMemory,
}: MemoryCardProps) {
  const isProposed =
    memory.status === 'proposed';

  return (
    <article className="rounded-2xl border border-borde bg-superficie p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-texto-principal">
            {getMemoryTypeLabel(memory.type)}
          </p>

          <p className="mt-3 text-sm font-medium leading-relaxed text-texto-largo">
            {memory.summary}
          </p>
        </div>

        <span className="rounded-full border border-borde px-3 py-1 text-xs text-texto-largo">
          {getStatusLabel(memory.status)}
        </span>
      </div>

      {memory.reason && (
        <p className="mt-4 text-sm leading-relaxed text-texto-largo">
          {memory.reason}
        </p>
      )}

      <p className="mt-4 text-xs text-texto-largo">
        Confianza: {Math.round(memory.confidence * 100)}%
      </p>

      <div className="mt-5 flex flex-wrap gap-2">
        {isProposed && (
          <>
            <button
              type="button"
              onClick={() =>
                onConfirmMemory(memory.id)
              }
              className="rounded-full bg-rojo-base px-4 py-2 text-xs font-bold text-hueso transition hover:shadow-stencil"
            >
              Confirmar
            </button>

            <button
              type="button"
              onClick={() =>
                onRejectMemory(memory.id)
              }
              className="rounded-full border border-borde px-4 py-2 text-xs font-semibold text-texto-largo transition hover:border-acento"
            >
              Rechazar
            </button>
          </>
        )}

        {!isProposed && (
          <button
            type="button"
            onClick={() =>
              onArchiveMemory(memory.id)
            }
            className="rounded-full border border-borde px-4 py-2 text-xs font-semibold text-texto-largo transition hover:border-acento hover:text-texto-largo"
          >
            Archivar
          </button>
        )}
      </div>
    </article>
  );
}

function getMemoryTypeLabel(
  type: ExecutiveMemoryType
): string {
  return (
    MEMORY_TYPES.find(
      (item) => item.id === type
    )?.label || type
  );
}

function getStatusLabel(status: string): string {
  if (status === 'proposed') {
    return 'Propuesto';
  }

  if (
    status === 'active' ||
    status === 'confirmed'
  ) {
    return 'Activo';
  }

  if (status === 'contradicted') {
    return 'Contradicho';
  }

  if (status === 'superseded') {
    return 'Reemplazado';
  }

  if (status === 'archived') {
    return 'Archivado';
  }

  if (status === 'rejected') {
    return 'Rechazado';
  }

  return status;
}