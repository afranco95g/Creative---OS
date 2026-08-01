'use client';

import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  loadProjectActorEditorData,
  saveProjectActorLinks,
} from '../../services/editorial/projectActorsService';

import type {
  ProjectActorLink,
  ProjectActorOption,
  ProjectActorType,
} from '../../services/editorial/projectActorsService';

interface ProjectActorsEditorProps {
  projectId: string;
}

const typeLabels:
  Record<ProjectActorType, string> = {
    person:
      'Personas',

    space:
      'Espacios',

    funder:
      'Marcas y financiadores',
  };

const defaultRelationshipLabels:
  Record<ProjectActorType, string> = {
    person:
      'Participa',

    space:
      'Espacio aliado',

    funder:
      'Apoya el proyecto',
  };

export function ProjectActorsEditor({
  projectId,
}: ProjectActorsEditorProps) {
  const [
    options,
    setOptions,
  ] = useState<
    ProjectActorOption[]
  >([]);

  const [
    links,
    setLinks,
  ] = useState<
    ProjectActorLink[]
  >([]);

  const [
    activeType,
    setActiveType,
  ] = useState<ProjectActorType>(
    'person'
  );

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  const [
    isSaving,
    setIsSaving,
  ] = useState(false);

  const [
    successMessage,
    setSuccessMessage,
  ] = useState('');

  const [
    errorMessage,
    setErrorMessage,
  ] = useState('');

  useEffect(() => {
    let mounted = true;

    async function load() {
      setIsLoading(true);
      setErrorMessage('');

      try {
        const result =
          await loadProjectActorEditorData(
            projectId
          );

        if (!mounted) {
          return;
        }

        setOptions(
          result.options
        );

        setLinks(
          result.links
        );
      } catch (error) {
        if (mounted) {
          setErrorMessage(
            getErrorMessage(error)
          );
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    void load();

    return () => {
      mounted = false;
    };
  }, [projectId]);

  const visibleOptions =
    useMemo(
      () =>
        options.filter(
          (option) =>
            option.actorType ===
            activeType
        ),

      [
        options,
        activeType,
      ]
    );

  function getLink(
    option: ProjectActorOption
  ) {
    return links.find(
      (link) =>
        link.actorType ===
          option.actorType &&
        link.actorId ===
          option.actorId
    );
  }

  function toggleActor(
    option: ProjectActorOption
  ) {
    const existingLink =
      getLink(option);

    if (existingLink) {
      setLinks(
        (currentLinks) =>
          currentLinks.filter(
            (link) =>
              !(
                link.actorType ===
                  option.actorType &&
                link.actorId ===
                  option.actorId
              )
          )
      );

      return;
    }

    setLinks(
      (currentLinks) => [
        ...currentLinks,

        {
          actorType:
            option.actorType,

          actorId:
            option.actorId,

          relationshipLabel:
            defaultRelationshipLabels[
              option.actorType
            ],

          isPublic: true,

          sortOrder:
            currentLinks.length,
        },
      ]
    );
  }

  function updateRelationship(
    option: ProjectActorOption,
    relationshipLabel: string
  ) {
    setLinks(
      (currentLinks) =>
        currentLinks.map(
          (link) =>
            link.actorType ===
              option.actorType &&
            link.actorId ===
              option.actorId
              ? {
                  ...link,
                  relationshipLabel,
                }
              : link
        )
    );
  }

  function updateVisibility(
    option: ProjectActorOption,
    isPublic: boolean
  ) {
    setLinks(
      (currentLinks) =>
        currentLinks.map(
          (link) =>
            link.actorType ===
              option.actorType &&
            link.actorId ===
              option.actorId
              ? {
                  ...link,
                  isPublic,
                }
              : link
        )
    );
  }

  async function handleSave() {
    setIsSaving(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      await saveProjectActorLinks(
        projectId,
        links
      );

      setSuccessMessage(
        'Las relaciones del proyecto fueron guardadas.'
      );
    } catch (error) {
      setErrorMessage(
        getErrorMessage(error)
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="rounded-[32px] border border-white/10 bg-[#0A0A0A] p-7 md:p-9">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#767676]">
        Ecosistema del proyecto
      </p>

      <h2 className="mt-3 text-2xl font-bold">
        Personas, espacios y apoyos
      </h2>

      <p className="mt-4 max-w-3xl text-sm leading-7 text-[#888888]">
        Conecta la historia editorial con los actores
        que participan, reciben, producen o financian
        el proyecto.
      </p>

      <div className="mt-7 flex flex-wrap gap-3">
        {(
          [
            'person',
            'space',
            'funder',
          ] as ProjectActorType[]
        ).map((type) => (
          <button
            key={type}
            type="button"
            onClick={() =>
              setActiveType(type)
            }
            className={[
              'rounded-full border px-5 py-2.5 text-sm font-semibold transition',
              activeType === type
                ? 'border-[#D9FF00] bg-[#D9FF00] text-black'
                : 'border-white/15 text-white hover:border-white',
            ].join(' ')}
          >
            {typeLabels[type]}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="mt-8 h-52 animate-pulse rounded-3xl bg-[#111111]" />
      ) : visibleOptions.length === 0 ? (
        <div className="mt-8 rounded-3xl border border-dashed border-white/15 p-7">
          <p className="font-semibold">
            No hay actores disponibles
          </p>

          <p className="mt-2 text-sm text-[#777777]">
            Primero debe existir al menos un actor de este tipo dentro del ecosistema.
          </p>
        </div>
      ) : (
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {visibleOptions.map(
            (option) => {
              const link =
                getLink(option);

              const isSelected =
                Boolean(link);

              return (
                <article
                  key={`${option.actorType}-${option.actorId}`}
                  className={[
                    'rounded-2xl border p-5 transition',
                    isSelected
                      ? 'border-[#D9FF00]/40 bg-[#D9FF00]/5'
                      : 'border-white/10 bg-[#111111]',
                  ].join(' ')}
                >
                  <div className="flex items-start gap-4">
                    <button
                      type="button"
                      onClick={() =>
                        toggleActor(
                          option
                        )
                      }
                      className={[
                        'mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded border text-xs font-bold',
                        isSelected
                          ? 'border-[#D9FF00] bg-[#D9FF00] text-black'
                          : 'border-white/20 text-transparent',
                      ].join(' ')}
                    >
                      ✓
                    </button>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold text-white">
                          {option.name}
                        </h3>

                        <span className="rounded-full border border-white/10 px-2.5 py-1 text-[9px] uppercase tracking-[0.12em] text-[#666666]">
                          {option.status}
                        </span>
                      </div>

                      <p className="mt-2 text-sm leading-6 text-[#777777]">
                        {option.subtitle}
                      </p>
                    </div>
                  </div>

                  {link ? (
                    <div className="mt-5 space-y-4 border-t border-white/10 pt-5">
                      <div>
                        <label className="text-xs text-[#777777]">
                          Relación con el proyecto
                        </label>

                        <input
                          value={
                            link.relationshipLabel
                          }
                          onChange={(event) =>
                            updateRelationship(
                              option,
                              event.target.value
                            )
                          }
                          className="mt-2 w-full rounded-xl border border-white/10 bg-[#080808] px-4 py-3 text-sm text-white outline-none focus:border-[#D9FF00]"
                        />
                      </div>

                      <label className="flex items-center gap-3 text-sm text-[#999999]">
                        <input
                          type="checkbox"
                          checked={
                            link.isPublic
                          }
                          onChange={(event) =>
                            updateVisibility(
                              option,
                              event.target.checked
                            )
                          }
                        />

                        Mostrar públicamente
                      </label>
                    </div>
                  ) : null}
                </article>
              );
            }
          )}
        </div>
      )}

      {successMessage ? (
        <div className="mt-6 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-5 py-4 text-sm text-emerald-200">
          {successMessage}
        </div>
      ) : null}

      {errorMessage ? (
        <div className="mt-6 rounded-2xl border border-red-400/20 bg-red-400/10 px-5 py-4 text-sm text-red-200">
          {errorMessage}
        </div>
      ) : null}

      <div className="mt-7 flex items-center justify-between gap-4">
        <p className="text-xs text-[#666666]">
          {links.length}{' '}
          {links.length === 1
            ? 'actor vinculado'
            : 'actores vinculados'}
        </p>

        <button
          type="button"
          onClick={() => {
            void handleSave();
          }}
          disabled={isSaving}
          className="rounded-full bg-white px-6 py-3 text-sm font-bold text-black transition hover:bg-[#D9FF00] disabled:opacity-50"
        >
          {isSaving
            ? 'Guardando...'
            : 'Guardar relaciones'}
        </button>
      </div>
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