'use client';

import {
  useCallback,
  useEffect,
  useState,
  useSyncExternalStore,
} from 'react';

import {
  workspaceStore,
} from '../core/workspaceStore';

import {
  cloudProjectToWorkspaceProject,
  loadMyCloudProjects,
  submitProjectToMedia,
  syncLocalProjectsToCloud,
} from '../services/projects/projectCloudService';

import {
  ProjectApplicationDialog,
} from './projects/ProjectApplicationDialog';

import type {
  CloudProjectSummary,
  ProjectWorkflowStatus,
} from '../services/projects/projectCloudService';

import type {
  WorkspaceState,
} from '../types/workspace';

const workflowLabels:
  Record<
    ProjectWorkflowStatus,
    string
  > = {
    private:
      'Privado',

    eligibility_requested:
      'Revisión solicitada',

    eligibility_rejected:
      'Elegibilidad rechazada',

    eligible:
      'Elegible',

    submitted_to_media:
      'Postulado al medio',

    editorial_review:
      'Revisión editorial',

    publication_rejected:
      'Publicación rechazada',

    published:
      'Publicado',

    archived:
      'Archivado',
  };

const workflowDescriptions:
  Record<
    ProjectWorkflowStatus,
    string
  > = {
    private:
      'El proyecto solo está disponible para su propietario y su equipo.',

    eligibility_requested:
      'La aplicación fue enviada y está pendiente de revisión por la administración del ecosistema.',

    eligibility_rejected:
      'La aplicación necesita ajustes antes de volver a enviarse al ecosistema.',

    eligible:
      'El proyecto fue aceptado por el ecosistema. Su propietario puede decidir si lo postula al medio.',

    submitted_to_media:
      'El proyecto fue enviado voluntariamente al equipo editorial.',

    editorial_review:
      'El equipo del medio está revisando si el proyecto debe publicarse.',

    publication_rejected:
      'El medio solicitó ajustes antes de una nueva postulación.',

    published:
      'El proyecto fue aprobado y está habilitado para aparecer en Cultura Esta.',

    archived:
      'El proyecto está archivado.',
  };

export function ProjectCloudPanel() {
  const workspaceState =
    useSyncExternalStore<
      WorkspaceState | null
    >(
      (listener) =>
        workspaceStore.subscribe(
          () => listener()
        ),

      () =>
        workspaceStore.getSnapshot(),

      () => null
    );

  const [
    cloudProjects,
    setCloudProjects,
  ] = useState<
    CloudProjectSummary[]
  >([]);

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  const [
    isSyncing,
    setIsSyncing,
  ] = useState(false);

  const [
    activeActionId,
    setActiveActionId,
  ] = useState<
    string | null
  >(null);

  const [
    applicationProject,
    setApplicationProject,
  ] = useState<
    CloudProjectSummary | null
  >(null);

  const [
    successMessage,
    setSuccessMessage,
  ] = useState('');

  const [
    errorMessage,
    setErrorMessage,
  ] = useState('');

  const localProjects =
    workspaceState?.projects.filter(
      (project) =>
        project.actorId === workspaceState.activeActorId
    ) ?? [];

  const activeActor =
    workspaceState?.actors.find(
      (actor) => actor.id === workspaceState.activeActorId
    ) ?? null;

  const refreshProjects = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage('');

    try {
      const projects =
        await loadMyCloudProjects(
          activeActor?.id,
          activeActor?.type
        );

      setCloudProjects(
        projects
      );
      workspaceStore.mergeCloudProjects(
        projects.map(cloudProjectToWorkspaceProject)
      );
    } catch (error) {
      setErrorMessage(
        getErrorMessage(error)
      );
    } finally {
      setIsLoading(false);
    }
  }, [activeActor?.id, activeActor?.type]);

  useEffect(() => {
    if (activeActor) {
      void refreshProjects();
    } else {
      setCloudProjects([]);
      setIsLoading(false);
    }
  }, [activeActor, refreshProjects]);

  async function handleSync() {
    if (
      !activeActor || localProjects.length === 0
    ) {
      setErrorMessage(
        'No hay proyectos locales para vincular.'
      );

      return;
    }

    setIsSyncing(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const result =
        await syncLocalProjectsToCloud(
          localProjects,
          activeActor.id,
          activeActor.type
        );

      setCloudProjects(
        result.projects
      );
      workspaceStore.mergeCloudProjects(
        result.projects.map(cloudProjectToWorkspaceProject)
      );

      setSuccessMessage(
        result.uploadedCount === 1
          ? 'El proyecto quedó vinculado correctamente con tu cuenta.'
          : `${result.uploadedCount} proyectos quedaron vinculados correctamente con tu cuenta.`
      );
    } catch (error) {
      setErrorMessage(
        getErrorMessage(error)
      );
    } finally {
      setIsSyncing(false);
    }
  }

  async function handleSubmitToMedia(
    projectId: string
  ) {
    setActiveActionId(
      projectId
    );

    setErrorMessage('');
    setSuccessMessage('');

    try {
      await submitProjectToMedia(
        projectId
      );

      await refreshProjects();

      setSuccessMessage(
        'El proyecto fue postulado voluntariamente al medio.'
      );
    } catch (error) {
      setErrorMessage(
        getErrorMessage(error)
      );
    } finally {
      setActiveActionId(null);
    }
  }

  return (
    <section className="mt-6 rounded-3xl border border-[#D9FF00]/20 bg-[#D9FF00]/5 p-6">
      <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
        <div className="max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#D9FF00]">
            Proyectos y cuenta
          </p>

          <h3 className="mt-3 text-xl font-semibold text-white">
            Creative OS conectado con el ecosistema
          </h3>

          <p className="mt-3 text-sm leading-7 text-[#A6A6A6]">
            Los proyectos vinculados permanecen privados hasta que
            su propietario prepare y envíe una aplicación segura al
            ecosistema.
          </p>

          <p className="mt-3 text-xs leading-5 text-[#777777]">
            Vincular o actualizar un proyecto no lo publica, no lo
            postula y no comparte su información sensible.
          </p>
        </div>

        <div className="grid min-w-72 grid-cols-2 gap-3">
          <Metric
            value={String(
              localProjects.length
            )}
            label="En este navegador"
          />

          <Metric
            value={
              isLoading
                ? '...'
                : String(
                    cloudProjects.length
                  )
            }
            label="En Supabase"
          />
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={handleSync}
          disabled={
            isSyncing ||
            !activeActor ||
            localProjects.length ===
              0
          }
          className="rounded-full bg-[#D9FF00] px-6 py-3 text-sm font-bold text-black transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSyncing
            ? 'Actualizando proyectos...'
            : 'Vincular o actualizar proyectos'}
        </button>

        <button
          type="button"
          onClick={() => {
            void refreshProjects();
          }}
          disabled={isLoading}
          className="rounded-full border border-white/15 px-6 py-3 text-sm font-semibold text-white transition hover:border-white disabled:opacity-50"
        >
          Actualizar estado
        </button>
      </div>

      {successMessage ? (
        <div className="mt-5 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-5 py-4 text-sm leading-6 text-emerald-200">
          {successMessage}
        </div>
      ) : null}

      {errorMessage ? (
        <div className="mt-5 rounded-2xl border border-red-400/20 bg-red-400/10 px-5 py-4 text-sm leading-6 text-red-200">
          {errorMessage}
        </div>
      ) : null}

      {cloudProjects.length > 0 ? (
        <div className="mt-7 border-t border-white/10 pt-6">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#767676]">
            Proyectos vinculados
          </p>

          <div className="mt-4 space-y-4">
            {cloudProjects.map(
              (project) => (
                <CloudProjectCard
                  key={project.id}
                  project={project}
                  isWorking={
                    activeActionId ===
                    project.id
                  }
                  onPrepareApplication={() => {
                    setApplicationProject(
                      project
                    );
                  }}
                  onSubmitToMedia={() => {
                    void handleSubmitToMedia(
                      project.id
                    );
                  }}
                />
              )
            )}
          </div>
        </div>
      ) : null}
      {applicationProject ? (
        <ProjectApplicationDialog
          project={applicationProject}
          onClose={() => {
            setApplicationProject(
              null
            );
          }}
          onSubmitted={() => {
            setSuccessMessage(
              'La aplicación fue enviada al ecosistema.'
            );

            void refreshProjects();
          }}
        />
      ) : null}

    </section>
  );
}

function CloudProjectCard({
  project,
  isWorking,
  onPrepareApplication,
  onSubmitToMedia,
}: {
  project:
    CloudProjectSummary;

  isWorking: boolean;

  onPrepareApplication:
    () => void;

  onSubmitToMedia:
    () => void;
}) {
  const canRequestEligibility =
    project.workflowStatus ===
      'private' ||
    project.workflowStatus ===
      'eligibility_rejected';

  const canSubmitToMedia =
    project.workflowStatus ===
      'eligible' ||
    project.workflowStatus ===
      'publication_rejected';

  return (
    <article className="rounded-2xl border border-white/10 bg-[#101010] p-5">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-2xl">
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full border border-[#D9FF00]/20 bg-[#D9FF00]/10 px-3 py-1 text-[10px] font-bold uppercase text-[#D9FF00]">
              {
                workflowLabels[
                  project
                    .workflowStatus
                ]
              }
            </span>

            <span className="text-xs capitalize text-[#777777]">
              {project.category}
              {' · '}
              {project.progress}%
            </span>
          </div>

          <h4 className="mt-4 text-xl font-semibold text-white">
            {project.title}
          </h4>

          <p className="mt-3 text-sm leading-6 text-[#888888]">
            {
              workflowDescriptions[
                project
                  .workflowStatus
              ]
            }
          </p>

          {project.eligibilityNote ? (
            <ReviewNote
              label="Nota del ecosistema"
              value={
                project.eligibilityNote
              }
            />
          ) : null}

          {project.editorialNote ? (
            <ReviewNote
              label="Nota editorial"
              value={
                project.editorialNote
              }
            />
          ) : null}
        </div>

        <div className="flex shrink-0 flex-wrap gap-3">
          {canRequestEligibility ? (
            <button
              type="button"
              onClick={
                onPrepareApplication
              }
              disabled={isWorking}
              className="rounded-full bg-white px-5 py-3 text-sm font-bold text-black transition hover:bg-[#D9FF00] disabled:opacity-50"
            >
              Preparar aplicación
            </button>
          ) : null}

          {canSubmitToMedia ? (
            <button
              type="button"
              onClick={
                onSubmitToMedia
              }
              disabled={isWorking}
              className="rounded-full bg-[#D9FF00] px-5 py-3 text-sm font-bold text-black transition hover:bg-white disabled:opacity-50"
            >
              {isWorking
                ? 'Postulando...'
                : 'Postular al medio'}
            </button>
          ) : null}
        </div>
      </div>
    </article>
  );
}

function ReviewNote({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#666666]">
        {label}
      </p>

      <p className="mt-2 text-sm leading-6 text-[#A6A6A6]">
        {value}
      </p>
    </div>
  );
}

function Metric({
  value,
  label,
}: {
  value: string;
  label: string;
}) {
  return (
    <article className="rounded-2xl border border-white/10 bg-[#101010] p-4 text-center">
      <p className="text-2xl font-bold text-[#D9FF00]">
        {value}
      </p>

      <p className="mt-2 text-[10px] uppercase leading-4 tracking-[0.12em] text-[#777777]">
        {label}
      </p>
    </article>
  );
}

function getErrorMessage(
  error: unknown
): string {
  if (
    error instanceof Error
  ) {
    return error.message;
  }

  return 'Ocurrió un error inesperado.';
}
