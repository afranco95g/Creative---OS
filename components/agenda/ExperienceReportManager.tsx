'use client';

import Link from 'next/link';

import {
  type FormEvent,
  useEffect,
  useState,
} from 'react';

import {
  loadExperienceReportWorkspace,
  reviewExperienceReport,
  saveExperienceReport,
  submitExperienceReport,
} from '@/services/agenda/experienceReportService';

import type {
  ExperienceReportStatus,
  ExperienceReportWorkspace,
} from '@/services/agenda/experienceReportService';

const statusLabels:
  Record<ExperienceReportStatus, string> = {
    not_started:
      'Sin iniciar',

    draft:
      'Borrador',

    submitted:
      'En revisión',

    published:
      'Publicado',

    rejected:
      'Requiere cambios',

    archived:
      'Archivado',
  };

export function ExperienceReportManager({
  experienceId,
}: {
  experienceId: string;
}) {
  const [
    workspace,
    setWorkspace,
  ] = useState<
    ExperienceReportWorkspace | null
  >(null);

  const [
    summary,
    setSummary,
  ] = useState('');

  const [
    outcomes,
    setOutcomes,
  ] = useState('');

  const [
    learnings,
    setLearnings,
  ] = useState('');

  const [
    challenges,
    setChallenges,
  ] = useState('');

  const [
    nextSteps,
    setNextSteps,
  ] = useState('');

  const [
    revenueCop,
    setRevenueCop,
  ] = useState('0');

  const [
    expensesCop,
    setExpensesCop,
  ] = useState('0');

  const [
    evidenceText,
    setEvidenceText,
  ] = useState('');

  const [
    reviewNote,
    setReviewNote,
  ] = useState('');

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  const [
    isWorking,
    setIsWorking,
  ] = useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState('');

  const [
    successMessage,
    setSuccessMessage,
  ] = useState('');

  useEffect(() => {
    void loadWorkspace();
  }, [experienceId]);

  async function loadWorkspace() {
    setIsLoading(true);
    setErrorMessage('');

    try {
      const result =
        await loadExperienceReportWorkspace(
          experienceId
        );

      setWorkspace(
        result
      );

      setSummary(
        result.summary
      );

      setOutcomes(
        result.outcomes
      );

      setLearnings(
        result.learnings
      );

      setChallenges(
        result.challenges
      );

      setNextSteps(
        result.nextSteps
      );

      setRevenueCop(
        String(
          result.revenueCop
        )
      );

      setExpensesCop(
        String(
          result.expensesCop
        )
      );

      setEvidenceText(
        result.evidenceUrls.join(
          '\n'
        )
      );

      setReviewNote(
        result.reviewNote
      );
    } catch (error) {
      setErrorMessage(
        getErrorMessage(error)
      );
    } finally {
      setIsLoading(false);
    }
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
      await saveExperienceReport(
        experienceId,
        {
          summary:
            summary.trim(),

          outcomes:
            outcomes.trim(),

          learnings:
            learnings.trim(),

          challenges:
            challenges.trim(),

          nextSteps:
            nextSteps.trim(),

          revenueCop:
            parseMoney(
              revenueCop
            ),

          expensesCop:
            parseMoney(
              expensesCop
            ),

          evidenceUrls:
            parseEvidenceUrls(
              evidenceText
            ),
        }
      );

      setSuccessMessage(
        'El borrador del reporte fue guardado.'
      );

      await loadWorkspace();
    } catch (error) {
      setErrorMessage(
        getErrorMessage(error)
      );
    } finally {
      setIsWorking(false);
    }
  }

  async function handleSubmit() {
    setIsWorking(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      await submitExperienceReport(
        experienceId
      );

      setSuccessMessage(
        'El reporte fue enviado a revisión.'
      );

      await loadWorkspace();
    } catch (error) {
      setErrorMessage(
        getErrorMessage(error)
      );
    } finally {
      setIsWorking(false);
    }
  }

  async function handleReview(
    approved:
      boolean
  ) {
    setIsWorking(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      await reviewExperienceReport(
        experienceId,
        approved,
        reviewNote
      );

      setSuccessMessage(
        approved
          ? 'El reporte fue publicado.'
          : 'El reporte fue devuelto para realizar cambios.'
      );

      await loadWorkspace();
    } catch (error) {
      setErrorMessage(
        getErrorMessage(error)
      );
    } finally {
      setIsWorking(false);
    }
  }

  if (isLoading) {
    return (
      <div className="h-96 animate-pulse rounded-3xl bg-superficie-elevada" />
    );
  }

  if (!workspace) {
    return (
      <div className="rounded-3xl border border-borde bg-rojo-base p-6 text-hueso">
        {errorMessage ||
          'No fue posible cargar el reporte.'}
      </div>
    );
  }

  const canEdit =
    workspace.reportStatus ===
      'not_started' ||
    workspace.reportStatus ===
      'draft' ||
    workspace.reportStatus ===
      'rejected' ||
    workspace.canReview;

  return (
    <div>
      <header className="flex flex-col gap-7 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <Link
            href="/gestion-agenda"
            className="text-sm text-texto-largo transition hover:text-texto-largo"
          >
            ← Volver a gestión de agenda
          </Link>

          <p className="mt-8 text-xs font-bold uppercase tracking-[0.24em] text-texto-principal">
            Resultados e impacto
          </p>

          <h1 className="mt-4 max-w-5xl text-4xl font-bold tracking-[-0.04em] sm:text-6xl">
            {workspace.experienceTitle}
          </h1>

          <p className="mt-5 max-w-3xl text-base leading-8 text-texto-largo">
            Documenta los resultados, aprendizajes,
            recursos y evidencias generados por la actividad.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <span className="rounded-full border border-acento/20 bg-acento/10 px-4 py-2 text-xs font-bold uppercase text-texto-principal">
              {
                statusLabels[
                  workspace.reportStatus
                ]
              }
            </span>

            <span className="text-sm text-texto-largo">
              {new Date(
                workspace.startsAt
              ).toLocaleDateString(
                'es-CO',
                {
                  day:
                    'numeric',

                  month:
                    'long',

                  year:
                    'numeric',
                }
              )}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href={`/agenda/${workspace.experienceSlug}`}
            className="rounded-full border border-borde/15 px-5 py-3 text-sm font-semibold"
          >
            Ver actividad
          </Link>

          {workspace.reportStatus ===
          'published' ? (
            <Link
              href={`/reportes/experiencias/${workspace.experienceSlug}`}
              className="rounded-full bg-rojo-base px-5 py-3 text-sm font-bold text-hueso"
            >
              Ver reporte público
            </Link>
          ) : null}
        </div>
      </header>

      {errorMessage ? (
        <div className="mt-8 rounded-2xl border border-borde bg-rojo-base p-4 text-sm text-hueso">
          {errorMessage}
        </div>
      ) : null}

      {successMessage ? (
        <div className="mt-8 rounded-2xl border border-borde bg-superficie-elevada p-4 text-sm text-texto-principal">
          {successMessage}
        </div>
      ) : null}

      <section className="mt-10">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-texto-largo">
          Información automática
        </p>

        <h2 className="mt-3 text-3xl font-bold">
          Métricas de participación
        </h2>

        <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Metric
            value={
              workspace.activeRegistrations
            }
            label="Inscripciones activas"
          />

          <Metric
            value={
              workspace.reservedPlaces
            }
            label="Cupos reservados"
          />

          <Metric
            value={
              workspace.attendedPlaces
            }
            label="Asistentes"
          />

          <Metric
            value={`${workspace.attendanceRate}%`}
            label="Tasa de asistencia"
          />
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Metric
            value={
              workspace.occupancyRate ===
              null
                ? 'Sin límite'
                : `${workspace.occupancyRate}%`
            }
            label="Ocupación"
          />

          <Metric
            value={
              workspace.cancelledRegistrations
            }
            label="Inscripciones canceladas"
          />
        </div>
      </section>

      <form
        onSubmit={
          handleSave
        }
        className="mt-12 space-y-8"
      >
        <ReportField
          label="Resumen general"
          description="Explica qué sucedió y cuál fue el alcance general de la actividad."
          value={
            summary
          }
          onChange={
            setSummary
          }
          disabled={
            !canEdit
          }
        />

        <ReportField
          label="Resultados alcanzados"
          description="Describe productos, logros, conexiones, participación o cambios generados."
          value={
            outcomes
          }
          onChange={
            setOutcomes
          }
          disabled={
            !canEdit
          }
        />

        <ReportField
          label="Aprendizajes"
          description="Registra lo que funcionó, lo que cambió y aquello que debe conservarse."
          value={
            learnings
          }
          onChange={
            setLearnings
          }
          disabled={
            !canEdit
          }
        />

        <ReportField
          label="Retos y dificultades"
          description="Documenta problemas de producción, convocatoria, financiación o ejecución."
          value={
            challenges
          }
          onChange={
            setChallenges
          }
          disabled={
            !canEdit
          }
        />

        <ReportField
          label="Próximos pasos"
          description="Explica cómo continúa el proceso después de esta experiencia."
          value={
            nextSteps
          }
          onChange={
            setNextSteps
          }
          disabled={
            !canEdit
          }
        />

        <section className="rounded-3xl border border-borde/10 bg-superficie-elevada p-7">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-texto-largo">
            Información financiera
          </p>

          <div className="mt-6 grid gap-6 md:grid-cols-2">
            <MoneyField
              label="Ingresos"
              value={
                revenueCop
              }
              onChange={
                setRevenueCop
              }
              disabled={
                !canEdit
              }
            />

            <MoneyField
              label="Gastos"
              value={
                expensesCop
              }
              onChange={
                setExpensesCop
              }
              disabled={
                !canEdit
              }
            />
          </div>

          <div className="mt-6 border-t border-borde/10 pt-6">
            <p className="text-xs uppercase tracking-[0.16em] text-texto-largo">
              Balance estimado
            </p>

            <p className="mt-3 text-3xl font-black text-texto-principal">
              {formatCop(
                parseMoney(
                  revenueCop
                ) -
                parseMoney(
                  expensesCop
                )
              )}
            </p>
          </div>
        </section>

        <section className="rounded-3xl border border-borde/10 bg-superficie-elevada p-7">
          <label
            htmlFor="report-evidence"
            className="text-lg font-bold"
          >
            Evidencias
          </label>

          <p className="mt-2 text-sm leading-6 text-texto-largo">
            Escribe una URL por línea: fotografías,
            videos, publicaciones, documentos o carpetas.
          </p>

          <textarea
            id="report-evidence"
            value={
              evidenceText
            }
            onChange={(event) =>
              setEvidenceText(
                event.target.value
              )
            }
            disabled={
              !canEdit
            }
            rows={6}
            className={textareaClassName}
          />
        </section>

        {workspace.reviewNote ? (
          <div className="rounded-3xl border border-borde bg-superficie-elevada p-6">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-naranja">
              Nota de revisión
            </p>

            <p className="mt-3 leading-7 text-texto-largo">
              {
                workspace.reviewNote
              }
            </p>
          </div>
        ) : null}

        {canEdit ? (
          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={
                isWorking
              }
              className="rounded-full bg-rojo-base px-6 py-3 text-sm font-bold text-hueso transition hover:bg-rojo-base disabled:opacity-50"
            >
              {isWorking
                ? 'Guardando...'
                : 'Guardar borrador'}
            </button>

            {workspace.reportStatus ===
              'draft' ||
            workspace.reportStatus ===
              'rejected' ? (
              <button
                type="button"
                onClick={() => {
                  void handleSubmit();
                }}
                disabled={
                  isWorking
                }
                className="rounded-full bg-rojo-base px-6 py-3 text-sm font-bold text-hueso disabled:opacity-50"
              >
                Enviar a revisión
              </button>
            ) : null}
          </div>
        ) : null}
      </form>

      {workspace.canReview &&
      workspace.reportStatus ===
        'submitted' ? (
        <section className="mt-12 rounded-3xl border border-acento/20 bg-acento/5 p-7">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-texto-principal">
            Revisión administrativa
          </p>

          <h2 className="mt-4 text-3xl font-bold">
            Revisar reporte
          </h2>

          <textarea
            value={
              reviewNote
            }
            onChange={(event) =>
              setReviewNote(
                event.target.value
              )
            }
            rows={4}
            placeholder="Nota para el responsable"
            className={textareaClassName}
          />

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => {
                void handleReview(
                  false
                );
              }}
              disabled={
                isWorking
              }
              className="rounded-full border border-borde px-5 py-3 font-semibold text-rojo-base disabled:opacity-50"
            >
              Devolver
            </button>

            <button
              type="button"
              onClick={() => {
                void handleReview(
                  true
                );
              }}
              disabled={
                isWorking
              }
              className="rounded-full bg-rojo-base px-5 py-3 font-bold text-hueso disabled:opacity-50"
            >
              Publicar reporte
            </button>
          </div>
        </section>
      ) : null}
    </div>
  );
}

function ReportField({
  label,
  description,
  value,
  onChange,
  disabled,
}: {
  label: string;
  description: string;
  value: string;
  onChange:
    (value: string) => void;
  disabled: boolean;
}) {
  return (
    <section className="rounded-3xl border border-borde/10 bg-superficie-elevada p-7">
      <label className="text-lg font-bold">
        {label}
      </label>

      <p className="mt-2 text-sm leading-6 text-texto-largo">
        {description}
      </p>

      <textarea
        value={
          value
        }
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
        disabled={
          disabled
        }
        rows={6}
        className={textareaClassName}
      />
    </section>
  );
}

function MoneyField({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: string;
  onChange:
    (value: string) => void;
  disabled: boolean;
}) {
  return (
    <div>
      <label className="text-sm font-semibold">
        {label}
      </label>

      <input
        type="number"
        min="0"
        step="1000"
        value={
          value
        }
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
        disabled={
          disabled
        }
        className="mt-3 w-full rounded-2xl border border-borde/10 bg-superficie-elevada px-5 py-4 outline-none focus:border-acento"
      />
    </div>
  );
}

function Metric({
  value,
  label,
}: {
  value:
    number | string;
  label:
    string;
}) {
  return (
    <article className="rounded-2xl border border-borde/10 bg-superficie-elevada p-5">
      <p className="text-3xl font-black text-texto-principal">
        {value}
      </p>

      <p className="mt-2 text-[10px] uppercase tracking-[0.14em] text-texto-largo">
        {label}
      </p>
    </article>
  );
}

function parseMoney(
  value:
    string
): number {
  const parsed =
    Number(
      value
    );

  if (
    Number.isNaN(
      parsed
    ) ||
    parsed < 0
  ) {
    return 0;
  }

  return parsed;
}

function parseEvidenceUrls(
  value:
    string
): string[] {
  return value
    .split('\n')
    .map(
      (item) =>
        item.trim()
    )
    .filter(Boolean);
}

function formatCop(
  value:
    number
): string {
  return new Intl.NumberFormat(
    'es-CO',
    {
      style:
        'currency',

      currency:
        'COP',

      maximumFractionDigits:
        0,
    }
  ).format(
    value
  );
}

function getErrorMessage(
  error:
    unknown
): string {
  return error instanceof Error
    ? error.message
    : 'Ocurrió un error inesperado.';
}

const textareaClassName =
  'mt-5 w-full resize-y rounded-2xl border border-borde/10 bg-superficie-elevada px-5 py-4 leading-7 text-texto-largo outline-none transition focus:border-acento disabled:opacity-60';