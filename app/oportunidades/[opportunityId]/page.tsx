import Link from 'next/link';

import {
  notFound,
} from 'next/navigation';

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
    <main className="min-h-screen bg-[#050505] text-white">
      <header className="border-b border-white/10 px-6 py-6">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4">
          <Link
            href="/"
            className="text-xl font-black tracking-[-0.04em]"
          >
            CULTURA ESTÁ
          </Link>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/oportunidades"
              className="rounded-full border border-white/15 px-5 py-3 text-sm font-semibold"
            >
              Ver oportunidades
            </Link>

            <Link
              href={`/oportunidades/${opportunity.id}/postular`}
              className="rounded-full bg-[#D9FF00] px-5 py-3 text-sm font-bold text-black"
            >
              Postular proyecto
            </Link>
          </div>
        </div>
      </header>

      <section className="border-b border-white/10 px-6 py-20 lg:py-28">
        <div className="mx-auto max-w-7xl">
          <span className="rounded-full bg-[#D9FF00] px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-black">
            {
              typeLabels[
                opportunity.opportunityType
              ] ??
              opportunity.opportunityType
            }
          </span>

          <h1 className="mt-9 max-w-6xl text-5xl font-black leading-[0.92] tracking-[-0.055em] sm:text-7xl lg:text-9xl">
            {opportunity.title}
          </h1>

          <p className="mt-8 max-w-4xl text-xl leading-9 text-[#AAAAAA]">
            {opportunity.summary}
          </p>

          <p className="mt-8 text-sm text-[#666666]">
            Publicada por{' '}
            {
              opportunity.ownerName
            }
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-10 px-6 py-16 lg:grid-cols-[320px_minmax(0,760px)] lg:justify-between lg:py-24">
        <aside>
          <div className="sticky top-8 rounded-[30px] border border-white/10 bg-[#0A0A0A] p-7">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#D9FF00]">
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
              className="mt-8 flex w-full items-center justify-center rounded-full bg-[#D9FF00] px-6 py-4 text-sm font-bold text-black transition hover:bg-white"
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
            <section className="mt-14 border-t border-white/10 pt-12">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#D9FF00]">
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
                      className="rounded-2xl border border-white/10 bg-[#0A0A0A] p-5 text-sm leading-7 text-[#AAAAAA]"
                    >
                      — {document}
                    </li>
                  )
                )}
              </ul>
            </section>
          ) : null}

          <section className="mt-16 rounded-[32px] border border-[#D9FF00]/20 bg-[#D9FF00]/5 p-8">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#D9FF00]">
              Creative OS
            </p>

            <h2 className="mt-5 text-3xl font-bold">
              Postula un proyecto estructurado
            </h2>

            <p className="mt-5 max-w-2xl text-base leading-8 text-[#999999]">
              El proyecto debe haber pasado la revisión de
              elegibilidad del ecosistema. Puedes adjuntar un
              reporte publicado como evidencia de experiencia
              previa.
            </p>

            <Link
              href={`/oportunidades/${opportunity.id}/postular`}
              className="mt-8 inline-flex rounded-full bg-[#D9FF00] px-6 py-3 text-sm font-bold text-black"
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
    <section className="border-b border-white/10 pb-12">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#D9FF00]">
        Oportunidad
      </p>

      <h2 className="mt-4 text-4xl font-bold">
        {title}
      </h2>

      <p className="mt-7 whitespace-pre-line text-lg leading-9 text-[#AAAAAA]">
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
    <div className="mt-7 border-t border-white/10 pt-6">
      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#666666]">
        {label}
      </p>

      <p className="mt-3 text-sm font-semibold leading-6">
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