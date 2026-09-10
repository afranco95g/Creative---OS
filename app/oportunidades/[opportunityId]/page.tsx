import Link from 'next/link';

import {
  notFound,
} from 'next/navigation';

import { SiteHeader } from '../../../components/public/SiteHeader';

import {
  getPublishedFundingOpportunity,
} from '../../../services/public/publicFunding';

interface FundingOpportunityPageProps {
  params: Promise<{
    opportunityId: string;
  }>;
}

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

export default async function FundingOpportunityPage({
  params,
}: FundingOpportunityPageProps) {
  const {
    opportunityId,
  } = await params;

  const opportunity =
    await getPublishedFundingOpportunity(
      opportunityId
    );

  if (!opportunity) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-superficie text-texto-largo">
      <SiteHeader
        ctaLabel="Postular proyecto"
        ctaHref={`/oportunidades/${opportunity.id}/postular`}
        links={[
          { label: 'Ver oportunidades', href: '/oportunidades' },
        ]}
      />

      <section className="border-b border-borde px-6 py-20 sm:px-8 lg:px-12 lg:py-28">
        <div className="mx-auto max-w-7xl">
          <span className="border border-borde bg-rojo-base px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-hueso">
            {
              typeLabels[
                opportunity.opportunityType
              ] ??
              opportunity.opportunityType
            }
          </span>

          <h1 className="stencil-heading mt-9 max-w-6xl text-5xl font-black leading-[0.92] tracking-[-0.055em] sm:text-7xl lg:text-9xl">
            {opportunity.title}
          </h1>

          <p className="mt-8 max-w-4xl text-xl leading-9 text-texto-largo">
            {opportunity.summary}
          </p>

          <p className="mt-8 text-sm text-texto-largo">
            Publicada por{' '}
            {
              opportunity.ownerName
            }
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-10 px-6 py-16 sm:px-8 lg:grid-cols-[320px_minmax(0,760px)] lg:justify-between lg:px-12 lg:py-24">
        <aside>
          <div className="sticky top-8 border border-borde bg-superficie-elevada p-7">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-texto-principal">
              Información
            </p>

            <InformationItem
              label="Financiación"
              value={formatAmountRange(
                opportunity
              )}
            />

            {opportunity.opensAt ? (
              <InformationItem
                label="Apertura"
                value={formatDate(
                  opportunity.opensAt
                )}
              />
            ) : null}

            {opportunity.closesAt ? (
              <InformationItem
                label="Cierre"
                value={formatDate(
                  opportunity.closesAt
                )}
              />
            ) : null}

            <InformationItem
              label="Postulaciones recibidas"
              value={String(
                opportunity.applicationsCount
              )}
            />

            <Link
              href={`/oportunidades/${opportunity.id}/postular`}
              className="mt-8 flex w-full items-center justify-center border border-borde bg-rojo-base px-6 py-4 text-sm font-bold text-hueso transition hover:shadow-stencil"
            >
              Postular un proyecto
            </Link>
          </div>
        </aside>

        <div>
          <Section
            title="Descripción"
            content={
              opportunity.description
            }
          />

          <Section
            title="Quién puede participar"
            content={
              opportunity.eligibility
            }
          />

          {opportunity.requiredDocuments.length >
          0 ? (
            <section className="mt-14 border-t border-borde pt-12">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-texto-principal">
                Requisitos
              </p>

              <h2 className="mt-4 text-4xl font-bold">
                Documentos solicitados
              </h2>

              <ul className="mt-8 space-y-4">
                {opportunity.requiredDocuments.map(
                  (document) => (
                    <li
                      key={
                        document
                      }
                      className="border border-borde bg-superficie-elevada p-5 text-sm leading-7 text-texto-largo"
                    >
                      — {document}
                    </li>
                  )
                )}
              </ul>
            </section>
          ) : null}

          <section className="mt-16 border border-borde bg-rojo-base p-8 text-hueso">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-hueso">
              Creative OS
            </p>

            <h2 className="mt-5 text-3xl font-bold">
              Postula un proyecto estructurado
            </h2>

            <p className="mt-5 max-w-2xl text-base leading-8 text-hueso">
              El proyecto debe haber pasado la revisión de
              elegibilidad del ecosistema. Puedes adjuntar un
              reporte publicado como evidencia de experiencia
              previa.
            </p>

            <Link
              href={`/oportunidades/${opportunity.id}/postular`}
              className="mt-8 inline-flex border border-hueso px-6 py-3 text-sm font-bold text-hueso transition hover:bg-rojo-profundo"
            >
              Comenzar postulación
            </Link>
          </section>
        </div>
      </section>
    </main>
  );
}

function Section({
  title,
  content,
}: {
  title: string;
  content: string;
}) {
  return (
    <section className="border-b border-borde pb-12">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-texto-principal">
        Oportunidad
      </p>

      <h2 className="mt-4 text-4xl font-bold">
        {title}
      </h2>

      <p className="mt-7 whitespace-pre-line text-lg leading-9 text-texto-largo">
        {content}
      </p>
    </section>
  );
}

function InformationItem({
  label,
  value,
}: {
  label: string;
  value: string;
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

function formatDate(
  value: string
): string {
  return new Date(
    `${value}T12:00:00`
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
  );
}

function formatAmountRange(
  opportunity: {
    amountMin: number | null;
    amountMax: number | null;
    currency: string;
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
