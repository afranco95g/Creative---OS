'use client';

interface LandingScreenProps {
  hasUser: boolean;
  userName?: string;
  onEnterStudio: () => void;
  onStart: () => void;
}

export function LandingScreen({
  hasUser,
  userName,
  onEnterStudio,
  onStart,
}: LandingScreenProps) {
  return (
    <main className="relative flex min-h-screen overflow-hidden bg-[#050505] px-8 py-10 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(217,255,0,0.08),transparent_30%)]" />

      <section className="relative mx-auto flex w-full max-w-7xl flex-col justify-between">
        <header className="flex items-center justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.3em] text-[#D9FF00]">
              Creative OS
            </p>

            <p className="mt-2 text-xs text-[#767676]">
              Sistema operativo para productores creativos.
            </p>
          </div>

          {hasUser && (
            <button
              type="button"
              onClick={onEnterStudio}
              className="rounded-full border border-[#333333] bg-[#101010] px-5 py-2.5 text-sm text-white transition hover:border-[#D9FF00]"
            >
              Entrar al estudio
            </button>
          )}
        </header>

        <div className="grid flex-1 items-center gap-16 py-20 lg:grid-cols-[1.15fr_0.85fr]">
          <div>
            <p className="mb-5 text-sm uppercase tracking-[0.24em] text-[#767676]">
              Ideas → proyectos → producción
            </p>

            <h1 className="max-w-5xl text-6xl font-semibold leading-[0.98] tracking-tight md:text-8xl">
              Construye proyectos con la claridad de un
              <span className="text-[#D9FF00]"> Productor Ejecutivo.</span>
            </h1>

            <p className="mt-8 max-w-2xl text-xl leading-relaxed text-[#A6A6A6]">
              Creative OS convierte conversaciones en dirección, tareas,
              documentos, cronogramas y siguientes pasos visibles.
            </p>

            <div className="mt-10 flex flex-wrap gap-4">
              {hasUser ? (
                <button
                  type="button"
                  onClick={onEnterStudio}
                  className="rounded-full bg-[#D9FF00] px-7 py-3.5 text-sm font-bold text-black transition hover:bg-white"
                >
                  Continuar como {userName || 'Productor'}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onStart}
                  className="rounded-full bg-[#D9FF00] px-7 py-3.5 text-sm font-bold text-black transition hover:bg-white"
                >
                  Crear mi estudio
                </button>
              )}

              <a
                href="#como-funciona"
                className="rounded-full border border-[#333333] bg-[#101010] px-7 py-3.5 text-sm font-semibold text-white transition hover:border-[#D9FF00]"
              >
                Ver cómo funciona
              </a>
            </div>
          </div>

          <div className="rounded-[32px] border border-[#232323] bg-[#0D0D0D] p-7 shadow-2xl">
            <p className="text-xs uppercase tracking-[0.2em] text-[#767676]">
              Tu estudio hoy
            </p>

            <div className="mt-6 space-y-4">
              <PreviewCard
                label="Dirección"
                title="Aclara qué estás construyendo"
                progress="82%"
              />

              <PreviewCard
                label="Producción"
                title="Convierte ideas en tareas y cronogramas"
                progress="46%"
              />

              <PreviewCard
                label="Recursos"
                title="Identifica costos, aliados y necesidades"
                progress="28%"
              />
            </div>

            <div className="mt-6 rounded-2xl border border-[#283000] bg-[#151A08] p-5">
              <p className="text-xs uppercase tracking-[0.18em] text-[#D9FF00]">
                Productor Ejecutivo
              </p>

              <p className="mt-3 text-sm leading-relaxed text-white">
                Tu proyecto tiene una dirección clara. El siguiente frente
                debería ser estructurar la producción y los recursos mínimos.
              </p>
            </div>
          </div>
        </div>

        <section
          id="como-funciona"
          className="grid gap-5 border-t border-[#1D1D1D] py-10 md:grid-cols-3"
        >
          <Feature
            number="01"
            title="Conversar"
            description="Cuéntale tu idea al Productor Ejecutivo sin llenar formularios."
          />

          <Feature
            number="02"
            title="Organizar"
            description="Creative OS estructura áreas, tareas, documentos y decisiones."
          />

          <Feature
            number="03"
            title="Producir"
            description="Visualiza qué falta, qué sigue y cómo hacer avanzar el proyecto."
          />
        </section>
      </section>
    </main>
  );
}

interface PreviewCardProps {
  label: string;
  title: string;
  progress: string;
}

function PreviewCard({
  label,
  title,
  progress,
}: PreviewCardProps) {
  return (
    <div className="rounded-2xl border border-[#232323] bg-[#121212] p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-[#767676]">
            {label}
          </p>

          <p className="mt-2 text-sm leading-relaxed text-white">
            {title}
          </p>
        </div>

        <span className="text-lg font-bold text-[#D9FF00]">
          {progress}
        </span>
      </div>
    </div>
  );
}

interface FeatureProps {
  number: string;
  title: string;
  description: string;
}

function Feature({
  number,
  title,
  description,
}: FeatureProps) {
  return (
    <div className="rounded-2xl border border-[#1D1D1D] bg-[#0A0A0A] p-6">
      <p className="text-xs font-bold text-[#D9FF00]">{number}</p>

      <h2 className="mt-5 text-xl font-semibold">{title}</h2>

      <p className="mt-3 text-sm leading-relaxed text-[#8A8A8A]">
        {description}
      </p>
    </div>
  );
}