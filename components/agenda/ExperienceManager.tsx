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
  ExperienceImageUpload,
} from './ExperienceImageUpload';

import {
  createExperience,
  loadExperienceRelationOptions,
  loadManageableExperiences,
  reviewExperience,
  submitExperienceForReview,
  updateExperience,
} from '../../services/agenda/experienceService';

import type {
  ExperienceFormInput,
  ExperienceRelationOption,
  ExperienceStatus,
  ExperienceType,
  ManagedExperience,
} from '../../services/agenda/experienceService';

const typeLabels: Record<
  ExperienceType,
  string
> = {
  event: 'Evento',
  workshop: 'Taller',
  class: 'Clase',
  laboratory: 'Laboratorio',
  exhibition: 'Exposición',
  concert: 'Concierto',
  meeting: 'Encuentro',
  activation: 'Activación',
  residency: 'Residencia',
  call: 'Convocatoria',
  other: 'Otro',
};

const statusLabels: Record<
  ExperienceStatus,
  string
> = {
  draft: 'Borrador',
  submitted: 'En revisión',
  published: 'Publicada',
  rejected: 'Requiere cambios',
  cancelled: 'Cancelada',
  archived: 'Archivada',
};

const initialForm: ExperienceFormInput = {
  title: '',
  summary: '',
  description: '',
  experienceType: 'event',
  city: '',
  venueName: '',
  address: '',
  startsAt: '',
  endsAt: '',
  capacity: '',
  ticketUrl: '',
  coverImageUrl: '',
  projectId: '',
  hostSpaceId: '',
};

export function ExperienceManager() {
  const [
    experiences,
    setExperiences,
  ] = useState<ManagedExperience[]>([]);

  const [
    relationOptions,
    setRelationOptions,
  ] = useState<
    ExperienceRelationOption[]
  >([]);

  const [
    form,
    setForm,
  ] = useState<ExperienceFormInput>(
    initialForm
  );

  const [
    editingExperienceId,
    setEditingExperienceId,
  ] = useState<string | null>(null);

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
    isSaving,
    setIsSaving,
  ] = useState(false);

  const [
    activeExperienceId,
    setActiveExperienceId,
  ] = useState<string | null>(null);

  const [
    successMessage,
    setSuccessMessage,
  ] = useState('');

  const [
    errorMessage,
    setErrorMessage,
  ] = useState('');

  useEffect(() => {
    void loadData();
  }, []);

  const projectOptions =
    useMemo(
      () =>
        relationOptions.filter(
          (option) =>
            option.optionType ===
            'project'
        ),
      [relationOptions]
    );

  const spaceOptions =
    useMemo(
      () =>
        relationOptions.filter(
          (option) =>
            option.optionType ===
            'space'
        ),
      [relationOptions]
    );

  async function loadData() {
    setIsLoading(true);
    setErrorMessage('');

    try {
      const [
        experiencesResult,
        optionsResult,
      ] = await Promise.all([
        loadManageableExperiences(),
        loadExperienceRelationOptions(),
      ]);

      setExperiences(
        experiencesResult
      );

      setRelationOptions(
        optionsResult
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
    Key extends keyof ExperienceFormInput
  >(
    key: Key,
    value: ExperienceFormInput[Key]
  ) {
    setForm(
      (current) => ({
        ...current,
        [key]: value,
      })
    );
  }

  function resetForm() {
    setForm(initialForm);
    setEditingExperienceId(null);
  }

  function beginEditing(
    experience: ManagedExperience
  ) {
    setEditingExperienceId(
      experience.id
    );

    setForm({
      title:
        experience.title,

      summary:
        experience.summary,

      description:
        experience.description,

      experienceType:
        experience.experienceType,

      city:
        experience.city,

      venueName:
        experience.venueName,

      address:
        experience.address,

      startsAt:
        toDateTimeLocalValue(
          experience.startsAt
        ),

      endsAt:
        experience.endsAt
          ? toDateTimeLocalValue(
              experience.endsAt
            )
          : '',

      capacity:
        experience.capacity === null
          ? ''
          : String(
              experience.capacity
            ),

      ticketUrl:
        experience.ticketUrl,

      coverImageUrl:
        experience.coverImageUrl,

      projectId:
        experience.projectId ?? '',

      hostSpaceId:
        experience.hostSpaceId ?? '',
    });

    setSuccessMessage('');
    setErrorMessage('');

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  }

  async function handleSave(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setIsSaving(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      if (editingExperienceId) {
        await updateExperience(
          editingExperienceId,
          form
        );

        setSuccessMessage(
          'Los cambios de la experiencia fueron guardados.'
        );
      } else {
        await createExperience(form);

        setSuccessMessage(
          'La experiencia fue creada como borrador.'
        );
      }

      resetForm();
      await loadData();
    } catch (error) {
      setErrorMessage(
        getErrorMessage(error)
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleSubmit(
    experienceId: string
  ) {
    setActiveExperienceId(
      experienceId
    );

    setErrorMessage('');
    setSuccessMessage('');

    try {
      await submitExperienceForReview(
        experienceId
      );

      setSuccessMessage(
        'La experiencia fue enviada a revisión.'
      );

      await loadData();
    } catch (error) {
      setErrorMessage(
        getErrorMessage(error)
      );
    } finally {
      setActiveExperienceId(null);
    }
  }

  async function handleReview(
    experienceId: string,
    approved: boolean
  ) {
    setActiveExperienceId(
      experienceId
    );

    setErrorMessage('');
    setSuccessMessage('');

    try {
      await reviewExperience(
        experienceId,
        approved,
        notes[experienceId] || ''
      );

      setSuccessMessage(
        approved
          ? 'La experiencia fue publicada en la agenda.'
          : 'La experiencia fue devuelta para realizar cambios.'
      );

      await loadData();
    } catch (error) {
      setErrorMessage(
        getErrorMessage(error)
      );
    } finally {
      setActiveExperienceId(null);
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
              Programación cultural
            </p>

            <h1 className="mt-3 text-4xl font-bold tracking-[-0.04em] sm:text-6xl">
              Gestión de agenda
            </h1>

            <p className="mt-5 max-w-3xl text-base leading-8 text-[#999999]">
              Crea y administra eventos,
              talleres, clases, laboratorios,
              activaciones, convocatorias y
              otras experiencias del ecosistema.
            </p>
          </div>

          <Link
            href="/agenda"
            className="rounded-full border border-white/15 px-5 py-3 text-sm font-semibold transition hover:border-white"
          >
            Ver agenda pública
          </Link>
        </header>

        {errorMessage ? (
          <div className="mt-8 rounded-2xl border border-red-400/20 bg-red-400/10 px-5 py-4 text-sm text-red-200">
            {errorMessage}
          </div>
        ) : null}

        {successMessage ? (
          <div className="mt-8 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-5 py-4 text-sm text-emerald-200">
            {successMessage}
          </div>
        ) : null}

        <section className="mt-10 rounded-[32px] border border-white/10 bg-[#0A0A0A] p-7 md:p-9">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#767676]">
                {editingExperienceId
                  ? 'Editar experiencia'
                  : 'Nueva experiencia'}
              </p>

              <h2 className="mt-3 text-3xl font-bold">
                {editingExperienceId
                  ? 'Corregir o actualizar actividad'
                  : 'Crear una actividad'}
              </h2>
            </div>

            {editingExperienceId ? (
              <button
                type="button"
                onClick={resetForm}
                className="self-start rounded-full border border-white/15 px-5 py-3 text-sm font-semibold"
              >
                Cancelar edición
              </button>
            ) : null}
          </div>

          <form
            onSubmit={handleSave}
            className="mt-8 grid gap-6 md:grid-cols-2"
          >
            <Field
              label="Nombre"
              htmlFor="experience-title"
            >
              <input
                id="experience-title"
                value={form.title}
                onChange={(event) =>
                  updateField(
                    'title',
                    event.target.value
                  )
                }
                className={inputClassName}
              />
            </Field>

            <Field
              label="Tipo"
              htmlFor="experience-type"
            >
              <select
                id="experience-type"
                value={
                  form.experienceType
                }
                onChange={(event) =>
                  updateField(
                    'experienceType',
                    event.target
                      .value as ExperienceType
                  )
                }
                className={inputClassName}
              >
                {(
                  Object.keys(
                    typeLabels
                  ) as ExperienceType[]
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

            <Field
              label="Proyecto relacionado"
              htmlFor="experience-project"
            >
              <select
                id="experience-project"
                value={form.projectId}
                onChange={(event) =>
                  updateField(
                    'projectId',
                    event.target.value
                  )
                }
                className={inputClassName}
              >
                <option value="">
                  Sin proyecto relacionado
                </option>

                {projectOptions.map(
                  (option) => (
                    <option
                      key={option.optionId}
                      value={option.optionId}
                    >
                      {option.name}
                    </option>
                  )
                )}
              </select>

              <p className="mt-2 text-xs text-[#666666]">
                Puedes relacionar la
                actividad con uno de tus
                proyectos o con un proyecto
                público.
              </p>
            </Field>

            <Field
              label="Espacio anfitrión"
              htmlFor="experience-space"
            >
              <select
                id="experience-space"
                value={form.hostSpaceId}
                onChange={(event) =>
                  updateField(
                    'hostSpaceId',
                    event.target.value
                  )
                }
                className={inputClassName}
              >
                <option value="">
                  Sin espacio vinculado
                </option>

                {spaceOptions.map(
                  (option) => (
                    <option
                      key={option.optionId}
                      value={option.optionId}
                    >
                      {option.name}
                    </option>
                  )
                )}
              </select>

              <p className="mt-2 text-xs text-[#666666]">
                Solo aparecen espacios
                publicados o disponibles para
                administración.
              </p>
            </Field>

            <div className="md:col-span-2">
              <Field
                label="Resumen"
                htmlFor="experience-summary"
              >
                <textarea
                  id="experience-summary"
                  value={form.summary}
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
                htmlFor="experience-description"
              >
                <textarea
                  id="experience-description"
                  value={form.description}
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
              label="Ciudad"
              htmlFor="experience-city"
            >
              <input
                id="experience-city"
                value={form.city}
                onChange={(event) =>
                  updateField(
                    'city',
                    event.target.value
                  )
                }
                className={inputClassName}
              />
            </Field>

            <Field
              label="Lugar"
              htmlFor="experience-venue"
            >
              <input
                id="experience-venue"
                value={form.venueName}
                onChange={(event) =>
                  updateField(
                    'venueName',
                    event.target.value
                  )
                }
                className={inputClassName}
              />
            </Field>

            <Field
              label="Dirección"
              htmlFor="experience-address"
            >
              <input
                id="experience-address"
                value={form.address}
                onChange={(event) =>
                  updateField(
                    'address',
                    event.target.value
                  )
                }
                className={inputClassName}
              />
            </Field>

            <Field
              label="Capacidad"
              htmlFor="experience-capacity"
            >
              <input
                id="experience-capacity"
                type="number"
                min="0"
                value={form.capacity}
                onChange={(event) =>
                  updateField(
                    'capacity',
                    event.target.value
                  )
                }
                className={inputClassName}
              />
            </Field>

            <Field
              label="Inicio"
              htmlFor="experience-start"
            >
              <input
                id="experience-start"
                type="datetime-local"
                value={form.startsAt}
                onChange={(event) =>
                  updateField(
                    'startsAt',
                    event.target.value
                  )
                }
                className={inputClassName}
              />
            </Field>

            <Field
              label="Finalización"
              htmlFor="experience-end"
            >
              <input
                id="experience-end"
                type="datetime-local"
                value={form.endsAt}
                onChange={(event) =>
                  updateField(
                    'endsAt',
                    event.target.value
                  )
                }
                className={inputClassName}
              />
            </Field>

            <div className="md:col-span-2">
              <Field
                label="Enlace de inscripción o entradas"
                htmlFor="experience-ticket"
              >
                <input
                  id="experience-ticket"
                  type="url"
                  value={form.ticketUrl}
                  onChange={(event) =>
                    updateField(
                      'ticketUrl',
                      event.target.value
                    )
                  }
                  placeholder="https://..."
                  className={inputClassName}
                />
              </Field>
            </div>

            <div className="md:col-span-2">
              <ExperienceImageUpload
                value={
                  form.coverImageUrl
                }
                onChange={(imageUrl) =>
                  updateField(
                    'coverImageUrl',
                    imageUrl
                  )
                }
                disabled={isSaving}
              />
            </div>

            <div className="md:col-span-2 flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={isSaving}
                className="rounded-full bg-[#D9FF00] px-6 py-3 text-sm font-bold text-black transition hover:bg-white disabled:opacity-50"
              >
                {isSaving
                  ? 'Guardando...'
                  : editingExperienceId
                    ? 'Guardar cambios'
                    : 'Crear borrador'}
              </button>

              {editingExperienceId ? (
                <button
                  type="button"
                  onClick={resetForm}
                  disabled={isSaving}
                  className="rounded-full border border-white/15 px-6 py-3 text-sm font-semibold disabled:opacity-50"
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
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#767676]">
                Programación
              </p>

              <h2 className="mt-3 text-3xl font-bold">
                Experiencias registradas
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
          ) : experiences.length === 0 ? (
            <div className="mt-7 rounded-3xl border border-dashed border-white/15 p-8 text-[#777777]">
              Todavía no hay experiencias
              registradas.
            </div>
          ) : (
            <div className="mt-7 grid gap-5 md:grid-cols-2">
              {experiences.map(
                (experience) => (
                  <ExperienceCard
                    key={experience.id}
                    experience={experience}
                    projectName={findRelationName(
                      projectOptions,
                      experience.projectId
                    )}
                    spaceName={findRelationName(
                      spaceOptions,
                      experience.hostSpaceId
                    )}
                    note={
                      notes[experience.id] ||
                      ''
                    }
                    onNoteChange={(value) =>
                      setNotes(
                        (current) => ({
                          ...current,
                          [experience.id]:
                            value,
                        })
                      )
                    }
                    onEdit={beginEditing}
                    onSubmit={handleSubmit}
                    onReview={handleReview}
                    isWorking={
                      activeExperienceId ===
                      experience.id
                    }
                  />
                )
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function ExperienceCard({
  experience,
  projectName,
  spaceName,
  note,
  onNoteChange,
  onEdit,
  onSubmit,
  onReview,
  isWorking,
}: {
  experience: ManagedExperience;
  projectName: string;
  spaceName: string;
  note: string;

  onNoteChange:
    (value: string) => void;

  onEdit:
    (
      experience: ManagedExperience
    ) => void;

  onSubmit:
    (
      experienceId: string
    ) => Promise<void>;

  onReview:
    (
      experienceId: string,
      approved: boolean
    ) => Promise<void>;

  isWorking: boolean;
}) {
  const startDate =
    new Date(
      experience.startsAt
    );

  const canEdit =
    (
      experience.isOwner ||
      experience.canReview
    ) &&
    (
      experience.status === 'draft' ||
      experience.status === 'rejected'
    );

  return (
    <article className="rounded-3xl border border-white/10 bg-[#0A0A0A] p-6">
      {experience.coverImageUrl ? (
        <img
          src={
            experience.coverImageUrl
          }
          alt={experience.title}
          className="mb-6 aspect-[16/9] w-full rounded-2xl object-cover"
        />
      ) : null}

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <span className="rounded-full border border-[#D9FF00]/20 bg-[#D9FF00]/10 px-3 py-1 text-[10px] font-bold uppercase text-[#D9FF00]">
            {
              statusLabels[
                experience.status
              ]
            }
          </span>

          <h3 className="mt-5 text-2xl font-bold">
            {experience.title}
          </h3>

          <p className="mt-2 text-xs uppercase tracking-[0.14em] text-[#777777]">
            {
              typeLabels[
                experience.experienceType
              ]
            }
          </p>
        </div>

        <p className="text-right text-sm text-[#777777]">
          {startDate.toLocaleDateString(
            'es-CO',
            {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            }
          )}

          <span className="block">
            {startDate.toLocaleTimeString(
              'es-CO',
              {
                hour: '2-digit',
                minute: '2-digit',
              }
            )}
          </span>
        </p>
      </div>

      <p className="mt-5 text-sm leading-7 text-[#999999]">
        {experience.summary ||
          'Sin resumen.'}
      </p>

      <p className="mt-4 text-xs text-[#666666]">
        {[
          experience.venueName,
          experience.city,
        ]
          .filter(Boolean)
          .join(' · ')}
      </p>

      {projectName ? (
        <div className="mt-5 rounded-2xl border border-white/10 bg-[#111111] px-4 py-3">
          <p className="text-[10px] uppercase tracking-[0.14em] text-[#666666]">
            Proyecto relacionado
          </p>

          <p className="mt-2 text-sm font-semibold">
            {projectName}
          </p>
        </div>
      ) : null}

      {spaceName ? (
        <div className="mt-3 rounded-2xl border border-white/10 bg-[#111111] px-4 py-3">
          <p className="text-[10px] uppercase tracking-[0.14em] text-[#666666]">
            Espacio anfitrión
          </p>

          <p className="mt-2 text-sm font-semibold">
            {spaceName}
          </p>
        </div>
      ) : null}

      <p className="mt-5 text-xs text-[#555555]">
        Creado por{' '}
        {experience.ownerName}
      </p>

      {experience.reviewNote ? (
        <div className="mt-5 rounded-2xl border border-white/10 bg-[#111111] p-4">
          <p className="text-[10px] uppercase tracking-[0.14em] text-[#666666]">
            Nota de revisión
          </p>

          <p className="mt-2 text-sm text-[#999999]">
            {experience.reviewNote}
          </p>
        </div>
      ) : null}

      {canEdit ? (
        <button
          type="button"
          onClick={() =>
            onEdit(experience)
          }
          disabled={isWorking}
          className="mt-6 rounded-full border border-white/15 px-5 py-3 text-sm font-semibold transition hover:border-[#D9FF00] hover:text-[#D9FF00] disabled:opacity-50"
        >
          Editar actividad
        </button>
      ) : null}

      {experience.isOwner &&
      (
        experience.status ===
          'draft' ||
        experience.status ===
          'rejected'
      ) ? (
        <button
          type="button"
          onClick={() => {
            void onSubmit(
              experience.id
            );
          }}
          disabled={isWorking}
          className="ml-3 mt-6 rounded-full bg-white px-5 py-3 text-sm font-bold text-black disabled:opacity-50"
        >
          Enviar a revisión
        </button>
      ) : null}

      {experience.canReview &&
      experience.status ===
        'submitted' ? (
        <div className="mt-6 border-t border-white/10 pt-5">
          <textarea
            value={note}
            onChange={(event) =>
              onNoteChange(
                event.target.value
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
                void onReview(
                  experience.id,
                  false
                );
              }}
              disabled={isWorking}
              className="rounded-full border border-red-400/30 px-4 py-3 text-sm font-semibold text-red-300 disabled:opacity-50"
            >
              Devolver
            </button>

            <button
              type="button"
              onClick={() => {
                void onReview(
                  experience.id,
                  true
                );
              }}
              disabled={isWorking}
              className="rounded-full bg-[#D9FF00] px-4 py-3 text-sm font-bold text-black disabled:opacity-50"
            >
              Publicar
            </button>
          </div>
        </div>
      ) : null}

      {experience.status ===
      'published' ? (
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href={`/agenda/${experience.slug}`}
            className="rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-[#D9FF00] transition hover:border-[#D9FF00]"
          >
            Ver actividad pública
          </Link>

          {experience.isOwner ||
          experience.canReview ? (
            <>
              <Link
                href={`/gestion-agenda/${experience.id}/asistentes`}
                className="rounded-full bg-white px-5 py-3 text-sm font-bold text-black transition hover:bg-[#D9FF00]"
              >
                Gestionar asistentes
              </Link>

              <Link
                href={`/gestion-agenda/${experience.id}/reporte`}
                className="rounded-full border border-[#D9FF00]/30 px-5 py-3 text-sm font-semibold text-[#D9FF00] transition hover:bg-[#D9FF00] hover:text-black"
              >
                Crear o revisar reporte
              </Link>
            </>
          ) : null}
        </div>
      ) : null}
    </article>
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

function findRelationName(
  options:
    ExperienceRelationOption[],
  optionId:
    string | null
): string {
  if (!optionId) {
    return '';
  }

  return (
    options.find(
      (option) =>
        option.optionId ===
        optionId
    )?.name ?? ''
  );
}

function toDateTimeLocalValue(
  value: string
): string {
  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return '';
  }

  const timezoneOffset =
    date.getTimezoneOffset() *
    60_000;

  return new Date(
    date.getTime() -
      timezoneOffset
  )
    .toISOString()
    .slice(0, 16);
}

function getErrorMessage(
  error: unknown
): string {
  return error instanceof Error
    ? error.message
    : 'Ocurrió un error inesperado.';
}

const inputClassName =
  'w-full rounded-2xl border border-white/10 bg-[#111111] px-5 py-4 text-white outline-none transition focus:border-[#D9FF00]';

const textareaClassName =
  'w-full resize-y rounded-2xl border border-white/10 bg-[#111111] px-5 py-4 leading-7 text-white outline-none transition focus:border-[#D9FF00]';