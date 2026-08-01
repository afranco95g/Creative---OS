import { EditorialCard } from './EditorialCard';
import { stories } from '../../data/media/stories';

export function LatestStoriesSection() {
  const latestStories = stories.slice(0, 4);

  return (
    <section
      id="historias"
      className="border-b border-white/10 bg-[#050505]"
    >
      <div className="mx-auto max-w-7xl px-8 py-24">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.35em] text-[#D9FF00]">
              Historias recientes
            </p>

            <h2 className="mt-5 max-w-3xl text-4xl font-bold leading-tight md:text-5xl">
              Lo que está pasando en el ecosistema creativo.
            </h2>
          </div>

          <button className="w-fit border-b border-white/30 pb-1 text-sm font-semibold transition hover:border-[#D9FF00] hover:text-[#D9FF00]">
            Ver todas las historias
          </button>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-2">
          {latestStories.map((story) => (
            <EditorialCard
              key={story.id}
              category={story.type}
              title={story.title}
              description={story.excerpt}
            />
          ))}
        </div>
      </div>
    </section>
  );
}