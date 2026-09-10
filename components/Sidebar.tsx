'use client';

import Link from 'next/link';

import {
  usePathname,
} from 'next/navigation';

import type {
  ProjectGraph,
} from '../types/project';

export type AppView =
  | 'producer'
  | 'project'
  | 'documents'
  | 'diagnosis'
  | 'log';

interface SidebarProps {
  activeView: AppView;
  setActiveView: (
    view: AppView
  ) => void;
  graph: ProjectGraph;
  progress: number;
  onBackToWorkspace: () => void;
}

const NAV_ITEMS: Array<{
  id: AppView;
  label: string;
}> = [
  {
    id: 'producer',
    label: 'Productor Ejecutivo',
  },
  {
    id: 'project',
    label: 'Proyecto',
  },
  {
    id: 'documents',
    label: 'Herramientas',
  },
  {
    id: 'diagnosis',
    label: 'Executive Review',
  },
  {
    id: 'log',
    label: 'Bitácora Viva',
  },
];

export function Sidebar({
  activeView,
  setActiveView,
  graph,
  progress,
  onBackToWorkspace,
}: SidebarProps) {
  const pathname =
    usePathname();

  const projectPath =
    pathname.endsWith(
      '/continuity'
    )
      ? pathname.replace(
          /\/continuity$/,
          ''
        )
      : pathname.replace(
          /\/$/,
          ''
        );

  const continuityHref =
    `${projectPath}/continuity`;

  return (
    <aside className="sticky top-0 flex h-screen w-[280px] shrink-0 flex-col justify-between overflow-y-auto border-r border-borde bg-superficie-elevada p-6">
      <div>
        <div className="mb-8 flex flex-col gap-3">
          <Link
            href="/"
            className="text-xs text-texto-largo transition hover:text-texto-principal"
          >
            ← Volver al medio
          </Link>

          <button
            type="button"
            onClick={
              onBackToWorkspace
            }
            className="text-left text-xs text-texto-largo transition hover:text-texto-largo"
          >
            ← Volver al estudio
          </button>
        </div>

        <div className="mb-10">
          <p className="text-sm font-bold uppercase tracking-[0.28em] text-texto-principal">
            Creative OS
          </p>

          <p className="mt-2 text-xs leading-relaxed text-texto-largo">
            Sistema operativo para
            construir, fortalecer y
            activar proyectos.
          </p>
        </div>

        <div className="mb-8 rounded-2xl border border-borde bg-superficie-elevada p-4">
          <div className="flex items-center justify-between text-xs">
            <span className="text-texto-largo">
              Construcción
            </span>

            <span className="text-texto-largo">
              {progress}%
            </span>
          </div>

          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-borde">
            <div
              className="h-full rounded-full bg-rojo-base transition-all duration-500"
              style={{
                width: `${progress}%`,
              }}
            />
          </div>
        </div>

        <nav className="space-y-2">
          {NAV_ITEMS.map(
            (item) => {
              const isActive =
                activeView ===
                item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() =>
                    setActiveView(
                      item.id
                    )
                  }
                  className={[
                    'w-full rounded-xl px-4 py-3 text-left text-sm transition',
                    isActive
                      ? 'bg-rojo-base font-semibold text-hueso'
                      : 'text-texto-largo hover:bg-superficie hover:text-texto-largo',
                  ].join(' ')}
                >
                  {item.label}
                </button>
              );
            }
          )}
        </nav>

        <div className="mt-6 border-t border-borde pt-6">
          <p className="mb-3 px-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-texto-largo">
            Inteligencia y continuidad
          </p>

          <Link
            href={
              continuityHref
            }
            className="block w-full rounded-xl border border-borde bg-superficie-elevada px-4 py-3 text-left text-sm text-texto-largo transition hover:border-acento hover:text-texto-largo"
          >
            <span className="block font-medium text-texto-largo">
              Memoria y continuidad
            </span>

            <span className="mt-1 block text-xs leading-5 text-texto-largo">
              Executive Memory,
              exportación y handoff.
            </span>
          </Link>
        </div>

        <div className="mt-6 border-t border-borde pt-6">
          <p className="mb-3 px-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-texto-largo">
            Ecosistema
          </p>

          <Link
            href="/ecosistema"
            className="block rounded-xl px-4 py-3 text-sm text-texto-largo transition hover:bg-superficie hover:text-texto-largo"
          >
            Personas y conexiones
          </Link>
        </div>
      </div>

      <div className="mt-8 rounded-2xl border border-borde bg-superficie-elevada p-4">
        <p className="text-xs text-texto-largo">
          Proyecto activo
        </p>

        <p className="mt-1 text-sm font-medium text-texto-largo">
          {graph.title}
        </p>

        <p className="mt-2 text-xs capitalize text-texto-largo">
          Estado:{' '}
          {graph.stage.replaceAll(
            '_',
            ' '
          )}
        </p>
      </div>
    </aside>
  );
}
