import Link from 'next/link';

import {
  notFound,
} from 'next/navigation';

import { SiteHeader } from '../../../components/public/SiteHeader';

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
    <main className="min-h-screen bg-superficie text-texto-largo">
      <SiteHeader
        links={[
          { label: 'Explorar calendario', href: '/agenda' },
        ]}
      />

      <div className="px-6 py-12 sm:px-8">
        <div className="mx-auto max-w-2xl">
          <header className="text-center">
            <p className="text-xs font-bold uppercase tracking-[0.26em] text-texto-principal">
              Entrada digital
            </p>
          </header>

          <article className="mt-8 overflow-hidden border border-borde bg-superficie-elevada">
            <div
              className={[
                'border-b p-7 text-center sm:p-10',
                isCancelled
                  ? 'border-borde bg-rojo-base'
                  : 'border-borde bg-superficie',
              ].join(' ')}
            >
              <p
                className={[
                  'text-xs font-bold uppercase tracking-[0.2em]',
                  isCancelled
                    ? 'text-hueso'
                    : 'text-texto-principal',
                ].join(' ')}
              >
                {
                  statusLabels[
                    ticket.status
                  ]
                }
              </p>

              <h1
                className={[
                  'stencil-heading mt-5 text-4xl font-black tracking-[-0.04em] sm:text-5xl',
                  isCancelled ? 'text-hueso' : 'text-texto-principal',
                ].join(' ')}
              >
                {ticket.experienceTitle}
              </h1>
            </div>

            <div className="p-7 sm:p-10">
              <div className="border border-borde bg-superficie p-7 text-center">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-texto-largo">
                  Código de entrada
                </p>

                <p className="mt-4 break-all font-mono text-3xl font-black tracking-[0.08em] text-texto-principal">
                  {ticket.ticketCode}
                </p>

                <p className="mt-4 text-xs leading-5 text-texto-largo">
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
                <div className="mt-7 border-t border-borde pt-6">
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-texto-largo">
                    Dirección
                  </p>

                  <p className="mt-3 text-sm font-semibold text-texto-principal">
                    {ticket.address}
                  </p>
                </div>
              ) : null}

              {ticket.checkedInAt ? (
                <div className="mt-7 border border-borde bg-superficie p-5">
                  <p className="font-semibold text-texto-principal">
                    Asistencia registrada
                  </p>

                  <p className="mt-2 text-sm text-texto-largo">
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
                <div className="mt-7 border border-borde bg-rojo-base p-5">
                  <p className="font-semibold text-hueso">
                    Esta entrada fue cancelada y ya no puede
                    utilizarse.
                  </p>
                </div>
              ) : null}

              <div className="mt-9 flex flex-wrap justify-center gap-3">
                <Link
                  href={`/agenda/${ticket.experienceSlug}`}
                  className="border border-borde bg-rojo-base px-6 py-3 text-sm font-bold text-hueso transition hover:shadow-stencil"
                >
                  Ver actividad
                </Link>

                <Link
                  href="/agenda"
                  className="border border-borde px-6 py-3 text-sm font-semibold transition hover:bg-superficie-elevada"
                >
                  Explorar calendario
                </Link>
              </div>
            </div>
          </article>

          <p className="mt-7 text-center text-xs leading-5 text-texto-largo">
            Guarda esta página o toma una captura de pantalla
            para presentar tu entrada.
          </p>
        </div>
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
    <div className="border-t border-borde pt-5">
      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-texto-largo">
        {label}
      </p>

      <p className="mt-3 text-sm font-semibold leading-6 text-texto-principal">
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
