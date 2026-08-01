'use client';

import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  loadExperienceAttendees,
  updateRegistrationStatus,
} from '../../services/agenda/experienceRegistrationService';

import type {
  ExperienceAttendee,
  RegistrationStatus,
} from '../../services/agenda/experienceRegistrationService';

const statusLabels:
  Record<RegistrationStatus, string> = {
    registered:
      'Registrado',

    attended:
      'Asistió',

    cancelled:
      'Cancelado',
  };

export function ExperienceAttendeesPanel({
  experienceId,
}: {
  experienceId: string;
}) {
  const [
    attendees,
    setAttendees,
  ] = useState<
    ExperienceAttendee[]
  >([]);

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  const [
    activeRegistrationId,
    setActiveRegistrationId,
  ] = useState<
    string | null
  >(null);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState('');

  const [
    successMessage,
    setSuccessMessage,
  ] = useState('');

  useEffect(() => {
    void loadAttendees();
  }, [experienceId]);

  async function loadAttendees() {
    setIsLoading(true);
    setErrorMessage('');

    try {
      const result =
        await loadExperienceAttendees(
          experienceId
        );

      setAttendees(
        result
      );
    } catch (error) {
      setErrorMessage(
        getErrorMessage(error)
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function changeStatus(
    attendee: ExperienceAttendee,
    status: RegistrationStatus
  ) {
    setActiveRegistrationId(
      attendee.registrationId
    );

    setErrorMessage('');
    setSuccessMessage('');

    try {
      await updateRegistrationStatus(
        attendee.registrationId,
        status
      );

      setSuccessMessage(
        status === 'attended'
          ? `Se registró la asistencia de ${attendee.attendeeName}.`
          : status === 'cancelled'
            ? `La inscripción de ${attendee.attendeeName} fue cancelada.`
            : `La inscripción de ${attendee.attendeeName} fue reactivada.`
      );

      await loadAttendees();
    } catch (error) {
      setErrorMessage(
        getErrorMessage(error)
      );
    } finally {
      setActiveRegistrationId(
        null
      );
    }
  }

  const metrics =
    useMemo(
      () => {
        const registered =
          attendees.filter(
            (attendee) =>
              attendee.status ===
              'registered'
          );

        const attended =
          attendees.filter(
            (attendee) =>
              attendee.status ===
              'attended'
          );

        const cancelled =
          attendees.filter(
            (attendee) =>
              attendee.status ===
              'cancelled'
          );

        return {
          registrations:
            registered.length +
            attended.length,

          reservedPlaces:
            [...registered, ...attended]
              .reduce(
                (
                  total,
                  attendee
                ) =>
                  total +
                  attendee.attendeesCount,
                0
              ),

          attended:
            attended.length,

          cancelled:
            cancelled.length,
        };
      },
      [attendees]
    );

  return (
    <section>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Metric
          value={metrics.registrations}
          label="Inscripciones activas"
        />

        <Metric
          value={metrics.reservedPlaces}
          label="Cupos reservados"
        />

        <Metric
          value={metrics.attended}
          label="Asistencias"
        />

        <Metric
          value={metrics.cancelled}
          label="Canceladas"
        />
      </div>

      <div className="mt-8 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#767676]">
            Participantes
          </p>

          <h2 className="mt-3 text-3xl font-bold">
            Lista de asistentes
          </h2>
        </div>

        <button
          type="button"
          onClick={() => {
            void loadAttendees();
          }}
          className="rounded-full border border-white/15 px-5 py-3 text-sm font-semibold"
        >
          Actualizar
        </button>
      </div>

      {errorMessage ? (
        <div className="mt-6 rounded-2xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-200">
          {errorMessage}
        </div>
      ) : null}

      {successMessage ? (
        <div className="mt-6 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm text-emerald-200">
          {successMessage}
        </div>
      ) : null}

      {isLoading ? (
        <div className="mt-7 h-64 animate-pulse rounded-3xl bg-[#111111]" />
      ) : attendees.length === 0 ? (
        <div className="mt-7 rounded-3xl border border-dashed border-white/15 bg-[#0A0A0A] p-9">
          <h3 className="text-xl font-semibold">
            Todavía no hay inscripciones
          </h3>

          <p className="mt-3 text-sm text-[#777777]">
            Las personas aparecerán aquí cuando reserven
            un cupo desde la ficha pública.
          </p>
        </div>
      ) : (
        <div className="mt-7 space-y-4">
          {attendees.map(
            (attendee) => {
              const isWorking =
                activeRegistrationId ===
                attendee.registrationId;

              return (
                <article
                  key={
                    attendee.registrationId
                  }
                  className="rounded-3xl border border-white/10 bg-[#0A0A0A] p-6"
                >
                  <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="rounded-full border border-[#D9FF00]/20 bg-[#D9FF00]/10 px-3 py-1 text-[10px] font-bold uppercase text-[#D9FF00]">
                          {
                            statusLabels[
                              attendee.status
                            ]
                          }
                        </span>

                        <span className="font-mono text-xs text-[#666666]">
                          {
                            attendee.ticketCode
                          }
                        </span>
                      </div>

                      <h3 className="mt-4 text-xl font-bold">
                        {
                          attendee.attendeeName
                        }
                      </h3>

                      <p className="mt-2 text-sm text-[#999999]">
                        {
                          attendee.attendeeEmail
                        }
                      </p>

                      {attendee.attendeePhone ? (
                        <p className="mt-1 text-sm text-[#777777]">
                          {
                            attendee.attendeePhone
                          }
                        </p>
                      ) : null}

                      <p className="mt-3 text-xs text-[#666666]">
                        {
                          attendee.attendeesCount
                        }{' '}
                        {attendee.attendeesCount ===
                        1
                          ? 'cupo'
                          : 'cupos'}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-3 lg:justify-end">
                      {attendee.status ===
                      'registered' ? (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              void changeStatus(
                                attendee,
                                'attended'
                              );
                            }}
                            disabled={isWorking}
                            className="rounded-full bg-[#D9FF00] px-5 py-3 text-sm font-bold text-black disabled:opacity-50"
                          >
                            Marcar asistencia
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              void changeStatus(
                                attendee,
                                'cancelled'
                              );
                            }}
                            disabled={isWorking}
                            className="rounded-full border border-red-400/30 px-5 py-3 text-sm font-semibold text-red-300 disabled:opacity-50"
                          >
                            Cancelar
                          </button>
                        </>
                      ) : null}

                      {attendee.status ===
                      'attended' ? (
                        <button
                          type="button"
                          onClick={() => {
                            void changeStatus(
                              attendee,
                              'registered'
                            );
                          }}
                          disabled={isWorking}
                          className="rounded-full border border-white/15 px-5 py-3 text-sm font-semibold disabled:opacity-50"
                        >
                          Deshacer asistencia
                        </button>
                      ) : null}

                      {attendee.status ===
                      'cancelled' ? (
                        <button
                          type="button"
                          onClick={() => {
                            void changeStatus(
                              attendee,
                              'registered'
                            );
                          }}
                          disabled={isWorking}
                          className="rounded-full bg-white px-5 py-3 text-sm font-bold text-black disabled:opacity-50"
                        >
                          Reactivar
                        </button>
                      ) : null}
                    </div>
                  </div>
                </article>
              );
            }
          )}
        </div>
      )}
    </section>
  );
}

function Metric({
  value,
  label,
}: {
  value: number;
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

function getErrorMessage(
  error: unknown
): string {
  return error instanceof Error
    ? error.message
    : 'Ocurrió un error inesperado.';
}