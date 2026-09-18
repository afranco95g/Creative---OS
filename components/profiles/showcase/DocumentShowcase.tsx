import { FileText } from 'lucide-react';

import type { PublicPortfolioItem } from '@/services/public/publicEcosystem';

/** Ítem de portafolio de tipo documento (PDF), migración 058. */
export function DocumentShowcase({ item }: { item: PublicPortfolioItem }) {
  return (
    <div className="flex flex-col border border-borde bg-superficie-elevada p-4">
      <div className="flex items-center gap-2 text-texto-principal">
        <FileText size={20} />
        <p className="text-sm font-bold text-texto-largo">{item.title}</p>
      </div>

      {item.description ? (
        <p className="mt-2 line-clamp-3 text-xs leading-5 text-texto-largo">
          {item.description}
        </p>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        {item.mediaUrls.map((url, index) => (
          <a
            key={url}
            href={url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 border border-borde px-3 py-1.5 text-xs font-semibold text-texto-largo transition hover:border-rojo-base hover:text-rojo-base"
          >
            {item.mediaUrls.length > 1 ? `Ver documento ${index + 1}` : 'Ver documento'}
          </a>
        ))}
      </div>
    </div>
  );
}
