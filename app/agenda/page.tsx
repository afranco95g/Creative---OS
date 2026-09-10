import Link from 'next/link';

import { SiteHeader } from '../../components/public/SiteHeader';

import {
  listPublishedExperiences,
} from '../../services/public/publicAgenda';

const typeLabels:
  Record<string, string> = {
    event:
      'Evento',

    workshop:
      'Taller',

    class:
      'Clase',

    laboratory:
      'Laboratorio',

    exhibition:
      'Exposición',

    concert:
      'Concierto',

    meeting:
      'Encuentro',

    activation:
      'Activación',

    residency:
      'Residencia',

    call:
      'Convocatoria',

    other:
      'Otro',
  };

export const dynamic =
  'force-dynamic';

export default async function PublicAgendaPage() {
  const experiences =
    await listPublishedExperiences();

  return (
    <main className="min-h-screen bg-superficie text-texto-largo">
      <SiteHeader
        ctaLabel="Crear actividad"
        ctaHref="/gestion-agenda"
        links={[
          { label: 'Volver al medio', href: '/' },
        ]}
      />

      <section className="border-b border-borde px-6 py-20 sm:px-8 lg:px-12 lg:py-28">
        <div className="mx-auto max-w-7xl">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-texto-principal">
            Programación cultural
          </p>

          <h1 className="stencil-heading mt-6 max-w-6xl text-5xl font-black leading-[0.92] tracking-[-0.055em] sm:text-7xl lg:text-9xl">
            Lugares, encuentros y experiencias para participar.
          </h1>

          <p className="mt-8 max-w-3xl text-lg leading-8 text-texto-largo">
            Eventos, talleres, laboratorios, conciertos,
            convocatorias y experiencias creadas por el
            ecosistema cultural.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16 lg:py-24">
        <div className="mb-9 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-texto-largo">
              Próximas actividades
            </p>

            <h2 className="mt-3 text-3xl font-bold">
              Calendario publicado
            </h2>
          </div>

          <p className="text-sm text-texto-largo">
            {experiences.length}{' '}
            {experiences.length === 1
              ? 'actividad'
              : 'actividades'}
          </p>
        </div>

        {experiences.length === 0 ? (
          <div className="border border-dashed border-borde bg-superficie-elevada p-10">
            <h2 className="text-2xl font-bold">
              Todavía no hay actividades publicadas
            </h2>

            <p className="mt-4 text-texto-largo">
              Las experiencias aparecerán después de ser
              creadas y aprobadas por el ecosistema.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {experiences.map(
              (experience) => {
                const start =
                  new Date(
                    experience.startsAt
                  );

                return (
                  <article
                    key={
                      experience.id
                    }
                    className="group flex flex-col overflow-hidden border border-borde bg-superficie-elevada transition hover:shadow-stencil"
                  >
                    <Link
                      href={`/agenda/${experience.slug}`}
                    >
                      {experience.coverImageUrl ? (
                        <img
                          src={
                            experience.coverImageUrl
                          }
                          alt={
                            experience.title
                          }
                          className="aspect-[16/10] w-full border-b border-borde object-cover"
                        />
                      ) : (
                        <div className="flex aspect-[16/10] items-end border-b border-borde bg-superficie p-7">
                          <p className="text-xs font-bold uppercase tracking-[0.2em] text-texto-principal">
                            {
                              typeLabels[
                                experience.experienceType
                              ] ??
                                experience.experienceType
                            }
                          </p>
                        </div>
                      )}
                    </Link>

                    <div className="flex flex-1 flex-col p-7">
                      <p className="text-xs font-bold uppercase tracking-[0.16em] text-texto-principal">
                        {start.toLocaleDateString(
                          'es-CO',
                          {
                            weekday:
                              'long',

                            day:
                              'numeric',

                            month:
                              'long',
                          }
                        )}
                      </p>

                      <Link
                        href={`/agenda/${experience.slug}`}
                      >
                        <h2 className="mt-4 text-3xl font-bold tracking-[-0.035em] transition group-hover:text-texto-principal">
                          {
                            experience.title
                          }
                        </h2>
                      </Link>

                      <p className="mt-4 line-clamp-4 text-sm leading-7 text-texto-largo">
                        {
                          experience.summary
                        }
                      </p>

                      <p className="mt-6 text-sm text-texto-largo">
                        {[
                          experience.venueName,
                          experience.city,
                        ]
                          .filter(Boolean)
                          .join(' · ')}
                      </p>

                      <p className="mt-2 text-sm text-texto-largo">
                        {start.toLocaleTimeString(
                          'es-CO',
                          {
                            hour:
                              '2-digit',

                            minute:
                              '2-digit',
                          }
                        )}
                      </p>

                      <div className="mt-auto flex flex-wrap gap-3 pt-8">
                        <Link
                          href={`/agenda/${experience.slug}`}
                          className="border border-borde px-5 py-3 text-sm font-semibold transition hover:bg-superficie"
                        >
                          Ver actividad
                        </Link>

                        {experience.ticketUrl ? (
                          <a
                            href={
                              experience.ticketUrl
                            }
                            target="_blank"
                            rel="noreferrer"
                            className="border border-borde bg-rojo-base px-5 py-3 text-sm font-bold text-hueso"
                          >
                            Inscribirse
                          </a>
                        ) : null}
                      </div>
                    </div>
                  </article>
                );
              }
            )}
          </div>
        )}
      </section>
    </main>
  );
}
