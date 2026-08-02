import Link from 'next/link';

import {
  notFound,
} from 'next/navigation';

import {
  ExperienceRegistrationPanel,
} from '../../../components/agenda/ExperienceRegistrationPanel';

import {
  getPublishedExperience,
} from '../../../services/public/publicAgenda';

interface PublicExperiencePageProps {
  params: Promise<{
    slug: string;
  }>;
}

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
      'Otra experiencia',
  };

export const dynamic =
  'force-dynamic';

export default async function PublicExperiencePage({
  params,
}: PublicExperiencePageProps) {
  const {
    slug,
  } = await params;

  const experience =
    await getPublishedExperience(
      slug
    );

  if (!experience) {
    notFound();
  }

  const startsAt =
    new Date(
      experience.startsAt
    );

  const endsAt =
    experience.endsAt
      ? new Date(
          experience.endsAt
        )
      : null;

  const descriptionParagraphs =
    experience.description
      .split(/\n{2,}/)
      .map(
        (paragraph) =>
          paragraph.trim()
      )
      .filter(Boolean);

  const location =
    [
      experience.venueName,
      experience.city,
    ]
      .filter(Boolean)
      .join(' · ');

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <header className="border-b border-white/10 px-6 py-6 sm:px-8 lg:px-12">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <Link
            href="/"
            className="text-xl font-black tracking-[-0.04em]"
          >
            CULTURA ESTA
          </Link>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/agenda"
              className="rounded-full border border-white/15 px-5 py-2.5 text-sm font-semibold transition hover:border-white"
            >
              Ver agenda
            </Link>

            <Link
              href="/gestion-agenda"
              className="rounded-full border border-white/15 px-5 py-2.5 text-sm font-semibold transition hover:border-white"
            >
              Crear actividad
            </Link>

            <Link
              href="/studio?new=1"
              className="rounded-full bg-[#D9FF00] px-5 py-2.5 text-sm font-bold text-black transition hover:bg-white"
            >
              Crear proyecto
            </Link>
          </div>
        </div>
      </header>

      <article>
        <section className="border-b border-white/10 px-6 py-14 sm:px-8 lg:px-12 lg:py-20">
          <div className="mx-auto max-w-7xl">
            <Link
              href="/agenda"
              className="text-sm text-[#777777] transition hover:text-white"
            >
              ← Volver a la agenda
            </Link>

            <div className="mt-12 flex flex-wrap items-center gap-3">
              <span className="rounded-full bg-[#D9FF00] px-4 py-2 text-xs font-bold uppercase tracking-[0.12em] text-black">
                {typeLabels[
                  experience.experienceType
                ] ??
                  experience.experienceType}
              </span>

              {experience.city ? (
                <span className="rounded-full border border-white/15 px-4 py-2 text-xs text-[#A6A6A6]">
                  {experience.city}
                </span>
              ) : null}
            </div>

            <h1 className="mt-9 max-w-6xl text-5xl font-black leading-[0.92] tracking-[-0.055em] sm:text-7xl lg:text-9xl">
              {experience.title}
            </h1>

            <p className="mt-9 max-w-4xl text-xl leading-9 text-[#B0B0B0]">
              {experience.summary}
            </p>
          </div>
        </section>

        {experience.coverImageUrl ? (
          <section className="px-6 pt-10 sm:px-8 lg:px-12">
            <div className="mx-auto max-w-7xl overflow-hidden rounded-[36px] border border-white/10 bg-[#0A0A0A]">
              <img
                src={
                  experience.coverImageUrl
                }
                alt={
                  experience.title
                }
                className="aspect-[16/8] w-full object-cover"
              />
            </div>
          </section>
        ) : null}

        <section className="px-6 py-16 sm:px-8 lg:px-12 lg:py-24">
          <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[320px_minmax(0,760px)] lg:justify-between">
            <aside>
              <div className="sticky top-8 rounded-[30px] border border-white/10 bg-[#0A0A0A] p-7">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#D9FF00]">
                  Información
                </p>

                <InformationItem
                  label="Fecha"
                  value={startsAt.toLocaleDateString(
                    'es-CO',
                    {
                      weekday:
                        'long',

                      day:
                        'numeric',

                      month:
                        'long',

                      year:
                        'numeric',
                    }
                  )}
                />

                <InformationItem
                  label="Hora"
                  value={formatTimeRange(
                    startsAt,
                    endsAt
                  )}
                />

                {location ? (
                  <InformationItem
                    label="Lugar"
                    value={location}
                  />
                ) : null}

                {experience.address ? (
                  <InformationItem
                    label="Dirección"
                    value={
                      experience.address
                    }
                  />
                ) : null}

                {experience.capacity !==
                null ? (
                  <InformationItem
                    label="Capacidad"
                    value={`${experience.capacity} personas`}
                  />
                ) : null}

                <ExperienceRegistrationPanel
                  experienceId={
                    experience.id
                  }
                  externalTicketUrl={
                    experience.ticketUrl
                  }
                />
              </div>
            </aside>

            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#D9FF00]">
                La experiencia
              </p>

              <h2 className="mt-5 text-4xl font-bold tracking-[-0.04em]">
                Sobre la actividad
              </h2>

              {descriptionParagraphs.length >
              0 ? (
                <div className="mt-8 space-y-7">
                  {descriptionParagraphs.map(
                    (
                      paragraph,
                      index
                    ) => (
                      <p
                        key={`${index}-${paragraph.slice(
                          0,
                          20
                        )}`}
                        className="text-lg leading-9 text-[#B0B0B0]"
                      >
                        {paragraph}
                      </p>
                    )
                  )}
                </div>
              ) : (
                <p className="mt-8 text-lg leading-9 text-[#B0B0B0]">
                  {experience.summary}
                </p>
              )}

              {experience.project ? (
                <section className="mt-16 border-t border-white/10 pt-12">
                  <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#D9FF00]">
                    Proyecto relacionado
                  </p>

                  <Link
                    href={`/proyectos/${experience.project.slug}`}
                    className="group mt-7 block rounded-[30px] border border-white/10 bg-[#0A0A0A] p-7 transition hover:border-[#D9FF00]"
                  >
                    <h3 className="text-3xl font-bold tracking-[-0.035em] transition group-hover:text-[#D9FF00]">
                      {
                        experience.project.headline
                      }
                    </h3>

                    <p className="mt-5 text-sm leading-7 text-[#888888]">
                      {
                        experience.project.summary
                      }
                    </p>

                    <p className="mt-7 text-sm font-bold">
                      Conocer el proyecto →
                    </p>
                  </Link>
                </section>
              ) : null}

              {experience.hostSpace ? (
                <section className="mt-12 border-t border-white/10 pt-12">
                  <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#D9FF00]">
                    Espacio anfitrión
                  </p>

                  <Link
                    href={`/ecosistema/espacios/${experience.hostSpace.slug}`}
                    className="group mt-7 block rounded-[30px] border border-white/10 bg-[#0A0A0A] p-7 transition hover:border-[#D9FF00]"
                  >
                    <h3 className="text-3xl font-bold tracking-[-0.035em] transition group-hover:text-[#D9FF00]">
                      {
                        experience.hostSpace.name
                      }
                    </h3>

                    <p className="mt-5 text-sm leading-7 text-[#888888]">
                      {experience.hostSpace.description ||
                        'Espacio anfitrión dentro del ecosistema cultural y creativo.'}
                    </p>

                    <p className="mt-7 text-sm font-bold">
                      Conocer el espacio →
                    </p>
                  </Link>
                </section>
              ) : null}

              <section className="mt-16 rounded-[30px] border border-[#D9FF00]/20 bg-[#D9FF00]/5 p-7 md:p-9">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#D9FF00]">
                  Cultura Esta
                </p>

                <h2 className="mt-5 text-3xl font-bold tracking-[-0.035em]">
                  También puedes activar el ecosistema
                </h2>

                <p className="mt-5 max-w-2xl text-base leading-8 text-[#A0A0A0]">
                  Crea una actividad, relaciónala con un proyecto
                  y conéctala con uno de los espacios del
                  ecosistema cultural.
                </p>

                <div className="mt-8 flex flex-wrap gap-3">
                  <Link
                    href="/gestion-agenda"
                    className="rounded-full bg-[#D9FF00] px-6 py-3 text-sm font-bold text-black transition hover:bg-white"
                  >
                    Crear actividad
                  </Link>

                  <Link
                    href="/studio?new=1"
                    className="rounded-full border border-white/15 px-6 py-3 text-sm font-semibold"
                  >
                    Crear proyecto
                  </Link>
                </div>
              </section>
            </div>
          </div>
        </section>
      </article>
    </main>
  );
}

function InformationItem({
  label,
  value,
}: {
  label:
    string;

  value:
    string;
}) {
  return (
    <div className="mt-7 border-t border-white/10 pt-6">
      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#666666]">
        {label}
      </p>

      <p className="mt-3 text-sm font-semibold leading-6 text-white">
        {value}
      </p>
    </div>
  );
}

function formatTimeRange(
  startsAt:
    Date,

  endsAt:
    Date | null
): string {
  const startTime =
    startsAt.toLocaleTimeString(
      'es-CO',
      {
        hour:
          '2-digit',

        minute:
          '2-digit',
      }
    );

  if (!endsAt) {
    return startTime;
  }

  const sameDay =
    startsAt.toDateString() ===
    endsAt.toDateString();

  if (sameDay) {
    const endTime =
      endsAt.toLocaleTimeString(
        'es-CO',
        {
          hour:
            '2-digit',

          minute:
            '2-digit',
        }
      );

    return `${startTime} – ${endTime}`;
  }

  return `${startTime} – ${endsAt.toLocaleDateString(
    'es-CO',
    {
      day:
        'numeric',

      month:
        'short',

      hour:
        '2-digit',

      minute:
        '2-digit',
    }
  )}`;
}