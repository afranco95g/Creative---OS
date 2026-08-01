'use client';

import Link from 'next/link';

import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  loadFundingOpportunityApplications,
  reviewFundingApplication,
} from '../../services/funding/fundingApplicationService';

import type {
  FundingApplicationStatus,
  ManagedFundingApplication,
} from '../../services/funding/fundingApplicationService';

const statusLabels:
  Record<FundingApplicationStatus, string> = {
    draft:
      'Borrador',

    submitted:
      'Pendiente',

    accepted:
      'Aceptada',

    rejected:
      'Rechazada',

    withdrawn:
      'Retirada',
  };

export function FundingApplicationsReview({
  opportunityId,
}: {
  opportunityId: string;
}) {
  const [
    applications,
    setApplications,
  ] = useState<
    ManagedFundingApplication[]
  >([]);

  const [
    reviewNotes,
    setReviewNotes,
  ] = useState<
    Record<string, string>
  >({});

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  const [
    activeId,
    setActiveId,
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
    void loadApplications();
  }, [opportunityId]);

  const metrics =
    useMemo(
      () => ({
        total:
          applications.length,

        pending:
          applications.filter(
            (application) =>
              application.status ===
              'submitted'
          ).length,

        accepted:
          applications.filter(
            (application) =>
              application.status ===
              'accepted'
          ).length,

        rejected:
          applications.filter(
            (application) =>
              application.status ===
              'rejected'
          ).length,
      }),
      [applications]
    );

  async function loadApplications() {
    setIsLoading(true);
    setErrorMessage('');

    try {
      const result =
        await loadFundingOpportunityApplications(
          opportunityId
        );

      setApplications(
        result
      );
    } catch (error) {
      setErrorMessage(
        getErrorMessage(error)
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function handleReview(
    application:
      ManagedFundingApplication,

    accepted:
      boolean
  ) {
    setActiveId(
      application.applicationId
    );

    setErrorMessage('');
    setSuccessMessage('');

    try {
      await reviewFundingApplication(
        application.applicationId,
        accepted,
        reviewNotes[
          application.applicationId
        ] || ''
      );

      setSuccessMessage(
        accepted
          ? `El proyecto “${application.projectTitle}” fue aceptado.`
          : `La postulación de “${application.projectTitle}” fue rechazada.`
      );

      await loadApplications();
    } catch (error) {
      setErrorMessage(
        getErrorMessage(error)
      );
    } finally {
      setActiveId(null);
    }
  }

  const opportunityTitle =
    applications[0]?.opportunityTitle ??
    'Postulaciones';

  return (
    <div>
      <header className="flex flex-col gap-7 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <Link
            href="/gestion-financiacion"
            className="text-sm text-[#777777] transition hover:text-white"
          >
            ← Volver a financiación
          </Link>

          <p className="mt-8 text-xs font-bold uppercase tracking-[0.24em] text-[#D9FF00]">
            Revisión del financiador
          </p>

          <h1 className="mt-4 max-w-5xl text-4xl font-bold tracking-[-0.04em] sm:text-6xl">
            {opportunityTitle}
          </h1>

          <p className="mt-5 max-w-3xl text-base leading-8 text-[#999999]">
            Compara los proyectos, sus solicitudes económicas,
            el uso propuesto de los recursos y la evidencia
            generada en procesos anteriores.
          </p>
        </div>

        <Link
          href={`/oportunidades/${opportunityId}`}
          className="rounded-full border border-white/15 px-5 py-3 text-sm font-semibold"
        >
          Ver oportunidad pública
        </Link>
      </header>

      {errorMessage ? (
        <div className="mt-8 rounded-2xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-200">
          {errorMessage}
        </div>
      ) : null}

      {successMessage ? (
        <div className="mt-8 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm text-emerald-200">
          {successMessage}
        </div>
      ) : null}

      <section className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Metric
          value={metrics.total}
          label="Postulaciones"
        />

        <Metric
          value={metrics.pending}
          label="Pendientes"
        />

        <Metric
          value={metrics.accepted}
          label="Aceptadas"
        />

        <Metric
          value={metrics.rejected}
          label="Rechazadas"
        />
      </section>

      <section className="mt-14">
        <div className="flex items-end justify-between gap-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#777777]">
              Proyectos
            </p>

            <h2 className="mt-3 text-3xl font-bold">
              Cola de evaluación
            </h2>
          </div>

          <button
            type="button"
            onClick={() => {
              void loadApplications();
            }}
            className="rounded-full border border-white/15 px-5 py-3 text-sm font-semibold"
          >
            Actualizar
          </button>
        </div>

        {isLoading ? (
          <div className="mt-7 h-80 animate-pulse rounded-3xl bg-[#111111]" />
        ) : applications.length ===
          0 ? (
          <div className="mt-7 rounded-3xl border border-dashed border-white/15 p-9">
            <h3 className="text-xl font-bold">
              Todavía no hay postulaciones
            </h3>

            <p className="mt-3 text-sm text-[#777777]">
              Los proyectos aparecerán aquí después de enviar
              formalmente su solicitud.
            </p>
          </div>
        ) : (
          <div className="mt-7 space-y-6">
            {applications.map(
              (application) => {
                const isActive =
                  activeId ===
                  application.applicationId;

                return (
                  <article
                    key={
                      application.applicationId
                    }
                    className="rounded-[32px] border border-white/10 bg-[#0A0A0A] p-7 md:p-9"
                  >
                    <div className="grid gap-8 lg:grid-cols-[1fr_260px]">
                      <div>
                        <div className="flex flex-wrap items-center gap-3">
                          <span className="rounded-full border border-[#D9FF00]/20 bg-[#D9FF00]/10 px-3 py-1 text-[10px] font-bold uppercase text-[#D9FF00]">
                            {
                              statusLabels[
                                application.status
                              ]
                            }
                          </span>

                          <span className="text-xs uppercase tracking-[0.14em] text-[#666666]">
                            {
                              application.projectCategory
                            }
                          </span>
                        </div>

                        <h3 className="mt-5 text-3xl font-bold">
                          {
                            application.projectTitle
                          }
                        </h3>

                        <p className="mt-3 text-sm text-[#777777]">
                          Postulado por{' '}
                          {
                            application.applicantName
                          }{' '}
                          ·{' '}
                          {
                            application.applicantEmail
                          }
                        </p>

                        <p className="mt-6 text-base leading-8 text-[#999999]">
                          {
                            application.projectDescription
                          }
                        </p>
                      </div>

                      <div className="rounded-3xl border border-[#D9FF00]/20 bg-[#D9FF00]/5 p-6">
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#D9FF00]">
                          Monto solicitado
                        </p>

                        <p className="mt-4 text-3xl font-black text-white">
                          {new Intl.NumberFormat(
                            'es-CO',
                            {
                              maximumFractionDigits:
                                0,
                            }
                          ).format(
                            application.requestedAmount
                          )}
                        </p>

                        <p className="mt-3 text-xs text-[#777777]">
                          Estado del proyecto:{' '}
                          {
                            application.projectWorkflowStatus
                          }
                        </p>
                      </div>
                    </div>

                    <div className="mt-9 grid gap-5 lg:grid-cols-3">
                      <InformationBlock
                        title="Propuesta"
                        content={
                          application.proposalSummary
                        }
                      />

                      <InformationBlock
                        title="Uso de recursos"
                        content={
                          application.useOfFunds
                        }
                      />

                      <InformationBlock
                        title="Resultados esperados"
                        content={
                          application.expectedOutcomes
                        }
                      />
                    </div>

                    {application.reportExperienceSlug ? (
                      <Link
                        href={`/reportes/experiencias/${application.reportExperienceSlug}`}
                        className="mt-7 inline-flex rounded-full border border-[#D9FF00]/30 px-5 py-3 text-sm font-bold text-[#D9FF00]"
                      >
                        Ver reporte de impacto adjunto
                      </Link>
                    ) : (
                      <p className="mt-7 text-sm text-[#666666]">
                        Este proyecto no adjuntó un reporte de impacto anterior.
                      </p>
                    )}

                    {application.reviewNote ? (
                      <div className="mt-7 rounded-2xl border border-white/10 bg-[#111111] p-5">
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#777777]">
                          Decisión registrada
                        </p>

                        <p className="mt-3 text-sm leading-7 text-[#999999]">
                          {
                            application.reviewNote
                          }
                        </p>
                      </div>
                    ) : null}

                    {application.status ===
                    'submitted' ? (
                      <div className="mt-8 border-t border-white/10 pt-7">
                        <label
                          htmlFor={`review-${application.applicationId}`}
                          className="text-sm font-semibold"
                        >
                          Nota para el proyecto
                        </label>

                        <textarea
                          id={`review-${application.applicationId}`}
                          value={
                            reviewNotes[
                              application.applicationId
                            ] || ''
                          }
                          onChange={(event) =>
                            setReviewNotes(
                              (current) => ({
                                ...current,

                                [application.applicationId]:
                                  event.target.value,
                              })
                            )
                          }
                          rows={4}
                          className="mt-3 w-full resize-y rounded-2xl border border-white/10 bg-[#111111] px-5 py-4 leading-7 outline-none focus:border-[#D9FF00]"
                        />

                        <div className="mt-5 grid gap-3 sm:grid-cols-2">
                          <button
                            type="button"
                            onClick={() => {
                              void handleReview(
                                application,
                                false
                              );
                            }}
                            disabled={
                              isActive
                            }
                            className="rounded-full border border-red-400/30 px-5 py-3 font-semibold text-red-300 disabled:opacity-50"
                          >
                            Rechazar
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              void handleReview(
                                application,
                                true
                              );
                            }}
                            disabled={
                              isActive
                            }
                            className="rounded-full bg-[#D9FF00] px-5 py-3 font-bold text-black disabled:opacity-50"
                          >
                            Aceptar proyecto
                          </button>
                        </div>
                      </div>
                    ) : null}
                  </article>
                );
              }
            )}
          </div>
        )}
      </section>
    </div>
  );
}

function Metric({
  value,
  label,
}: {
  value: number;
  label: string;
}) {
  return (
    <article className="rounded-2xl border border-white/10 bg-[#0A0A0A] p-5">
      <p className="text-3xl font-black text-[#D9FF00]">
        {value}
      </p>

      <p className="mt-2 text-[10px] uppercase tracking-[0.14em] text-[#777777]">
        {label}
      </p>
    </article>
  );
}

function InformationBlock({
  title,
  content,
}: {
  title: string;
  content: string;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-[#111111] p-6">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#777777]">
        {title}
      </p>

      <p className="mt-4 whitespace-pre-line text-sm leading-7 text-[#999999]">
        {content ||
          'Sin información.'}
      </p>
    </div>
  );
}

function getErrorMessage(
  error: unknown
): string {
  return error instanceof Error
    ? error.message
    : 'Ocurrió un error inesperado.';
}