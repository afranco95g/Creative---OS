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

export const dynamic =
  'force-dynamic';

export default async function PublicAgendaPage() {
  const experiences =
    await listPublishedExperiences();

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <header className="border-b border-white/10 px-6 py-6 sm:px-8 lg:px-12">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <Link
            href="/"
            className="text-xl font-black tracking-[-0.04em]"
          >
            CULTURA ESTÁ
          </Link>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/"
              className="rounded-full border border-white/15 px-5 py-2.5 text-sm font-semibold"
            >
              Volver al medio
            </Link>

            <Link
              href="/gestion-agenda"
              className="rounded-full bg-[#D9FF00] px-5 py-2.5 text-sm font-bold text-black"
            >
              Crear actividad
            </Link>
          </div>
        </div>
      </header>

      <section className="border-b border-white/10 px-6 py-20 sm:px-8 lg:px-12 lg:py-28">
        <div className="mx-auto max-w-7xl">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#D9FF00]">
            Programación cultural
          </p>

          <h1 className="mt-6 max-w-6xl text-5xl font-black leading-[0.92] tracking-[-0.055em] sm:text-7xl lg:text-9xl">
            Lugares, encuentros y experiencias para participar.
          </h1>

          <p className="mt-8 max-w-3xl text-lg leading-8 text-[#A6A6A6]">
            Eventos, talleres, laboratorios, conciertos,
            convocatorias y experiencias creadas por el
            ecosistema cultural.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16 lg:py-24">
        <div className="mb-9 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#767676]">
              Próximas actividades
            </p>

            <h2 className="mt-3 text-3xl font-bold">
              Agenda publicada
            </h2>
          </div>

          <p className="text-sm text-[#666666]">
            {experiences.length}{' '}
            {experiences.length === 1
              ? 'actividad'
              : 'actividades'}
          </p>
        </div>

        {experiences.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-white/15 bg-[#0A0A0A] p-10">
            <h2 className="text-2xl font-bold">
              Todavía no hay actividades publicadas
            </h2>

            <p className="mt-4 text-[#777777]">
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
                    className="group flex flex-col overflow-hidden rounded-[30px] border border-white/10 bg-[#0A0A0A] transition hover:-translate-y-1 hover:border-[#D9FF00]"
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
                          className="aspect-[16/10] w-full object-cover"
                        />
                      ) : (
                        <div className="flex aspect-[16/10] items-end bg-[#111111] p-7">
                          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#D9FF00]">
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
                      <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#D9FF00]">
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
                        <h2 className="mt-4 text-3xl font-bold tracking-[-0.035em] transition group-hover:text-[#D9FF00]">
                          {
                            experience.title
                          }
                        </h2>
                      </Link>

                      <p className="mt-4 line-clamp-4 text-sm leading-7 text-[#929292]">
                        {
                          experience.summary
                        }
                      </p>

                      <p className="mt-6 text-sm text-[#777777]">
                        {[
                          experience.venueName,
                          experience.city,
                        ]
                          .filter(Boolean)
                          .join(' · ')}
                      </p>

                      <p className="mt-2 text-sm text-[#777777]">
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
                          className="rounded-full border border-white/15 px-5 py-3 text-sm font-semibold transition hover:border-[#D9FF00] hover:text-[#D9FF00]"
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
                            className="rounded-full bg-[#D9FF00] px-5 py-3 text-sm font-bold text-black"
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