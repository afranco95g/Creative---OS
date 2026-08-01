import { logEntries } from '@/lib/data';

export function LogPanel() {
  return (
    <section className="min-h-screen px-5 py-8 md:px-10">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black tracking-tight">Bitácora Viva</h1>
          <p className="mt-2 text-white/55">Registro vivo de decisiones, ideas y avances.</p>
        </div>
        <button className="acid-button px-4 py-3 text-xs uppercase">+ Nueva entrada</button>
      </div>
      <div className="relative max-w-4xl pl-8 before:absolute before:left-3 before:top-0 before:h-full before:w-px before:bg-acid/60">
        {logEntries.map((entry) => (
          <article key={entry.title} className="relative mb-5 rounded-3xl border border-white/10 bg-white/[.04] p-5 before:absolute before:-left-[27px] before:top-7 before:h-4 before:w-4 before:rounded-full before:bg-acid before:shadow-glow">
            <div className="flex items-start justify-between gap-4">
              <h3 className="font-black">{entry.title}</h3>
              <span className="text-xs text-white/45">{entry.time}</span>
            </div>
            <p className="mt-2 text-sm text-white/65">{entry.body}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {entry.tags.map((tag) => <span key={tag} className="rounded-full bg-white/10 px-3 py-1 text-[10px] font-black uppercase text-white/55">{tag}</span>)}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
