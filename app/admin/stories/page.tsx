import Link from 'next/link';
import { stories } from '../../../data/media/stories';

const storyTypeLabels = {
  documentary: 'Documental',
  interview: 'Entrevista',
  article: 'Artículo',
  opinion: 'Opinión',
  'photo-story': 'Fotohistoria',
  report: 'Reportaje',
};

export default function AdminStoriesPage() {
  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <header className="border-b border-white/10">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-8 py-6">
          <div>
            <Link
              href="/admin"
              className="text-sm text-[#8A8A8A] transition hover:text-white"
            >
              ← Volver al panel
            </Link>

            <h1 className="mt-3 text-3xl font-semibold">
              Historias
            </h1>
          </div>

          <Link
            href="/admin/stories/new"
            className="rounded-full bg-[#D9FF00] px-6 py-3 font-semibold text-black transition hover:scale-105"
          >
            Nueva historia
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-8 py-16">
        <div className="flex flex-col gap-5 border-b border-white/10 pb-10 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.3em] text-[#D9FF00]">
              Contenido editorial
            </p>

            <h2 className="mt-4 text-4xl font-bold">
              Historias publicadas
            </h2>

            <p className="mt-4 max-w-2xl leading-relaxed text-[#8A8A8A]">
              Aquí podrás administrar documentales, entrevistas,
              artículos, opinión, fotohistorias y reportajes.
            </p>
          </div>

          <div className="rounded-full border border-white/10 px-5 py-3 text-sm text-[#A0A0A0]">
            {stories.length}{' '}
            {stories.length === 1 ? 'historia' : 'historias'}
          </div>
        </div>

        <div className="mt-10 overflow-hidden rounded-[28px] border border-white/10 bg-[#0A0A0A]">
          <div className="hidden grid-cols-[1fr_160px_140px_120px] gap-6 border-b border-white/10 px-7 py-4 text-xs font-bold uppercase tracking-[0.2em] text-[#666666] md:grid">
            <span>Historia</span>
            <span>Tipo</span>
            <span>Fecha</span>
            <span>Estado</span>
          </div>

          <div>
            {stories.map((story) => (
              <article
                key={story.id}
                className="grid gap-5 border-b border-white/10 px-7 py-7 last:border-b-0 md:grid-cols-[1fr_160px_140px_120px] md:items-center"
              >
                <div>
                  <p className="text-xl font-semibold">
                    {story.title}
                  </p>

                  <p className="mt-2 line-clamp-2 max-w-2xl text-sm leading-relaxed text-[#7D7D7D]">
                    {story.excerpt}
                  </p>
                </div>

                <div>
                  <p className="mb-1 text-xs uppercase tracking-[0.2em] text-[#5F5F5F] md:hidden">
                    Tipo
                  </p>

                  <span className="text-sm text-[#B0B0B0]">
                    {storyTypeLabels[story.type]}
                  </span>
                </div>

                <div>
                  <p className="mb-1 text-xs uppercase tracking-[0.2em] text-[#5F5F5F] md:hidden">
                    Fecha
                  </p>

                  <span className="text-sm text-[#B0B0B0]">
                    {story.publishedAt}
                  </span>
                </div>

                <div>
                  <p className="mb-1 text-xs uppercase tracking-[0.2em] text-[#5F5F5F] md:hidden">
                    Estado
                  </p>

                  <span
                    className={
                      story.featured
                        ? 'inline-flex rounded-full bg-[#D9FF00] px-3 py-1 text-xs font-bold text-black'
                        : 'inline-flex rounded-full border border-white/10 px-3 py-1 text-xs text-[#8A8A8A]'
                    }
                  >
                    {story.featured ? 'Destacada' : 'Publicada'}
                  </span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}