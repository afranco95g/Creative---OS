'use client';

import Link from 'next/link';

import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  loadEcosystemActorsForReview,
  updateEcosystemActorPublication,
} from '../../services/ecosystem/actorReviewService';

import type {
  EcosystemActorReviewItem,
  EcosystemActorStatus,
  EcosystemActorType,
} from '../../services/ecosystem/actorReviewService';

const typeLabels:
  Record<EcosystemActorType, string> = {
    person:
      'Personas',

    space:
      'Espacios',

    funder:
      'Financiadores',
  };

const statusLabels:
  Record<EcosystemActorStatus, string> = {
    draft:
      'Borrador',

    review:
      'En revisión',

    published:
      'Publicado',

    archived:
      'Archivado',
  };

export function EcosystemActorsReview() {
  const [
    actors,
    setActors,
  ] = useState<
    EcosystemActorReviewItem[]
  >([]);

  const [
    activeType,
    setActiveType,
  ] = useState<EcosystemActorType>(
    'person'
  );

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  const [
    activeActorId,
    setActiveActorId,
  ] = useState<
    string | null
  >(null);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState('');

  const [
    successMessage,
    setSuccessMessage,
  ] = useState('');

  useEffect(() => {
    void loadActors();
  }, []);

  async function loadActors() {
    setIsLoading(true);
    setErrorMessage('');

    try {
      const result =
        await loadEcosystemActorsForReview();

      setActors(result);
    } catch (error) {
      setErrorMessage(
        getErrorMessage(error)
      );
    } finally {
      setIsLoading(false);
    }
  }

  const visibleActors =
    useMemo(
      () =>
        actors.filter(
          (actor) =>
            actor.actorType ===
            activeType
        ),

      [
        actors,
        activeType,
      ]
    );

  async function updateActor(
    actor:
      EcosystemActorReviewItem,
    changes: {
      status?:
        EcosystemActorStatus;

      verified?:
        boolean;

      featured?:
        boolean;
    }
  ) {
    setActiveActorId(
      actor.actorId
    );

    setErrorMessage('');
    setSuccessMessage('');

    const nextStatus =
      changes.status ??
      actor.status;

    const nextVerified =
      changes.verified ??
      actor.verified;

    const nextFeatured =
      changes.featured ??
      actor.featured;

    try {
      await updateEcosystemActorPublication(
        actor,
        nextStatus,
        nextVerified,
        nextFeatured
      );

      setActors(
        (currentActors) =>
          currentActors.map(
            (currentActor) =>
              currentActor.actorId ===
                actor.actorId &&
              currentActor.actorType ===
                actor.actorType
                ? {
                    ...currentActor,

                    status:
                      nextStatus,

                    verified:
                      nextVerified,

                    featured:
                      nextFeatured,
                  }
                : currentActor
          )
      );

      setSuccessMessage(
        nextStatus ===
          'published'
          ? `${actor.name} ya aparece en el ecosistema público.`
          : `Los cambios de ${actor.name} fueron guardados.`
      );
    } catch (error) {
      setErrorMessage(
        getErrorMessage(error)
      );
    } finally {
      setActiveActorId(null);
    }
  }

  return (
    <main className="min-h-screen bg-superficie px-6 py-10 text-texto-largo sm:px-8 lg:px-12">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-col gap-7 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <Link
              href="/mi-ecosistema"
              className="text-sm text-texto-largo transition hover:text-texto-largo"
            >
              ← Volver a Mi Ecosistema
            </Link>

            <p className="mt-8 text-xs font-bold uppercase tracking-[0.24em] text-texto-principal">
              Administración del ecosistema
            </p>

            <h1 className="mt-3 text-4xl font-bold tracking-[-0.04em] sm:text-6xl">
              Publicación de actores
            </h1>

            <p className="mt-5 max-w-3xl text-base leading-8 text-texto-largo">
              Revisa las personas, espacios y financiadores antes
              de hacer sus perfiles visibles dentro del ecosistema
              público de El Culebreo.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/ecosistema"
              className="rounded-full border border-borde/15 px-5 py-3 text-sm font-semibold transition hover:border-borde"
            >
              Ver ecosistema público
            </Link>

            <button
              type="button"
              onClick={() => {
                void loadActors();
              }}
              disabled={isLoading}
              className="rounded-full bg-rojo-base px-5 py-3 text-sm font-bold text-hueso disabled:opacity-50"
            >
              Actualizar actores
            </button>
          </div>
        </header>

        {errorMessage ? (
          <div className="mt-8 rounded-2xl border border-borde bg-rojo-base px-5 py-4 text-sm text-hueso">
            {errorMessage}
          </div>
        ) : null}

        {successMessage ? (
          <div className="mt-8 rounded-2xl border border-borde bg-superficie-elevada px-5 py-4 text-sm text-texto-principal">
            {successMessage}
          </div>
        ) : null}

        <div className="mt-10 flex flex-wrap gap-3">
          {(
            [
              'person',
              'space',
              'funder',
            ] as EcosystemActorType[]
          ).map(
            (actorType) => {
              const count =
                actors.filter(
                  (actor) =>
                    actor.actorType ===
                    actorType
                ).length;

              return (
                <button
                  key={actorType}
                  type="button"
                  onClick={() =>
                    setActiveType(
                      actorType
                    )
                  }
                  className={[
                    'rounded-full border px-5 py-3 text-sm font-semibold transition',
                    activeType ===
                    actorType
                      ? 'border-acento bg-rojo-base text-hueso'
                      : 'border-borde/15 text-texto-largo hover:border-borde',
                  ].join(' ')}
                >
                  {typeLabels[
                    actorType
                  ]}{' '}
                  · {count}
                </button>
              );
            }
          )}
        </div>

        {isLoading ? (
          <div className="mt-8 grid gap-5 md:grid-cols-2">
            <div className="h-80 animate-pulse rounded-3xl bg-superficie-elevada" />
            <div className="h-80 animate-pulse rounded-3xl bg-superficie-elevada" />
          </div>
        ) : visibleActors.length ===
          0 ? (
          <div className="mt-8 rounded-3xl border border-dashed border-borde/15 bg-superficie-elevada p-10">
            <h2 className="text-2xl font-semibold">
              No hay actores de este tipo
            </h2>
          </div>
        ) : (
          <div className="mt-8 grid gap-5 md:grid-cols-2">
            {visibleActors.map(
              (actor) => (
                <ActorReviewCard
                  key={`${actor.actorType}-${actor.actorId}`}
                  actor={actor}
                  isWorking={
                    activeActorId ===
                    actor.actorId
                  }
                  onUpdate={
                    updateActor
                  }
                />
              )
            )}
          </div>
        )}
      </div>
    </main>
  );
}

function ActorReviewCard({
  actor,
  isWorking,
  onUpdate,
}: {
  actor:
    EcosystemActorReviewItem;

  isWorking:
    boolean;

  onUpdate: (
    actor:
      EcosystemActorReviewItem,

    changes: {
      status?:
        EcosystemActorStatus;

      verified?:
        boolean;

      featured?:
        boolean;
    }
  ) => Promise<void>;
}) {
  const location =
    [
      actor.city,
      actor.country,
    ]
      .filter(Boolean)
      .join(', ');

  return (
    <article className="rounded-3xl border border-borde/10 bg-superficie-elevada p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <span className="rounded-full border border-acento/20 bg-acento/10 px-3 py-1 text-[10px] font-bold uppercase text-texto-principal">
            {
              statusLabels[
                actor.status
              ]
            }
          </span>

          <h2 className="mt-5 text-2xl font-bold">
            {actor.name}
          </h2>

          <p className="mt-2 text-sm font-semibold text-texto-principal">
            {actor.headline}
          </p>
        </div>

        <span className="text-xs uppercase text-texto-largo">
          {
            typeLabels[
              actor.actorType
            ]
          }
        </span>
      </div>

      <p className="mt-5 line-clamp-4 text-sm leading-7 text-texto-largo">
        {actor.description ||
          'Este perfil todavía no tiene una descripción pública.'}
      </p>

      <p className="mt-5 text-xs text-texto-largo">
        {location ||
          'Ubicación sin definir'}
      </p>

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => {
            void onUpdate(
              actor,
              {
                verified:
                  !actor.verified,
              }
            );
          }}
          disabled={isWorking}
          className={[
            'rounded-full border px-4 py-2 text-xs font-semibold transition disabled:opacity-50',
            actor.verified
              ? 'border-acento text-texto-principal'
              : 'border-borde/15 text-texto-largo',
          ].join(' ')}
        >
          {actor.verified
            ? 'Verificado'
            : 'Verificar'}
        </button>

        <button
          type="button"
          onClick={() => {
            void onUpdate(
              actor,
              {
                featured:
                  !actor.featured,
              }
            );
          }}
          disabled={isWorking}
          className={[
            'rounded-full border px-4 py-2 text-xs font-semibold transition disabled:opacity-50',
            actor.featured
              ? 'border-acento text-texto-principal'
              : 'border-borde/15 text-texto-largo',
          ].join(' ')}
        >
          {actor.featured
            ? 'Destacado'
            : 'Destacar'}
        </button>
      </div>

      <div className="mt-7 grid grid-cols-2 gap-3 border-t border-borde/10 pt-6">
        {actor.status ===
        'published' ? (
          <button
            type="button"
            onClick={() => {
              void onUpdate(
                actor,
                {
                  status:
                    'draft',
                }
              );
            }}
            disabled={isWorking}
            className="rounded-full border border-borde/15 px-4 py-3 text-sm font-semibold disabled:opacity-50"
          >
            Volver a borrador
          </button>
        ) : (
          <button
            type="button"
            onClick={() => {
              void onUpdate(
                actor,
                {
                  status:
                    'published',
                }
              );
            }}
            disabled={isWorking}
            className="rounded-full bg-rojo-base px-4 py-3 text-sm font-bold text-hueso disabled:opacity-50"
          >
            {isWorking
              ? 'Publicando...'
              : 'Publicar perfil'}
          </button>
        )}

        <button
          type="button"
          onClick={() => {
            void onUpdate(
              actor,
              {
                status:
                  'archived',
              }
            );
          }}
          disabled={isWorking}
          className="rounded-full border border-borde px-4 py-3 text-sm font-semibold text-rojo-base disabled:opacity-50"
        >
          Archivar
        </button>
      </div>
    </article>
  );
}

function getErrorMessage(
  error: unknown
): string {
  return error instanceof Error
    ? error.message
    : 'Ocurrió un error inesperado.';
}