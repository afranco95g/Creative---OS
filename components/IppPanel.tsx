import { ipp } from '@/lib/data';

export function IppPanel() {
  return (
    <section className="min-h-screen px-5 py-8 md:px-10">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black tracking-tight">IPP</h1>
          <p className="mt-2 text-white/55">Índice de Potencial del Proyecto</p>
        </div>
        <button className="rounded-2xl border border-white/10 px-4 py-3 text-xs font-black uppercase text-white/60">¿Cómo se calcula?</button>
      </div>
      <div className="grid gap-6 xl:grid-cols-[1fr_1.2fr]">
        <div className="card grid place-items-center p-8">
          <div className="relative grid h-64 w-64 place-items-center rounded-full border-[18px] border-white/10" style={{ background: `conic-gradient(#D7FF00 ${ipp.score * 3.6}deg, transparent 0deg)` }}>
            <div className="absolute inset-5 rounded-full bg-coal" />
            <div className="relative text-center">
              <div className="text-7xl font-black">{ipp.score}</div>
              <div className="text-white/45">/100</div>
              <div className="mt-3 font-black text-acid">Potencial Alto</div>
            </div>
          </div>
        </div>
        <div className="card p-6">
          <div className="grid gap-8 md:grid-cols-2">
            <div>
              <h3 className="mb-4 font-black">Fortalezas</h3>
              <ul className="space-y-3 text-sm text-white/70">
                {ipp.strengths.map((item) => <li key={item} className="flex gap-3"><span className="text-acid">●</span>{item}</li>)}
              </ul>
            </div>
            <div>
              <h3 className="mb-4 font-black">Áreas a fortalecer</h3>
              <ul className="space-y-3 text-sm text-white/70">
                {ipp.improve.map((item) => <li key={item} className="flex gap-3"><span className="text-yellow-400">●</span>{item}</li>)}
              </ul>
            </div>
          </div>
          <div className="mt-10 border-t border-white/10 pt-6">
            <h3 className="mb-3 font-black">Recomendación</h3>
            <p className="max-w-3xl text-sm leading-relaxed text-white/65">{ipp.recommendation}</p>
            <button className="acid-button mt-6 px-8 py-4 uppercase">Ver plan de acción</button>
          </div>
        </div>
      </div>
    </section>
  );
}
