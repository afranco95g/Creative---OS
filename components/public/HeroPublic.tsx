interface HeroPublicProps {
  onExplore: () => void;
  onLearnMore: () => void;
}

export function HeroPublic({
  onExplore,
}: HeroPublicProps) {
  return (
    <section className="border-b border-white/10 bg-[#050505]">
      <div className="mx-auto max-w-7xl px-8 py-20">

        <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr]">

          <div>

            <p className="mb-6 text-sm font-bold uppercase tracking-[0.35em] text-[#D9FF00]">
              DOCUMENTAL DESTACADO
            </p>

            <h1 className="max-w-3xl text-6xl font-bold leading-[1.05]">
              San Felipe:
              <br />
              el barrio donde
              <br />
              los talleres
              <br />
              volvieron a abrir.
            </h1>

            <p className="mt-8 max-w-2xl text-xl leading-relaxed text-[#9B9B9B]">
              Un recorrido por los talleres, artistas y espacios
              independientes que están redefiniendo uno de los
              distritos creativos más importantes de Bogotá.
            </p>

            <div className="mt-12 flex gap-5">

              <button
                onClick={onExplore}
                className="rounded-full bg-[#D9FF00] px-8 py-4 font-semibold text-black transition hover:scale-105"
              >
                Ver documental
              </button>

              <button className="rounded-full border border-white/20 px-8 py-4 transition hover:border-white">
                Leer historia
              </button>

            </div>

          </div>

          <div>

            <div className="aspect-[4/5] overflow-hidden rounded-[32px] border border-white/10 bg-gradient-to-br from-[#202020] to-[#090909]">

              <div className="flex h-full items-center justify-center text-center text-[#666666]">

                Imagen del documental
                <br />
                (la reemplazaremos por contenido real)

              </div>

            </div>

          </div>

        </div>

      </div>
    </section>
  );
}