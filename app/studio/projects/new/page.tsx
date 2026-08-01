'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  useState,
  useSyncExternalStore,
} from 'react';
import type { FormEvent } from 'react';

import { workspaceStore } from '@/core/workspaceStore';
import type { WorkspaceProject } from '@/types/workspace';

const projectTypes = [
  {
    id: 'creative-project',
    name: 'Proyecto creativo',
    description:
      'Una exposición, producción audiovisual, publicación, álbum, laboratorio o proceso artístico.',
    category: 'artistic',
  },
  {
    id: 'event',
    name: 'Evento o experiencia',
    description:
      'Un festival, encuentro, taller, convocatoria, activación o programación cultural.',
    category: 'event',
  },
  {
    id: 'space',
    name: 'Espacio cultural',
    description:
      'Un taller, estudio, galería, escenario, residencia o espacio independiente.',
    category: 'cultural',
  },
  {
    id: 'initiative',
    name: 'Iniciativa u organización',
    description:
      'Un colectivo, fundación, medio, marca cultural o proceso comunitario.',
    category: 'social',
  },
] satisfies Array<{
  id: string;
  name: string;
  description: string;
  category: WorkspaceProject['category'];
}>;

type ProjectTypeId =
  (typeof projectTypes)[number]['id'];

export default function NewProjectPage() {
  const router = useRouter();

  const workspaceState = useSyncExternalStore(
    (listener) =>
      workspaceStore.subscribe(() => listener()),
    () => workspaceStore.getSnapshot(),
    () => null
  );

  const [selectedTypeId, setSelectedTypeId] =
    useState<ProjectTypeId | null>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] =
    useState('');

  const selectedType = projectTypes.find(
    (type) => type.id === selectedTypeId
  );

  const activeContext =
    workspaceState?.contexts.find(
      (context) =>
        context.id ===
        workspaceState.activeContextId
    );

  function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const cleanTitle = title.trim();
    const cleanDescription =
      description.trim();

    if (
      !cleanTitle ||
      !selectedType ||
      !activeContext
    ) {
      return;
    }

    workspaceStore.createProject(
      cleanTitle,
      cleanDescription,
      selectedType.category,
      activeContext.id
    );

    router.push('/workspace');
  }

  if (!workspaceState) {
    return (
      <div className="min-h-screen bg-neutral-950 px-6 py-12 text-white">
        <div className="mx-auto max-w-5xl">
          <div className="h-8 w-72 animate-pulse rounded bg-neutral-800" />

          <div className="mt-12 grid gap-4 md:grid-cols-2">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="h-52 animate-pulse rounded-3xl border border-neutral-800 bg-neutral-900"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!activeContext) {
    return (
      <main className="min-h-screen bg-neutral-950 px-6 py-12 text-white">
        <div className="mx-auto max-w-3xl rounded-3xl border border-neutral-800 bg-neutral-900 p-8">
          <h1 className="text-2xl font-bold">
            No hay un contexto activo
          </h1>

          <p className="mt-3 text-neutral-400">
            Selecciona primero un contexto dentro
            de Creative OS.
          </p>

          <Link
            href="/studio"
            className="mt-6 inline-flex rounded-full bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-neutral-200"
          >
            Seleccionar contexto
          </Link>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <header className="border-b border-white/10 px-6 py-6 sm:px-10">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-neutral-500">
              Creative OS · {activeContext.name}
            </p>

            <h1 className="mt-2 text-2xl font-bold tracking-tight">
              Crear un proyecto
            </h1>
          </div>

          <Link
            href="/workspace"
            className="text-sm text-neutral-400 transition hover:text-white"
          >
            Cancelar
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-12 sm:px-10">
        {!selectedType ? (
          <>
            <section className="max-w-3xl">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-neutral-500">
                Primer paso
              </p>

              <h2 className="mt-4 text-4xl font-black tracking-[-0.04em] sm:text-5xl">
                ¿Qué quieres poner en movimiento?
              </h2>

              <p className="mt-5 max-w-2xl text-lg leading-8 text-neutral-400">
                Creative OS te ayudará a convertir
                la idea en una estructura operable
                y conectarla con personas, espacios,
                recursos y oportunidades.
              </p>
            </section>

            <section className="mt-12">
              <p className="mb-5 text-sm font-medium text-neutral-300">
                Selecciona el tipo de proyecto
              </p>

              <div className="grid gap-4 md:grid-cols-2">
                {projectTypes.map((type) => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() =>
                      setSelectedTypeId(type.id)
                    }
                    className="group min-h-52 rounded-3xl border border-white/10 bg-white/[0.035] p-6 text-left transition hover:border-white/30 hover:bg-white/[0.07]"
                  >
                    <div className="flex h-full flex-col">
                      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">
                        Tipo de proyecto
                      </span>

                      <h3 className="mt-8 text-2xl font-bold tracking-tight">
                        {type.name}
                      </h3>

                      <p className="mt-3 flex-1 text-sm leading-6 text-neutral-400">
                        {type.description}
                      </p>

                      <span className="mt-8 text-sm font-semibold text-neutral-200 transition group-hover:translate-x-1">
                        Seleccionar →
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </section>
          </>
        ) : (
          <>
            <section className="max-w-3xl">
              <button
                type="button"
                onClick={() =>
                  setSelectedTypeId(null)
                }
                className="text-sm text-neutral-500 transition hover:text-white"
              >
                ← Cambiar tipo
              </button>

              <p className="mt-8 text-sm font-semibold uppercase tracking-[0.2em] text-neutral-500">
                Segundo paso
              </p>

              <h2 className="mt-4 text-4xl font-black tracking-[-0.04em] sm:text-5xl">
                Cuéntanos qué estás creando
              </h2>

              <p className="mt-5 max-w-2xl text-lg leading-8 text-neutral-400">
                Crearás un{' '}
                <strong className="font-semibold text-white">
                  {selectedType.name}
                </strong>{' '}
                dentro del contexto{' '}
                <strong className="font-semibold text-white">
                  {activeContext.name}
                </strong>
                .
              </p>
            </section>

            <form
              onSubmit={handleSubmit}
              className="mt-10 rounded-3xl border border-white/10 bg-white/[0.035] p-7 sm:p-9"
            >
              <div className="grid gap-6">
                <label className="grid gap-2">
                  <span className="text-sm font-semibold text-neutral-300">
                    Nombre del proyecto
                  </span>

                  <input
                    type="text"
                    value={title}
                    onChange={(event) =>
                      setTitle(event.target.value)
                    }
                    placeholder="Ej. Reserva Pájaro Jaguar"
                    required
                    autoFocus
                    className="rounded-2xl border border-neutral-700 bg-neutral-950 px-4 py-3.5 text-white outline-none transition placeholder:text-neutral-600 focus:border-white"
                  />
                </label>

                <label className="grid gap-2">
                  <span className="text-sm font-semibold text-neutral-300">
                    Descripción inicial
                  </span>

                  <textarea
                    value={description}
                    onChange={(event) =>
                      setDescription(
                        event.target.value
                      )
                    }
                    placeholder="Describe brevemente qué es, dónde sucede y qué busca desarrollar."
                    rows={5}
                    className="resize-none rounded-2xl border border-neutral-700 bg-neutral-950 px-4 py-3.5 text-white outline-none transition placeholder:text-neutral-600 focus:border-white"
                  />
                </label>
              </div>

              <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
                <p className="text-sm text-neutral-500">
                  Se creará en{' '}
                  {activeContext.name}
                </p>

                <button
                  type="submit"
                  disabled={!title.trim()}
                  className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-black transition hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Crear proyecto
                </button>
              </div>
            </form>
          </>
        )}

        <section className="mt-12 rounded-3xl border border-white/10 bg-white/[0.025] p-7">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">
            Lo que construiremos
          </p>

          <div className="mt-5 grid gap-5 text-sm text-neutral-300 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="font-semibold text-white">
                Propósito
              </p>

              <p className="mt-2 leading-6 text-neutral-500">
                Problema, visión, contexto y
                comunidad.
              </p>
            </div>

            <div>
              <p className="font-semibold text-white">
                Estructura
              </p>

              <p className="mt-2 leading-6 text-neutral-500">
                Objetivos, tareas, equipo y
                cronograma.
              </p>
            </div>

            <div>
              <p className="font-semibold text-white">
                Recursos
              </p>

              <p className="mt-2 leading-6 text-neutral-500">
                Presupuesto, espacios, aliados y
                necesidades.
              </p>
            </div>

            <div>
              <p className="font-semibold text-white">
                Ecosistema
              </p>

              <p className="mt-2 leading-6 text-neutral-500">
                Conexiones, oportunidades y
                circulación.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}