'use client';

import { useState } from 'react';
import type { FormEvent } from 'react';

import type { WizardSpaceSearchResult } from '@/services/spaces/spaceRoomService';
import type { WizardSelectedBooking } from './steps';

interface SpaceBookingConfirmModalProps {
  room: WizardSpaceSearchResult;
  onConfirm: (booking: WizardSelectedBooking) => void;
  onCancel: () => void;
}

/**
 * Recoge fecha/hora tentativa. No inserta nada en Supabase aquí — el
 * wizard crea el proyecto primero y la solicitud de reserva después,
 * ya con project_id, en el paso final (ver ProjectCreationWizard).
 * Bloques mínimos de 2 horas, igual que el resto de la plataforma.
 */
export function SpaceBookingConfirmModal({
  room,
  onConfirm,
  onCancel,
}: SpaceBookingConfirmModalProps) {
  const [eventType, setEventType] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [specialRequests, setSpecialRequests] = useState('');
  const [error, setError] = useState('');

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');

    if (!eventType.trim() || !date || !startTime || !endTime) {
      setError('Completa el tipo de evento, la fecha y el rango de horas.');
      return;
    }

    const startsAt = new Date(`${date}T${startTime}:00`);
    const endsAt = new Date(`${date}T${endTime}:00`);

    if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime())) {
      setError('La fecha u hora no son válidas.');
      return;
    }

    if (endsAt.getTime() - startsAt.getTime() < 2 * 60 * 60 * 1000) {
      setError('El bloque mínimo de reserva es de 2 horas.');
      return;
    }

    onConfirm({
      roomId: room.roomId,
      roomName: room.roomName,
      spaceName: room.spaceName,
      startsAt: startsAt.toISOString(),
      endsAt: endsAt.toISOString(),
      eventType: eventType.trim(),
      specialRequests: specialRequests.trim(),
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-neutral-950 p-7">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">
          {room.spaceName}
        </p>

        <h3 className="mt-2 text-2xl font-bold tracking-tight">
          Solicitar {room.roomName}
        </h3>

        <p className="mt-3 text-sm leading-6 text-neutral-400">
          Esto crea una solicitud de reserva sujeta a aprobación del
          espacio, con pago presencial — igual que cualquier otra
          reserva en la plataforma. Se confirma al aceptar el
          proyecto.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 grid gap-5">
          <label className="grid gap-2">
            <span className="text-sm font-semibold text-neutral-300">
              Tipo de evento
            </span>
            <input
              type="text"
              value={eventType}
              onChange={(event) => setEventType(event.target.value)}
              placeholder="Ej. Concierto, taller, grabación"
              className="rounded-2xl border border-neutral-700 bg-neutral-950 px-4 py-3 text-white outline-none transition placeholder:text-neutral-600 focus:border-white"
            />
          </label>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <label className="grid gap-2">
              <span className="text-sm font-semibold text-neutral-300">
                Fecha
              </span>
              <input
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
                className="rounded-2xl border border-neutral-700 bg-neutral-950 px-3 py-3 text-white outline-none transition focus:border-white"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-semibold text-neutral-300">
                Desde
              </span>
              <input
                type="time"
                value={startTime}
                onChange={(event) => setStartTime(event.target.value)}
                className="rounded-2xl border border-neutral-700 bg-neutral-950 px-3 py-3 text-white outline-none transition focus:border-white"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-semibold text-neutral-300">
                Hasta
              </span>
              <input
                type="time"
                value={endTime}
                onChange={(event) => setEndTime(event.target.value)}
                className="rounded-2xl border border-neutral-700 bg-neutral-950 px-3 py-3 text-white outline-none transition focus:border-white"
              />
            </label>
          </div>

          <label className="grid gap-2">
            <span className="text-sm font-semibold text-neutral-300">
              Notas para el espacio (opcional)
            </span>
            <textarea
              value={specialRequests}
              onChange={(event) => setSpecialRequests(event.target.value)}
              rows={3}
              className="resize-none rounded-2xl border border-neutral-700 bg-neutral-950 px-4 py-3 text-white outline-none transition placeholder:text-neutral-600 focus:border-white"
            />
          </label>

          {error && (
            <p className="text-sm text-red-400">{error}</p>
          )}

          <div className="mt-2 flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={onCancel}
              className="text-sm text-neutral-500 transition hover:text-white"
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-black transition hover:bg-neutral-200"
            >
              Confirmar selección
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
