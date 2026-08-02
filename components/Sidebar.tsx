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
    label: 'Documentos',
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
    <aside className="sticky top-0 flex h-screen w-[280px] shrink-0 flex-col justify-between overflow-y-auto border-r border-[#232323] bg-[#080808] p-6">
      <div>
        <div className="mb-8 flex flex-col gap-3">
          <Link
            href="/"
            className="text-xs text-[#767676] transition hover:text-[#D9FF00]"
          >
            ← Volver al medio
          </Link>

          <button
            type="button"
            onClick={
              onBackToWorkspace
            }
            className="text-left text-xs text-[#767676] transition hover:text-white"
          >
            ← Volver al estudio
          </button>
        </div>

        <div className="mb-10">
          <p className="text-sm font-bold uppercase tracking-[0.28em] text-[#D9FF00]">
            Creative OS
          </p>

          <p className="mt-2 text-xs leading-relaxed text-[#767676]">
            Sistema operativo para
            construir, fortalecer y
            activar proyectos.
          </p>
        </div>

        <div className="mb-8 rounded-2xl border border-[#232323] bg-[#101010] p-4">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#A6A6A6]">
              Construcción
            </span>

            <span className="text-white">
              {progress}%
            </span>
          </div>

          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#232323]">
            <div
              className="h-full rounded-full bg-[#D9FF00] transition-all duration-500"
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
                      ? 'bg-[#D9FF00] font-semibold text-black'
                      : 'text-[#A6A6A6] hover:bg-[#151515] hover:text-white',
                  ].join(' ')}
                >
                  {item.label}
                </button>
              );
            }
          )}
        </nav>

        <div className="mt-6 border-t border-[#232323] pt-6">
          <p className="mb-3 px-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#555555]">
            Inteligencia y continuidad
          </p>

          <Link
            href={
              continuityHref
            }
            className="block w-full rounded-xl border border-[#333333] bg-[#101010] px-4 py-3 text-left text-sm text-[#A6A6A6] transition hover:border-[#D9FF00] hover:text-white"
          >
            <span className="block font-medium text-white">
              Memoria y continuidad
            </span>

            <span className="mt-1 block text-xs leading-5 text-[#767676]">
              Executive Memory,
              exportación y handoff.
            </span>
          </Link>
        </div>

        <div className="mt-6 border-t border-[#232323] pt-6">
          <p className="mb-3 px-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#555555]">
            Ecosistema
          </p>

          <Link
            href="/workspace/ecosystem"
            className="block rounded-xl px-4 py-3 text-sm text-[#A6A6A6] transition hover:bg-[#151515] hover:text-white"
          >
            Personas y conexiones
          </Link>
        </div>
      </div>

      <div className="mt-8 rounded-2xl border border-[#232323] bg-[#101010] p-4">
        <p className="text-xs text-[#767676]">
          Proyecto activo
        </p>

        <p className="mt-1 text-sm font-medium text-white">
          {graph.title}
        </p>

        <p className="mt-2 text-xs capitalize text-[#767676]">
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