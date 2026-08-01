'use client';

import {
  type FormEvent,
  useEffect,
  useState,
} from 'react';

import {
  useRouter,
} from 'next/navigation';

import {
  loadExperienceAvailability,
  registerForExperience,
} from '../../services/agenda/experienceRegistrationService';

import type {
  ExperienceAvailability,
} from '../../services/agenda/experienceRegistrationService';

interface ExperienceRegistrationPanelProps {
  experienceId: string;
  externalTicketUrl: string | null;
}

export function ExperienceRegistrationPanel({
  experienceId,
  externalTicketUrl,
}: ExperienceRegistrationPanelProps) {
  const router =
    useRouter();

  const [
    availability,
    setAvailability,
  ] = useState<
    ExperienceAvailability | null
  >(null);

  const [
    attendeeName,
    setAttendeeName,
  ] = useState('');

  const [
    attendeeEmail,
    setAttendeeEmail,
  ] = useState('');

  const [
    attendeePhone,
    setAttendeePhone,
  ] = useState('');

  const [
    attendeesCount,
    setAttendeesCount,
  ] = useState(1);

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  const [
    isSubmitting,
    setIsSubmitting,
  ] = useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState('');

  useEffect(() => {
    let mounted = true;

    async function load() {
      setIsLoading(true);

      try {
        const result =
          await loadExperienceAvailability(
            experienceId
          );

        if (mounted) {
          setAvailability(
            result
          );
        }
      } catch (error) {
        if (mounted) {
          setErrorMessage(
            getErrorMessage(error)
          );
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    void load();

    return () => {
      mounted = false;
    };
  }, [experienceId]);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const result =
        await registerForExperience(
          experienceId,
          {
            attendeeName,
            attendeeEmail,
            attendeePhone,
            attendeesCount,
          }
        );

      router.push(
        `/entradas/${result.ticketToken}`
      );
    } catch (error) {
      setErrorMessage(
        getErrorMessage(error)
      );

      try {
        const nextAvailability =
          await loadExperienceAvailability(
            experienceId
          );

        setAvailability(
          nextAvailability
        );
      } catch {
        // Conserva el error principal.
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="mt-8 h-48 animate-pulse rounded-3xl bg-[#111111]" />
    );
  }

  const registrationOpen =
    availability?.registrationOpen ??
    false;

  return (
    <section className="mt-8 border-t border-white/10 pt-7">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#D9FF00]">
        Inscripción
      </p>

      {availability?.capacity !== null ? (
        <div className="mt-4 rounded-2xl border border-white/10 bg-[#111111] p-4">
          <p className="text-sm font-semibold text-white">
            {availability?.remaining ??
              0}{' '}
            cupos disponibles
          </p>

          <p className="mt-2 text-xs text-[#777777]">
            {
              availability?.registeredCount ??
              0
            }{' '}
            de{' '}
            {
              availability?.capacity ??
              0
            }{' '}
            cupos reservados.
          </p>
        </div>
      ) : (
        <p className="mt-4 text-sm text-[#888888]">
          Actividad sin límite de cupos definido.
        </p>
      )}

      {registrationOpen ? (
        <form
          onSubmit={handleSubmit}
          className="mt-6 space-y-4"
        >
          <div>
            <label
              htmlFor="registration-name"
              className={labelClassName}
            >
              Nombre completo
            </label>

            <input
              id="registration-name"
              value={attendeeName}
              onChange={(event) =>
                setAttendeeName(
                  event.target.value
                )
              }
              autoComplete="name"
              className={inputClassName}
            />
          </div>

          <div>
            <label
              htmlFor="registration-email"
              className={labelClassName}
            >
              Correo electrónico
            </label>

            <input
              id="registration-email"
              type="email"
              value={attendeeEmail}
              onChange={(event) =>
                setAttendeeEmail(
                  event.target.value
                )
              }
              autoComplete="email"
              className={inputClassName}
            />
          </div>

          <div>
            <label
              htmlFor="registration-phone"
              className={labelClassName}
            >
              Teléfono
            </label>

            <input
              id="registration-phone"
              type="tel"
              value={attendeePhone}
              onChange={(event) =>
                setAttendeePhone(
                  event.target.value
                )
              }
              autoComplete="tel"
              className={inputClassName}
            />
          </div>

          <div>
            <label
              htmlFor="registration-count"
              className={labelClassName}
            >
              Número de asistentes
            </label>

            <input
              id="registration-count"
              type="number"
              min="1"
              max="10"
              value={attendeesCount}
              onChange={(event) =>
                setAttendeesCount(
                  Number(
                    event.target.value
                  )
                )
              }
              className={inputClassName}
            />
          </div>

          <p className="text-xs leading-5 text-[#666666]">
            Al inscribirte aceptas que Cultura Está
            almacene estos datos para administrar tu
            participación en la actividad.
          </p>

          {errorMessage ? (
            <div className="rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm leading-6 text-red-200">
              {errorMessage}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex w-full items-center justify-center rounded-full bg-[#D9FF00] px-6 py-4 text-sm font-bold text-black transition hover:bg-white disabled:opacity-50"
          >
            {isSubmitting
              ? 'Registrando...'
              : 'Reservar mi cupo'}
          </button>
        </form>
      ) : (
        <div className="mt-6 rounded-2xl border border-white/10 bg-[#111111] p-5">
          <p className="font-semibold">
            Inscripciones cerradas
          </p>

          <p className="mt-2 text-sm leading-6 text-[#777777]">
            La actividad ya comenzó, terminó o alcanzó
            su capacidad máxima.
          </p>
        </div>
      )}

      {externalTicketUrl ? (
        <a
          href={externalTicketUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-4 flex w-full items-center justify-center rounded-full border border-white/15 px-6 py-3 text-sm font-semibold transition hover:border-white"
        >
          Usar enlace externo de inscripción
        </a>
      ) : null}
    </section>
  );
}

function getErrorMessage(
  error: unknown
): string {
  return error instanceof Error
    ? error.message
    : 'No fue posible completar la inscripción.';
}

const labelClassName =
  'mb-2 block text-xs font-medium text-[#999999]';

const inputClassName =
  'w-full rounded-2xl border border-white/10 bg-[#080808] px-4 py-3 text-sm text-white outline-none transition focus:border-[#D9FF00]';