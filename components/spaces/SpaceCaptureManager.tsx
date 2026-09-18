'use client';

import { FormEvent, useEffect, useState } from 'react';

import {
  createRoom,
  listRoomsForSpace,
  updateRoom,
  type SpaceRoom,
} from '@/services/spaces/spaceRoomService';

import { SpaceRoomInventoryPanel } from './SpaceRoomInventoryPanel';
import { SpaceRoomMediaPanel } from './SpaceRoomMediaPanel';

interface SpaceOption {
  id: string;
  name: string;
  status: string;
}

export function SpaceCaptureManager({ initialSpaces }: { initialSpaces: SpaceOption[] }) {
  const [spaces] = useState(initialSpaces);
  const [selectedSpaceId, setSelectedSpaceId] = useState(
    initialSpaces.length === 1 ? (initialSpaces[0]?.id ?? '') : ''
  );
  const [rooms, setRooms] = useState<SpaceRoom[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [message, setMessage] = useState('');

  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomDescription, setNewRoomDescription] = useState('');
  const [newRoomCapacity, setNewRoomCapacity] = useState('');
  const [newRoomUses, setNewRoomUses] = useState('');

  useEffect(() => {
    if (!selectedSpaceId) {
      setRooms([]);
      return;
    }

    let cancelled = false;
    setLoadingRooms(true);

    listRoomsForSpace(selectedSpaceId)
      .then((data) => {
        if (!cancelled) {
          setRooms(data);
          setSelectedRoomId((current) => current ?? data[0]?.id ?? null);
        }
      })
      .catch((error) => {
        if (!cancelled) setMessage(getErrorMessage(error));
      })
      .finally(() => {
        if (!cancelled) setLoadingRooms(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedSpaceId]);

  async function handleCreateRoom(event: FormEvent) {
    event.preventDefault();
    setMessage('');

    try {
      const possibleUses = newRoomUses
        .split(',')
        .map((use) => use.trim())
        .filter(Boolean);

      const room = await createRoom({
        spaceId: selectedSpaceId,
        name: newRoomName,
        description: newRoomDescription || undefined,
        capacity: newRoomCapacity ? Number(newRoomCapacity) : undefined,
        possibleUses: possibleUses.length ? possibleUses : undefined,
      });

      setRooms((current) => [...current, room]);
      setSelectedRoomId(room.id);
      setNewRoomName('');
      setNewRoomDescription('');
      setNewRoomCapacity('');
      setNewRoomUses('');
      setMessage('Salón creado en borrador.');
    } catch (error) {
      setMessage(getErrorMessage(error));
    }
  }

  async function togglePublish(room: SpaceRoom) {
    setMessage('');

    try {
      const nextStatus = room.status === 'published' ? 'draft' : 'published';
      const updated = await updateRoom(room.id, { status: nextStatus });

      setRooms((current) => current.map((item) => (item.id === room.id ? updated : item)));
      setMessage(
        nextStatus === 'published'
          ? `"${room.name}" quedó publicado — visible con sesión iniciada.`
          : `"${room.name}" volvió a borrador.`
      );
    } catch (error) {
      setMessage(getErrorMessage(error));
    }
  }

  const selectedRoom = rooms.find((room) => room.id === selectedRoomId) ?? null;

  return (
    <div className="space-y-8">
      <label className="block max-w-md">
        <span className="mb-2 block text-sm font-medium text-texto-largo">Espacio</span>
        <select
          value={selectedSpaceId}
          onChange={(event) => {
            setSelectedSpaceId(event.target.value);
            setSelectedRoomId(null);
          }}
          className="w-full border border-borde/15 bg-superficie-elevada px-4 py-3 text-texto-largo outline-none focus:border-acento"
        >
          {selectedSpaceId === '' ? (
            <option value="" disabled>
              Selecciona un espacio
            </option>
          ) : null}
          {spaces.map((space) => (
            <option key={space.id} value={space.id}>
              {space.name} ({space.status})
            </option>
          ))}
        </select>
      </label>

      {message ? (
        <p className="border-l-2 border-acento pl-4 text-sm text-texto-largo">{message}</p>
      ) : null}

      <div className="grid gap-8 lg:grid-cols-[320px_1fr]">
        <div className="space-y-6">
          <div className="border border-borde/10 bg-superficie-elevada p-5">
            <h2 className="text-sm font-semibold uppercase tracking-[.1em] text-texto-principal">
              Salones
            </h2>

            {loadingRooms ? <p className="mt-3 text-sm text-texto-largo">Cargando…</p> : null}

            <ul className="mt-4 space-y-2">
              {rooms.map((room) => (
                <li key={room.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedRoomId(room.id)}
                    className={`w-full border px-3 py-2 text-left text-sm ${
                      room.id === selectedRoomId
                        ? 'border-acento bg-superficie text-texto-principal'
                        : 'border-borde/10 text-texto-largo hover:border-borde/30'
                    }`}
                  >
                    {room.name}
                    <span className="ml-2 text-xs opacity-70">({room.status})</span>
                  </button>
                </li>
              ))}

              {!rooms.length && !loadingRooms ? (
                <li className="text-sm text-texto-largo">
                  {selectedSpaceId === ''
                    ? 'Selecciona un espacio para ver sus salones.'
                    : 'Todavía no hay salones en este espacio.'}
                </li>
              ) : null}
            </ul>
          </div>

          <form onSubmit={handleCreateRoom} className="space-y-3 border border-borde/10 bg-superficie-elevada p-5">
            <h2 className="text-sm font-semibold uppercase tracking-[.1em] text-texto-principal">
              Nuevo salón
            </h2>

            <input
              value={newRoomName}
              onChange={(event) => setNewRoomName(event.target.value)}
              placeholder="Nombre del salón"
              required
              className="w-full border border-borde/15 bg-superficie px-3 py-2 text-sm text-texto-largo outline-none focus:border-acento"
            />

            <textarea
              value={newRoomDescription}
              onChange={(event) => setNewRoomDescription(event.target.value)}
              placeholder="Descripción"
              rows={3}
              className="w-full border border-borde/15 bg-superficie px-3 py-2 text-sm text-texto-largo outline-none focus:border-acento"
            />

            <input
              type="number"
              min={1}
              value={newRoomCapacity}
              onChange={(event) => setNewRoomCapacity(event.target.value)}
              placeholder="Capacidad (personas)"
              className="w-full border border-borde/15 bg-superficie px-3 py-2 text-sm text-texto-largo outline-none focus:border-acento"
            />

            <input
              value={newRoomUses}
              onChange={(event) => setNewRoomUses(event.target.value)}
              placeholder="Usos posibles, separados por coma"
              className="w-full border border-borde/15 bg-superficie px-3 py-2 text-sm text-texto-largo outline-none focus:border-acento"
            />

            <button
              type="submit"
              disabled={!selectedSpaceId || !newRoomName.trim()}
              className="w-full bg-rojo-base px-4 py-2 text-sm font-bold text-hueso disabled:opacity-50"
            >
              Crear salón
            </button>
          </form>
        </div>

        <div className="space-y-6">
          {selectedRoom ? (
            <>
              <div className="flex items-center justify-between border border-borde/10 bg-superficie-elevada p-5">
                <div>
                  <h2 className="text-lg font-semibold text-texto-largo">{selectedRoom.name}</h2>
                  <p className="mt-1 text-sm text-texto-largo">
                    Capacidad: {selectedRoom.capacity ?? 'sin definir'} · Estado: {selectedRoom.status}
                  </p>
                  {selectedRoom.possibleUses.length ? (
                    <p className="mt-1 text-sm text-texto-largo">
                      Usos: {selectedRoom.possibleUses.join(', ')}
                    </p>
                  ) : null}
                </div>

                <button
                  type="button"
                  onClick={() => togglePublish(selectedRoom)}
                  className="border border-borde px-4 py-2 text-sm font-semibold text-rojo-base"
                >
                  {selectedRoom.status === 'published' ? 'Volver a borrador' : 'Publicar salón'}
                </button>
              </div>

              <SpaceRoomInventoryPanel roomId={selectedRoom.id} />
              <SpaceRoomMediaPanel roomId={selectedRoom.id} />
            </>
          ) : (
            <p className="border border-dashed border-borde/15 p-8 text-center text-sm text-texto-largo">
              Selecciona o crea un salón para cargar su inventario y galería.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Ocurrió un error inesperado.';
}
