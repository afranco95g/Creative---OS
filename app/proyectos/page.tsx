import Link from 'next/link';

import {
  listPublishedProjects,
} from '../../services/public/publicProjects';

const categoryLabels:
  Record<string, string> = {
    cultural: 'Cultural',
    product: 'Producto',
    event: 'Evento',
    social: 'Social',
    artistic: 'Artístico',
    business: 'Negocio',
    other: 'Otro',
  };

export const dynamic =
  'force-dynamic';

export default async function PublicProjectsPage() {
  const projects =
    await listPublishedProjects();

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <header className="border-b border-white/10 px-6 py-6 sm:px-8 lg:px-12">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <Link
            href="/"
            className="text-xl font-black tracking-[-0.04em]"
          >
            CULTURA ESTÁ
          </Link>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/"
              className="rounded-full border border-white/15 px-5 py-2.5 text-sm font-semibold transition hover:border-white"
            >
              Volver al medio
            </Link>

            <Link
              href="/studio?new=1"
              className="rounded-full bg-[#D9FF00] px-5 py-2.5 text-sm font-bold text-black transition hover:bg-white"
            >
              Crear un proyecto
            </Link>
          </div>
        </div>
      </header>

      <section className="border-b border-white/10 px-6 py-20 sm:px-8 lg:px-12 lg:py-28">
        <div className="mx-auto max-w-7xl">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#D9FF00]">
            Ecosistema creativo
          </p>

          <h1 className="mt-6 max-w-5xl text-5xl font-black leading-[0.93] tracking-[-0.055em] sm:text-6xl lg:text-8xl">
            Proyectos que están haciendo cultura.
          </h1>

          <p className="mt-8 max-w-3xl text-lg leading-8 text-[#A6A6A6]">
            Procesos construidos con Creative OS, aceptados
            por el ecosistema y desarrollados editorialmente
            por Cultura Está.
          </p>
        </div>
      </section>

      <section className="px-6 py-14 sm:px-8 lg:px-12 lg:py-20">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#767676]">
                Selección editorial
              </p>

              <h2 className="mt-3 text-3xl font-bold">
                Proyectos publicados
              </h2>
            </div>

            <p className="text-sm text-[#777777]">
              {projects.length}{' '}
              {projects.length === 1
                ? 'proyecto'
                : 'proyectos'}
            </p>
          </div>

          {projects.length === 0 ? (
            <div className="rounded-[32px] border border-dashed border-white/15 bg-[#0A0A0A] p-10">
              <h2 className="text-2xl font-bold">
                Todavía no hay proyectos publicados
              </h2>

              <p className="mt-4 max-w-2xl text-sm leading-7 text-[#888888]">
                Los proyectos aparecerán aquí después de pasar
                la revisión del ecosistema, construir su ficha
                editorial y recibir aprobación del medio.
              </p>

              <Link
                href="/studio?new=1"
                className="mt-7 inline-flex rounded-full bg-[#D9FF00] px-6 py-3 text-sm font-bold text-black"
              >
                Crear el primer proyecto
              </Link>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {projects.map(
                (project) => (
                  <Link
                    key={project.id}
                    href={`/proyectos/${project.slug}`}
                    className="group flex min-h-[520px] flex-col overflow-hidden rounded-[30px] border border-white/10 bg-[#0A0A0A] transition hover:-translate-y-1 hover:border-[#D9FF00]"
                  >
                    {project.coverImageUrl ? (
                      <img
                        src={
                          project.coverImageUrl
                        }
                        alt={
                          project.headline
                        }
                        className="aspect-[16/10] w-full object-cover"
                      />
                    ) : (
                      <div className="flex aspect-[16/10] items-end bg-[#111111] p-7">
                        <p className="max-w-xs text-xs font-bold uppercase tracking-[0.24em] text-[#D9FF00]">
                          Cultura Está · Proyecto
                        </p>
                      </div>
                    )}

                    <div className="flex flex-1 flex-col p-7">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="text-xs font-bold uppercase tracking-[0.18em] text-[#767676]">
                          {categoryLabels[
                            project.category
                          ] ??
                            project.category}
                        </span>

                        {project.city ? (
                          <>
                            <span className="text-[#333333]">
                              ·
                            </span>

                            <span className="text-xs text-[#777777]">
                              {project.city}
                            </span>
                          </>
                        ) : null}
                      </div>

                      <h2 className="mt-7 text-3xl font-bold leading-tight tracking-[-0.035em]">
                        {project.headline}
                      </h2>

                      <p className="mt-5 line-clamp-4 text-sm leading-7 text-[#929292]">
                        {project.summary}
                      </p>

                      {project.disciplines.length >
                      0 ? (
                        <div className="mt-6 flex flex-wrap gap-2">
                          {project.disciplines
                            .slice(0, 4)
                            .map(
                              (
                                discipline
                              ) => (
                                <span
                                  key={
                                    discipline
                                  }
                                  className="rounded-full border border-white/10 px-3 py-1.5 text-[10px] uppercase tracking-[0.12em] text-[#777777]"
                                >
                                  {
                                    discipline
                                  }
                                </span>
                              )
                            )}
                        </div>
                      ) : null}

                      <div className="mt-auto pt-9">
                        <p className="text-sm font-bold text-white transition group-hover:text-[#D9FF00]">
                          Leer el proyecto →
                        </p>
                      </div>
                    </div>
                  </Link>
                )
              )}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}