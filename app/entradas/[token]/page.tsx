import Link from 'next/link';

import {
  notFound,
} from 'next/navigation';

import {
  getPublicExperienceTicket,
} from '../../../services/public/publicTickets';

interface PublicTicketPageProps {
  params: Promise<{
    token: string;
  }>;
}

const statusLabels = {
  registered:
    'Entrada válida',

  attended:
    'Asistencia registrada',

  cancelled:
    'Entrada cancelada',
};

export const dynamic =
  'force-dynamic';

export default async function PublicTicketPage({
  params,
}: PublicTicketPageProps) {
  const {
    token,
  } = await params;

  const ticket =
    await getPublicExperienceTicket(
      token
    );

  if (!ticket) {
    notFound();
  }

  const start =
    new Date(
      ticket.startsAt
    );

  const end =
    ticket.endsAt
      ? new Date(
          ticket.endsAt
        )
      : null;

  const isCancelled =
    ticket.status ===
    'cancelled';

  return (
    <main className="min-h-screen bg-[#050505] px-6 py-12 text-white sm:px-8">
      <div className="mx-auto max-w-2xl">
        <header className="text-center">
          <Link
            href="/"
            className="text-xl font-black tracking-[-0.04em]"
          >
            CULTURA ESTA
          </Link>

          <p className="mt-8 text-xs font-bold uppercase tracking-[0.26em] text-[#D9FF00]">
            Entrada digital
          </p>
        </header>

        <article className="mt-8 overflow-hidden rounded-[36px] border border-white/10 bg-[#0A0A0A]">
          <div
            className={[
              'border-b p-7 text-center sm:p-10',
              isCancelled
                ? 'border-red-400/20 bg-red-400/10'
                : 'border-[#D9FF00]/20 bg-[#D9FF00]/5',
            ].join(' ')}
          >
            <p
              className={[
                'text-xs font-bold uppercase tracking-[0.2em]',
                isCancelled
                  ? 'text-red-300'
                  : 'text-[#D9FF00]',
              ].join(' ')}
            >
              {
                statusLabels[
                  ticket.status
                ]
              }
            </p>

            <h1 className="mt-5 text-4xl font-black tracking-[-0.04em] sm:text-5xl">
              {ticket.experienceTitle}
            </h1>
          </div>

          <div className="p-7 sm:p-10">
            <div className="rounded-3xl border border-white/10 bg-[#050505] p-7 text-center">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#666666]">
                Código de entrada
              </p>

              <p className="mt-4 break-all font-mono text-3xl font-black tracking-[0.08em] text-[#D9FF00]">
                {ticket.ticketCode}
              </p>

              <p className="mt-4 text-xs leading-5 text-[#666666]">
                Presenta este código al ingresar a la
                actividad.
              </p>
            </div>

            <div className="mt-8 grid gap-6 sm:grid-cols-2">
              <TicketInformation
                label="Asistente"
                value={
                  ticket.attendeeName
                }
              />

              <TicketInformation
                label="Correo"
                value={
                  ticket.attendeeEmail
                }
              />

              <TicketInformation
                label="Entradas"
                value={String(
                  ticket.attendeesCount
                )}
              />

              <TicketInformation
                label="Fecha"
                value={start.toLocaleDateString(
                  'es-CO',
                  {
                    weekday:
                      'long',

                    day:
                      'numeric',

                    month:
                      'long',

                    year:
                      'numeric',
                  }
                )}
              />

              <TicketInformation
                label="Horario"
                value={formatTimeRange(
                  start,
                  end
                )}
              />

              <TicketInformation
                label="Lugar"
                value={
                  [
                    ticket.venueName,
                    ticket.city,
                  ]
                    .filter(Boolean)
                    .join(' · ') ||
                  'Por confirmar'
                }
              />
            </div>

            {ticket.address ? (
              <div className="mt-7 border-t border-white/10 pt-6">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#666666]">
                  Dirección
                </p>

                <p className="mt-3 text-sm font-semibold">
                  {ticket.address}
                </p>
              </div>
            ) : null}

            {ticket.checkedInAt ? (
              <div className="mt-7 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-5">
                <p className="font-semibold text-emerald-200">
                  Asistencia registrada
                </p>

                <p className="mt-2 text-sm text-emerald-200/70">
                  {
                    new Date(
                      ticket.checkedInAt
                    ).toLocaleString(
                      'es-CO'
                    )
                  }
                </p>
              </div>
            ) : null}

            {isCancelled ? (
              <div className="mt-7 rounded-2xl border border-red-400/20 bg-red-400/10 p-5">
                <p className="font-semibold text-red-200">
                  Esta entrada fue cancelada y ya no puede
                  utilizarse.
                </p>
              </div>
            ) : null}

            <div className="mt-9 flex flex-wrap justify-center gap-3">
              <Link
                href={`/agenda/${ticket.experienceSlug}`}
                className="rounded-full bg-[#D9FF00] px-6 py-3 text-sm font-bold text-black transition hover:bg-white"
              >
                Ver actividad
              </Link>

              <Link
                href="/agenda"
                className="rounded-full border border-white/15 px-6 py-3 text-sm font-semibold transition hover:border-white"
              >
                Explorar agenda
              </Link>
            </div>
          </div>
        </article>

        <p className="mt-7 text-center text-xs leading-5 text-[#555555]">
          Guarda esta página o toma una captura de pantalla
          para presentar tu entrada.
        </p>
      </div>
    </main>
  );
}

function TicketInformation({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="border-t border-white/10 pt-5">
      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#666666]">
        {label}
      </p>

      <p className="mt-3 text-sm font-semibold leading-6">
        {value}
      </p>
    </div>
  );
}

function formatTimeRange(
  start: Date,
  end: Date | null
): string {
  const startTime =
    start.toLocaleTimeString(
      'es-CO',
      {
        hour:
          '2-digit',

        minute:
          '2-digit',
      }
    );

  if (!end) {
    return startTime;
  }

  return `${startTime} – ${end.toLocaleTimeString(
    'es-CO',
    {
      hour:
        '2-digit',

      minute:
        '2-digit',
    }
  )}`;
}