import Link from 'next/link';

import {
  notFound,
} from 'next/navigation';

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
    <main className="min-h-screen bg-[#050505] text-white">
      <header className="border-b border-white/10 px-6 py-6">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4">
          <Link
            href="/"
            className="text-xl font-black tracking-[-0.04em]"
          >
            CULTURA ESTA
          </Link>

          <div className="flex flex-wrap gap-3">
            <Link
              href={`/agenda/${report.experienceSlug}`}
              className="rounded-full border border-white/15 px-5 py-3 text-sm font-semibold"
            >
              Ver actividad
            </Link>

            <Link
              href="/agenda"
              className="rounded-full bg-[#D9FF00] px-5 py-3 text-sm font-bold text-black"
            >
              Explorar agenda
            </Link>
          </div>
        </div>
      </header>

      <section className="border-b border-white/10 px-6 py-20 lg:py-28">
        <div className="mx-auto max-w-7xl">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#D9FF00]">
            Reporte de resultados
          </p>

          <h1 className="mt-7 max-w-6xl text-5xl font-black leading-[0.92] tracking-[-0.055em] sm:text-7xl lg:text-9xl">
            {report.experienceTitle}
          </h1>

          <p className="mt-8 max-w-4xl text-xl leading-9 text-[#AAAAAA]">
            {report.summary}
          </p>

          <p className="mt-7 text-sm text-[#666666]">
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
        <section className="px-6 pt-10">
          <img
            src={
              report.coverImageUrl
            }
            alt={
              report.experienceTitle
            }
            className="mx-auto aspect-[16/8] w-full max-w-7xl rounded-[36px] object-cover"
          />
        </section>
      ) : null}

      <section className="mx-auto max-w-7xl px-6 py-20">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#767676]">
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

        <section className="mt-16 rounded-[32px] border border-white/10 bg-[#0A0A0A] p-8">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#767676]">
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
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#767676]">
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
                    className="rounded-3xl border border-white/10 bg-[#0A0A0A] p-6 transition hover:border-[#D9FF00]"
                  >
                    <p className="text-xs uppercase tracking-[0.16em] text-[#D9FF00]">
                      Evidencia{' '}
                      {index + 1}
                    </p>

                    <p className="mt-4 break-all text-sm leading-6 text-[#888888]">
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
          <section className="mt-16 rounded-[32px] border border-[#D9FF00]/20 bg-[#D9FF00]/5 p-8">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#D9FF00]">
              Proyecto relacionado
            </p>

            <h2 className="mt-5 text-3xl font-bold">
              {
                report.projectHeadline
              }
            </h2>

            <Link
              href={`/proyectos/${report.projectSlug}`}
              className="mt-7 inline-flex rounded-full bg-[#D9FF00] px-6 py-3 text-sm font-bold text-black"
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
    <article className="rounded-2xl border border-white/10 bg-[#0A0A0A] p-6">
      <p className="text-4xl font-black text-[#D9FF00]">
        {value}
      </p>

      <p className="mt-3 text-xs uppercase tracking-[0.14em] text-[#777777]">
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
    <article className="rounded-[32px] border border-white/10 bg-[#0A0A0A] p-8">
      <h2 className="text-3xl font-bold tracking-[-0.035em]">
        {title}
      </h2>

      <p className="mt-6 whitespace-pre-line text-base leading-8 text-[#AAAAAA]">
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
    <div className="rounded-2xl border border-white/10 bg-[#111111] p-5">
      <p className="text-xs uppercase tracking-[0.15em] text-[#666666]">
        {label}
      </p>

      <p className="mt-3 text-2xl font-black text-[#D9FF00]">
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