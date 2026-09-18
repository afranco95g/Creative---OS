'use client';

import { useEffect, useState } from 'react';

import {
  searchPublishedRoomsForWizard,
} from '@/services/spaces/spaceRoomService';
import type { WizardSpaceSearchResult } from '@/services/spaces/spaceRoomService';
import { listInventoryCategories } from '@/services/spaces/spaceInventoryService';
import type { SpaceInventoryCategory } from '@/services/spaces/spaceInventoryService';

import { SpaceResultCard } from './SpaceResultCard';
import { SpaceBookingConfirmModal } from './SpaceBookingConfirmModal';
import type { WizardSelectedBooking } from './steps';

interface Step2SpaceFinderProps {
  selectedBooking: WizardSelectedBooking | null;
  onConfirmBooking: (booking: WizardSelectedBooking) => void;
  onSkip: () => void;
  onBack: () => void;
}

export function Step2SpaceFinder({
  selectedBooking,
  onConfirmBooking,
  onSkip,
  onBack,
}: Step2SpaceFinderProps) {
  const [minCapacity, setMinCapacity] = useState('');
  const [city, setCity] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [categories, setCategories] = useState<SpaceInventoryCategory[]>([]);
  const [results, setResults] = useState<WizardSpaceSearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [roomToConfirm, setRoomToConfirm] = useState<WizardSpaceSearchResult | null>(null);

  useEffect(() => {
    void listInventoryCategories()
      .then(setCategories)
      .catch(() => setCategories([]));
  }, []);

  async function runSearch() {
    setLoading(true);
    setError('');

    try {
      const parsedCapacity = minCapacity.trim() ? Number(minCapacity) : undefined;

      const data = await searchPublishedRoomsForWizard({
        minCapacity: parsedCapacity && !Number.isNaN(parsedCapacity) ? parsedCapacity : undefined,
        city: city.trim() || undefined,
        equipmentCategories: selectedCategories.length > 0 ? selectedCategories : undefined,
      });

      setResults(data);
    } catch (searchError) {
      setError(
        searchError instanceof Error
          ? searchError.message
          : 'No fue posible buscar salones disponibles.'
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void runSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function toggleCategory(key: string) {
    setSelectedCategories((current) =>
      current.includes(key)
        ? current.filter((item) => item !== key)
        : [...current, key]
    );
  }

  return (
    <section className="max-w-5xl">
      <button
        type="button"
        onClick={onBack}
        className="text-sm text-neutral-500 transition hover:text-white"
      >
        ← Cambiar qué vas a crear
      </button>

      <p className="mt-8 text-sm font-semibold uppercase tracking-[0.2em] text-neutral-500">
        Segundo paso
      </p>

      <h2 className="mt-4 text-4xl font-black tracking-[-0.04em] sm:text-5xl">
        ¿Dónde y con qué?
      </h2>

      <p className="mt-5 max-w-2xl text-lg leading-8 text-neutral-400">
        Busca un salón disponible. Si lo eliges, se crea una solicitud
        de reserva sujeta a aprobación — igual que cualquier reserva
        hecha desde el perfil del espacio. Puedes decidir esto
        después si todavía no lo sabes.
      </p>

      {selectedBooking && (
        <div className="mt-8 rounded-3xl border border-white/20 bg-white/[0.06] p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-400">
            Salón elegido
          </p>
          <p className="mt-2 text-lg font-semibold">
            {selectedBooking.roomName} — {selectedBooking.spaceName}
          </p>
          <p className="mt-1 text-sm text-neutral-400">
            {new Date(selectedBooking.startsAt).toLocaleString('es-CO')} a{' '}
            {new Date(selectedBooking.endsAt).toLocaleString('es-CO')}
          </p>
        </div>
      )}

      <div className="mt-8 grid gap-4 rounded-3xl border border-white/10 bg-white/[0.025] p-6 sm:grid-cols-3">
        <label className="grid gap-2">
          <span className="text-sm font-semibold text-neutral-300">
            Aforo mínimo
          </span>
          <input
            type="number"
            min={1}
            value={minCapacity}
            onChange={(event) => setMinCapacity(event.target.value)}
            placeholder="Ej. 50"
            className="rounded-2xl border border-neutral-700 bg-neutral-950 px-4 py-2.5 text-white outline-none transition focus:border-white"
          />
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-semibold text-neutral-300">
            Ciudad
          </span>
          <input
            type="text"
            value={city}
            onChange={(event) => setCity(event.target.value)}
            placeholder="Ej. Bogotá"
            className="rounded-2xl border border-neutral-700 bg-neutral-950 px-4 py-2.5 text-white outline-none transition focus:border-white"
          />
        </label>

        <div className="grid gap-2 sm:col-span-1">
          <span className="text-sm font-semibold text-neutral-300">
            Equipamiento
          </span>
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category.key}
                type="button"
                onClick={() => toggleCategory(category.key)}
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                  selectedCategories.includes(category.key)
                    ? 'border-white bg-white text-black'
                    : 'border-neutral-700 text-neutral-300 hover:border-white/50'
                }`}
              >
                {category.label}
              </button>
            ))}
          </div>
        </div>

        <div className="sm:col-span-3">
          <button
            type="button"
            onClick={() => void runSearch()}
            className="rounded-full bg-white px-6 py-2.5 text-sm font-semibold text-black transition hover:bg-neutral-200"
          >
            Buscar
          </button>
        </div>
      </div>

      <div className="mt-10">
        {loading ? (
          <div className="grid gap-4 md:grid-cols-3">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-64 animate-pulse rounded-3xl border border-neutral-800 bg-neutral-900"
              />
            ))}
          </div>
        ) : error ? (
          <p className="text-sm text-red-400">{error}</p>
        ) : results.length === 0 ? (
          <p className="rounded-3xl border border-dashed border-white/10 p-8 text-center text-neutral-500">
            No hay salones publicados que cumplan estos filtros todavía.
          </p>
        ) : (
          <div className="grid gap-5 md:grid-cols-3">
            {results.map((result) => (
              <SpaceResultCard
                key={result.roomId}
                result={result}
                onSelect={() => setRoomToConfirm(result)}
              />
            ))}
          </div>
        )}
      </div>

      <div className="mt-10 flex items-center justify-between gap-4 border-t border-white/10 pt-8">
        <button
          type="button"
          onClick={onSkip}
          className="text-sm text-neutral-400 transition hover:text-white"
        >
          Decidir el espacio después →
        </button>
      </div>

      {roomToConfirm && (
        <SpaceBookingConfirmModal
          room={roomToConfirm}
          onCancel={() => setRoomToConfirm(null)}
          onConfirm={(booking) => {
            setRoomToConfirm(null);
            onConfirmBooking(booking);
          }}
        />
      )}
    </section>
  );
}
