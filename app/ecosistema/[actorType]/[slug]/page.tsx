import Link from 'next/link';

import {
  notFound,
} from 'next/navigation';

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
              href="/ecosistema"
              className="rounded-full border border-white/15 px-5 py-2.5 text-sm font-semibold transition hover:border-white"
            >
              Explorar ecosistema
            </Link>

            <Link
              href="/proyectos"
              className="rounded-full border border-white/15 px-5 py-2.5 text-sm font-semibold transition hover:border-white"
            >
              Ver proyectos
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

      <section className="border-b border-white/10 px-6 py-16 sm:px-8 lg:px-12 lg:py-24">
        <div className="mx-auto max-w-7xl">
          <Link
            href="/ecosistema"
            className="text-sm text-[#777777] transition hover:text-white"
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
                  className="aspect-square w-full max-w-[220px] rounded-full object-cover"
                />
              ) : (
                <div className="flex aspect-square w-full max-w-[220px] items-center justify-center rounded-full bg-[#D9FF00] text-5xl font-black text-black">
                  {initials || 'CE'}
                </div>
              )}
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-3">
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#D9FF00]">
                  {content.eyebrow}
                </p>

                {actor.verified ? (
                  <span className="rounded-full border border-[#D9FF00]/30 bg-[#D9FF00]/10 px-3 py-1 text-[10px] font-bold uppercase text-[#D9FF00]">
                    Verificado
                  </span>
                ) : null}
              </div>

              <h1 className="mt-6 max-w-5xl text-5xl font-black leading-[0.94] tracking-[-0.055em] sm:text-7xl lg:text-8xl">
                {actor.name}
              </h1>

              <p className="mt-7 max-w-4xl text-xl leading-8 text-[#D9FF00]">
                {actor.headline}
              </p>

              {location ? (
                <p className="mt-5 text-sm text-[#777777]">
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
                        className="rounded-full border border-white/10 px-4 py-2 text-xs uppercase tracking-[0.12em] text-[#777777]"
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
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#D9FF00]">
              Perfil
            </p>

            <h2 className="mt-5 text-4xl font-bold tracking-[-0.04em]">
              Sobre este actor
            </h2>

            <p className="mt-7 whitespace-pre-line text-lg leading-9 text-[#B0B0B0]">
              {actor.description ||
                'Este perfil hace parte del ecosistema cultural y creativo de Cultura Está.'}
            </p>

            <section className="mt-16 border-t border-white/10 pt-12">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#D9FF00]">
                Proyectos
              </p>

              <h2 className="mt-5 text-4xl font-bold tracking-[-0.04em]">
                Procesos relacionados
              </h2>

              {projects.length ===
              0 ? (
                <div className="mt-8 rounded-3xl border border-dashed border-white/15 bg-[#0A0A0A] p-8">
                  <p className="text-[#777777]">
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
                actor.offers
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

            <div className="rounded-[28px] border border-[#D9FF00]/20 bg-[#D9FF00]/5 p-6">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#D9FF00]">
                Creative OS
              </p>

              <h3 className="mt-4 text-xl font-bold">
                Conecta con el ecosistema
              </h3>

              <p className="mt-3 text-sm leading-7 text-[#888888]">
                Crea un proyecto y comienza a construir relaciones con personas, espacios y financiadores.
              </p>

              <Link
                href="/studio?new=1"
                className="mt-6 inline-flex rounded-full bg-[#D9FF00] px-5 py-3 text-sm font-bold text-black transition hover:bg-white"
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
      className="group overflow-hidden rounded-[28px] border border-white/10 bg-[#0A0A0A] transition hover:border-[#D9FF00]"
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
        <div className="aspect-[16/10] bg-[#111111]" />
      )}

      <div className="p-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#D9FF00]">
            {
              project.relationshipLabel
            }
          </span>

          <span className="text-[#333333]">
            ·
          </span>

          <span className="text-[10px] uppercase tracking-[0.12em] text-[#666666]">
            {categoryLabels[
              project.category
            ] ??
              project.category}
          </span>
        </div>

        <h3 className="mt-5 text-2xl font-bold tracking-[-0.03em]">
          {project.headline}
        </h3>

        <p className="mt-4 line-clamp-3 text-sm leading-7 text-[#888888]">
          {project.summary}
        </p>

        <p className="mt-6 text-sm font-bold transition group-hover:text-[#D9FF00]">
          Ver proyecto →
        </p>
      </div>
    </Link>
  );
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
    <section className="rounded-[28px] border border-white/10 bg-[#0A0A0A] p-6">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#767676]">
        {title}
      </p>

      {values.length === 0 ? (
        <p className="mt-5 text-sm text-[#666666]">
          {emptyText}
        </p>
      ) : (
        <div className="mt-5 flex flex-wrap gap-2">
          {values.map(
            (value) => (
              <span
                key={value}
                className="rounded-full border border-white/10 px-3 py-2 text-xs text-[#A0A0A0]"
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