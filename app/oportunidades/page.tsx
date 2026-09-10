import Link from 'next/link';

import { SiteHeader } from '../../components/public/SiteHeader';

import {
  listPublishedFundingOpportunities,
} from '../../services/public/publicFunding';

const typeLabels:
  Record<string, string> = {
    grant:
      'Convocatoria o estímulo',

    sponsorship:
      'Patrocinio',

    commission:
      'Comisión o contratación',

    partnership:
      'Alianza',

    residency:
      'Residencia',

    call:
      'Llamado abierto',

    other:
      'Otra oportunidad',
  };

export const dynamic =
  'force-dynamic';

export default async function PublicOpportunitiesPage() {
  const opportunities =
    await listPublishedFundingOpportunities();

  return (
    <main className="min-h-screen bg-superficie text-texto-largo">
      <SiteHeader
        ctaLabel="Crear oportunidad"
        ctaHref="/gestion-financiacion"
        links={[
          { label: 'Mi Ecosistema', href: '/mi-ecosistema' },
        ]}
      />

      <section className="border-b border-borde px-6 py-20 sm:px-8 lg:px-12 lg:py-28">
        <div className="mx-auto max-w-7xl">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-texto-principal">
            Financiación y alianzas
          </p>

          <h1 className="stencil-heading mt-7 max-w-6xl text-5xl font-black leading-[0.92] tracking-[-0.055em] sm:text-7xl lg:text-9xl">
            Recursos que encuentran proyectos.
          </h1>

          <p className="mt-8 max-w-3xl text-lg leading-8 text-texto-largo">
            Convocatorias, patrocinios, alianzas,
            residencias y posibilidades para fortalecer
            procesos culturales y creativos.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16 sm:px-8 lg:px-12 lg:py-24">
        <div className="flex items-end justify-between gap-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-texto-largo">
              Oportunidades abiertas
            </p>

            <h2 className="mt-3 text-3xl font-bold">
              Financiación disponible
            </h2>
          </div>

          <p className="text-sm text-texto-largo">
            {opportunities.length}{' '}
            {opportunities.length === 1
              ? 'oportunidad'
              : 'oportunidades'}
          </p>
        </div>

        {opportunities.length ===
        0 ? (
          <div className="mt-8 border border-dashed border-borde bg-superficie-elevada p-10">
            <h2 className="text-2xl font-bold">
              Todavía no hay oportunidades publicadas
            </h2>

            <p className="mt-4 max-w-2xl text-sm leading-7 text-texto-largo">
              Las posibilidades de financiación aparecerán
              después de ser creadas y aprobadas por el
              ecosistema.
            </p>
          </div>
        ) : (
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            {opportunities.map(
              (opportunity) => (
                <article
                  key={
                    opportunity.id
                  }
                  className="group border border-borde bg-superficie-elevada p-8 transition hover:shadow-stencil"
                >
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <span className="border border-borde bg-rojo-base px-4 py-2 text-[10px] font-bold uppercase tracking-[0.14em] text-hueso">
                      {
                        typeLabels[
                          opportunity.opportunityType
                        ] ??
                        opportunity.opportunityType
                      }
                    </span>

                    {opportunity.closesAt ? (
                      <span className="text-xs text-texto-largo">
                        Cierra el{' '}
                        {new Date(
                          `${opportunity.closesAt}T12:00:00`
                        ).toLocaleDateString(
                          'es-CO',
                          {
                            day:
                              'numeric',

                            month:
                              'long',

                            year:
                              'numeric',
                          }
                        )}
                      </span>
                    ) : null}
                  </div>

                  <Link
                    href={`/oportunidades/${opportunity.id}`}
                  >
                    <h2 className="mt-7 text-3xl font-bold tracking-[-0.035em] transition group-hover:text-texto-principal">
                      {
                        opportunity.title
                      }
                    </h2>
                  </Link>

                  <p className="mt-5 text-base leading-8 text-texto-largo">
                    {
                      opportunity.summary
                    }
                  </p>

                  <p className="mt-6 text-sm font-bold text-texto-principal">
                    {formatAmountRange(
                      opportunity
                    )}
                  </p>

                  <p className="mt-7 text-xs text-texto-largo">
                    Publicada por{' '}
                    {
                      opportunity.ownerName
                    }
                  </p>

                  <div className="mt-7 flex flex-wrap gap-3">
                    <Link
                      href={`/oportunidades/${opportunity.id}`}
                      className="border border-borde px-5 py-3 text-sm font-semibold transition hover:bg-superficie"
                    >
                      Ver oportunidad
                    </Link>

                    <Link
                      href={`/oportunidades/${opportunity.id}/postular`}
                      className="border border-borde bg-rojo-base px-5 py-3 text-sm font-bold text-hueso transition hover:shadow-stencil"
                    >
                      Postular proyecto
                    </Link>
                  </div>
                </article>
              )
            )}
          </div>
        )}
      </section>
    </main>
  );
}

function formatAmountRange(
  opportunity: {
    amountMin:
      number | null;

    amountMax:
      number | null;

    currency:
      string;
  }
): string {
  if (
    opportunity.amountMin ===
      null &&
    opportunity.amountMax ===
      null
  ) {
    return 'Monto por definir';
  }

  const formatter =
    new Intl.NumberFormat(
      'es-CO',
      {
        style:
          'currency',

        currency:
          opportunity.currency,

        maximumFractionDigits:
          0,
      }
    );

  if (
    opportunity.amountMin !==
      null &&
    opportunity.amountMax !==
      null
  ) {
    return `${formatter.format(
      opportunity.amountMin
    )} – ${formatter.format(
      opportunity.amountMax
    )}`;
  }

  return formatter.format(
    opportunity.amountMin ??
      opportunity.amountMax ??
      0
  );
}
