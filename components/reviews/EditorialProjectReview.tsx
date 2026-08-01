'use client';

import Link from 'next/link';

import {
  useEffect,
  useState,
} from 'react';

import {
  loadEditorialReviewQueue,
  markProjectInEditorialReview,
  reviewProjectPublication,
} from '../../services/projects/projectCloudService';

import {
  loadPublishedEditorialProjects,
} from '../../services/editorial/publishedEditorialProjectsService';

import type {
  ReviewProjectSummary,
} from '../../services/projects/projectCloudService';

import type {
  PublishedEditorialProject,
} from '../../services/editorial/publishedEditorialProjectsService';

const categoryLabels:
  Record<string, string> = {
    cultural:
      'Cultural',

    product:
      'Producto',

    event:
      'Evento',

    social:
      'Social',

    artistic:
      'Artístico',

    business:
      'Negocio',

    other:
      'Otro',
  };

export function EditorialProjectReview() {
  const [
    pendingProjects,
    setPendingProjects,
  ] = useState<
    ReviewProjectSummary[]
  >([]);

  const [
    publishedProjects,
    setPublishedProjects,
  ] = useState<
    PublishedEditorialProject[]
  >([]);

  const [
    notes,
    setNotes,
  ] = useState<
    Record<string, string>
  >({});

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  const [
    activeProjectId,
    setActiveProjectId,
  ] = useState<
    string | null
  >(null);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState('');

  useEffect(() => {
    void loadAllProjects();
  }, []);

  async function loadAllProjects() {
    setIsLoading(true);
    setErrorMessage('');

    try {
      const [
        pendingResult,
        publishedResult,
      ] = await Promise.all([
        loadEditorialReviewQueue(),

        loadPublishedEditorialProjects(),
      ]);

      setPendingProjects(
        pendingResult
      );

      setPublishedProjects(
        publishedResult
      );
    } catch (error) {
      setErrorMessage(
        getErrorMessage(error)
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function handleStartReview(
    projectId: string
  ) {
    setActiveProjectId(
      projectId
    );

    setErrorMessage('');

    try {
      await markProjectInEditorialReview(
        projectId
      );

      await loadAllProjects();
    } catch (error) {
      setErrorMessage(
        getErrorMessage(error)
      );
    } finally {
      setActiveProjectId(null);
    }
  }

  async function handleDecision(
    projectId: string,
    approved: boolean
  ) {
    setActiveProjectId(
      projectId
    );

    setErrorMessage('');

    try {
      await reviewProjectPublication(
        projectId,
        approved,
        notes[projectId] || ''
      );

      await loadAllProjects();
    } catch (error) {
      const message =
        getErrorMessage(error);

      if (
        message
          .toLowerCase()
          .includes(
            'ficha editorial'
          )
      ) {
        setErrorMessage(
          'Antes de publicar debes abrir la ficha editorial, completar la información y marcarla como lista.'
        );
      } else {
        setErrorMessage(
          message
        );
      }
    } finally {
      setActiveProjectId(null);
    }
  }

  return (
    <main className="min-h-screen bg-[#050505] px-6 py-10 text-white sm:px-8 lg:px-12">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-col gap-7 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <Link
              href="/mi-ecosistema"
              className="text-sm text-[#777777] transition hover:text-white"
            >
              ← Volver a Mi Ecosistema
            </Link>

            <p className="mt-8 text-xs font-bold uppercase tracking-[0.24em] text-[#D9FF00]">
              Administración del medio
            </p>

            <h1 className="mt-3 text-4xl font-bold tracking-[-0.04em] sm:text-5xl">
              Revisión editorial
            </h1>

            <p className="mt-5 max-w-3xl text-base leading-7 text-[#999999]">
              Revisa las nuevas postulaciones y continúa
              administrando los proyectos que ya fueron publicados
              por Cultura Está.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              void loadAllProjects();
            }}
            disabled={isLoading}
            className="rounded-full border border-white/15 px-5 py-3 text-sm font-semibold transition hover:border-white disabled:opacity-50"
          >
            Actualizar proyectos
          </button>
        </header>

        {errorMessage ? (
          <div className="mt-8 rounded-2xl border border-red-400/20 bg-red-400/10 p-5 text-sm leading-6 text-red-200">
            {errorMessage}
          </div>
        ) : null}

        {isLoading ? (
          <div className="mt-10 space-y-5">
            <div className="h-72 animate-pulse rounded-3xl bg-[#101010]" />

            <div className="h-56 animate-pulse rounded-3xl bg-[#101010]" />
          </div>
        ) : (
          <>
            <PendingProjectsSection
              projects={
                pendingProjects
              }
              notes={notes}
              setNotes={setNotes}
              activeProjectId={
                activeProjectId
              }
              onStartReview={
                handleStartReview
              }
              onDecision={
                handleDecision
              }
            />

            <PublishedProjectsSection
              projects={
                publishedProjects
              }
            />
          </>
        )}
      </div>
    </main>
  );
}

function PendingProjectsSection({
  projects,
  notes,
  setNotes,
  activeProjectId,
  onStartReview,
  onDecision,
}: {
  projects:
    ReviewProjectSummary[];

  notes:
    Record<string, string>;

  setNotes:
    React.Dispatch<
      React.SetStateAction<
        Record<string, string>
      >
    >;

  activeProjectId:
    string | null;

  onStartReview:
    (
      projectId: string
    ) => Promise<void>;

  onDecision:
    (
      projectId: string,
      approved: boolean
    ) => Promise<void>;
}) {
  return (
    <section className="mt-12">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#767676]">
            Cola editorial
          </p>

          <h2 className="mt-3 text-3xl font-bold">
            Postulaciones pendientes
          </h2>
        </div>

        <p className="text-sm text-[#777777]">
          {projects.length}{' '}
          {projects.length === 1
            ? 'postulación'
            : 'postulaciones'}
        </p>
      </div>

      {projects.length === 0 ? (
        <div className="mt-6 rounded-3xl border border-dashed border-white/15 bg-[#0A0A0A] p-8">
          <h3 className="text-xl font-semibold">
            No hay postulaciones pendientes
          </h3>

          <p className="mt-3 text-sm text-[#777777]">
            La cola editorial está vacía.
          </p>
        </div>
      ) : (
        <div className="mt-6 space-y-6">
          {projects.map(
            (project) => (
              <article
                key={project.id}
                className="rounded-3xl border border-white/10 bg-[#0A0A0A] p-7"
              >
                <div className="grid gap-8 xl:grid-cols-[1fr_360px]">
                  <div>
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full border border-[#D9FF00]/20 bg-[#D9FF00]/10 px-3 py-1 text-[10px] font-bold uppercase text-[#D9FF00]">
                        {project.workflowStatus ===
                        'editorial_review'
                          ? 'En revisión'
                          : 'Postulado'}
                      </span>

                      <span className="rounded-full border border-white/10 px-3 py-1 text-[10px] uppercase text-[#777777]">
                        {project.progress}% construido
                      </span>
                    </div>

                    <h3 className="mt-5 text-3xl font-bold">
                      {project.title}
                    </h3>

                    <p className="mt-4 text-sm leading-7 text-[#999999]">
                      {project.description ||
                        'Proyecto sin descripción.'}
                    </p>

                    <p className="mt-5 text-sm text-[#777777]">
                      Propietario:{' '}
                      <strong className="text-white">
                        {project.ownerName}
                      </strong>
                    </p>

                    {project.eligibilityNote ? (
                      <div className="mt-5 rounded-2xl border border-white/10 bg-[#111111] p-4">
                        <p className="text-[10px] uppercase tracking-[0.14em] text-[#666666]">
                          Nota del ecosistema
                        </p>

                        <p className="mt-2 text-sm leading-6 text-[#A6A6A6]">
                          {
                            project.eligibilityNote
                          }
                        </p>
                      </div>
                    ) : null}

                    <div className="mt-6 flex flex-wrap gap-3">
                      <Link
                        href={`/revision-editorial/${project.id}`}
                        className="rounded-full bg-white px-5 py-3 text-sm font-bold text-black transition hover:bg-[#D9FF00]"
                      >
                        Preparar ficha editorial
                      </Link>

                      <Link
                        href={`/revision-editorial/${project.id}/actores`}
                        className="rounded-full border border-white/15 px-5 py-3 text-sm font-semibold transition hover:border-[#D9FF00] hover:text-[#D9FF00]"
                      >
                        Gestionar actores
                      </Link>
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor={`editorial-note-${project.id}`}
                      className="text-xs font-bold uppercase tracking-[0.16em] text-[#767676]"
                    >
                      Nota editorial
                    </label>

                    <textarea
                      id={`editorial-note-${project.id}`}
                      value={
                        notes[
                          project.id
                        ] || ''
                      }
                      onChange={(event) =>
                        setNotes(
                          (
                            currentNotes
                          ) => ({
                            ...currentNotes,

                            [project.id]:
                              event.target.value,
                          })
                        )
                      }
                      placeholder="Explica la decisión editorial."
                      rows={6}
                      className="mt-3 w-full resize-none rounded-2xl border border-white/10 bg-[#111111] p-4 text-sm text-white outline-none focus:border-[#D9FF00]"
                    />

                    {project.workflowStatus ===
                    'submitted_to_media' ? (
                      <button
                        type="button"
                        onClick={() => {
                          void onStartReview(
                            project.id
                          );
                        }}
                        disabled={
                          activeProjectId ===
                          project.id
                        }
                        className="mt-4 w-full rounded-full border border-white/15 px-4 py-3 text-sm font-semibold disabled:opacity-50"
                      >
                        Marcar en revisión
                      </button>
                    ) : null}

                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          void onDecision(
                            project.id,
                            false
                          );
                        }}
                        disabled={
                          activeProjectId ===
                          project.id
                        }
                        className="rounded-full border border-red-400/30 px-4 py-3 text-sm font-semibold text-red-300 disabled:opacity-50"
                      >
                        Rechazar
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          void onDecision(
                            project.id,
                            true
                          );
                        }}
                        disabled={
                          activeProjectId ===
                          project.id
                        }
                        className="rounded-full bg-[#D9FF00] px-4 py-3 text-sm font-bold text-black disabled:opacity-50"
                      >
                        Publicar
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            )
          )}
        </div>
      )}
    </section>
  );
}

function PublishedProjectsSection({
  projects,
}: {
  projects:
    PublishedEditorialProject[];
}) {
  return (
    <section className="mt-16 border-t border-white/10 pt-12">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#D9FF00]">
            Archivo editorial
          </p>

          <h2 className="mt-3 text-3xl font-bold">
            Proyectos publicados
          </h2>

          <p className="mt-3 max-w-3xl text-sm leading-7 text-[#888888]">
            Continúa editando la narrativa, los créditos y las
            relaciones del ecosistema después de la publicación.
          </p>
        </div>

        <p className="text-sm text-[#777777]">
          {projects.length}{' '}
          {projects.length === 1
            ? 'proyecto'
            : 'proyectos'}
        </p>
      </div>

      {projects.length === 0 ? (
        <div className="mt-6 rounded-3xl border border-dashed border-white/15 bg-[#0A0A0A] p-8">
          <h3 className="text-xl font-semibold">
            Todavía no hay proyectos publicados
          </h3>
        </div>
      ) : (
        <div className="mt-7 grid gap-5 md:grid-cols-2">
          {projects.map(
            (project) => (
              <article
                key={project.id}
                className="rounded-3xl border border-white/10 bg-[#0A0A0A] p-6"
              >
                <div className="flex flex-wrap items-center gap-3">
                  <span className="rounded-full bg-[#D9FF00] px-3 py-1 text-[10px] font-bold uppercase text-black">
                    Publicado
                  </span>

                  <span className="text-xs text-[#777777]">
                    {categoryLabels[
                      project.category
                    ] ??
                      project.category}
                    {' · '}
                    {project.progress}%
                  </span>
                </div>

                <h3 className="mt-5 text-2xl font-bold">
                  {project.title}
                </h3>

                <p className="mt-3 line-clamp-3 text-sm leading-7 text-[#888888]">
                  {project.description ||
                    'Proyecto publicado por Cultura Está.'}
                </p>

                {project.publishedAt ? (
                  <p className="mt-4 text-xs text-[#555555]">
                    Publicado el{' '}
                    {new Date(
                      project.publishedAt
                    ).toLocaleDateString(
                      'es-CO'
                    )}
                  </p>
                ) : null}

                <div className="mt-6 flex flex-wrap gap-3">
                  <Link
                    href={`/revision-editorial/${project.id}`}
                    className="rounded-full border border-white/15 px-4 py-2.5 text-sm font-semibold transition hover:border-white"
                  >
                    Editar ficha
                  </Link>

                  <Link
                    href={`/revision-editorial/${project.id}/actores`}
                    className="rounded-full border border-[#D9FF00]/30 px-4 py-2.5 text-sm font-semibold text-[#D9FF00] transition hover:bg-[#D9FF00] hover:text-black"
                  >
                    Gestionar actores
                  </Link>

                  <Link
                    href={`/proyectos/${project.id}`}
                    className="rounded-full bg-white px-4 py-2.5 text-sm font-bold text-black transition hover:bg-[#D9FF00]"
                  >
                    Ver público
                  </Link>
                </div>
              </article>
            )
          )}
        </div>
      )}
    </section>
  );
}

function getErrorMessage(
  error: unknown
): string {
  return error instanceof Error
    ? error.message
    : 'Ocurrió un error inesperado.';
}