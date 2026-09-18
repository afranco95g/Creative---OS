'use client';

import type { WizardSpaceSearchResult } from '@/services/spaces/spaceRoomService';

interface SpaceResultCardProps {
  result: WizardSpaceSearchResult;
  onSelect: () => void;
}

export function SpaceResultCard({
  result,
  onSelect,
}: SpaceResultCardProps) {
  return (
    <article className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.035] transition hover:border-white/30">
      <div className="aspect-[16/9] w-full bg-neutral-900">
        {result.coverPhotoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={result.coverPhotoUrl}
            alt={result.roomName}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs uppercase tracking-[0.2em] text-neutral-600">
            Sin foto todavía
          </div>
        )}
      </div>

      <div className="p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">
          {result.spaceName}
          {result.city ? ` · ${result.city}` : ''}
        </p>

        <h4 className="mt-2 text-xl font-bold tracking-tight">
          {result.roomName}
        </h4>

        <p className="mt-2 text-sm text-neutral-400">
          {result.capacity
            ? `Aforo: ${result.capacity} personas`
            : 'Aforo no especificado'}
        </p>

        {result.possibleUses.length > 0 && (
          <p className="mt-2 text-xs text-neutral-500">
            {result.possibleUses.join(' · ')}
          </p>
        )}

        <button
          type="button"
          onClick={onSelect}
          className="mt-5 w-full rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-neutral-200"
        >
          Elegir este salón
        </button>
      </div>
    </article>
  );
}
