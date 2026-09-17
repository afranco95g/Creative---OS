'use client';

import { ChangeEvent, useEffect, useState } from 'react';

import {
  deleteSpaceMedia,
  listMediaForRoom,
  uploadSpaceMedia,
  type SpaceMedia,
} from '@/services/spaces/spaceMediaService';

export function SpaceRoomMediaPanel({ roomId }: { roomId: string }) {
  const [media, setMedia] = useState<SpaceMedia[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    setMessage('');

    listMediaForRoom(roomId)
      .then(setMedia)
      .catch((error) => setMessage(getErrorMessage(error)));
  }, [roomId]);

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setMessage('');

    try {
      const uploaded = await uploadSpaceMedia(file, roomId);
      setMedia((current) => [...current, uploaded]);
      setMessage('Archivo cargado.');
    } catch (error) {
      setMessage(getErrorMessage(error));
    } finally {
      setIsUploading(false);
      event.target.value = '';
    }
  }

  async function handleDelete(item: SpaceMedia) {
    setMessage('');

    try {
      await deleteSpaceMedia(item.id, item.storagePath);
      setMedia((current) => current.filter((entry) => entry.id !== item.id));
    } catch (error) {
      setMessage(getErrorMessage(error));
    }
  }

  return (
    <div className="border border-borde/10 bg-superficie-elevada p-5">
      <h3 className="text-sm font-semibold uppercase tracking-[.1em] text-texto-principal">
        Galería
      </h3>

      <div className="mt-4 border border-dashed border-borde/15 p-4">
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime"
          onChange={(event) => {
            void handleFileChange(event);
          }}
          disabled={isUploading}
          className="block w-full cursor-pointer text-sm text-texto-largo file:mr-4 file:cursor-pointer file:border-0 file:bg-rojo-base file:px-5 file:py-3 file:text-sm file:font-bold file:text-hueso disabled:opacity-50"
        />

        <p className="mt-3 text-xs text-texto-largo">
          Fotos: JPG, PNG o WEBP hasta 8 MB. Video: MP4 o MOV hasta 300 MB.
        </p>

        {isUploading ? <p className="mt-3 text-sm text-texto-principal">Cargando…</p> : null}
      </div>

      {message ? <p className="mt-4 text-sm text-texto-largo">{message}</p> : null}

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {media.map((item) => (
          <div key={item.id} className="relative border border-borde/10 bg-superficie">
            {item.mediaType === 'video' ? (
              <video src={item.url} controls className="aspect-square w-full object-cover" />
            ) : (
              <img src={item.url} alt="" className="aspect-square w-full object-cover" />
            )}

            <button
              type="button"
              onClick={() => handleDelete(item)}
              className="absolute right-1 top-1 border border-borde bg-superficie px-2 py-1 text-xs font-semibold text-rojo-base"
            >
              Quitar
            </button>
          </div>
        ))}

        {!media.length ? (
          <p className="col-span-full text-sm text-texto-largo">
            Todavía no hay fotos ni video de este salón.
          </p>
        ) : null}
      </div>
    </div>
  );
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Ocurrió un error inesperado.';
}
