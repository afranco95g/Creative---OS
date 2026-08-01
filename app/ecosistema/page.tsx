import Link from 'next/link';

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
    },
  ];

export const dynamic =
  'force-dynamic';

export default async function PublicEcosystemPage() {
  const actors =
    await listPublishedEcosystemActors();

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
              href="/"
              className="rounded-full border border-white/15 px-5 py-2.5 text-sm font-semibold transition hover:border-white"
            >
              Volver al medio
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

      <section className="border-b border-white/10 px-6 py-20 sm:px-8 lg:px-12 lg:py-28">
        <div className="mx-auto max-w-7xl">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#D9FF00]">
            Ecosistema creativo
          </p>

          <h1 className="mt-6 max-w-6xl text-5xl font-black leading-[0.92] tracking-[-0.055em] sm:text-7xl lg:text-9xl">
            La cultura la hacen personas conectadas.
          </h1>

          <p className="mt-8 max-w-3xl text-lg leading-8 text-[#A6A6A6]">
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
                    <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#D9FF00]">
                      {
                        section.eyebrow
                      }
                    </p>

                    <h2 className="mt-4 max-w-4xl text-4xl font-bold tracking-[-0.04em]">
                      {section.title}
                    </h2>

                    <p className="mt-4 max-w-3xl text-sm leading-7 text-[#888888]">
                      {
                        section.description
                      }
                    </p>
                  </div>

                  <p className="text-sm text-[#666666]">
                    {
                      sectionActors.length
                    }{' '}
                    {sectionActors.length ===
                    1
                      ? 'perfil'
                      : 'perfiles'}
                  </p>
                </div>

                {sectionActors.length ===
                0 ? (
                  <div className="mt-8 rounded-3xl border border-dashed border-white/15 bg-[#0A0A0A] p-8">
                    <p className="text-[#777777]">
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
      className="group flex min-h-[390px] flex-col rounded-[30px] border border-white/10 bg-[#0A0A0A] p-7 transition hover:-translate-y-1 hover:border-[#D9FF00]"
    >
      <div className="flex items-start justify-between gap-4">
        {actor.imageUrl ? (
          <img
            src={actor.imageUrl}
            alt={actor.name}
            className="h-20 w-20 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#D9FF00] text-xl font-black text-black">
            {initials || 'CE'}
          </div>
        )}

        {actor.verified ? (
          <span className="rounded-full border border-[#D9FF00]/30 bg-[#D9FF00]/10 px-3 py-1.5 text-[10px] font-bold uppercase text-[#D9FF00]">
            Verificado
          </span>
        ) : null}
      </div>

      <h3 className="mt-8 text-3xl font-bold tracking-[-0.035em]">
        {actor.name}
      </h3>

      <p className="mt-3 text-sm font-semibold text-[#D9FF00]">
        {actor.headline}
      </p>

      <p className="mt-5 line-clamp-4 text-sm leading-7 text-[#888888]">
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
                className="rounded-full border border-white/10 px-3 py-1.5 text-[10px] uppercase tracking-[0.12em] text-[#666666]"
              >
                {formatLabel(
                  label
                )}
              </span>
            ))}
        </div>
      ) : null}

      <div className="mt-auto pt-8">
        <p className="text-xs text-[#555555]">
          {location ||
            'Ubicación sin definir'}
        </p>

        <p className="mt-5 text-sm font-bold transition group-hover:text-[#D9FF00]">
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
    <article className="rounded-2xl border border-white/10 bg-[#0A0A0A] p-5">
      <p className="text-3xl font-black text-[#D9FF00]">
        {value}
      </p>

      <p className="mt-2 text-[10px] uppercase tracking-[0.14em] text-[#777777]">
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