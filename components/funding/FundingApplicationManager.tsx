'use client';

import Link from 'next/link';

import {
  type FormEvent,
  type ReactNode,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  loadFundingProjectOptions,
  loadFundingReportOptions,
  loadMyFundingApplications,
  saveFundingApplication,
  submitFundingApplication,
} from '../../services/funding/fundingApplicationService';

import type {
  FundingApplicationInput,
  FundingApplicationStatus,
  FundingProjectOption,
  FundingReportOption,
  MyFundingApplication,
} from '../../services/funding/fundingApplicationService';

const statusLabels:
  Record<FundingApplicationStatus, string> = {
    draft:
      'Borrador',

    submitted:
      'En revisión',

    accepted:
      'Aceptada',

    rejected:
      'Requiere cambios',

    withdrawn:
      'Retirada',
  };

const initialForm:
  FundingApplicationInput = {
    projectId: '',
    reportId: '',
    requestedAmount: '',
    proposalSummary: '',
    useOfFunds: '',
    expectedOutcomes: '',
  };

export function FundingApplicationManager({
  opportunityId,
  opportunityTitle,
  currency,
}: {
  opportunityId: string;
  opportunityTitle: string;
  currency: string;
}) {
  const [
    projects,
    setProjects,
  ] = useState<
    FundingProjectOption[]
  >([]);

  const [
    reports,
    setReports,
  ] = useState<
    FundingReportOption[]
  >([]);

  const [
    applications,
    setApplications,
  ] = useState<
    MyFundingApplication[]
  >([]);

  const [
    form,
    setForm,
  ] = useState<
    FundingApplicationInput
  >(initialForm);

  const [
    editingId,
    setEditingId,
  ] = useState<
    string | null
  >(null);

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  const [
    isLoadingReports,
    setIsLoadingReports,
  ] = useState(false);

  const [
    isWorking,
    setIsWorking,
  ] = useState(false);

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
    void loadData();
  }, [opportunityId]);

  useEffect(() => {
    void loadReports(
      form.projectId
    );
  }, [form.projectId]);

  const selectedProject =
    useMemo(
      () =>
        projects.find(
          (project) =>
            project.projectId ===
            form.projectId
        ) ?? null,
      [
        projects,
        form.projectId,
      ]
    );

  async function loadData() {
    setIsLoading(true);
    setErrorMessage('');

    try {
      const [
        projectResult,
        applicationResult,
      ] = await Promise.all([
        loadFundingProjectOptions(),

        loadMyFundingApplications(
          opportunityId
        ),
      ]);

      setProjects(
        projectResult
      );

      setApplications(
        applicationResult
      );
    } catch (error) {
      setErrorMessage(
        getErrorMessage(error)
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function loadReports(
    projectId: string
  ) {
    if (!projectId) {
      setReports([]);
      return;
    }

    setIsLoadingReports(true);

    try {
      const result =
        await loadFundingReportOptions(
          projectId
        );

      setReports(
        result
      );
    } catch (error) {
      setErrorMessage(
        getErrorMessage(error)
      );

      setReports([]);
    } finally {
      setIsLoadingReports(false);
    }
  }

  function updateField<
    Key extends keyof FundingApplicationInput
  >(
    key: Key,
    value:
      FundingApplicationInput[Key]
  ) {
    setForm(
      (current) => ({
        ...current,
        [key]:
          value,
      })
    );
  }

  function resetForm() {
    setEditingId(null);
    setForm(initialForm);
    setReports([]);
  }

  function beginEditing(
    application:
      MyFundingApplication
  ) {
    setEditingId(
      application.applicationId
    );

    setForm({
      projectId:
        application.projectId,

      reportId:
        application.reportId ??
        '',

      requestedAmount:
        String(
          application.requestedAmount
        ),

      proposalSummary:
        application.proposalSummary,

      useOfFunds:
        application.useOfFunds,

      expectedOutcomes:
        application.expectedOutcomes,
    });

    setErrorMessage('');
    setSuccessMessage('');

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  }

  async function handleSave(
    event:
      FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setIsWorking(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      await saveFundingApplication(
        editingId,
        opportunityId,
        form
      );

      setSuccessMessage(
        editingId
          ? 'La postulación fue actualizada.'
          : 'La postulación fue guardada como borrador.'
      );

      resetForm();
      await loadData();
    } catch (error) {
      setErrorMessage(
        getErrorMessage(error)
      );
    } finally {
      setIsWorking(false);
    }
  }

  async function handleSubmit(
    applicationId: string
  ) {
    setActiveId(
      applicationId
    );

    setErrorMessage('');
    setSuccessMessage('');

    try {
      await submitFundingApplication(
        applicationId
      );

      setSuccessMessage(
        'La postulación fue enviada al financiador.'
      );

      await loadData();
    } catch (error) {
      setErrorMessage(
        getErrorMessage(error)
      );
    } finally {
      setActiveId(null);
    }
  }

  return (
    <div>
      <header>
        <Link
          href={`/oportunidades/${opportunityId}`}
          className="text-sm text-[#777777] transition hover:text-white"
        >
          ← Volver a la oportunidad
        </Link>

        <p className="mt-8 text-xs font-bold uppercase tracking-[0.24em] text-[#D9FF00]">
          Postulación de proyecto
        </p>

        <h1 className="mt-4 max-w-5xl text-4xl font-bold tracking-[-0.04em] sm:text-6xl">
          {opportunityTitle}
        </h1>

        <p className="mt-5 max-w-3xl text-base leading-8 text-[#999999]">
          Selecciona un proyecto aceptado por el ecosistema,
          explica cómo utilizarás los recursos y cuáles serán
          los resultados esperados.
        </p>
      </header>

      {errorMessage ? (
        <div className="mt-8 rounded-2xl border border-red-400/20 bg-red-400/10 p-4 text-sm leading-6 text-red-200">
          {errorMessage}
        </div>
      ) : null}

      {successMessage ? (
        <div className="mt-8 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm text-emerald-200">
          {successMessage}
        </div>
      ) : null}

      <section className="mt-10 rounded-[32px] border border-white/10 bg-[#0A0A0A] p-7 md:p-9">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#777777]">
              {editingId
                ? 'Editar postulación'
                : 'Nueva postulación'}
            </p>

            <h2 className="mt-3 text-3xl font-bold">
              Presentar un proyecto
            </h2>
          </div>

          {editingId ? (
            <button
              type="button"
              onClick={resetForm}
              className="rounded-full border border-white/15 px-5 py-3 text-sm font-semibold"
            >
              Cancelar edición
            </button>
          ) : null}
        </div>

        {isLoading ? (
          <div className="mt-8 h-72 animate-pulse rounded-3xl bg-[#111111]" />
        ) : projects.length ===
          0 ? (
          <div className="mt-8 rounded-3xl border border-dashed border-white/15 p-8">
            <h3 className="text-xl font-bold">
              Todavía no tienes proyectos vinculados
            </h3>

            <p className="mt-3 text-sm leading-7 text-[#777777]">
              Primero crea o vincula un proyecto con tu cuenta.
            </p>

            <Link
              href="/studio?new=1"
              className="mt-6 inline-flex rounded-full bg-[#D9FF00] px-5 py-3 text-sm font-bold text-black"
            >
              Crear proyecto
            </Link>
          </div>
        ) : (
          <form
            onSubmit={handleSave}
            className="mt-8 space-y-7"
          >
            <Field
              label="Proyecto"
              htmlFor="application-project"
            >
              <select
                id="application-project"
                value={
                  form.projectId
                }
                onChange={(event) => {
                  updateField(
                    'projectId',
                    event.target.value
                  );

                  updateField(
                    'reportId',
                    ''
                  );
                }}
                className={
                  inputClassName
                }
              >
                <option value="">
                  Seleccionar proyecto
                </option>

                {projects.map(
                  (project) => (
                    <option
                      key={
                        project.projectId
                      }
                      value={
                        project.projectId
                      }
                      disabled={
                        !project.isEligible
                      }
                    >
                      {project.title}
                      {project.isEligible
                        ? ''
                        : ' — todavía no elegible'}
                    </option>
                  )
                )}
              </select>
            </Field>

            {selectedProject ? (
              <div
                className={[
                  'rounded-2xl border p-5',
                  selectedProject.isEligible
                    ? 'border-emerald-400/20 bg-emerald-400/10'
                    : 'border-yellow-400/20 bg-yellow-400/10',
                ].join(' ')}
              >
                <p className="font-semibold">
                  {selectedProject.isEligible
                    ? 'Proyecto elegible'
                    : 'El proyecto todavía no puede postularse'}
                </p>

                <p className="mt-2 text-sm leading-6 text-white/60">
                  Estado actual:{' '}
                  {
                    selectedProject.workflowStatus
                  }
                </p>

                {!selectedProject.isEligible ? (
                  <Link
                    href="/mi-ecosistema"
                    className="mt-4 inline-flex text-sm font-bold text-[#D9FF00]"
                  >
                    Solicitar elegibilidad →
                  </Link>
                ) : null}
              </div>
            ) : null}

            <Field
              label={`Monto solicitado en ${currency}`}
              htmlFor="application-amount"
            >
              <input
                id="application-amount"
                type="number"
                min="0"
                value={
                  form.requestedAmount
                }
                onChange={(event) =>
                  updateField(
                    'requestedAmount',
                    event.target.value
                  )
                }
                className={
                  inputClassName
                }
              />
            </Field>

            <Field
              label="Resumen de la postulación"
              htmlFor="application-summary"
            >
              <textarea
                id="application-summary"
                value={
                  form.proposalSummary
                }
                onChange={(event) =>
                  updateField(
                    'proposalSummary',
                    event.target.value
                  )
                }
                rows={5}
                placeholder="¿Por qué este proyecto es relevante para esta oportunidad?"
                className={
                  textareaClassName
                }
              />
            </Field>

            <Field
              label="Uso de los recursos"
              htmlFor="application-funds"
            >
              <textarea
                id="application-funds"
                value={
                  form.useOfFunds
                }
                onChange={(event) =>
                  updateField(
                    'useOfFunds',
                    event.target.value
                  )
                }
                rows={6}
                placeholder="Explica en qué actividades, equipos, honorarios, producción o procesos se invertirán los recursos."
                className={
                  textareaClassName
                }
              />
            </Field>

            <Field
              label="Resultados esperados"
              htmlFor="application-outcomes"
            >
              <textarea
                id="application-outcomes"
                value={
                  form.expectedOutcomes
                }
                onChange={(event) =>
                  updateField(
                    'expectedOutcomes',
                    event.target.value
                  )
                }
                rows={6}
                placeholder="¿Qué resultados, productos, audiencias, aprendizajes o impacto generará el proyecto?"
                className={
                  textareaClassName
                }
              />
            </Field>

            <Field
              label="Reporte de impacto anterior"
              htmlFor="application-report"
            >
              <select
                id="application-report"
                value={
                  form.reportId
                }
                onChange={(event) =>
                  updateField(
                    'reportId',
                    event.target.value
                  )
                }
                disabled={
                  !form.projectId ||
                  isLoadingReports
                }
                className={
                  inputClassName
                }
              >
                <option value="">
                  No adjuntar reporte
                </option>

                {reports.map(
                  (report) => (
                    <option
                      key={
                        report.reportId
                      }
                      value={
                        report.reportId
                      }
                    >
                      {
                        report.experienceTitle
                      }
                    </option>
                  )
                )}
              </select>

              <p className="mt-2 text-xs leading-5 text-[#666666]">
                Solo aparecen reportes publicados y relacionados
                con el proyecto seleccionado.
              </p>
            </Field>

            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={
                  isWorking ||
                  !selectedProject?.isEligible
                }
                className="rounded-full bg-[#D9FF00] px-6 py-3 text-sm font-bold text-black disabled:opacity-40"
              >
                {isWorking
                  ? 'Guardando...'
                  : editingId
                    ? 'Guardar cambios'
                    : 'Crear borrador'}
              </button>

              {editingId ? (
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-full border border-white/15 px-6 py-3 text-sm font-semibold"
                >
                  Cancelar
                </button>
              ) : null}
            </div>
          </form>
        )}
      </section>

      <section className="mt-14">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#777777]">
          Seguimiento
        </p>

        <h2 className="mt-3 text-3xl font-bold">
          Mis postulaciones
        </h2>

        {applications.length ===
        0 ? (
          <div className="mt-7 rounded-3xl border border-dashed border-white/15 p-8 text-[#777777]">
            Todavía no has postulado ningún proyecto a esta
            oportunidad.
          </div>
        ) : (
          <div className="mt-7 grid gap-5 md:grid-cols-2">
            {applications.map(
              (application) => {
                const canEdit =
                  application.status ===
                    'draft' ||
                  application.status ===
                    'rejected';

                const isActive =
                  activeId ===
                  application.applicationId;

                return (
                  <article
                    key={
                      application.applicationId
                    }
                    className="rounded-3xl border border-white/10 bg-[#0A0A0A] p-6"
                  >
                    <span className="rounded-full border border-[#D9FF00]/20 bg-[#D9FF00]/10 px-3 py-1 text-[10px] font-bold uppercase text-[#D9FF00]">
                      {
                        statusLabels[
                          application.status
                        ]
                      }
                    </span>

                    <h3 className="mt-5 text-2xl font-bold">
                      {
                        application.projectTitle
                      }
                    </h3>

                    <p className="mt-4 text-sm font-semibold text-[#D9FF00]">
                      {formatMoney(
                        application.requestedAmount,
                        currency
                      )}
                    </p>

                    <p className="mt-4 text-sm leading-7 text-[#999999]">
                      {
                        application.proposalSummary ||
                        'Postulación en construcción.'
                      }
                    </p>

                    {application.reportExperienceSlug ? (
                      <Link
                        href={`/reportes/experiencias/${application.reportExperienceSlug}`}
                        className="mt-5 inline-flex text-sm font-bold text-[#D9FF00]"
                      >
                        Ver reporte adjunto →
                      </Link>
                    ) : null}

                    {application.reviewNote ? (
                      <div className="mt-5 rounded-2xl border border-yellow-400/20 bg-yellow-400/10 p-4">
                        <p className="text-xs font-bold uppercase text-yellow-200">
                          Nota del financiador
                        </p>

                        <p className="mt-2 text-sm leading-6 text-yellow-100/80">
                          {
                            application.reviewNote
                          }
                        </p>
                      </div>
                    ) : null}

                    {application.status ===
                    'accepted' ? (
                      <div className="mt-5 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4">
                        <p className="font-semibold text-emerald-200">
                          Proyecto seleccionado
                        </p>

                        <p className="mt-2 text-sm text-emerald-100/70">
                          El financiador aceptó esta postulación.
                        </p>
                      </div>
                    ) : null}

                    {canEdit ? (
                      <div className="mt-6 flex flex-wrap gap-3">
                        <button
                          type="button"
                          onClick={() =>
                            beginEditing(
                              application
                            )
                          }
                          className="rounded-full border border-white/15 px-5 py-3 text-sm font-semibold"
                        >
                          Editar
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            void handleSubmit(
                              application.applicationId
                            );
                          }}
                          disabled={
                            isActive
                          }
                          className="rounded-full bg-white px-5 py-3 text-sm font-bold text-black disabled:opacity-50"
                        >
                          Enviar al financiador
                        </button>
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

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label
        htmlFor={htmlFor}
        className="mb-2 block text-sm font-medium text-[#BDBDBD]"
      >
        {label}
      </label>

      {children}
    </div>
  );
}

function formatMoney(
  value: number,
  currency: string
): string {
  return new Intl.NumberFormat(
    'es-CO',
    {
      style:
        'currency',

      currency,

      maximumFractionDigits:
        0,
    }
  ).format(
    value
  );
}

function getErrorMessage(
  error: unknown
): string {
  return error instanceof Error
    ? error.message
    : 'Ocurrió un error inesperado.';
}

const inputClassName =
  'w-full rounded-2xl border border-white/10 bg-[#111111] px-5 py-4 text-white outline-none transition focus:border-[#D9FF00] disabled:opacity-50';

const textareaClassName =
  'w-full resize-y rounded-2xl border border-white/10 bg-[#111111] px-5 py-4 leading-7 text-white outline-none transition focus:border-[#D9FF00]';