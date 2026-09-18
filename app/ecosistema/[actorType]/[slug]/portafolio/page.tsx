import Link from 'next/link';

import { notFound } from 'next/navigation';

import { SiteHeader } from '../../../../../components/public/SiteHeader';

import {
  getPublicPortfolioGalleryAll,
  getPublishedEcosystemActor,
} from '../../../../../services/public/publicEcosystem';

import type { PublicActorType, PublicPortfolioItem } from '../../../../../services/public/publicEcosystem';

interface PortfolioGalleryPageProps {
  params: Promise<{
    actorType: string;
    slug: string;
  }>;
}

export const dynamic = 'force-dynamic';

export default async function PortfolioGalleryPage({ params }: PortfolioGalleryPageProps) {
  const { actorType: routeActorType, slug } = await params;

  const actorType = getActorTypeFromRoute(routeActorType);
  if (!actorType) {
    notFound();
  }

  const actor = await getPublishedEcosystemActor(actorType, slug);
  if (!actor) {
    notFound();
  }

  const items = await getPublicPortfolioGalleryAll(actor.actorType, actor.actorId);

  return (
    <main className="min-h-screen bg-superficie text-texto-largo">
      <SiteHeader
        ctaLabel="Crear un proyecto"
        ctaHref="/studio?new=1"
        links={[
          { label: 'Explorar ecosistema', href: '/ecosistema' },
          { label: 'Ver proyectos', href: '/proyectos' },
        ]}
      />

      <section className="border-b border-borde px-6 py-16 sm:px-8 lg:px-12 lg:py-20">
        <div className="mx-auto max-w-7xl">
          <Link
            href={`/ecosistema/${routeActorType}/${slug}`}
            className="text-sm text-texto-largo transition hover:text-texto-principal"
          >
            ← Volver al perfil
          </Link>

          <p className="mt-8 text-xs font-bold uppercase tracking-[0.22em] text-texto-principal">Portafolio</p>
          <h1 className="stencil-heading mt-4 text-5xl font-black leading-[0.94] tracking-[-0.055em] sm:text-6xl">
            {actor.name}
          </h1>
        </div>
      </section>

      <section className="px-6 py-16 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-7xl">
          {items.length === 0 ? (
            <p className="text-texto-largo">Este perfil todavía no tiene items publicados en su portafolio.</p>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((item) => (
                <GalleryItemCard key={item.id} item={item} />
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

function GalleryItemCard({ item }: { item: PublicPortfolioItem }) {
  const coverUrl = item.mediaUrls[0] ?? null;
  const isVideo = coverUrl ? /\.(mp4|mov)$/i.test(coverUrl) : false;

  return (
    <div className="overflow-hidden border border-borde bg-superficie-elevada">
      {coverUrl ? (
        isVideo ? (
          <video src={coverUrl} className="aspect-square w-full border-b border-borde object-cover" muted playsInline controls />
        ) : (
          <img src={coverUrl} alt={item.title} className="aspect-square w-full border-b border-borde object-cover" />
        )
      ) : (
        <div className="aspect-square border-b border-borde bg-superficie" />
      )}

      <div className="p-5">
        <p className="text-base font-bold">{item.title}</p>
        {item.description ? <p className="mt-2 text-sm leading-6 text-texto-largo">{item.description}</p> : null}
      </div>
    </div>
  );
}

function getActorTypeFromRoute(routeActorType: string): PublicActorType | null {
  if (routeActorType === 'personas') return 'person';
  if (routeActorType === 'espacios') return 'space';
  if (routeActorType === 'financiadores') return 'funder';
  return null;
}
