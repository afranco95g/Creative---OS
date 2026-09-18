import type { PublicPortfolioItem } from '@/services/public/publicEcosystem';

/**
 * Reproductor para un ítem de portafolio de tipo audio (migración
 * 058). Un ítem es homogéneo — todas sus URLs son audio — así que se
 * listan todas como pistas del mismo ítem, no como ítems separados.
 */
export function AudioShowcase({ item }: { item: PublicPortfolioItem }) {
  return (
    <div className="border border-borde bg-superficie-elevada p-4">
      <p className="text-sm font-bold">{item.title}</p>
      {item.description ? (
        <p className="mt-2 line-clamp-2 text-xs leading-5 text-texto-largo">
          {item.description}
        </p>
      ) : null}

      <div className="mt-4 space-y-3">
        {item.mediaUrls.map((url, index) => (
          <audio key={url} controls preload="none" className="w-full">
            <source src={url} />
            {item.mediaUrls.length > 1 ? `Pista ${index + 1}` : 'Audio'}
          </audio>
        ))}
      </div>
    </div>
  );
}
