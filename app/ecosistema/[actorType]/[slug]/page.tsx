import Link from 'next/link';

import {
  notFound,
} from 'next/navigation';

import {
  SiteHeader,
} from '../../../../components/public/SiteHeader';

import {
  getPublishedActorProjects,
  getPublishedEcosystemActor,
} from '../../../../services/public/publicEcosystem';

import type {
  PublicActorProject,
  PublicActorType,
} from '../../../../services/public/publicEcosystem';

interface PublicActorPageProps {
  params: Promise<{
    actorType: string;
    slug: string;
  }>;
}

const actorTypeContent:
  Record<
    PublicActorType,
    {
      eyebrow: string;
      offersTitle: string;
      interestsTitle: string;
    }
  > = {
    person: {
      eyebrow:
        'Persona del ecosistema',

      offersTitle:
        'Habilidades y aportes',

      interestsTitle:
        'Intereses',
    },

    space: {
      eyebrow:
        'Espacio del ecosistema',

      offersTitle:
        'Qué ofrece',

      interestsTitle:
        'Qué necesita',
    },

    funder: {
      eyebrow:
        'Financiador del ecosistema',

      offersTitle:
        'Modalidades de apoyo',

      interestsTitle:
        'Intereses de financiación',
    },
  };

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

export default async function PublicActorPage({
  params,
}: PublicActorPageProps) {
  const {
    actorType:
      routeActorType,
    slug,
  } = await params;

  const actorType =
    getActorTypeFromRoute(
      routeActorType
    );

  if (!actorType) {
    notFound();
  }

  const actor =
    await getPublishedEcosystemActor(
      actorType,
      slug
    );

  if (!actor) {
    notFound();
  }

  const projects =
    await getPublishedActorProjects(
      actor.actorType,
      actor.actorId
    );

  const content =
    actorTypeContent[
      actor.actorType
    ];

  const location =
    [
      actor.city,
      actor.department,
      actor.country,
    ]
      .filter(Boolean)
      .join(', ');

  const initials =
    actor.name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map(
        (part) =>
          part.charAt(0)
      )
      .join('')
      .toUpperCase();

  return (
    <main className="min-h-screen bg-superficie text-texto-largo">
      <SiteHeader
        ctaLabel="Crear un proyecto"
        ctaHref="/studio?new=1"
        links={[
          { label: 'Explorar ecosistema', href: '/ecosistema' },
          { label: 'Ver proyectos', href: '/proyectos' },
        ]}
      />

      <section className="border-b border-borde px-6 py-16 sm:px-8 lg:px-12 lg:py-24">
        <div className="mx-auto max-w-7xl">
          <Link
            href="/ecosistema"
            className="text-sm text-texto-largo transition hover:text-texto-principal"
          >
            ← Volver al ecosistema
          </Link>

          <div className="mt-12 grid gap-10 lg:grid-cols-[220px_minmax(0,1fr)]">
            <div>
              {actor.imageUrl ? (
                <img
                  src={
                    actor.imageUrl
                  }
                  alt={actor.name}
                  className="aspect-square w-full max-w-[220px] border border-borde object-cover"
                />
              ) : (
                <div className="flex aspect-square w-full max-w-[220px] items-center justify-center border border-borde bg-rojo-base text-5xl font-black text-hueso">
                  {initials || 'CE'}
                </div>
              )}
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-3">
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-texto-principal">
                  {content.eyebrow}
                </p>

                {actor.verified ? (
                  <span className="border border-borde px-3 py-1 text-[10px] font-bold uppercase text-texto-principal">
                    Verificado
                  </span>
                ) : null}
              </div>

              <h1 className="stencil-heading mt-6 max-w-5xl text-5xl font-black leading-[0.94] tracking-[-0.055em] sm:text-7xl lg:text-8xl">
                {actor.name}
              </h1>

              <p className="mt-7 max-w-4xl text-xl leading-8 text-texto-principal">
                {actor.headline}
              </p>

              {location ? (
                <p className="mt-5 text-sm text-texto-largo">
                  {location}
                </p>
              ) : null}

              {actor.labels.length >
              0 ? (
                <div className="mt-7 flex flex-wrap gap-2">
                  {actor.labels.map(
                    (label) => (
                      <span
                        key={label}
                        className="border border-borde px-4 py-2 text-xs uppercase tracking-[0.12em] text-texto-largo"
                      >
                        {formatLabel(
                          label
                        )}
                      </span>
                    )
                  )}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 py-16 sm:px-8 lg:px-12 lg:py-24">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[minmax(0,760px)_320px] lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-texto-principal">
              Perfil
            </p>

            <h2 className="mt-5 text-4xl font-bold tracking-[-0.04em]">
              Sobre este actor
            </h2>

            <p className="mt-7 whitespace-pre-line text-lg leading-9 text-texto-largo">
              {actor.description ||
                'Este perfil hace parte del ecosistema cultural y creativo de El Culebreo.'}
            </p>

            <section className="mt-16 border-t border-borde pt-12">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-texto-principal">
                Proyectos
              </p>

              <h2 className="mt-5 text-4xl font-bold tracking-[-0.04em]">
                Procesos relacionados
              </h2>

              {projects.length ===
              0 ? (
                <div className="mt-8 border border-dashed border-borde bg-superficie-elevada p-8">
                  <p className="text-texto-largo">
                    Todavía no hay proyectos públicos asociados con este perfil.
                  </p>
                </div>
              ) : (
                <div className="mt-8 grid gap-5 md:grid-cols-2">
                  {projects.map(
                    (project) => (
                      <ProjectCard
                        key={
                          project.projectId
                        }
                        project={
                          project
                        }
                      />
                    )
                  )}
                </div>
              )}
            </section>
          </div>

          <aside className="space-y-5">
            <InformationCard
              title={
                content.offersTitle
              }
              values={
                actor.offers.map(formatOfferLabel)
              }
              emptyText="Sin información pública."
            />

            <InformationCard
              title={
                content.interestsTitle
              }
              values={
                actor.interests
              }
              emptyText="Sin información pública."
            />

            <div className="border border-borde bg-rojo-base p-6 text-hueso">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-hueso">
                Creative OS
              </p>

              <h3 className="mt-4 text-xl font-bold">
                Conecta con el ecosistema
              </h3>

              <p className="mt-3 text-sm leading-7 text-hueso">
                Crea un proyecto y comienza a construir relaciones con personas, espacios y financiadores.
              </p>

              <Link
                href="/studio?new=1"
                className="mt-6 inline-flex border border-hueso px-5 py-3 text-sm font-bold text-hueso transition hover:bg-rojo-profundo"
              >
                Crear proyecto
              </Link>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}

function ProjectCard({
  project,
}: {
  project:
    PublicActorProject;
}) {
  return (
    <Link
      href={`/proyectos/${project.slug}`}
      className="group overflow-hidden border border-borde bg-superficie-elevada transition hover:shadow-stencil"
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
        <div className="aspect-[16/10] border-b border-borde bg-superficie" />
      )}

      <div className="p-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-texto-principal">
            {
              project.relationshipLabel
            }
          </span>

          <span className="text-texto-largo">
            ·
          </span>

          <span className="text-[10px] uppercase tracking-[0.12em] text-texto-largo">
            {categoryLabels[
              project.category
            ] ??
              project.category}
          </span>
        </div>

        <h3 className="mt-5 text-2xl font-bold tracking-[-0.03em]">
          {project.headline}
        </h3>

        <p className="mt-4 line-clamp-3 text-sm leading-7 text-texto-largo">
          {project.summary}
        </p>

        <p className="mt-6 text-sm font-bold transition group-hover:text-texto-principal">
          Ver proyecto →
        </p>
      </div>
    </Link>
  );
}

// Humaniza claves snake_case del vocabulario cerrado de habilidades
// (people.skills / PERSON_SKILLS) para mostrarlas en el perfil público —
// mismo criterio que formatLabel() en app/ecosistema/page.tsx para los
// labels de espacios.
function formatOfferLabel(value: string): string {
  return value
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function InformationCard({
  title,
  values,
  emptyText,
}: {
  title: string;
  values: string[];
  emptyText: string;
}) {
  return (
    <section className="border border-borde bg-superficie-elevada p-6">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-texto-largo">
        {title}
      </p>

      {values.length === 0 ? (
        <p className="mt-5 text-sm text-texto-largo">
          {emptyText}
        </p>
      ) : (
        <div className="mt-5 flex flex-wrap gap-2">
          {values.map(
            (value) => (
              <span
                key={value}
                className="border border-borde px-3 py-2 text-xs text-texto-largo"
              >
                {formatLabel(
                  value
                )}
              </span>
            )
          )}
        </div>
      )}
    </section>
  );
}

function getActorTypeFromRoute(
  routeActorType: string
): PublicActorType | null {
  if (
    routeActorType ===
    'personas'
  ) {
    return 'person';
  }

  if (
    routeActorType ===
    'espacios'
  ) {
    return 'space';
  }

  if (
    routeActorType ===
    'financiadores'
  ) {
    return 'funder';
  }

  return null;
}

function formatLabel(
  value: string
): string {
  return value
    .replaceAll('_', ' ')
    .replace(
      /\b\w/g,
      (character) =>
        character.toUpperCase()
    );
}
