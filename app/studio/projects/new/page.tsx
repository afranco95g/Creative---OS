'use client';

import Link from 'next/link';
import { useSyncExternalStore } from 'react';

import { workspaceStore } from '@/core/workspaceStore';
import { ProjectCreationWizard } from '@/components/projects/creation/ProjectCreationWizard';

export default function NewProjectPage() {
  const workspaceState = useSyncExternalStore(
    (listener) => workspaceStore.subscribe(() => listener()),
    () => workspaceStore.getSnapshot(),
    () => null
  );

  const activeContext = workspaceState?.contexts.find(
    (context) => context.id === workspaceState.activeContextId
  );

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
            Selecciona primero un contexto dentro de Creative OS.
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
        <ProjectCreationWizard contextId={activeContext.id} />
      </main>
    </div>
  );
}
