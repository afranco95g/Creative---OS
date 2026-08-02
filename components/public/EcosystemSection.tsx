export function EcosystemSection() {
  return (
    <section
      id="ecosistema"
      className="border-t border-white/10 bg-[#080808] text-white"
    >
      <div className="mx-auto max-w-7xl px-10 py-32">
        <div className="grid gap-16 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.32em] text-[#D9FF00]">
              EL ECOSISTEMA
            </p>

            <h2 className="mt-6 text-5xl font-bold leading-tight">
              Cuatro nodos.
              <br />
              Una infraestructura
              <br />
              para conectarlos.
            </h2>

            <p className="mt-8 max-w-xl text-lg leading-relaxed text-[#999999]">
              Cultura Esta organiza el ecosistema alrededor del
              Medio, las Personas, los Espacios y los
              Financiadores. La tecnología permite que estos
              actores creen proyectos, experiencias,
              oportunidades y nuevas formas de circulación de
              valor.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <article className="rounded-[28px] border border-[#242424] bg-[#0D0D0D] p-7">
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#D9FF00]">
                01 · MEDIO
              </p>

              <h3 className="mt-5 text-2xl font-semibold">
                Descubrir y contar.
              </h3>

              <p className="mt-4 leading-relaxed text-[#8D8D8D]">
                Historias, artículos, entrevistas,
                documentales, fotohistorias, agenda y
                convocatorias que hacen visible lo que sucede.
              </p>
            </article>

            <article className="rounded-[28px] border border-[#242424] bg-[#0D0D0D] p-7">
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#D9FF00]">
                02 · PERSONAS
              </p>

              <h3 className="mt-5 text-2xl font-semibold">
                Crear y colaborar.
              </h3>

              <p className="mt-4 leading-relaxed text-[#8D8D8D]">
                Artistas, productores, gestores,
                comunicadores, periodistas, técnicos y
                creadores con capacidades e intereses propios.
              </p>
            </article>

            <article className="rounded-[28px] border border-[#242424] bg-[#0D0D0D] p-7">
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#D9FF00]">
                03 · ESPACIOS
              </p>

              <h3 className="mt-5 text-2xl font-semibold">
                Hacer posible.
              </h3>

              <p className="mt-4 leading-relaxed text-[#8D8D8D]">
                Talleres, estudios, galerías, laboratorios,
                residencias y lugares con infraestructura,
                servicios y programación.
              </p>
            </article>

            <article className="rounded-[28px] border border-[#242424] bg-[#0D0D0D] p-7">
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#D9FF00]">
                04 · FINANCIADORES
              </p>

              <h3 className="mt-5 text-2xl font-semibold">
                Activar oportunidades.
              </h3>

              <p className="mt-4 leading-relaxed text-[#8D8D8D]">
                Marcas, instituciones, convocatorias,
                inversionistas y aliados que aportan capital,
                productos, recursos y conexiones.
              </p>
            </article>
          </div>
        </div>

        <div className="mt-16 rounded-[32px] border border-[#2B3500] bg-[#111700] p-8">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#D9FF00]">
            INFRAESTRUCTURA TECNOLÓGICA
          </p>

          <p className="mt-4 max-w-4xl text-2xl leading-relaxed">
            No es un quinto nodo. Es el brazo que permite
            estructurar proyectos, conectar actores, producir
            experiencias, organizar oportunidades y medir el
            valor que circula por el ecosistema.
          </p>
        </div>
      </div>
    </section>
  );
}