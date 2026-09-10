import Link from 'next/link';

import {
  notFound,
} from 'next/navigation';

import { SiteHeader } from '@/components/public/SiteHeader';

import {
  getPublishedExperienceReport,
} from '@/services/public/publicExperienceReports';

interface PublicReportPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export const dynamic =
  'force-dynamic';

export default async function PublicReportPage({
  params,
}: PublicReportPageProps) {
  const {
    slug,
  } = await params;

  const report =
    await getPublishedExperienceReport(
      slug
    );

  if (!report) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-superficie text-texto-largo">
      <SiteHeader
        ctaLabel="Explorar calendario"
        ctaHref="/agenda"
        links={[
          { label: 'Ver actividad', href: `/agenda/${report.experienceSlug}` },
        ]}
      />

      <section className="border-b border-borde px-6 py-20 sm:px-8 lg:px-12 lg:py-28">
        <div className="mx-auto max-w-7xl">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-texto-principal">
            Reporte de resultados
          </p>

          <h1 className="stencil-heading mt-7 max-w-6xl text-5xl font-black leading-[0.92] tracking-[-0.055em] sm:text-7xl lg:text-9xl">
            {report.experienceTitle}
          </h1>

          <p className="mt-8 max-w-4xl text-xl leading-9 text-texto-largo">
            {report.summary}
          </p>

          <p className="mt-7 text-sm text-texto-largo">
            Publicado el{' '}
            {new Date(
              report.publishedAt
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
          </p>
        </div>
      </section>

      {report.coverImageUrl ? (
        <section className="px-6 pt-10 sm:px-8 lg:px-12">
          <img
            src={
              report.coverImageUrl
            }
            alt={
              report.experienceTitle
            }
            className="mx-auto aspect-[16/8] w-full max-w-7xl border border-borde object-cover"
          />
        </section>
      ) : null}

      <section className="mx-auto max-w-7xl px-6 py-20 sm:px-8 lg:px-12">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-texto-largo">
          Participación
        </p>

        <h2 className="mt-4 text-4xl font-bold">
          Resultados cuantitativos
        </h2>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Metric
            value={
              report.reservedPlaces
            }
            label="Cupos reservados"
          />

          <Metric
            value={
              report.attendedPlaces
            }
            label="Asistentes"
          />

          <Metric
            value={`${report.attendanceRate}%`}
            label="Tasa de asistencia"
          />

          <Metric
            value={
              report.occupancyRate ===
              null
                ? 'Sin límite'
                : `${report.occupancyRate}%`
            }
            label="Ocupación"
          />
        </div>

        <div className="mt-16 grid gap-8 lg:grid-cols-2">
          <NarrativeSection
            title="Resultados alcanzados"
            content={
              report.outcomes
            }
          />

          <NarrativeSection
            title="Aprendizajes"
            content={
              report.learnings
            }
          />

          <NarrativeSection
            title="Retos y dificultades"
            content={
              report.challenges
            }
          />

          <NarrativeSection
            title="Próximos pasos"
            content={
              report.nextSteps
            }
          />
        </div>

        <section className="mt-16 border border-borde bg-superficie-elevada p-8">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-texto-largo">
            Recursos
          </p>

          <h2 className="mt-4 text-3xl font-bold">
            Balance financiero
          </h2>

          <div className="mt-8 grid gap-5 sm:grid-cols-3">
            <FinancialMetric
              label="Ingresos"
              value={
                report.revenueCop
              }
            />

            <FinancialMetric
              label="Gastos"
              value={
                report.expensesCop
              }
            />

            <FinancialMetric
              label="Balance"
              value={
                report.balanceCop
              }
            />
          </div>
        </section>

        {report.evidenceUrls.length >
        0 ? (
          <section className="mt-16">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-texto-largo">
              Evidencias
            </p>

            <h2 className="mt-4 text-4xl font-bold">
              Archivos y documentación
            </h2>

            <div className="mt-8 grid gap-4 md:grid-cols-2">
              {report.evidenceUrls.map(
                (
                  url,
                  index
                ) => (
                  <a
                    key={
                      url
                    }
                    href={
                      url
                    }
                    target="_blank"
                    rel="noreferrer"
                    className="border border-borde bg-superficie-elevada p-6 transition hover:shadow-stencil"
                  >
                    <p className="text-xs uppercase tracking-[0.16em] text-texto-principal">
                      Evidencia{' '}
                      {index + 1}
                    </p>

                    <p className="mt-4 break-all text-sm leading-6 text-texto-largo">
                      {url}
                    </p>
                  </a>
                )
              )}
            </div>
          </section>
        ) : null}

        {report.projectSlug &&
        report.projectHeadline ? (
          <section className="mt-16 border border-borde bg-rojo-base p-8 text-hueso">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-hueso">
              Proyecto relacionado
            </p>

            <h2 className="mt-5 text-3xl font-bold">
              {
                report.projectHeadline
              }
            </h2>

            <Link
              href={`/proyectos/${report.projectSlug}`}
              className="mt-7 inline-flex border border-hueso px-6 py-3 text-sm font-bold text-hueso transition hover:bg-rojo-profundo"
            >
              Ver proyecto
            </Link>
          </section>
        ) : null}
      </section>
    </main>
  );
}

function Metric({
  value,
  label,
}: {
  value:
    number | string;

  label:
    string;
}) {
  return (
    <article className="border border-borde bg-superficie-elevada p-6">
      <p className="text-4xl font-black text-texto-principal">
        {value}
      </p>

      <p className="mt-3 text-xs uppercase tracking-[0.14em] text-texto-largo">
        {label}
      </p>
    </article>
  );
}

function NarrativeSection({
  title,
  content,
}: {
  title:
    string;

  content:
    string;
}) {
  return (
    <article className="border border-borde bg-superficie-elevada p-8">
      <h2 className="text-3xl font-bold tracking-[-0.035em]">
        {title}
      </h2>

      <p className="mt-6 whitespace-pre-line text-base leading-8 text-texto-largo">
        {content ||
          'Sin información publicada.'}
      </p>
    </article>
  );
}

function FinancialMetric({
  label,
  value,
}: {
  label:
    string;

  value:
    number;
}) {
  return (
    <div className="border border-borde bg-superficie p-5">
      <p className="text-xs uppercase tracking-[0.15em] text-texto-largo">
        {label}
      </p>

      <p className="mt-3 text-2xl font-black text-texto-principal">
        {new Intl.NumberFormat(
          'es-CO',
          {
            style:
              'currency',

            currency:
              'COP',

            maximumFractionDigits:
              0,
          }
        ).format(
          value
        )}
      </p>
    </div>
  );
}
