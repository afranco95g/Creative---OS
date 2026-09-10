import Link from 'next/link';

import { SiteHeader } from '../../components/public/SiteHeader';

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
    <main className="min-h-screen bg-superficie text-texto-largo">
      <SiteHeader
        links={[
          { label: 'Volver al medio', href: '/' },
        ]}
      />

      <section className="border-b border-borde px-6 py-20 sm:px-8 lg:px-12 lg:py-28">
        <div className="mx-auto max-w-7xl">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-texto-principal">
            Ecosistema creativo
          </p>

          <h1 className="stencil-heading mt-6 max-w-5xl text-5xl font-black leading-[0.93] tracking-[-0.055em] sm:text-6xl lg:text-8xl">
            Proyectos que están haciendo cultura.
          </h1>

          <p className="mt-8 max-w-3xl text-lg leading-8 text-texto-largo">
            Procesos construidos con Creative OS, aceptados
            por el ecosistema y desarrollados editorialmente
            por El Culebreo.
          </p>
        </div>
      </section>

      <section className="px-6 py-14 sm:px-8 lg:px-12 lg:py-20">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-texto-largo">
                Selección editorial
              </p>

              <h2 className="mt-3 text-3xl font-bold">
                Proyectos publicados
              </h2>
            </div>

            <p className="text-sm text-texto-largo">
              {projects.length}{' '}
              {projects.length === 1
                ? 'proyecto'
                : 'proyectos'}
            </p>
          </div>

          {projects.length === 0 ? (
            <div className="border border-dashed border-borde bg-superficie-elevada p-10">
              <h2 className="text-2xl font-bold">
                Todavía no hay proyectos publicados
              </h2>

              <p className="mt-4 max-w-2xl text-sm leading-7 text-texto-largo">
                Los proyectos aparecerán aquí después de pasar
                la revisión del ecosistema, construir su ficha
                editorial y recibir aprobación del medio.
              </p>

              <Link
                href="/studio?new=1"
                className="mt-7 inline-flex border border-borde bg-rojo-base px-6 py-3 text-sm font-bold text-hueso transition hover:shadow-stencil"
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
                    className="group flex min-h-[520px] flex-col overflow-hidden border border-borde bg-superficie-elevada transition hover:shadow-stencil"
                  >
                    {project.coverImageUrl ? (
                      <img
                        src={
                          project.coverImageUrl
                        }
                        alt={
                          project.headline
                        }
                        className="aspect-[16/10] w-full border-b border-borde object-cover"
                      />
                    ) : (
                      <div className="flex aspect-[16/10] items-end border-b border-borde bg-superficie p-7">
                        <p className="max-w-xs text-xs font-bold uppercase tracking-[0.24em] text-texto-principal">
                          El Culebreo · Proyecto
                        </p>
                      </div>
                    )}

                    <div className="flex flex-1 flex-col p-7">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="text-xs font-bold uppercase tracking-[0.18em] text-texto-largo">
                          {categoryLabels[
                            project.category
                          ] ??
                            project.category}
                        </span>

                        {project.city ? (
                          <>
                            <span className="text-texto-largo">
                              ·
                            </span>

                            <span className="text-xs text-texto-largo">
                              {project.city}
                            </span>
                          </>
                        ) : null}
                      </div>

                      <h2 className="mt-7 text-3xl font-bold leading-tight tracking-[-0.035em]">
                        {project.headline}
                      </h2>

                      <p className="mt-5 line-clamp-4 text-sm leading-7 text-texto-largo">
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
                                  className="border border-borde px-3 py-1.5 text-[10px] uppercase tracking-[0.12em] text-texto-largo"
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
                        <p className="text-sm font-bold transition group-hover:text-texto-principal">
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
