'use client';

import Link from 'next/link';
import {
  ProjectActorsEditor,
} from './ProjectActorsEditor';
import {
  type FormEvent,
  type ReactNode,
  useEffect,
  useState,
} from 'react';

import {
  loadProjectEditorialProfile,
  saveProjectEditorialProfile,
} from '../../services/editorial/projectEditorialService';

import type {
  ProjectEditorialProfile,
} from '../../services/editorial/projectEditorialService';

interface ProjectEditorialFormProps {
  projectId: string;
}

export function ProjectEditorialForm({
  projectId,
}: ProjectEditorialFormProps) {
  const [profile, setProfile] =
    useState<ProjectEditorialProfile | null>(
      null
    );

  const [slug, setSlug] =
    useState('');

  const [headline, setHeadline] =
    useState('');

  const [summary, setSummary] =
    useState('');

  const [body, setBody] =
    useState('');

  const [
    coverImageUrl,
    setCoverImageUrl,
  ] = useState('');

  const [city, setCity] =
    useState('');

  const [
    disciplinesText,
    setDisciplinesText,
  ] = useState('');

  const [credits, setCredits] =
    useState('');

  const [isLoading, setIsLoading] =
    useState(true);

  const [isSaving, setIsSaving] =
    useState(false);

  const [
    successMessage,
    setSuccessMessage,
  ] = useState('');

  const [
    errorMessage,
    setErrorMessage,
  ] = useState('');

  useEffect(() => {
    let isMounted = true;

    async function loadProfile() {
      setIsLoading(true);
      setErrorMessage('');

      try {
        const result =
          await loadProjectEditorialProfile(
            projectId
          );

        if (!isMounted) {
          return;
        }

        setProfile(result);
        populateForm(result);
      } catch (error) {
        if (isMounted) {
          setErrorMessage(
            getErrorMessage(error)
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadProfile();

    return () => {
      isMounted = false;
    };
  }, [projectId]);

  function populateForm(
    currentProfile:
      ProjectEditorialProfile
  ) {
    setSlug(currentProfile.slug);

    setHeadline(
      currentProfile.headline
    );

    setSummary(
      currentProfile.summary
    );

    setBody(currentProfile.body);

    setCoverImageUrl(
      currentProfile.coverImageUrl
    );

    setCity(currentProfile.city);

    setDisciplinesText(
      currentProfile.disciplines.join(
        ', '
      )
    );

    setCredits(
      currentProfile.credits
    );
  }

  async function handleSave(
    status: 'draft' | 'ready'
  ) {
    setIsSaving(true);
    setSuccessMessage('');
    setErrorMessage('');

    try {
      const result =
        await saveProjectEditorialProfile({
          projectId,
          slug,
          headline,
          summary,
          body,
          coverImageUrl,
          city,

          disciplines:
            disciplinesText
              .split(',')
              .map((value) =>
                value.trim()
              )
              .filter(Boolean),

          credits,
          status,
        });

      setProfile(result);
      populateForm(result);

      setSuccessMessage(
        status === 'ready'
          ? 'La ficha editorial quedó lista para publicación.'
          : 'El borrador editorial fue guardado.'
      );
    } catch (error) {
      setErrorMessage(
        getErrorMessage(error)
      );
    } finally {
      setIsSaving(false);
    }
  }

  function handleSubmit(
    event:
      FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    void handleSave('draft');
  }

  if (isLoading) {
    return (
      <main className="min-h-screen bg-[#050505] px-6 py-12 text-white">
        <div className="mx-auto max-w-6xl">
          <div className="h-4 w-48 animate-pulse rounded bg-[#222222]" />

          <div className="mt-8 h-16 w-3/4 animate-pulse rounded bg-[#111111]" />

          <div className="mt-10 h-[600px] animate-pulse rounded-[32px] bg-[#0A0A0A]" />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#050505] px-6 py-10 text-white sm:px-8 lg:px-12">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-col gap-7 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <Link
              href="/revision-editorial"
              className="text-sm text-[#777777] transition hover:text-white"
            >
              ← Volver a revisión editorial
            </Link>

            <p className="mt-8 text-xs font-bold uppercase tracking-[0.24em] text-[#D9FF00]">
              Cultura Esta · Medio
            </p>

            <h1 className="mt-3 max-w-4xl text-4xl font-bold tracking-[-0.04em] sm:text-6xl">
              Ficha editorial
            </h1>

            <p className="mt-5 max-w-3xl text-base leading-8 text-[#999999]">
              Convierte la estructura interna del
              proyecto en una historia pública clara,
              contextualizada y legible para la
              audiencia del medio.
            </p>
          </div>

          {profile ? (
            <div className="rounded-2xl border border-white/10 bg-[#0A0A0A] px-5 py-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#666666]">
                Estado editorial
              </p>

              <p className="mt-2 text-sm font-semibold text-[#D9FF00]">
                {getStatusLabel(
                  profile.status
                )}
              </p>
            </div>
          ) : null}
        </header>

        {errorMessage ? (
          <div className="mt-8 rounded-2xl border border-red-400/20 bg-red-400/10 px-5 py-4 text-sm leading-6 text-red-200">
            {errorMessage}
          </div>
        ) : null}

        {successMessage ? (
          <div className="mt-8 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-5 py-4 text-sm leading-6 text-emerald-200">
            {successMessage}
          </div>
        ) : null}

        <form
          onSubmit={handleSubmit}
          className="mt-10 space-y-6"
        >
          <section className="rounded-[32px] border border-white/10 bg-[#0A0A0A] p-7 md:p-9">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#767676]">
              Identidad editorial
            </p>

            <h2 className="mt-3 text-2xl font-bold">
              Cómo se presenta el proyecto
            </h2>

            <div className="mt-8 grid gap-6">
              <Field
                label="Titular editorial"
                htmlFor="editorial-headline"
              >
                <input
                  id="editorial-headline"
                  value={headline}
                  onChange={(event) =>
                    setHeadline(
                      event.target.value
                    )
                  }
                  placeholder="Un titular claro y atractivo"
                  className={inputClassName}
                />
              </Field>

              <Field
                label="URL pública"
                htmlFor="editorial-slug"
              >
                <div className="flex overflow-hidden rounded-2xl border border-white/10 bg-[#111111] focus-within:border-[#D9FF00]">
                  <span className="flex items-center border-r border-white/10 px-4 text-sm text-[#666666]">
                    /proyectos/
                  </span>

                  <input
                    id="editorial-slug"
                    value={slug}
                    onChange={(event) =>
                      setSlug(
                        event.target.value
                      )
                    }
                    className="min-w-0 flex-1 bg-transparent px-4 py-4 text-white outline-none"
                  />
                </div>
              </Field>

              <Field
                label="Resumen editorial"
                htmlFor="editorial-summary"
              >
                <textarea
                  id="editorial-summary"
                  value={summary}
                  onChange={(event) =>
                    setSummary(
                      event.target.value
                    )
                  }
                  placeholder="Explica por qué este proyecto importa."
                  rows={4}
                  className={
                    textareaClassName
                  }
                />
              </Field>
            </div>
          </section>

          <section className="rounded-[32px] border border-white/10 bg-[#0A0A0A] p-7 md:p-9">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#767676]">
              Relato
            </p>

            <h2 className="mt-3 text-2xl font-bold">
              La historia pública del proyecto
            </h2>

            <div className="mt-8">
              <Field
                label="Texto editorial"
                htmlFor="editorial-body"
              >
                <textarea
                  id="editorial-body"
                  value={body}
                  onChange={(event) =>
                    setBody(
                      event.target.value
                    )
                  }
                  placeholder="Cuenta el origen, el contexto, las personas involucradas, el proceso y lo que el proyecto está construyendo."
                  rows={14}
                  className={
                    textareaClassName
                  }
                />
              </Field>
            </div>
          </section>

          <section className="rounded-[32px] border border-white/10 bg-[#0A0A0A] p-7 md:p-9">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#767676]">
              Contexto visual y territorial
            </p>

            <div className="mt-8 grid gap-6 md:grid-cols-2">
              <Field
                label="Ciudad"
                htmlFor="editorial-city"
              >
                <input
                  id="editorial-city"
                  value={city}
                  onChange={(event) =>
                    setCity(
                      event.target.value
                    )
                  }
                  placeholder="Ej. Bogotá"
                  className={inputClassName}
                />
              </Field>

              <Field
                label="Disciplinas"
                htmlFor="editorial-disciplines"
              >
                <input
                  id="editorial-disciplines"
                  value={disciplinesText}
                  onChange={(event) =>
                    setDisciplinesText(
                      event.target.value
                    )
                  }
                  placeholder="Música, skate, diseño, fotografía"
                  className={inputClassName}
                />

                <p className="mt-2 text-xs text-[#666666]">
                  Separa cada disciplina con
                  una coma.
                </p>
              </Field>

              <Field
                label="URL de la imagen de portada"
                htmlFor="editorial-cover"
              >
                <input
                  id="editorial-cover"
                  type="url"
                  value={coverImageUrl}
                  onChange={(event) =>
                    setCoverImageUrl(
                      event.target.value
                    )
                  }
                  placeholder="https://..."
                  className={inputClassName}
                />
              </Field>

              <Field
                label="Créditos"
                htmlFor="editorial-credits"
              >
                <input
                  id="editorial-credits"
                  value={credits}
                  onChange={(event) =>
                    setCredits(
                      event.target.value
                    )
                  }
                  placeholder="Fotografía, producción, aliados..."
                  className={inputClassName}
                />
              </Field>
            </div>

            {coverImageUrl ? (
              <div className="mt-8 overflow-hidden rounded-3xl border border-white/10 bg-[#111111]">
                <img
                  src={coverImageUrl}
                  alt="Vista previa de la portada"
                  className="aspect-[16/9] w-full object-cover"
                />
              </div>
            ) : null}
          </section>
<ProjectActorsEditor
  projectId={projectId}
/>
          <div className="flex flex-col gap-4 rounded-[28px] border border-[#D9FF00]/20 bg-[#D9FF00]/5 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold text-white">
                Guardar o marcar como lista
              </p>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-[#888888]">
                La publicación final seguirá
                dependiendo del administrador
                del medio.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={isSaving}
                className="rounded-full border border-white/15 px-6 py-3 text-sm font-semibold text-white transition hover:border-white disabled:opacity-50"
              >
                Guardar borrador
              </button>

              <button
                type="button"
                onClick={() => {
                  void handleSave(
                    'ready'
                  );
                }}
                disabled={isSaving}
                className="rounded-full bg-[#D9FF00] px-6 py-3 text-sm font-bold text-black transition hover:bg-white disabled:opacity-50"
              >
                {isSaving
                  ? 'Guardando...'
                  : 'Marcar lista para publicar'}
              </button>
            </div>
          </div>
        </form>
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

function getStatusLabel(
  status: string
): string {
  const labels:
    Record<string, string> = {
      draft: 'Borrador',
      ready: 'Lista para publicar',
      published: 'Publicada',
      archived: 'Archivada',
    };

  return labels[status] ??
    status;
}

function getErrorMessage(
  error: unknown
): string {
  return error instanceof Error
    ? error.message
    : 'Ocurrió un error inesperado.';
}

const inputClassName =
  'w-full rounded-2xl border border-white/10 bg-[#111111] px-5 py-4 text-white outline-none transition placeholder:text-[#555555] focus:border-[#D9FF00]';

const textareaClassName =
  'w-full resize-y rounded-2xl border border-white/10 bg-[#111111] px-5 py-4 leading-7 text-white outline-none transition placeholder:text-[#555555] focus:border-[#D9FF00]';