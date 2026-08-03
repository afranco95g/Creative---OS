'use client';

import Link from 'next/link';

import {
  useEffect,
  useState,
} from 'react';

import {
  loadProjectApplicationsForReview,
  reviewProjectApplication,
  startProjectApplicationReview,
} from '../../services/projects/projectApplicationService';

import type {
  ProjectApplicationReviewItem,
} from '../../services/projects/projectApplicationService';

import type {
  ProjectApplicationDecision,
} from '../../types/projectApplication';

const decisionOptions: Array<{
  value: ProjectApplicationDecision;
  label: string;
}> = [
  {
    value: 'connections',
    label: 'Aprobado para conexiones',
  },
  {
    value: 'experience',
    label: 'Aceptar en el ecosistema · actividad candidata',
  },
  {
    value: 'ticket_distribution',
    label: 'Aprobado para distribución en tickets',
  },
  {
    value: 'brand_activation',
    label: 'Aprobado para activación de marca',
  },
  {
    value: 'funding',
    label: 'Aprobado para financiación',
  },
  {
    value: 'editorial_referral',
    label: 'Referir a evaluación editorial',
  },
];

const applicationTypeLabels: Record<string, string> = {
  creative_project: 'Proyecto creativo',
  experience: 'Experiencia',
  product: 'Producto',
  campaign: 'Campaña',
  activation: 'Activación',
  call: 'Convocatoria',
  editorial_story: 'Historia editorial',
  other: 'Otro',
};

const routeLabels: Record<string, string> = {
  ecosystem_connections: 'Conexiones del ecosistema',
  cultural_calendar: 'Agenda cultural',
  ticket_distribution: 'Distribución en tickets',
  brand_activation: 'Activación de marca',
  space_match: 'Conexión con espacios',
  funding_opportunity: 'Oportunidad de financiación',
  editorial_consideration: 'Consideración editorial',
  other: 'Otra ruta',
};

export function EcosystemEligibilityReview() {
  const [
    applications,
    setApplications,
  ] = useState<
    ProjectApplicationReviewItem[]
  >([]);

  const [
    notes,
    setNotes,
  ] = useState<
    Record<string, string>
  >({});

  const [
    decisions,
    setDecisions,
  ] = useState<
    Record<
      string,
      ProjectApplicationDecision
    >
  >({});

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  const [
    activeApplicationId,
    setActiveApplicationId,
  ] = useState<
    string | null
  >(null);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState('');

  useEffect(() => {
    void loadQueue();
  }, []);

  async function loadQueue() {
    setIsLoading(true);
    setErrorMessage('');

    try {
      const result =
        await loadProjectApplicationsForReview();

      setApplications(result);

      setDecisions(
        Object.fromEntries(
          result.map(
            (application) => [
              application.applicationId,
              application.applicationType ===
              'product'
                ? 'ticket_distribution'
                : application.applicationType ===
                    'experience'
                  ? 'experience'
                  : application.applicationType ===
                      'campaign' ||
                    application.applicationType ===
                      'activation'
                    ? 'brand_activation'
                    : 'connections',
            ]
          )
        )
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
    applicationId: string
  ) {
    setActiveApplicationId(
      applicationId
    );

    setErrorMessage('');

    try {
      await startProjectApplicationReview(
        applicationId
      );

      setApplications(
        (current) =>
          current.map(
            (application) =>
              application.applicationId ===
              applicationId
                ? {
                    ...application,
                    status:
                      'under_review',
                  }
                : application
          )
      );
    } catch (error) {
      setErrorMessage(
        getErrorMessage(error)
      );
    } finally {
      setActiveApplicationId(
        null
      );
    }
  }

  async function handleAccept(
    applicationId: string
  ) {
    const decision =
      decisions[applicationId];

    if (!decision) {
      setErrorMessage(
        'Selecciona una ruta de aprobación.'
      );

      return;
    }

    await handleDecision(
      applicationId,
      'accepted',
      decision
    );
  }

  async function handleRequestChanges(
    applicationId: string
  ) {
    await handleDecision(
      applicationId,
      'changes_requested',
      'changes_required'
    );
  }

  async function handleReject(
    applicationId: string
  ) {
    await handleDecision(
      applicationId,
      'rejected',
      'not_eligible'
    );
  }

  async function handleDecision(
    applicationId: string,
    status:
      | 'accepted'
      | 'changes_requested'
      | 'rejected',
    decision:
      ProjectApplicationDecision
  ) {
    const note =
      notes[applicationId] || '';

    if (
      status !== 'accepted' &&
      !note.trim()
    ) {
      setErrorMessage(
        'Explica los ajustes requeridos o el motivo del rechazo.'
      );

      return;
    }

    setActiveApplicationId(
      applicationId
    );

    setErrorMessage('');

    try {
      await reviewProjectApplication(
        applicationId,
        status,
        decision,
        note
      );

      setApplications(
        (current) =>
          current.filter(
            (application) =>
              application.applicationId !==
              applicationId
          )
      );
    } catch (error) {
      setErrorMessage(
        getErrorMessage(error)
      );
    } finally {
      setActiveApplicationId(
        null
      );
    }
  }

  return (
    <main className="min-h-screen bg-[#050505] px-6 py-10 text-white sm:px-8 lg:px-12">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-7 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <Link
              href="/mi-ecosistema"
              className="text-sm text-[#777777] transition hover:text-white"
            >
              ← Volver a Mi Ecosistema
            </Link>

            <p className="mt-8 text-xs font-bold uppercase tracking-[0.24em] text-[#D9FF00]">
              Administración del ecosistema
            </p>

            <h1 className="mt-3 text-4xl font-bold tracking-[-0.04em] sm:text-5xl">
              Aplicaciones al ecosistema
            </h1>

            <p className="mt-5 max-w-3xl text-base leading-7 text-[#999999]">
              Aquí revisas la ficha controlada que cada actor decidió
              compartir. La conversación, el presupuesto interno, las
              tareas, los documentos y demás información sensible del
              proyecto permanecen privados.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              void loadQueue();
            }}
            disabled={isLoading}
            className="rounded-full border border-white/15 px-5 py-3 text-sm font-semibold transition hover:border-white disabled:opacity-50"
          >
            Actualizar cola
          </button>
        </div>

        {errorMessage ? (
          <div className="mt-8 rounded-2xl border border-red-400/20 bg-red-400/10 p-5 text-sm text-red-200">
            {errorMessage}
          </div>
        ) : null}

        {isLoading ? (
          <div className="mt-10 space-y-4">
            {[1, 2].map(
              (item) => (
                <div
                  key={item}
                  className="h-96 animate-pulse rounded-3xl bg-[#101010]"
                />
              )
            )}
          </div>
        ) : applications.length === 0 ? (
          <div className="mt-10 rounded-3xl border border-dashed border-white/15 bg-[#0A0A0A] p-10">
            <h2 className="text-2xl font-semibold">
              No hay aplicaciones pendientes
            </h2>

            <p className="mt-3 text-[#777777]">
              La cola del ecosistema está vacía.
            </p>
          </div>
        ) : (
          <div className="mt-10 space-y-6">
            {applications.map(
              (application) => {
                const isBusy =
                  activeApplicationId ===
                  application.applicationId;

                return (
                  <article
                    key={
                      application.applicationId
                    }
                    className="rounded-3xl border border-white/10 bg-[#0A0A0A] p-7"
                  >
                    <div className="grid gap-8 xl:grid-cols-[1fr_380px]">
                      <div>
                        <div className="flex flex-wrap gap-2">
                          <StatusPill
                            value={
                              applicationTypeLabels[
                                application.applicationType
                              ] ??
                              application.applicationType
                            }
                            accent
                          />

                          <StatusPill
                            value={
                              application.actorName
                            }
                          />

                          <StatusPill
                            value={
                              application.status ===
                              'under_review'
                                ? 'En revisión'
                                : 'Enviada'
                            }
                          />
                        </div>

                        <h2 className="mt-5 text-3xl font-bold">
                          {
                            application
                              .snapshot
                              .projectTitle
                          }
                        </h2>

                        <p className="mt-4 text-sm leading-7 text-[#999999]">
                          {
                            application.publicSummary
                          }
                        </p>

                        <div className="mt-6 grid gap-3 sm:grid-cols-3">
                          <Metric
                            label="Actor"
                            value={
                              application.actorName
                            }
                          />

                          <Metric
                            label="Cuenta"
                            value={
                              application.applicantName
                            }
                          />

                          <Metric
                            label="Solicitud"
                            value={
                              application.submittedAt
                                ? new Date(
                                    application.submittedAt
                                  ).toLocaleDateString(
                                    'es-CO'
                                  )
                                : 'Sin fecha'
                            }
                          />
                        </div>

                        <div className="mt-6 grid gap-4 md:grid-cols-2">
                          <InformationCard
                            title="Qué ofrece"
                            value={
                              application.ecosystemOffer
                            }
                          />

                          <InformationCard
                            title="Qué necesita"
                            value={
                              application.ecosystemNeeds
                            }
                          />

                          <InformationCard
                            title="Público"
                            value={
                              application.targetAudience
                            }
                          />

                          <InformationCard
                            title="Alcance"
                            value={
                              application.geographicScope ||
                              'Sin definir'
                            }
                          />
                        </div>

                        <div className="mt-6 rounded-2xl border border-white/10 bg-[#111111] p-5">
                          <p className="text-xs font-bold uppercase tracking-[0.15em] text-[#666666]">
                            Rutas solicitadas
                          </p>

                          <div className="mt-3 flex flex-wrap gap-2">
                            {application.requestedRoutes.map(
                              (route) => (
                                <StatusPill
                                  key={route}
                                  value={
                                    routeLabels[
                                      route
                                    ] ??
                                    route
                                  }
                                />
                              )
                            )}
                          </div>
                        </div>

                        {application.applicationType ===
                          'product' &&
                        application.productDetails ? (
                          <ProductPanel
                            details={
                              application.productDetails
                            }
                          />
                        ) : null}

                        <SnapshotPanel
                          application={
                            application
                          }
                        />
                      </div>

                      <div className="xl:sticky xl:top-8 xl:self-start">
                        <div className="rounded-3xl border border-white/10 bg-[#111111] p-5">
                          {application.status ===
                          'submitted' ? (
                            <button
                              type="button"
                              onClick={() => {
                                void handleStartReview(
                                  application.applicationId
                                );
                              }}
                              disabled={isBusy}
                              className="w-full rounded-full border border-[#D9FF00]/30 px-4 py-3 text-sm font-semibold text-[#D9FF00] disabled:opacity-50"
                            >
                              Iniciar revisión
                            </button>
                          ) : null}

                          <label
                            htmlFor={`decision-${application.applicationId}`}
                            className="mt-5 block text-xs font-bold uppercase tracking-[0.16em] text-[#767676]"
                          >
                            Ruta de aprobación
                          </label>

                          <select
                            id={`decision-${application.applicationId}`}
                            value={
                              decisions[
                                application.applicationId
                              ] || ''
                            }
                            onChange={(event) =>
                              setDecisions(
                                (current) => ({
                                  ...current,
                                  [application.applicationId]:
                                    event.target
                                      .value as ProjectApplicationDecision,
                                })
                              )
                            }
                            className="mt-3 w-full rounded-2xl border border-white/10 bg-[#0A0A0A] px-4 py-3 text-sm text-white outline-none focus:border-[#D9FF00]"
                          >
                            {decisionOptions.map(
                              (option) => (
                                <option
                                  key={
                                    option.value
                                  }
                                  value={
                                    option.value
                                  }
                                >
                                  {
                                    option.label
                                  }
                                </option>
                              )
                            )}
                          </select>

                          <label
                            htmlFor={`application-note-${application.applicationId}`}
                            className="mt-5 block text-xs font-bold uppercase tracking-[0.16em] text-[#767676]"
                          >
                            Nota de revisión
                          </label>

                          <textarea
                            id={`application-note-${application.applicationId}`}
                            value={
                              notes[
                                application.applicationId
                              ] || ''
                            }
                            onChange={(event) =>
                              setNotes(
                                (
                                  currentNotes
                                ) => ({
                                  ...currentNotes,
                                  [application.applicationId]:
                                    event.target.value,
                                })
                              )
                            }
                            placeholder="Explica la decisión o los ajustes que necesita."
                            rows={7}
                            className="mt-3 w-full resize-none rounded-2xl border border-white/10 bg-[#0A0A0A] p-4 text-sm text-white outline-none focus:border-[#D9FF00]"
                          />

                          <div className="mt-4 grid gap-3">
                            <button
                              type="button"
                              onClick={() => {
                                void handleAccept(
                                  application.applicationId
                                );
                              }}
                              disabled={isBusy}
                              className="rounded-full bg-[#D9FF00] px-4 py-3 text-sm font-bold text-black disabled:opacity-50"
                            >
                              Aceptar aplicación
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                void handleRequestChanges(
                                  application.applicationId
                                );
                              }}
                              disabled={isBusy}
                              className="rounded-full border border-amber-300/30 px-4 py-3 text-sm font-semibold text-amber-200 disabled:opacity-50"
                            >
                              Solicitar ajustes
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                void handleReject(
                                  application.applicationId
                                );
                              }}
                              disabled={isBusy}
                              className="rounded-full border border-red-400/30 px-4 py-3 text-sm font-semibold text-red-300 disabled:opacity-50"
                            >
                              Rechazar
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              }
            )}
          </div>
        )}
      </div>
    </main>
  );
}

function ProductPanel({
  details,
}: {
  details:
    NonNullable<
      ProjectApplicationReviewItem['productDetails']
    >;
}) {
  const wholesalePrice =
    details.wholesalePrice ?? 0;

  const ticketPrice =
    details.proposedTicketPrice ?? 0;

  const margin =
    details.marginPerUnit ??
    Math.max(
      ticketPrice -
        wholesalePrice,
      0
    );

  const units =
    details.availableUnits ?? 0;

  return (
    <section className="mt-6 rounded-3xl border border-[#D9FF00]/20 bg-[#D9FF00]/[0.04] p-6">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#D9FF00]">
        Evaluación comercial del producto
      </p>

      <h3 className="mt-3 text-2xl font-bold">
        {details.productName}
      </h3>

      <p className="mt-3 text-sm leading-7 text-[#A6A6A6]">
        {details.productDescription}
      </p>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Metric
          label="Costo mayorista"
          value={formatCurrency(
            wholesalePrice
          )}
        />

        <Metric
          label="Precio en ticket"
          value={formatCurrency(
            ticketPrice
          )}
        />

        <Metric
          label="Margen por unidad"
          value={formatCurrency(
            margin
          )}
        />

        <Metric
          label="Margen potencial"
          value={formatCurrency(
            margin * units
          )}
        />
      </div>
    </section>
  );
}

function SnapshotPanel({
  application,
}: {
  application:
    ProjectApplicationReviewItem;
}) {
  const items = [
    {
      label: 'Propósito',
      value:
        application.snapshot.purpose,
    },
    {
      label: 'Problema',
      value:
        application.snapshot.problem,
    },
    {
      label: 'Contexto',
      value:
        application.snapshot.context,
    },
    {
      label: 'Comunidad',
      value:
        application.snapshot.community,
    },
    {
      label: 'Objetivo general',
      value:
        application.snapshot.generalObjective,
    },
    {
      label: 'Actividades',
      value:
        application.snapshot.activities,
    },
    {
      label: 'Sostenibilidad',
      value:
        application.snapshot.sustainability,
    },
    {
      label: 'Impacto',
      value:
        application.snapshot.impact,
    },
  ].filter(
    (item) =>
      item.value?.trim()
  );

  if (items.length === 0) {
    return null;
  }

  return (
    <section className="mt-6 rounded-3xl border border-white/10 bg-[#111111] p-6">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#767676]">
        Snapshot compartido del proyecto
      </p>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        {items.map(
          (item) => (
            <InformationCard
              key={item.label}
              title={item.label}
              value={item.value}
            />
          )
        )}
      </div>
    </section>
  );
}

function InformationCard({
  title,
  value,
}: {
  title: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#0A0A0A] p-4">
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#666666]">
        {title}
      </p>

      <p className="mt-3 text-sm leading-6 text-[#A6A6A6]">
        {value || 'Sin información'}
      </p>
    </div>
  );
}

function Metric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#111111] p-4">
      <p className="text-[10px] uppercase tracking-[0.14em] text-[#666666]">
        {label}
      </p>

      <p className="mt-2 truncate text-sm font-semibold text-white">
        {value}
      </p>
    </div>
  );
}

function StatusPill({
  value,
  accent = false,
}: {
  value: string;
  accent?: boolean;
}) {
  return (
    <span
      className={[
        'rounded-full border px-3 py-1.5 text-xs font-semibold',
        accent
          ? 'border-[#D9FF00]/30 bg-[#D9FF00]/10 text-[#D9FF00]'
          : 'border-white/10 bg-white/[0.03] text-[#A6A6A6]',
      ].join(' ')}
    >
      {value}
    </span>
  );
}

function formatCurrency(
  value: number
): string {
  return new Intl.NumberFormat(
    'es-CO',
    {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }
  ).format(value);
}

function getErrorMessage(
  error: unknown
) {
  return error instanceof Error
    ? error.message
    : 'Ocurrió un error inesperado.';
}
