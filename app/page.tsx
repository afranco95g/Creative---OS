import Link from 'next/link';
import {
  HomeAgendaSection,
} from '../components/public/HomeAgendaSection';
import { HomepageEditorialSections } from '../components/public/HomepageEditorialSections';
import {
  getPublicActorHref,
  listPublishedEcosystemActors,
} from '../services/public/publicEcosystem';

import {
  listPublishedProjects,
} from '../services/public/publicProjects';

import type {
  PublicActorType,
  PublicEcosystemActor,
} from '../services/public/publicEcosystem';

import type {
  PublicProjectSummary,
} from '../services/public/publicProjects';
import { listPublicHomepageSections } from '../services/public/publicEditorial';

const upcomingActivities = [
  {
    day: '24',
    month: 'JUL',
    title:
      'Laboratorio de creación audiovisual',
    type:
      'Taller',
    location:
      'Taller 108 · Bogotá',
  },
  {
    day: '27',
    month: 'JUL',
    title:
      'Sesión abierta de dibujo',
    type:
      'Actividad',
    location:
      'Taller La Tata · Bogotá',
  },
  {
    day: '02',
    month: 'AGO',
    title:
      'Encuentro de productores independientes',
    type:
      'Encuentro',
    location:
      'Estación 2600 · Bogotá',
  },
];

const stories = [
  {
    category:
      'Música',
    title:
      'Nuevas escenas que están transformando el circuito independiente',
    description:
      'Artistas, espacios y productores construyen nuevas formas de circular la música.',
  },
  {
    category:
      'Arte',
    title:
      'Los talleres colectivos como infraestructura cultural',
    description:
      'Más que lugares de trabajo, los talleres se convierten en espacios de colaboración.',
  },
  {
    category:
      'Ciudad',
    title:
      'Una agenda cultural construida desde los territorios',
    description:
      'Conoce los proyectos y actividades que están activando distintos barrios.',
  },
];

const actorTypeLabels:
  Record<PublicActorType, string> = {
    person:
      'Persona',

    space:
      'Espacio',

    funder:
      'Financiador',
  };

export const dynamic =
  'force-dynamic';

export default async function HomePage() {
  const {
    projects,
    actors,
  } = await loadHomeData();
  const editorialSections = await listPublicHomepageSections();
  const hasEditorialHero = editorialSections.some((section) => section.blockType === 'hero');
  const hasEditorialStories = editorialSections.some((section) =>
    section.blockType === 'featured_articles' || section.blockType === 'latest_posts'
  );

  const people =
    actors.filter(
      (actor) =>
        actor.actorType ===
        'person'
    );

  const spaces =
    actors.filter(
      (actor) =>
        actor.actorType ===
        'space'
    );

  const funders =
    actors.filter(
      (actor) =>
        actor.actorType ===
        'funder'
    );

  const featuredProject =
    projects[0] ?? null;

  const featuredPerson =
    people.find(
      (person) =>
        person.featured
    ) ??
    people[0] ??
    null;

  const ecosystemPreview = [
    ...people.slice(0, 2),
    ...spaces.slice(0, 2),
    ...funders.slice(0, 2),
  ];

  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-neutral-950/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-5 px-6 py-5">
          <Link
            href="/"
            className="shrink-0 text-lg font-black tracking-[-0.04em]"
          >
            CULTURA ESTA
          </Link>

          <nav className="hidden items-center gap-7 text-sm text-neutral-300 lg:flex">
            <a
              href="#historias"
              className="transition hover:text-white"
            >
              Historias
            </a>

            <a
              href="#agenda"
              className="transition hover:text-white"
            >
              Agenda
            </a>

            <a
              href="#ecosistema"
              className="transition hover:text-white"
            >
              Ecosistema
            </a>

            <Link
              href="/proyectos"
              className="transition hover:text-white"
            >
              Proyectos
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/mi-ecosistema"
              className="hidden rounded-full border border-white/20 px-5 py-2 text-sm font-medium transition hover:bg-white hover:text-black xl:inline-flex"
            >
              Mi Ecosistema
            </Link>

            <Link
              href="/studio"
              className="hidden rounded-full border border-white/20 px-5 py-2 text-sm font-medium transition hover:bg-white hover:text-black sm:inline-flex"
            >
              Entrar al Studio
            </Link>

            <Link
              href="/studio?new=1"
              className="rounded-full bg-[#D9FF00] px-5 py-2 text-sm font-bold text-black transition hover:bg-white"
            >
              Crear un proyecto
            </Link>
          </div>
        </div>
      </header>

      <HomepageEditorialSections />

      {!hasEditorialHero ? <section className="border-b border-white/10">
        <div className="mx-auto grid min-h-[76vh] max-w-7xl items-end gap-10 px-6 py-16 lg:grid-cols-[1.3fr_0.7fr] lg:py-24">
          <div>
            <p className="mb-6 text-sm font-semibold uppercase tracking-[0.24em] text-neutral-400">
              Cultura, ciudad y ecosistemas creativos
            </p>

            <h1 className="max-w-5xl text-5xl font-black leading-[0.92] tracking-[-0.06em] sm:text-7xl lg:text-8xl">
              La cultura no está escondida.

              <span className="block text-neutral-500">
                Está sucediendo.
              </span>
            </h1>

            <p className="mt-8 max-w-2xl text-lg leading-8 text-neutral-300">
              Un medio para descubrir artistas, proyectos,
              espacios, talleres, eventos y procesos que
              están construyendo el ecosistema cultural.
            </p>

            <div className="mt-9 flex flex-wrap gap-3">
              <Link
                href="/proyectos"
                className="rounded-full bg-white px-6 py-3 text-sm font-bold text-black transition hover:bg-[#D9FF00]"
              >
                Explorar proyectos
              </Link>

              <Link
                href="/ecosistema"
                className="rounded-full border border-white/20 px-6 py-3 text-sm font-semibold transition hover:border-white"
              >
                Conocer el ecosistema
              </Link>
            </div>
          </div>

          <article className="rounded-3xl border border-white/10 bg-white/[0.04] p-7">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">
              Esta semana
            </p>

            <h2 className="mt-4 text-3xl font-bold tracking-tight">
              La ciudad como estudio creativo
            </h2>

            <p className="mt-4 leading-7 text-neutral-400">
              Visitamos espacios independientes donde artistas,
              productores y comunidades desarrollan nuevas
              formas de trabajar juntos.
            </p>

            <a
              href="#historias"
              className="mt-8 inline-flex text-sm font-semibold underline decoration-neutral-600 underline-offset-8"
            >
              Leer historia
            </a>
          </article>
        </div>
      </section> : null}

      {!hasEditorialStories ? <section
        id="historias"
        className="mx-auto max-w-7xl px-6 py-20"
      >
        <div className="mb-10 flex items-end justify-between gap-6">
          <div>
            <p className="text-sm uppercase tracking-[0.22em] text-neutral-500">
              Medio
            </p>

            <h2 className="mt-3 text-4xl font-bold tracking-tight">
              Historias recientes
            </h2>
          </div>

          <span className="hidden text-sm text-neutral-500 sm:block">
            Relatos del ecosistema →
          </span>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {stories.map(
            (
              story,
              index
            ) => (
              <article
                key={story.title}
                className="group flex min-h-96 flex-col justify-end rounded-3xl border border-white/10 bg-gradient-to-b from-neutral-800 to-neutral-950 p-7"
              >
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-400">
                  {story.category}
                </span>

                <h3 className="mt-4 text-2xl font-bold leading-tight tracking-tight">
                  {story.title}
                </h3>

                <p className="mt-4 leading-7 text-neutral-400">
                  {story.description}
                </p>

                <span className="mt-8 text-sm font-medium text-neutral-300 transition group-hover:translate-x-1">
                  Leer historia{' '}
                  {index + 1} →
                </span>
              </article>
            )
          )}
        </div>
      </section> : null}

      <HomeAgendaSection />

      <section className="border-y border-white/10 bg-[#0a0a0a]">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#D9FF00]">Haz parte del ecosistema</p>
          <h2 className="mt-4 max-w-4xl text-4xl font-black tracking-[-0.04em] sm:text-5xl">¿Ya tienes un proyecto? Aplica al ecosistema.</h2>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-neutral-400">Presenta una actividad, taller, evento, experiencia, producto cultural, proyecto artístico o activación que ya tenga suficiente estructura.</p>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-neutral-500">Aplicar permite solicitar conexiones, recursos, conocimientos, espacios, colaboradores, financiación, distribución o acompañamiento. No publica automáticamente el proyecto ni garantiza su aprobación.</p>
          <div className="mt-9 grid gap-4 md:grid-cols-2">
            <Link href="/studio?new=1" className="rounded-3xl border border-white/15 p-6 transition hover:border-white"><strong className="text-xl">Desarrollar una idea</strong><span className="mt-2 block text-neutral-400">Trabaja con el Productor Ejecutivo desde el inicio.</span></Link>
            <Link href="/aplicar" className="rounded-3xl bg-[#D9FF00] p-6 text-black"><strong className="text-xl">Aplicar con un proyecto existente</strong><span className="mt-2 block text-black/70">Presenta una propuesta que ya está en marcha o consolidada.</span></Link>
          </div>
        </div>
      </section>

      <section
        id="ecosistema"
        className="mx-auto max-w-7xl px-6 py-20"
      >
        <div className="flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.22em] text-[#D9FF00]">
              Personas y conexiones
            </p>

            <h2 className="mt-3 max-w-4xl text-4xl font-bold tracking-tight sm:text-5xl">
              El ecosistema que hace posible la cultura
            </h2>

            <p className="mt-5 max-w-3xl leading-7 text-neutral-400">
              Personas, espacios, marcas y organizaciones
              conectadas a proyectos y procesos creativos
              publicados por Cultura Esta.
            </p>
          </div>

          <Link
            href="/ecosistema"
            className="self-start rounded-full border border-white/15 px-5 py-3 text-sm font-semibold transition hover:border-[#D9FF00] hover:text-[#D9FF00]"
          >
            Explorar todo el ecosistema
          </Link>
        </div>

        <div className="mt-10 grid max-w-3xl grid-cols-3 gap-3">
          <HomeMetric
            value={String(
              people.length
            )}
            label="Personas"
          />

          <HomeMetric
            value={String(
              spaces.length
            )}
            label="Espacios"
          />

          <HomeMetric
            value={String(
              funders.length
            )}
            label="Financiadores"
          />
        </div>

        {ecosystemPreview.length === 0 ? (
          <div className="mt-10 rounded-3xl border border-dashed border-white/15 bg-white/[0.02] p-9">
            <h3 className="text-2xl font-bold">
              El directorio público está comenzando
            </h3>

            <p className="mt-4 max-w-3xl leading-7 text-neutral-400">
              Los perfiles aparecerán aquí después de ser
              revisados y publicados por el administrador del
              ecosistema.
            </p>

            <Link
              href="/ecosistema"
              className="mt-7 inline-flex rounded-full border border-white/15 px-5 py-3 text-sm font-semibold"
            >
              Ver directorio público
            </Link>
          </div>
        ) : (
          <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {ecosystemPreview.map(
              (actor) => (
                <HomeActorCard
                  key={`${actor.actorType}-${actor.actorId}`}
                  actor={actor}
                />
              )
            )}
          </div>
        )}
      </section>

      <section
        id="artista"
        className="mx-auto grid max-w-7xl gap-8 px-6 py-20 lg:grid-cols-2"
      >
        {featuredPerson?.imageUrl ? (
          <img
            src={
              featuredPerson.imageUrl
            }
            alt={
              featuredPerson.name
            }
            className="min-h-[520px] w-full rounded-3xl object-cover"
          />
        ) : (
          <div className="flex min-h-[520px] items-end rounded-3xl bg-gradient-to-br from-neutral-700 via-neutral-900 to-black p-9">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#D9FF00]">
              Cultura Esta · Persona
            </p>
          </div>
        )}

        <div className="flex flex-col justify-center rounded-3xl border border-white/10 p-8 lg:p-12">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-neutral-500">
            Artista de la semana
          </p>

          {featuredPerson ? (
            <>
              <h2 className="mt-5 text-5xl font-black tracking-[-0.05em]">
                {featuredPerson.name}
              </h2>

              <p className="mt-5 text-lg font-semibold leading-8 text-[#D9FF00]">
                {
                  featuredPerson.headline
                }
              </p>

              <p className="mt-6 max-w-xl text-lg leading-8 text-neutral-400">
                {featuredPerson.description ||
                  'Una voz activa dentro del ecosistema cultural y creativo de Cultura Esta.'}
              </p>

              <Link
                href={getPublicActorHref(
                  featuredPerson
                )}
                className="mt-9 self-start rounded-full bg-white px-6 py-3 text-sm font-semibold text-black transition hover:bg-[#D9FF00]"
              >
                Conocer el perfil
              </Link>
            </>
          ) : (
            <>
              <h2 className="mt-5 text-5xl font-black tracking-[-0.05em]">
                Una práctica construida entre imagen,
                territorio y memoria
              </h2>

              <p className="mt-6 max-w-xl text-lg leading-8 text-neutral-400">
                Cada semana destacamos una voz del ecosistema:
                su proceso, sus preguntas, su trayectoria y
                las comunidades con las que trabaja.
              </p>

              <Link
                href="/ecosistema"
                className="mt-9 self-start rounded-full bg-white px-6 py-3 text-sm font-semibold text-black transition hover:bg-[#D9FF00]"
              >
                Explorar personas
              </Link>
            </>
          )}
        </div>
      </section>

      <section
        id="proyecto"
        className="mx-auto max-w-7xl px-6 pb-24"
      >
        {featuredProject ? (
          <FeaturedProject
            project={
              featuredProject
            }
          />
        ) : (
          <article className="grid overflow-hidden rounded-3xl border border-white/10 bg-white text-black lg:grid-cols-[1.1fr_0.9fr]">
            <div className="p-8 sm:p-12 lg:p-16">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-neutral-500">
                Proyecto de la semana
              </p>

              <h2 className="mt-5 max-w-3xl text-5xl font-black tracking-[-0.05em]">
                Los proyectos del ecosistema aparecerán aquí
              </h2>

              <p className="mt-6 max-w-2xl text-lg leading-8 text-neutral-600">
                Los proyectos deben ser desarrollados con
                Creative OS, aceptados por el ecosistema y
                aprobados editorialmente por Cultura Esta.
              </p>

              <div className="mt-9 flex flex-wrap gap-3">
                <Link
                  href="/proyectos"
                  className="rounded-full bg-black px-6 py-3 text-sm font-semibold text-white"
                >
                  Ver proyectos
                </Link>

                <Link
                  href="/studio?new=1"
                  className="rounded-full border border-black/20 px-6 py-3 text-sm font-semibold text-black"
                >
                  Crear un proyecto
                </Link>
              </div>
            </div>

            <div className="min-h-96 bg-gradient-to-br from-neutral-300 via-neutral-500 to-neutral-900" />
          </article>
        )}
      </section>

      <section className="border-t border-white/10 bg-white/[0.025]">
        <div className="mx-auto grid max-w-7xl gap-8 px-6 py-20 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#D9FF00]">
              Creative OS
            </p>

            <h2 className="mt-4 max-w-4xl text-4xl font-black tracking-[-0.045em] sm:text-5xl">
              Lo que descubres también puede convertirse en
              un proyecto.
            </h2>

            <p className="mt-5 max-w-3xl text-lg leading-8 text-neutral-400">
              Convierte una inspiración, necesidad u
              oportunidad en una estructura de producción
              conectada con personas, espacios y
              financiadores del ecosistema.
            </p>
          </div>

          <Link
            href="/studio?new=1"
            className="self-start rounded-full bg-[#D9FF00] px-7 py-4 text-sm font-bold text-black transition hover:bg-white lg:self-center"
          >
            Construir un proyecto
          </Link>
        </div>
      </section>

      <footer className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-8 px-6 py-10 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-bold">
              Cultura Esta
            </p>

            <p className="mt-2 text-sm text-neutral-500">
              Un medio conectado a un ecosistema creativo.
            </p>
          </div>

          <div className="flex flex-wrap gap-5 text-sm text-neutral-400">
            <Link
              href="/proyectos"
              className="transition hover:text-white"
            >
              Proyectos
            </Link>

            <Link
              href="/ecosistema"
              className="transition hover:text-white"
            >
              Ecosistema
            </Link>

            <Link
              href="/mi-ecosistema"
              className="transition hover:text-white"
            >
              Mi Ecosistema
            </Link>

            <Link
              href="/studio"
              className="transition hover:text-white"
            >
              Acceder al Studio →
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}

function FeaturedProject({
  project,
}: {
  project:
    PublicProjectSummary;
}) {
  return (
    <article className="grid overflow-hidden rounded-3xl border border-white/10 bg-white text-black lg:grid-cols-[1.1fr_0.9fr]">
      <div className="p-8 sm:p-12 lg:p-16">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-neutral-500">
          Proyecto de la semana
        </p>

        <h2 className="mt-5 max-w-3xl text-5xl font-black tracking-[-0.05em]">
          {project.headline}
        </h2>

        <p className="mt-6 max-w-2xl text-lg leading-8 text-neutral-600">
          {project.summary ||
            project.description}
        </p>

        <div className="mt-7 flex flex-wrap gap-2">
          {project.city ? (
            <span className="rounded-full border border-black/10 px-4 py-2 text-xs font-semibold">
              {project.city}
            </span>
          ) : null}

          {project.disciplines
            .slice(0, 4)
            .map(
              (discipline) => (
                <span
                  key={
                    discipline
                  }
                  className="rounded-full border border-black/10 px-4 py-2 text-xs font-semibold"
                >
                  {discipline}
                </span>
              )
            )}
        </div>

        <Link
          href={`/proyectos/${project.slug}`}
          className="mt-9 inline-flex rounded-full bg-black px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#D9FF00] hover:text-black"
        >
          Ver proyecto
        </Link>
      </div>

      {project.coverImageUrl ? (
        <img
          src={
            project.coverImageUrl
          }
          alt={
            project.headline
          }
          className="min-h-96 h-full w-full object-cover"
        />
      ) : (
        <div className="min-h-96 bg-gradient-to-br from-neutral-300 via-neutral-500 to-neutral-900" />
      )}
    </article>
  );
}

function HomeActorCard({
  actor,
}: {
  actor:
    PublicEcosystemActor;
}) {
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

  const location =
    [
      actor.city,
      actor.department,
      actor.country,
    ]
      .filter(Boolean)
      .join(', ');

  return (
    <Link
      href={getPublicActorHref(
        actor
      )}
      className="group flex min-h-[360px] flex-col rounded-3xl border border-white/10 bg-white/[0.025] p-7 transition hover:-translate-y-1 hover:border-[#D9FF00]"
    >
      <div className="flex items-start justify-between gap-4">
        {actor.imageUrl ? (
          <img
            src={
              actor.imageUrl
            }
            alt={
              actor.name
            }
            className="h-16 w-16 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#D9FF00] text-lg font-black text-black">
            {initials || 'CE'}
          </div>
        )}

        <span className="rounded-full border border-white/10 px-3 py-1.5 text-[10px] uppercase tracking-[0.12em] text-neutral-500">
          {
            actorTypeLabels[
              actor.actorType
            ]
          }
        </span>
      </div>

      <h3 className="mt-7 text-2xl font-bold tracking-tight">
        {actor.name}
      </h3>

      <p className="mt-3 text-sm font-semibold text-[#D9FF00]">
        {actor.headline}
      </p>

      <p className="mt-5 line-clamp-3 text-sm leading-7 text-neutral-400">
        {actor.description ||
          'Perfil del ecosistema cultural y creativo.'}
      </p>

      {actor.labels.length > 0 ? (
        <div className="mt-6 flex flex-wrap gap-2">
          {actor.labels
            .slice(0, 3)
            .map(
              (label) => (
                <span
                  key={label}
                  className="rounded-full border border-white/10 px-3 py-1.5 text-[10px] uppercase tracking-[0.1em] text-neutral-500"
                >
                  {formatLabel(
                    label
                  )}
                </span>
              )
            )}
        </div>
      ) : null}

      <div className="mt-auto pt-7">
        <p className="text-xs text-neutral-600">
          {location ||
            'Ubicación sin definir'}
        </p>

        <p className="mt-5 text-sm font-semibold transition group-hover:text-[#D9FF00]">
          Conocer perfil →
        </p>
      </div>
    </Link>
  );
}

function HomeMetric({
  value,
  label,
}: {
  value:
    string;

  label:
    string;
}) {
  return (
    <article className="rounded-2xl border border-white/10 bg-white/[0.025] p-5">
      <p className="text-3xl font-black text-[#D9FF00]">
        {value}
      </p>

      <p className="mt-2 text-[10px] uppercase tracking-[0.14em] text-neutral-500">
        {label}
      </p>
    </article>
  );
}

async function loadHomeData(): Promise<{
  projects:
    PublicProjectSummary[];

  actors:
    PublicEcosystemActor[];
}> {
  const [
    projectsResult,
    actorsResult,
  ] = await Promise.allSettled([
    listPublishedProjects(),
    listPublishedEcosystemActors(),
  ]);

  if (
    projectsResult.status ===
    'rejected'
  ) {
    console.error(
      'No fue posible cargar proyectos en la portada:',
      projectsResult.reason
    );
  }

  if (
    actorsResult.status ===
    'rejected'
  ) {
    console.error(
      'No fue posible cargar actores en la portada:',
      actorsResult.reason
    );
  }

  return {
    projects:
      projectsResult.status ===
      'fulfilled'
        ? projectsResult.value
        : [],

    actors:
      actorsResult.status ===
      'fulfilled'
        ? actorsResult.value
        : [],
  };
}

function formatLabel(
  value:
    string
): string {
  return value
    .replaceAll(
      '_',
      ' '
    )
    .replace(
      /\b\w/g,
      (character) =>
        character.toUpperCase()
    );
}
