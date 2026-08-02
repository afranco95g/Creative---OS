import Link from 'next/link';
import type { Metadata } from 'next';

import {
  notFound,
} from 'next/navigation';

import {
  getPublishedProject,
} from '../../../services/public/publicProjects';

import type {
  PublicProjectActor,
} from '../../../services/public/publicProjects';
import { ShareButtons } from '../../../components/public/ShareButtons';

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

const actorTypeLabels:
  Record<string, string> = {
    person:
      'Persona',

    space:
      'Espacio',

    funder:
      'Apoyo',
  };

interface PublicProjectPageProps {
  params: Promise<{
    projectId: string;
  }>;
}

export const dynamic =
  'force-dynamic';

export async function generateMetadata({ params }: PublicProjectPageProps): Promise<Metadata> {
  const { projectId } = await params;
  const project = await getPublishedProject(projectId);
  if (!project) return { robots: { index: false, follow: false } };
  const url = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://creative-os-beta-cyan.vercel.app'}/proyectos/${project.id}`;
  return {
    title: project.headline,
    description: project.summary,
    alternates: { canonical: url },
    openGraph: { title: project.headline, description: project.summary, url, images: project.coverImageUrl ? [project.coverImageUrl] : [] },
    twitter: { card: 'summary_large_image', title: project.headline, description: project.summary, images: project.coverImageUrl ? [project.coverImageUrl] : [] },
  };
}

export default async function PublicProjectPage({
  params,
}: PublicProjectPageProps) {
  const {
    projectId,
  } = await params;

  const project =
    await getPublishedProject(
      projectId
    );

  if (!project) {
    notFound();
  }

  const publicationDate =
    project.publishedAt
      ? new Date(
          project.publishedAt
        ).toLocaleDateString(
          'es-CO',
          {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          }
        )
      : null;

  const bodyParagraphs =
    project.body
      .split(/\n{2,}/)
      .map((paragraph) =>
        paragraph.trim()
      )
      .filter(Boolean);

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

      <article>
        <section className="px-6 pb-16 pt-14 sm:px-8 lg:px-12 lg:pb-24 lg:pt-20">
          <div className="mx-auto max-w-7xl">
            <Link
              href="/proyectos"
              className="text-sm text-[#777777] transition hover:text-white"
            >
              ← Todos los proyectos
            </Link>

            <div className="mt-12 flex flex-wrap items-center gap-3">
              <span className="rounded-full bg-[#D9FF00] px-4 py-2 text-xs font-bold uppercase tracking-[0.12em] text-black">
                {categoryLabels[
                  project.category
                ] ??
                  project.category}
              </span>

              {project.city ? (
                <span className="rounded-full border border-white/15 px-4 py-2 text-xs text-[#A6A6A6]">
                  {project.city}
                </span>
              ) : null}

              {publicationDate ? (
                <span className="text-xs text-[#666666]">
                  Publicado el{' '}
                  {publicationDate}
                </span>
              ) : null}
            </div>

            <h1 className="mt-9 max-w-6xl text-5xl font-black leading-[0.92] tracking-[-0.055em] sm:text-7xl lg:text-9xl">
              {project.headline}
            </h1>

            <p className="mt-10 max-w-4xl text-xl leading-9 text-[#B0B0B0]">
              {project.summary}
            </p>

            <div className="mt-8 [&_a]:border [&_a]:border-white/15 [&_a]:px-4 [&_a]:py-2 [&_button]:border [&_button]:border-white/15 [&_button]:px-4 [&_button]:py-2">
              <ShareButtons
                title={project.headline}
                url={`${process.env.NEXT_PUBLIC_SITE_URL || 'https://creative-os-beta-cyan.vercel.app'}/proyectos/${project.id}`}
              />
            </div>

            {project.disciplines.length >
            0 ? (
              <div className="mt-8 flex flex-wrap gap-2">
                {project.disciplines.map(
                  (discipline) => (
                    <span
                      key={discipline}
                      className="rounded-full border border-white/10 px-4 py-2 text-xs uppercase tracking-[0.12em] text-[#777777]"
                    >
                      {discipline}
                    </span>
                  )
                )}
              </div>
            ) : null}
          </div>
        </section>

        {project.coverImageUrl ? (
          <section className="px-6 sm:px-8 lg:px-12">
            <div className="mx-auto max-w-7xl overflow-hidden rounded-[34px] border border-white/10 bg-[#0A0A0A]">
              <img
                src={
                  project.coverImageUrl
                }
                alt={
                  project.headline
                }
                className="aspect-[16/8] w-full object-cover"
              />
            </div>
          </section>
        ) : null}

        <section className="px-6 py-16 sm:px-8 lg:px-12 lg:py-24">
          <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[300px_minmax(0,760px)] lg:justify-between">
            <aside>
              <div className="sticky top-8 rounded-[28px] border border-white/10 bg-[#0A0A0A] p-6">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#767676]">
                  Proyecto
                </p>

                <p className="mt-5 text-5xl font-black text-[#D9FF00]">
                  {project.progress}%
                </p>

                <p className="mt-3 text-sm leading-6 text-[#888888]">
                  Nivel de construcción registrado al momento
                  de su publicación.
                </p>

                <div className="mt-6 h-2 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-[#D9FF00]"
                    style={{
                      width:
                        `${project.progress}%`,
                    }}
                  />
                </div>

                {project.credits ? (
                  <div className="mt-8 border-t border-white/10 pt-6">
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#666666]">
                      Créditos
                    </p>

                    <p className="mt-3 whitespace-pre-line text-sm leading-6 text-[#999999]">
                      {project.credits}
                    </p>
                  </div>
                ) : null}
              </div>
            </aside>

            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#D9FF00]">
                Historia
              </p>

              {bodyParagraphs.length >
              0 ? (
                <div className="mt-7 space-y-7">
                  {bodyParagraphs.map(
                    (
                      paragraph,
                      index
                    ) => (
                      <p
                        key={`${index}-${paragraph.slice(
                          0,
                          24
                        )}`}
                        className="text-lg leading-9 text-[#B0B0B0]"
                      >
                        {paragraph}
                      </p>
                    )
                  )}
                </div>
              ) : (
                <p className="mt-7 text-lg leading-9 text-[#B0B0B0]">
                  {project.description}
                </p>
              )}

              {project.actors.length > 0 ? (
                <section className="mt-16 border-t border-white/10 pt-12">
                  <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#D9FF00]">
                    Ecosistema del proyecto
                  </p>

                  <h2 className="mt-5 text-3xl font-bold tracking-[-0.035em]">
                    Personas, espacios y apoyos
                  </h2>

                  <div className="mt-8 grid gap-4 sm:grid-cols-2">
                    {project.actors.map(
                      (actor) => (
                        <PublicActorCard
                          key={`${actor.actorType}-${actor.actorId}`}
                          actor={actor}
                        />
                      )
                    )}
                  </div>
                </section>
              ) : null}

              <div className="mt-16 rounded-[30px] border border-[#D9FF00]/20 bg-[#D9FF00]/5 p-7 md:p-9">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#D9FF00]">
                  Creative OS
                </p>

                <h2 className="mt-5 text-3xl font-bold tracking-[-0.035em]">
                  También puedes construir un proyecto
                </h2>

                <p className="mt-5 max-w-2xl text-base leading-8 text-[#A0A0A0]">
                  Convierte una idea, necesidad u oportunidad
                  en una estructura de producción conectada con
                  el ecosistema creativo.
                </p>

                <Link
                  href="/studio?new=1"
                  className="mt-8 inline-flex rounded-full bg-[#D9FF00] px-6 py-3 text-sm font-bold text-black transition hover:bg-white"
                >
                  Crear mi proyecto
                </Link>
              </div>
            </div>
          </div>
        </section>
      </article>
    </main>
  );
}

function PublicActorCard({
  actor,
}: {
  actor: PublicProjectActor;
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

  return (
    <Link
      href={getActorHref(
        actor
      )}
      className="group rounded-2xl border border-white/10 bg-[#0A0A0A] p-5 transition hover:border-[#D9FF00]"
    >
      <div className="flex items-start gap-4">
        {actor.imageUrl ? (
          <img
            src={actor.imageUrl}
            alt={actor.name}
            className="h-14 w-14 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#D9FF00] text-sm font-bold text-black">
            {initials || 'CE'}
          </div>
        )}

        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#D9FF00]">
            {actor.relationshipLabel}
          </p>

          <h3 className="mt-2 font-semibold text-white transition group-hover:text-[#D9FF00]">
            {actor.name}
          </h3>

          <p className="mt-1 text-xs uppercase tracking-[0.12em] text-[#666666]">
            {actorTypeLabels[
              actor.actorType
            ] ??
              actor.actorType}
          </p>

          {actor.subtitle ? (
            <p className="mt-3 text-sm leading-6 text-[#888888]">
              {actor.subtitle}
            </p>
          ) : null}

          <p className="mt-4 text-xs font-semibold text-white">
            Ver perfil →
          </p>
        </div>
      </div>
    </Link>
  );
}

function getActorHref(
  actor:
    PublicProjectActor
): string {
  const pathByType:
    Record<
      PublicProjectActor['actorType'],
      string
    > = {
      person:
        'personas',

      space:
        'espacios',

      funder:
        'financiadores',
    };

  return `/ecosistema/${
    pathByType[
      actor.actorType
    ]
  }/${actor.slug}`;
}
