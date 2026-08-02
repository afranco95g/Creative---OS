export function AboutSection() {
  return (
    <section className="border-t border-white/10 bg-[#050505]">
      <div className="mx-auto max-w-7xl px-10 py-32">

        <p className="text-sm font-bold tracking-[0.35em] uppercase text-[#D9FF00]">
          ¿QUÉ ES CULTURA ESTA?
        </p>

        <h2 className="mt-8 max-w-5xl text-6xl font-bold leading-tight text-white">
          Una infraestructura para descubrir,
          conectar y producir cultura.
        </h2>

        <p className="mt-10 max-w-4xl text-2xl leading-relaxed text-[#9A9A9A]">
          Cultura Esta no es solamente un medio,
          una comunidad o una plataforma.

          Es una infraestructura que conecta
          personas, espacios, experiencias,
          financiadores y tecnología para fortalecer
          el ecosistema creativo.
        </p>

        <div className="mt-24 grid gap-8 lg:grid-cols-3">

          <div className="rounded-[28px] border border-[#252525] p-8">
            <p className="text-[#D9FF00] font-bold uppercase tracking-[0.3em]">
              DESCUBRIR
            </p>

            <h3 className="mt-5 text-3xl font-semibold text-white">
              El Medio
            </h3>

            <p className="mt-5 text-[#909090] leading-relaxed">
              Historias, agenda,
              convocatorias,
              entrevistas,
              documentales
              y contenidos editoriales.
            </p>
          </div>

          <div className="rounded-[28px] border border-[#252525] p-8">

            <p className="text-[#D9FF00] font-bold uppercase tracking-[0.3em]">
              CONECTAR
            </p>

            <h3 className="mt-5 text-3xl font-semibold text-white">
              El Ecosistema
            </h3>

            <p className="mt-5 text-[#909090] leading-relaxed">
              Personas,
              organizaciones,
              espacios,
              marcas
              y oportunidades
              conectadas.
            </p>

          </div>

          <div className="rounded-[28px] border border-[#252525] p-8">

            <p className="text-[#D9FF00] font-bold uppercase tracking-[0.3em]">
              PRODUCIR
            </p>

            <h3 className="mt-5 text-3xl font-semibold text-white">
              Creative OS
            </h3>

            <p className="mt-5 text-[#909090] leading-relaxed">
              La infraestructura tecnológica
              que convierte conversaciones
              en proyectos,
              documentos,
              cronogramas
              y experiencias.
            </p>

          </div>

        </div>

      </div>
    </section>
  );
}