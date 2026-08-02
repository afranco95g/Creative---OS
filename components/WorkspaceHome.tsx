'use client';

import Link from 'next/link';

import type {
  WorkspaceState,
} from '../types/workspace';

interface WorkspaceHomeProps {
  workspace: WorkspaceState;
  onCreateProject: () => void;
  onOpenProject: (
    projectId: string
  ) => void;
}

export function WorkspaceHome({
  workspace,
  onCreateProject,
  onOpenProject,
}: WorkspaceHomeProps) {
  const userName =
    workspace.user?.name ||
    'Productor';

  const projects =
    workspace.projects;

  return (
    <section className="min-h-screen bg-[#050505] px-6 py-10 text-white sm:px-8 lg:px-12 lg:py-12">
      <div className="mx-auto max-w-7xl space-y-12">
        <header className="flex flex-col gap-8 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <div className="mb-6 flex flex-wrap items-center gap-3">
              <Link
                href="/"
                className="rounded-full border border-[#333333] px-4 py-2 text-xs font-semibold text-[#A6A6A6] transition hover:border-white hover:text-white"
              >
                ← Volver al medio
              </Link>

              <span className="text-xs text-[#555555]">
                Cultura Esta
              </span>
            </div>

            <p className="mb-3 text-sm uppercase tracking-[0.25em] text-[#D9FF00]">
              Executive Workspace
            </p>

            <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
              Buenos días, {userName}.
            </h1>

            <p className="mt-5 max-w-3xl text-lg leading-relaxed text-[#A6A6A6]">
              Este es tu centro de operaciones. Aquí puedes
              convertir una inspiración, necesidad u oportunidad
              en un proyecto estructurado con Creative OS.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/"
              className="rounded-full border border-[#333333] px-6 py-3 text-sm font-semibold text-white transition hover:border-white"
            >
              Explorar el medio
            </Link>

            <Link
              href="/mi-ecosistema"
              className="rounded-full border border-[#333333] px-6 py-3 text-sm font-semibold text-white transition hover:border-[#D9FF00] hover:text-[#D9FF00]"
            >
              Mi Ecosistema
            </Link>

            <button
              type="button"
              onClick={onCreateProject}
              className="rounded-full bg-[#D9FF00] px-6 py-3 text-sm font-bold text-black transition hover:bg-white"
            >
              Crear nuevo proyecto
            </button>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <article className="rounded-3xl border border-[#232323] bg-[#101010] p-7">
            <p className="mb-4 text-xs uppercase tracking-[0.2em] text-[#767676]">
              Qué hacer hoy
            </p>

            <h2 className="text-3xl font-semibold">
              {projects.length > 0
                ? 'Tus proyectos activos necesitan atención.'
                : 'Todavía no tienes proyectos activos.'}
            </h2>

            <p className="mt-4 text-base leading-relaxed text-[#A6A6A6]">
              {projects.length > 0
                ? 'El Productor Ejecutivo organizará tus prioridades a partir del avance de cada proyecto.'
                : 'Puedes explorar el medio para inspirarte o crear directamente tu primera Mesa de Producción.'}
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={onCreateProject}
                className="rounded-full bg-[#D9FF00] px-5 py-3 text-sm font-bold text-black"
              >
                Crear proyecto
              </button>

              <Link
                href="/#historias"
                className="rounded-full border border-[#333333] px-5 py-3 text-sm font-semibold text-white"
              >
                Ver historias
              </Link>
            </div>
          </article>

          <article className="rounded-3xl border border-[#232323] bg-[#101010] p-7">
            <p className="mb-4 text-xs uppercase tracking-[0.2em] text-[#767676]">
              Productor observa
            </p>

            <p className="text-lg leading-relaxed text-[#D9FF00]">
              {projects.length > 0
                ? 'Revisé tus proyectos. Entra a una Mesa de Producción para continuar desarrollando su estructura.'
                : 'Una historia, un espacio, una conversación o una oportunidad pueden convertirse en el punto de partida de un proyecto.'}
            </p>
          </article>
        </div>

        <section>
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-2xl font-semibold">
              Proyectos activos
            </h2>

            <span className="text-sm text-[#767676]">
              {projects.length}{' '}
              {projects.length === 1
                ? 'proyecto'
                : 'proyectos'}
            </span>
          </div>

          {projects.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-[#333333] bg-[#080808] p-10">
              <h3 className="text-2xl font-semibold">
                Crea tu primer proyecto
              </h3>

              <p className="mt-3 max-w-2xl text-[#A6A6A6]">
                Creative OS abrirá una Mesa de Producción donde
                podrás conversar, estructurar documentos,
                organizar tareas y desarrollar el proyecto.
              </p>

              <button
                type="button"
                onClick={onCreateProject}
                className="mt-6 rounded-full bg-[#D9FF00] px-6 py-3 text-sm font-bold text-black transition hover:bg-white"
              >
                Nuevo proyecto
              </button>
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {projects.map((project) => (
                <button
                  key={project.id}
                  type="button"
                  onClick={() =>
                    onOpenProject(
                      project.id
                    )
                  }
                  className="rounded-3xl border border-[#232323] bg-[#101010] p-6 text-left transition hover:border-[#D9FF00]"
                >
                  <p className="text-xs uppercase tracking-[0.18em] text-[#767676]">
                    {project.category}
                  </p>

                  <h3 className="mt-3 text-2xl font-semibold text-white">
                    {project.title}
                  </h3>

                  <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-[#A6A6A6]">
                    {project.description ||
                      'Proyecto sin descripción inicial.'}
                  </p>

                  <p className="mt-6 text-sm font-semibold text-[#D9FF00]">
                    Abrir Mesa de Producción →
                  </p>
                </button>
              ))}
            </div>
          )}
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <Link
            href="/#historias"
            className="group rounded-3xl border border-[#232323] bg-[#101010] p-7 transition hover:border-[#D9FF00]"
          >
            <p className="mb-3 text-xs uppercase tracking-[0.2em] text-[#767676]">
              Medio
            </p>

            <h3 className="text-2xl font-semibold">
              Inspiración y legitimación
            </h3>

            <p className="mt-3 text-sm leading-relaxed text-[#A6A6A6]">
              Explora artistas, procesos, espacios, eventos,
              talleres, clases y manifestaciones culturales
              destacadas por Cultura Esta.
            </p>

            <p className="mt-6 text-sm font-semibold text-[#D9FF00] transition group-hover:translate-x-1">
              Ir al medio →
            </p>
          </Link>

          <Link
            href="/workspace/ecosystem"
            className="group rounded-3xl border border-[#232323] bg-[#101010] p-7 transition hover:border-[#D9FF00]"
          >
            <p className="mb-3 text-xs uppercase tracking-[0.2em] text-[#767676]">
              Ecosistema
            </p>

            <h3 className="text-2xl font-semibold">
              Personas y conexiones
            </h3>

            <p className="mt-3 text-sm leading-relaxed text-[#A6A6A6]">
              Explora personas, espacios, marcas, financiadores
              y otros actores conectados con los proyectos
              culturales y creativos.
            </p>

            <p className="mt-6 text-sm font-semibold text-[#D9FF00] transition group-hover:translate-x-1">
              Explorar ecosistema →
            </p>
          </Link>
        </section>
      </div>
    </section>
  );
}