'use client';

import Link from 'next/link';

import {
  type FormEvent,
  useEffect,
  useState,
} from 'react';

import {
  loadManageableFundingOpportunities,
  reviewFundingOpportunity,
  saveFundingOpportunity,
  submitFundingOpportunity,
} from '../../services/funding/fundingOpportunityService';

import type {
  FundingOpportunity,
  FundingOpportunityFormInput,
  FundingOpportunityStatus,
  FundingOpportunityType,
} from '../../services/funding/fundingOpportunityService';

const typeLabels:
  Record<FundingOpportunityType, string> = {
    grant:
      'Convocatoria o estímulo',

    sponsorship:
      'Patrocinio',

    commission:
      'Comisión o contratación',

    partnership:
      'Alianza',

    residency:
      'Residencia',

    call:
      'Llamado abierto',

    other:
      'Otra oportunidad',
  };

const statusLabels:
  Record<FundingOpportunityStatus, string> = {
    draft:
      'Borrador',

    submitted:
      'En revisión',

    published:
      'Publicada',

    rejected:
      'Requiere cambios',

    closed:
      'Cerrada',

    archived:
      'Archivada',
  };

const initialForm:
  FundingOpportunityFormInput = {
    title: '',
    summary: '',
    description: '',
    opportunityType: 'grant',
    amountMin: '',
    amountMax: '',
    currency: 'COP',
    opensAt: '',
    closesAt: '',
    eligibility: '',
    requiredDocumentsText: '',
  };

export function FundingOpportunityManager() {
  const [
    opportunities,
    setOpportunities,
  ] = useState<
    FundingOpportunity[]
  >([]);

  const [
    form,
    setForm,
  ] = useState<
    FundingOpportunityFormInput
  >(initialForm);

  const [
    editingId,
    setEditingId,
  ] = useState<
    string | null
  >(null);

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
  }, []);

  async function loadData() {
    setIsLoading(true);
    setErrorMessage('');

    try {
      const result =
        await loadManageableFundingOpportunities();

      setOpportunities(
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

  function updateField<
    Key extends keyof FundingOpportunityFormInput
  >(
    key: Key,
    value:
      FundingOpportunityFormInput[Key]
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
  }

  function beginEditing(
    opportunity:
      FundingOpportunity
  ) {
    setEditingId(
      opportunity.id
    );

    setForm({
      title:
        opportunity.title,

      summary:
        opportunity.summary,

      description:
        opportunity.description,

      opportunityType:
        opportunity.opportunityType,

      amountMin:
        opportunity.amountMin ===
        null
          ? ''
          : String(
              opportunity.amountMin
            ),

      amountMax:
        opportunity.amountMax ===
        null
          ? ''
          : String(
              opportunity.amountMax
            ),

      currency:
        opportunity.currency,

      opensAt:
        opportunity.opensAt ?? '',

      closesAt:
        opportunity.closesAt ?? '',

      eligibility:
        opportunity.eligibility,

      requiredDocumentsText:
        opportunity.requiredDocuments.join(
          '\n'
        ),
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
      await saveFundingOpportunity(
        editingId,
        form
      );

      setSuccessMessage(
        editingId
          ? 'La oportunidad fue actualizada.'
          : 'La oportunidad fue creada como borrador.'
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
    opportunityId: string
  ) {
    setActiveId(
      opportunityId
    );

    setErrorMessage('');
    setSuccessMessage('');

    try {
      await submitFundingOpportunity(
        opportunityId
      );

      setSuccessMessage(
        'La oportunidad fue enviada a revisión.'
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

  async function handleReview(
    opportunityId: string,
    approved: boolean
  ) {
    setActiveId(
      opportunityId
    );

    setErrorMessage('');
    setSuccessMessage('');

    try {
      await reviewFundingOpportunity(
        opportunityId,
        approved,
        reviewNotes[
          opportunityId
        ] || ''
      );

      setSuccessMessage(
        approved
          ? 'La oportunidad fue publicada.'
          : 'La oportunidad fue devuelta para realizar cambios.'
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
    <main className="min-h-screen bg-[#050505] px-6 py-10 text-white sm:px-8 lg:px-12">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-col gap-7 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <Link
              href="/mi-ecosistema"
              className="text-sm text-[#777777] transition hover:text-white"
            >
              ← Volver a Mi Ecosistema
            </Link>

            <p className="mt-8 text-xs font-bold uppercase tracking-[0.24em] text-[#D9FF00]">
              Financiación
            </p>

            <h1 className="mt-4 max-w-5xl text-4xl font-bold tracking-[-0.04em] sm:text-6xl">
              Oportunidades para activar proyectos
            </h1>

            <p className="mt-5 max-w-3xl text-base leading-8 text-[#999999]">
              Crea convocatorias, patrocinios,
              alianzas, residencias y otras
              oportunidades para el ecosistema.
            </p>
          </div>

          <Link
            href="/oportunidades"
            className="rounded-full border border-white/15 px-5 py-3 text-sm font-semibold"
          >
            Ver oportunidades públicas
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

        <section className="mt-10 rounded-[32px] border border-white/10 bg-[#0A0A0A] p-7 md:p-9">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#777777]">
                {editingId
                  ? 'Editar oportunidad'
                  : 'Nueva oportunidad'}
              </p>

              <h2 className="mt-3 text-3xl font-bold">
                {editingId
                  ? 'Actualizar borrador'
                  : 'Publicar una posibilidad'}
              </h2>
            </div>

            {editingId ? (
              <button
                type="button"
                onClick={
                  resetForm
                }
                className="rounded-full border border-white/15 px-5 py-3 text-sm font-semibold"
              >
                Cancelar edición
              </button>
            ) : null}
          </div>

          <form
            onSubmit={
              handleSave
            }
            className="mt-8 grid gap-6 md:grid-cols-2"
          >
            <Field
              label="Título"
              htmlFor="funding-title"
            >
              <input
                id="funding-title"
                value={
                  form.title
                }
                onChange={(event) =>
                  updateField(
                    'title',
                    event.target.value
                  )
                }
                className={
                  inputClassName
                }
              />
            </Field>

            <Field
              label="Tipo"
              htmlFor="funding-type"
            >
              <select
                id="funding-type"
                value={
                  form.opportunityType
                }
                onChange={(event) =>
                  updateField(
                    'opportunityType',
                    event.target
                      .value as FundingOpportunityType
                  )
                }
                className={
                  inputClassName
                }
              >
                {(
                  Object.keys(
                    typeLabels
                  ) as FundingOpportunityType[]
                ).map(
                  (type) => (
                    <option
                      key={type}
                      value={type}
                    >
                      {typeLabels[type]}
                    </option>
                  )
                )}
              </select>
            </Field>

            <div className="md:col-span-2">
              <Field
                label="Resumen"
                htmlFor="funding-summary"
              >
                <textarea
                  id="funding-summary"
                  value={
                    form.summary
                  }
                  onChange={(event) =>
                    updateField(
                      'summary',
                      event.target.value
                    )
                  }
                  rows={3}
                  className={
                    textareaClassName
                  }
                />
              </Field>
            </div>

            <div className="md:col-span-2">
              <Field
                label="Descripción"
                htmlFor="funding-description"
              >
                <textarea
                  id="funding-description"
                  value={
                    form.description
                  }
                  onChange={(event) =>
                    updateField(
                      'description',
                      event.target.value
                    )
                  }
                  rows={6}
                  className={
                    textareaClassName
                  }
                />
              </Field>
            </div>

            <Field
              label="Monto mínimo"
              htmlFor="funding-min"
            >
              <input
                id="funding-min"
                type="number"
                min="0"
                value={
                  form.amountMin
                }
                onChange={(event) =>
                  updateField(
                    'amountMin',
                    event.target.value
                  )
                }
                className={
                  inputClassName
                }
              />
            </Field>

            <Field
              label="Monto máximo"
              htmlFor="funding-max"
            >
              <input
                id="funding-max"
                type="number"
                min="0"
                value={
                  form.amountMax
                }
                onChange={(event) =>
                  updateField(
                    'amountMax',
                    event.target.value
                  )
                }
                className={
                  inputClassName
                }
              />
            </Field>

            <Field
              label="Moneda"
              htmlFor="funding-currency"
            >
              <select
                id="funding-currency"
                value={
                  form.currency
                }
                onChange={(event) =>
                  updateField(
                    'currency',
                    event.target.value
                  )
                }
                className={
                  inputClassName
                }
              >
                <option value="COP">
                  COP
                </option>

                <option value="USD">
                  USD
                </option>

                <option value="EUR">
                  EUR
                </option>
              </select>
            </Field>

            <div />

            <Field
              label="Fecha de apertura"
              htmlFor="funding-opens"
            >
              <input
                id="funding-opens"
                type="date"
                value={
                  form.opensAt
                }
                onChange={(event) =>
                  updateField(
                    'opensAt',
                    event.target.value
                  )
                }
                className={
                  inputClassName
                }
              />
            </Field>

            <Field
              label="Fecha de cierre"
              htmlFor="funding-closes"
            >
              <input
                id="funding-closes"
                type="date"
                value={
                  form.closesAt
                }
                onChange={(event) =>
                  updateField(
                    'closesAt',
                    event.target.value
                  )
                }
                className={
                  inputClassName
                }
              />
            </Field>

            <div className="md:col-span-2">
              <Field
                label="Criterios de elegibilidad"
                htmlFor="funding-eligibility"
              >
                <textarea
                  id="funding-eligibility"
                  value={
                    form.eligibility
                  }
                  onChange={(event) =>
                    updateField(
                      'eligibility',
                      event.target.value
                    )
                  }
                  rows={6}
                  className={
                    textareaClassName
                  }
                />
              </Field>
            </div>

            <div className="md:col-span-2">
              <Field
                label="Documentos requeridos"
                htmlFor="funding-documents"
              >
                <textarea
                  id="funding-documents"
                  value={
                    form.requiredDocumentsText
                  }
                  onChange={(event) =>
                    updateField(
                      'requiredDocumentsText',
                      event.target.value
                    )
                  }
                  rows={5}
                  placeholder="Escribe un requisito por línea"
                  className={
                    textareaClassName
                  }
                />
              </Field>
            </div>

            <div className="md:col-span-2 flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={
                  isWorking
                }
                className="rounded-full bg-[#D9FF00] px-6 py-3 text-sm font-bold text-black disabled:opacity-50"
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
                  onClick={
                    resetForm
                  }
                  className="rounded-full border border-white/15 px-6 py-3 text-sm font-semibold"
                >
                  Cancelar
                </button>
              ) : null}
            </div>
          </form>
        </section>

        <section className="mt-14">
          <div className="flex items-end justify-between gap-5">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#777777]">
                Administración
              </p>

              <h2 className="mt-3 text-3xl font-bold">
                Oportunidades registradas
              </h2>
            </div>

            <button
              type="button"
              onClick={() => {
                void loadData();
              }}
              className="rounded-full border border-white/15 px-5 py-3 text-sm font-semibold"
            >
              Actualizar
            </button>
          </div>

          {isLoading ? (
            <div className="mt-7 h-72 animate-pulse rounded-3xl bg-[#111111]" />
          ) : opportunities.length ===
            0 ? (
            <div className="mt-7 rounded-3xl border border-dashed border-white/15 p-8 text-[#777777]">
              Todavía no hay oportunidades registradas.
            </div>
          ) : (
            <div className="mt-7 grid gap-5 md:grid-cols-2">
              {opportunities.map(
                (opportunity) => {
                  const canEdit =
                    (
                      opportunity.isOwner ||
                      opportunity.canReview
                    ) &&
                    (
                      opportunity.status ===
                        'draft' ||
                      opportunity.status ===
                        'rejected'
                    );

                  const isActive =
                    activeId ===
                    opportunity.id;

                  return (
                    <article
                      key={
                        opportunity.id
                      }
                      className="rounded-3xl border border-white/10 bg-[#0A0A0A] p-6"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <span className="rounded-full border border-[#D9FF00]/20 bg-[#D9FF00]/10 px-3 py-1 text-[10px] font-bold uppercase text-[#D9FF00]">
                          {
                            statusLabels[
                              opportunity.status
                            ]
                          }
                        </span>

                        <span className="text-xs text-[#666666]">
                          {
                            typeLabels[
                              opportunity.opportunityType
                            ]
                          }
                        </span>
                      </div>

                      <h3 className="mt-5 text-2xl font-bold">
                        {
                          opportunity.title
                        }
                      </h3>

                      <p className="mt-4 text-sm leading-7 text-[#999999]">
                        {
                          opportunity.summary ||
                          'Sin resumen.'
                        }
                      </p>

                      <p className="mt-5 text-xs text-[#666666]">
                        Creada por{' '}
                        {
                          opportunity.ownerName
                        }
                      </p>

                      <p className="mt-4 text-sm font-semibold text-[#D9FF00]">
                        {formatAmountRange(
                          opportunity
                        )}
                      </p>

                      {opportunity.closesAt ? (
                        <p className="mt-3 text-sm text-[#777777]">
                          Cierre:{' '}
                          {new Date(
                            `${opportunity.closesAt}T12:00:00`
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
                        </p>
                      ) : null}

                      {opportunity.reviewNote ? (
                        <div className="mt-5 rounded-2xl border border-yellow-400/20 bg-yellow-400/10 p-4">
                          <p className="text-xs font-bold uppercase text-yellow-200">
                            Nota de revisión
                          </p>

                          <p className="mt-2 text-sm leading-6 text-yellow-100/80">
                            {
                              opportunity.reviewNote
                            }
                          </p>
                        </div>
                      ) : null}

                     <div className="mt-6 flex flex-wrap gap-3">
  {canEdit ? (
    <button
      type="button"
      onClick={() =>
        beginEditing(
          opportunity
        )
      }
      disabled={
        isActive
      }
      className="rounded-full border border-white/15 px-5 py-3 text-sm font-semibold"
    >
      Editar
    </button>
  ) : null}

  {opportunity.isOwner &&
  (
    opportunity.status ===
      'draft' ||
    opportunity.status ===
      'rejected'
  ) ? (
    <button
      type="button"
      onClick={() => {
        void handleSubmit(
          opportunity.id
        );
      }}
      disabled={
        isActive
      }
      className="rounded-full bg-white px-5 py-3 text-sm font-bold text-black disabled:opacity-50"
    >
      Enviar a revisión
    </button>
  ) : null}

  {opportunity.status ===
  'published' ? (
    <Link
      href={`/oportunidades/${opportunity.id}`}
      className="rounded-full border border-white/15 px-5 py-3 text-sm font-semibold"
    >
      Ver oportunidad
    </Link>
  ) : null}

  {opportunity.status ===
    'published' &&
  (
    opportunity.isOwner ||
    opportunity.canReview
  ) ? (
    <Link
      href={`/gestion-financiacion/${opportunity.id}/postulaciones`}
      className="rounded-full bg-[#D9FF00] px-5 py-3 text-sm font-bold text-black"
    >
      Gestionar postulaciones
    </Link>
  ) : null}
</div>

                      {opportunity.canReview &&
                      opportunity.status ===
                        'submitted' ? (
                        <div className="mt-6 border-t border-white/10 pt-5">
                          <textarea
                            value={
                              reviewNotes[
                                opportunity.id
                              ] || ''
                            }
                            onChange={(event) =>
                              setReviewNotes(
                                (current) => ({
                                  ...current,

                                  [opportunity.id]:
                                    event.target.value,
                                })
                              )
                            }
                            rows={3}
                            placeholder="Nota de revisión"
                            className={
                              textareaClassName
                            }
                          />

                          <div className="mt-4 grid grid-cols-2 gap-3">
                            <button
                              type="button"
                              onClick={() => {
                                void handleReview(
                                  opportunity.id,
                                  false
                                );
                              }}
                              disabled={
                                isActive
                              }
                              className="rounded-full border border-red-400/30 px-4 py-3 text-sm font-semibold text-red-300 disabled:opacity-50"
                            >
                              Devolver
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                void handleReview(
                                  opportunity.id,
                                  true
                                );
                              }}
                              disabled={
                                isActive
                              }
                              className="rounded-full bg-[#D9FF00] px-4 py-3 text-sm font-bold text-black disabled:opacity-50"
                            >
                              Publicar
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
    </main>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        htmlFor={
          htmlFor
        }
        className="mb-2 block text-sm font-medium text-[#BDBDBD]"
      >
        {label}
      </label>

      {children}
    </div>
  );
}

function formatAmountRange(
  opportunity:
    FundingOpportunity
): string {
  if (
    opportunity.amountMin ===
      null &&
    opportunity.amountMax ===
      null
  ) {
    return 'Monto por definir';
  }

  const formatter =
    new Intl.NumberFormat(
      'es-CO',
      {
        style:
          'currency',

        currency:
          opportunity.currency,

        maximumFractionDigits:
          0,
      }
    );

  if (
    opportunity.amountMin !==
      null &&
    opportunity.amountMax !==
      null
  ) {
    return `${formatter.format(
      opportunity.amountMin
    )} – ${formatter.format(
      opportunity.amountMax
    )}`;
  }

  return formatter.format(
    opportunity.amountMin ??
      opportunity.amountMax ??
      0
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

const inputClassName =
  'w-full rounded-2xl border border-white/10 bg-[#111111] px-5 py-4 text-white outline-none transition focus:border-[#D9FF00]';

const textareaClassName =
  'w-full resize-y rounded-2xl border border-white/10 bg-[#111111] px-5 py-4 leading-7 text-white outline-none transition focus:border-[#D9FF00]';