import Link from 'next/link';

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

export async function HomeAgendaSection() {
  const experiences =
    await listPublishedExperiences(
      3
    ).catch(
      () => []
    );

  return (
    <section
      id="agenda"
      className="border-y border-borde bg-superficie-elevada"
    >
      <div className="mx-auto max-w-7xl px-6 py-20">
        <div className="grid gap-12 lg:grid-cols-[0.7fr_1.3fr]">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-texto-largo">
              Ecosistema
            </p>

            <h2 className="mt-3 text-4xl font-bold tracking-tight">
              Calendario cultural
            </h2>

            <p className="mt-5 max-w-md leading-7 text-texto-largo">
              Eventos, talleres, laboratorios, convocatorias y
              encuentros creados por los espacios, personas y
              proyectos del ecosistema.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/agenda"
                className="border border-borde bg-rojo-base px-5 py-3 text-sm font-bold text-hueso transition hover:shadow-stencil"
              >
                Ver calendario completo
              </Link>

              <Link
                href="/gestion-agenda"
                className="border border-borde px-5 py-3 text-sm font-semibold transition hover:bg-superficie"
              >
                Crear actividad
              </Link>
            </div>
          </div>

          {experiences.length === 0 ? (
            <div className="border border-dashed border-borde bg-superficie p-8">
              <h3 className="text-xl font-semibold">
                La programación está comenzando
              </h3>

              <p className="mt-3 text-sm leading-7 text-texto-largo">
                Las actividades aparecerán aquí cuando sean
                creadas y aprobadas por el ecosistema.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-borde border-y border-borde">
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
                      className="grid gap-5 py-7 sm:grid-cols-[72px_1fr_auto] sm:items-center"
                    >
                      <div>
                        <div className="text-3xl font-black">
                          {start
                            .getDate()
                            .toString()
                            .padStart(
                              2,
                              '0'
                            )}
                        </div>

                        <div className="text-xs font-semibold uppercase tracking-[0.18em] text-texto-largo">
                          {start.toLocaleDateString(
                            'es-CO',
                            {
                              month:
                                'short',
                            }
                          )}
                        </div>
                      </div>

                      <div>
                        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-texto-largo">
                          {
                            typeLabels[
                              experience.experienceType
                            ] ??
                              experience.experienceType
                          }
                        </span>

                        <Link
                          href={`/agenda/${experience.slug}`}
                          className="group"
                        >
                          <h3 className="mt-2 text-xl font-semibold transition group-hover:text-texto-principal">
                            {
                              experience.title
                            }
                          </h3>
                        </Link>

                        <p className="mt-2 text-sm text-texto-largo">
                          {[
                            experience.venueName,
                            experience.city,
                          ]
                            .filter(Boolean)
                            .join(' · ')}
                        </p>
                      </div>

                      <Link
                        href={`/agenda/${experience.slug}`}
                        className="justify-self-start border border-borde px-4 py-2 text-sm transition hover:bg-superficie sm:justify-self-end"
                      >
                        Ver actividad
                      </Link>
                    </article>
                  );
                }
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
