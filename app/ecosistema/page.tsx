import Link from 'next/link';

import { SiteHeader } from '../../components/public/SiteHeader';

import {
  getPublicActorHref,
  listPublishedEcosystemActors,
} from '../../services/public/publicEcosystem';

import type {
  PublicActorType,
  PublicEcosystemActor,
} from '../../services/public/publicEcosystem';

const sectionDefinitions:
  Array<{
    actorType: PublicActorType;
    eyebrow: string;
    title: string;
    description: string;
    ctaLabel?: string;
    ctaHref?: string;
  }> = [
    {
      actorType:
        'person',

      eyebrow:
        'Personas',

      title:
        'Quienes crean, producen y conectan',

      description:
        'Artistas, productores, gestores, periodistas, mentores y agentes del ecosistema cultural y creativo.',
    },

    {
      actorType:
        'space',

      eyebrow:
        'Espacios',

      title:
        'Lugares donde la cultura sucede',

      description:
        'Talleres, estudios, galerías, restaurantes, salas y espacios interesados en recibir o crear experiencias.',
    },

    {
      actorType:
        'funder',

      eyebrow:
        'Financiadores',

      title:
        'Marcas y organizaciones que hacen posible',

      description:
        'Empresas, fundaciones, agencias, entidades y personas que apoyan procesos culturales y creativos.',

      ctaLabel:
        'Ver financiamiento activo',

      ctaHref:
        '/oportunidades',
    },
  ];

export const dynamic =
  'force-dynamic';

export default async function PublicEcosystemPage() {
  const actors =
    await listPublishedEcosystemActors();

  return (
    <main className="min-h-screen bg-superficie text-texto-largo">
      <SiteHeader
        links={[
          { label: 'Ver proyectos', href: '/proyectos' },
          { label: 'Volver al medio', href: '/' },
        ]}
      />

      <section className="border-b border-borde px-6 py-20 sm:px-8 lg:px-12 lg:py-28">
        <div className="mx-auto max-w-7xl">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-texto-principal">
            Ecosistema creativo
          </p>

          <h1 className="stencil-heading mt-6 max-w-6xl text-5xl font-black leading-[0.92] tracking-[-0.055em] sm:text-7xl lg:text-9xl">
            La cultura la hacen personas conectadas.
          </h1>

          <p className="mt-8 max-w-3xl text-lg leading-8 text-texto-largo">
            Explora las personas, espacios, marcas y
            organizaciones que crean, reciben, producen,
            financian y hacen circular proyectos culturales.
          </p>

          <div className="mt-10 grid max-w-3xl grid-cols-3 gap-3">
            <Metric
              value={String(
                actors.filter(
                  (actor) =>
                    actor.actorType ===
                    'person'
                ).length
              )}
              label="Personas"
            />

            <Metric
              value={String(
                actors.filter(
                  (actor) =>
                    actor.actorType ===
                    'space'
                ).length
              )}
              label="Espacios"
            />

            <Metric
              value={String(
                actors.filter(
                  (actor) =>
                    actor.actorType ===
                    'funder'
                ).length
              )}
              label="Financiadores"
            />
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl space-y-24 px-6 py-16 sm:px-8 lg:px-12 lg:py-24">
        {sectionDefinitions.map(
          (section) => {
            const sectionActors =
              actors.filter(
                (actor) =>
                  actor.actorType ===
                  section.actorType
              );

            return (
              <section
                key={
                  section.actorType
                }
              >
                <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.22em] text-texto-principal">
                      {
                        section.eyebrow
                      }
                    </p>

                    <h2 className="mt-4 max-w-4xl text-4xl font-bold tracking-[-0.04em]">
                      {section.title}
                    </h2>

                    <p className="mt-4 max-w-3xl text-sm leading-7 text-texto-largo">
                      {
                        section.description
                      }
                    </p>
                  </div>

                  <div className="flex flex-col items-start gap-3 lg:items-end">
                    <p className="text-sm text-texto-largo">
                      {
                        sectionActors.length
                      }{' '}
                      {sectionActors.length ===
                      1
                        ? 'perfil'
                        : 'perfiles'}
                    </p>

                    {section.ctaHref ? (
                      <Link
                        href={
                          section.ctaHref
                        }
                        className="border border-borde px-5 py-2.5 text-sm font-semibold transition hover:bg-superficie-elevada"
                      >
                        {
                          section.ctaLabel
                        }{' '}
                        →
                      </Link>
                    ) : null}
                  </div>
                </div>

                {sectionActors.length ===
                0 ? (
                  <div className="mt-8 border border-dashed border-borde bg-superficie-elevada p-8">
                    <p className="text-texto-largo">
                      Todavía no hay perfiles públicos de este tipo.
                    </p>
                  </div>
                ) : (
                  <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                    {sectionActors.map(
                      (actor) => (
                        <PublicActorCard
                          key={`${actor.actorType}-${actor.actorId}`}
                          actor={actor}
                        />
                      )
                    )}
                  </div>
                )}
              </section>
            );
          }
        )}
      </div>
    </main>
  );
}

function PublicActorCard({
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
      className="group flex min-h-[390px] flex-col border border-borde bg-superficie-elevada p-7 transition hover:shadow-stencil"
    >
      <div className="flex items-start justify-between gap-4">
        {actor.imageUrl ? (
          <img
            src={actor.imageUrl}
            alt={actor.name}
            className="h-20 w-20 border border-borde object-cover"
          />
        ) : (
          <div className="flex h-20 w-20 items-center justify-center border border-borde bg-rojo-base text-xl font-black text-hueso">
            {initials || 'EC'}
          </div>
        )}

        {actor.verified ? (
          <span className="border border-borde px-3 py-1.5 text-[10px] font-bold uppercase text-texto-principal">
            Verificado
          </span>
        ) : null}
      </div>

      <h3 className="mt-8 text-3xl font-bold tracking-[-0.035em]">
        {actor.name}
      </h3>

      <p className="mt-3 text-sm font-semibold text-texto-principal">
        {actor.headline}
      </p>

      <p className="mt-5 line-clamp-4 text-sm leading-7 text-texto-largo">
        {actor.description ||
          'Perfil del ecosistema cultural y creativo.'}
      </p>

      {actor.labels.length > 0 ? (
        <div className="mt-6 flex flex-wrap gap-2">
          {actor.labels
            .slice(0, 3)
            .map((label) => (
              <span
                key={label}
                className="border border-borde px-3 py-1.5 text-[10px] uppercase tracking-[0.12em] text-texto-largo"
              >
                {formatLabel(
                  label
                )}
              </span>
            ))}
        </div>
      ) : null}

      <div className="mt-auto pt-8">
        <p className="text-xs text-texto-largo">
          {location ||
            'Ubicación sin definir'}
        </p>

        <p className="mt-5 text-sm font-bold transition group-hover:text-texto-principal">
          Conocer perfil →
        </p>
      </div>
    </Link>
  );
}

function Metric({
  value,
  label,
}: {
  value: string;
  label: string;
}) {
  return (
    <article className="border border-borde bg-superficie-elevada p-5">
      <p className="text-3xl font-black text-texto-principal">
        {value}
      </p>

      <p className="mt-2 text-[10px] uppercase tracking-[0.14em] text-texto-largo">
        {label}
      </p>
    </article>
  );
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
