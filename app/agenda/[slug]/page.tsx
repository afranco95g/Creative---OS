import Link from 'next/link';

import {
  notFound,
} from 'next/navigation';

import {
  SiteHeader,
} from '../../../components/public/SiteHeader';

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
    <main className="min-h-screen bg-superficie text-texto-largo">
      <SiteHeader
        ctaLabel="Crear proyecto"
        ctaHref="/studio?new=1"
        links={[
          { label: 'Ver calendario', href: '/agenda' },
          { label: 'Crear actividad', href: '/gestion-agenda' },
        ]}
      />

      <article>
        <section className="border-b border-borde px-6 py-14 sm:px-8 lg:px-12 lg:py-20">
          <div className="mx-auto max-w-7xl">
            <Link
              href="/agenda"
              className="text-sm text-texto-largo transition hover:text-texto-principal"
            >
              ← Volver a la agenda
            </Link>

            <div className="mt-12 flex flex-wrap items-center gap-3">
              <span className="border border-borde bg-rojo-base px-4 py-2 text-xs font-bold uppercase tracking-[0.12em] text-hueso">
                {typeLabels[
                  experience.experienceType
                ] ??
                  experience.experienceType}
              </span>

              {experience.city ? (
                <span className="border border-borde px-4 py-2 text-xs text-texto-largo">
                  {experience.city}
                </span>
              ) : null}
            </div>

            <h1 className="stencil-heading mt-9 max-w-6xl text-5xl font-black leading-[0.92] tracking-[-0.055em] sm:text-7xl lg:text-9xl">
              {experience.title}
            </h1>

            <p className="mt-9 max-w-4xl text-xl leading-9 text-texto-largo">
              {experience.summary}
            </p>
          </div>
        </section>

        {experience.coverImageUrl ? (
          <section className="px-6 pt-10 sm:px-8 lg:px-12">
            <div className="mx-auto max-w-7xl overflow-hidden border border-borde bg-superficie-elevada">
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
              <div className="sticky top-8 border border-borde bg-superficie-elevada p-7">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-texto-principal">
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
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-texto-principal">
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
                        className="text-lg leading-9 text-texto-largo"
                      >
                        {paragraph}
                      </p>
                    )
                  )}
                </div>
              ) : (
                <p className="mt-8 text-lg leading-9 text-texto-largo">
                  {experience.summary}
                </p>
              )}

              {experience.project ? (
                <section className="mt-16 border-t border-borde pt-12">
                  <p className="text-xs font-bold uppercase tracking-[0.22em] text-texto-principal">
                    Proyecto relacionado
                  </p>

                  <Link
                    href={`/proyectos/${experience.project.slug}`}
                    className="group mt-7 block border border-borde bg-superficie-elevada p-7 transition hover:shadow-stencil"
                  >
                    <h3 className="text-3xl font-bold tracking-[-0.035em] transition group-hover:text-texto-principal">
                      {
                        experience.project.headline
                      }
                    </h3>

                    <p className="mt-5 text-sm leading-7 text-texto-largo">
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
                <section className="mt-12 border-t border-borde pt-12">
                  <p className="text-xs font-bold uppercase tracking-[0.22em] text-texto-principal">
                    Espacio anfitrión
                  </p>

                  <Link
                    href={`/ecosistema/espacios/${experience.hostSpace.slug}`}
                    className="group mt-7 block border border-borde bg-superficie-elevada p-7 transition hover:shadow-stencil"
                  >
                    <h3 className="text-3xl font-bold tracking-[-0.035em] transition group-hover:text-texto-principal">
                      {
                        experience.hostSpace.name
                      }
                    </h3>

                    <p className="mt-5 text-sm leading-7 text-texto-largo">
                      {experience.hostSpace.description ||
                        'Espacio anfitrión dentro del ecosistema cultural y creativo.'}
                    </p>

                    <p className="mt-7 text-sm font-bold">
                      Conocer el espacio →
                    </p>
                  </Link>
                </section>
              ) : null}

              <section className="mt-16 border border-borde bg-rojo-base p-7 text-hueso md:p-9">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-hueso">
                  El Culebreo
                </p>

                <h2 className="mt-5 text-3xl font-bold tracking-[-0.035em]">
                  También puedes activar el ecosistema
                </h2>

                <p className="mt-5 max-w-2xl text-base leading-8 text-hueso">
                  Crea una actividad, relaciónala con un proyecto
                  y conéctala con uno de los espacios del
                  ecosistema cultural.
                </p>

                <div className="mt-8 flex flex-wrap gap-3">
                  <Link
                    href="/gestion-agenda"
                    className="border border-hueso px-6 py-3 text-sm font-bold text-hueso transition hover:bg-rojo-profundo"
                  >
                    Crear actividad
                  </Link>

                  <Link
                    href="/studio?new=1"
                    className="border border-hueso px-6 py-3 text-sm font-semibold text-hueso transition hover:bg-rojo-profundo"
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
    <div className="mt-7 border-t border-borde pt-6">
      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-texto-largo">
        {label}
      </p>

      <p className="mt-3 text-sm font-semibold leading-6 text-texto-principal">
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
