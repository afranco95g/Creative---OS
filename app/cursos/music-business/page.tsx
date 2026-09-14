import Link from 'next/link';
import { MusicBusinessCoursePlatform } from '@/components/courses/MusicBusinessCoursePlatform';

export const metadata = {
  title: 'Programa Music Business | Imagine Company & Creative OS',
  description: 'Plataforma educativa y de estructuración para proyectos musicales de Imagine Company S.A.S.',
};

export default function MusicBusinessCoursePage() {
  return (
    <main className="min-h-screen bg-superficie px-6 py-10 text-texto-largo sm:px-8 lg:px-12">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Navigation Breadcrumb */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-borde/10 pb-6">
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/"
              className="rounded-full border border-borde/15 px-4 py-2 text-xs text-texto-largo transition hover:border-borde hover:text-hueso"
            >
              ← Volver al medio
            </Link>
            <span className="text-borde">/</span>
            <Link
              href="/studio"
              className="rounded-full border border-borde/15 px-4 py-2 text-xs text-texto-largo transition hover:border-borde hover:text-hueso"
            >
              Creative OS
            </Link>
            <span className="text-borde">/</span>
            <Link
              href="/mi-ecosistema"
              className="rounded-full border border-borde/15 px-4 py-2 text-xs text-texto-largo transition hover:border-borde hover:text-hueso"
            >
              Mi Ecosistema
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/studio"
              className="rounded-full bg-rojo-base px-5 py-2 text-xs font-bold text-hueso transition hover:bg-rojo-base/90"
            >
              Ir a mi Mesa de Producción
            </Link>
          </div>
        </div>

        {/* Music Business Platform Component */}
        <MusicBusinessCoursePlatform />
      </div>
    </main>
  );
}

