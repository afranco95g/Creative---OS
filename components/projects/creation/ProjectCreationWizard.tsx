'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { workspaceStore } from '@/core/workspaceStore';
import { syncLocalProjectsToCloud } from '@/services/projects/projectCloudService';
import { createBookingRequest } from '@/services/spaces/spaceBookingService';
import type { WorkspaceProject } from '@/types/workspace';

import { Step1NatureSelector } from './Step1NatureSelector';
import { Step2SpaceFinder } from './Step2SpaceFinder';
import {
  INITIAL_WIZARD_STATE,
  NATURE_LABELS,
  NATURE_OPTIONS,
  NATURE_TO_DEFAULT_CATEGORY,
} from './steps';
import type { ProjectWizardState, WizardSelectedBooking } from './steps';

interface ProjectCreationWizardProps {
  contextId: WorkspaceProject['contextId'];
}

/**
 * Contenedor del wizard híbrido (Pantallas 1-2). Su única
 * responsabilidad: recoger nature + salón/reserva opcional, crear el
 * proyecto real en Supabase (no solo local) y, si aplica, la
 * solicitud de reserva ya vinculada por project_id — y de ahí
 * entregar el control a /studio/projects/[id], donde toma el mando
 * ProducerChat (el motor conversacional real). No reimplementa nada
 * de ese motor. Ver specs/wizard-creacion-proyectos-hibrido.md.
 */
export function ProjectCreationWizard({
  contextId,
}: ProjectCreationWizardProps) {
  const router = useRouter();

  const [state, setState] = useState<ProjectWizardState>(INITIAL_WIZARD_STATE);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  function handleSelectNature(nature: ProjectWizardState['nature']) {
    if (!nature) return;
    const option = NATURE_OPTIONS.find((item) => item.id === nature);

    setState((current) => ({
      ...current,
      nature,
      step: option?.needsSpace ? 2 : 3,
    }));
  }

  function handleConfirmBooking(booking: WizardSelectedBooking) {
    setState((current) => ({
      ...current,
      selectedBooking: booking,
      spaceSkipped: false,
      step: 3,
    }));
  }

  function handleSkipSpace() {
    setState((current) => ({
      ...current,
      selectedBooking: null,
      spaceSkipped: true,
      step: 3,
    }));
  }

  async function handleCreateProject() {
    if (!state.nature) return;

    const cleanTitle = title.trim() || `Nuevo ${NATURE_LABELS[state.nature]} — sin título`;
    setCreating(true);
    setCreateError('');

    try {
      const category = NATURE_TO_DEFAULT_CATEGORY[state.nature];

      const project = workspaceStore.createProject(
        cleanTitle,
        description.trim(),
        category,
        contextId,
        state.nature
      );

      if (!project.actorId || !project.actorType) {
        throw new Error('Selecciona una identidad antes de crear un proyecto.');
      }

      // Se sube de inmediato (no se espera al ciclo del
      // persistenceCoordinator) para que la fila exista en Supabase
      // antes de crear la solicitud de reserva — evita que la
      // referencia project_id apunte a un proyecto que todavía no
      // aterrizó en la base de datos.
      await syncLocalProjectsToCloud([project], project.actorId, project.actorType);

      if (state.selectedBooking) {
        await createBookingRequest({
          roomId: state.selectedBooking.roomId,
          projectId: project.id,
          eventType: state.selectedBooking.eventType,
          startsAt: state.selectedBooking.startsAt,
          endsAt: state.selectedBooking.endsAt,
          specialRequests: state.selectedBooking.specialRequests || undefined,
          extraStaffRequested: false,
        });
      }

      router.push(`/studio/projects/${project.id}`);
    } catch (error) {
      setCreateError(
        error instanceof Error
          ? error.message
          : 'No fue posible crear el proyecto. Intenta de nuevo.'
      );
      setCreating(false);
    }
  }

  if (state.step === 1) {
    return (
      <Step1NatureSelector
        selected={state.nature}
        onSelect={handleSelectNature}
      />
    );
  }

  if (state.step === 2) {
    return (
      <Step2SpaceFinder
        selectedBooking={state.selectedBooking}
        onConfirmBooking={handleConfirmBooking}
        onSkip={handleSkipSpace}
        onBack={() => setState((current) => ({ ...current, step: 1 }))}
      />
    );
  }

  const natureOption = state.nature
    ? NATURE_OPTIONS.find((option) => option.id === state.nature)
    : null;

  return (
    <section className="max-w-3xl">
      <button
        type="button"
        onClick={() =>
          setState((current) => ({
            ...current,
            step: natureOption?.needsSpace ? 2 : 1,
          }))
        }
        className="text-sm text-neutral-500 transition hover:text-white"
      >
        ← Volver
      </button>

      <p className="mt-8 text-sm font-semibold uppercase tracking-[0.2em] text-neutral-500">
        Último paso
      </p>

      <h2 className="mt-4 text-4xl font-black tracking-[-0.04em] sm:text-5xl">
        Dale nombre a tu {natureOption?.label.toLowerCase()}
      </h2>

      <p className="mt-5 max-w-2xl text-lg leading-8 text-neutral-400">
        De aquí en adelante construyes en conversación — visión,
        narrativa, presupuesto, equipo. Esto solo arranca el proyecto.
      </p>

      {state.selectedBooking && (
        <p className="mt-4 text-sm text-neutral-400">
          Con solicitud de reserva para{' '}
          <strong className="text-white">
            {state.selectedBooking.roomName} — {state.selectedBooking.spaceName}
          </strong>
          .
        </p>
      )}

      <div className="mt-10 grid gap-6 rounded-3xl border border-white/10 bg-white/[0.035] p-7 sm:p-9">
        <label className="grid gap-2">
          <span className="text-sm font-semibold text-neutral-300">
            Nombre del proyecto
          </span>
          <input
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder={`Nuevo ${natureOption?.label ?? 'proyecto'} — sin título`}
            autoFocus
            className="rounded-2xl border border-neutral-700 bg-neutral-950 px-4 py-3.5 text-white outline-none transition placeholder:text-neutral-600 focus:border-white"
          />
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-semibold text-neutral-300">
            Descripción inicial (opcional)
          </span>
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Puedes dejarlo en blanco y resolverlo en la conversación."
            rows={4}
            className="resize-none rounded-2xl border border-neutral-700 bg-neutral-950 px-4 py-3.5 text-white outline-none transition placeholder:text-neutral-600 focus:border-white"
          />
        </label>

        {createError && (
          <p className="text-sm text-red-400">{createError}</p>
        )}

        <div className="flex items-center justify-end">
          <button
            type="button"
            disabled={creating}
            onClick={() => void handleCreateProject()}
            className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-black transition hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {creating ? 'Creando…' : 'Crear proyecto'}
          </button>
        </div>
      </div>
    </section>
  );
}
