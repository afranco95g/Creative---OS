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
    <main className="relative flex min-h-screen overflow-hidden bg-superficie px-8 py-10 text-texto-largo">
      <section className="relative mx-auto flex w-full max-w-7xl flex-col justify-between">
        <header className="flex items-center justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.3em] text-texto-principal">
              Creative OS
            </p>

            <p className="mt-2 text-xs text-texto-largo">
              Sistema operativo para productores creativos.
            </p>
          </div>

          {hasUser && (
            <button
              type="button"
              onClick={onEnterStudio}
              className="rounded-full border border-borde bg-superficie-elevada px-5 py-2.5 text-sm text-texto-largo transition hover:border-acento"
            >
              Entrar al estudio
            </button>
          )}
        </header>

        <div className="grid flex-1 items-center gap-16 py-20 lg:grid-cols-[1.15fr_0.85fr]">
          <div>
            <p className="mb-5 text-sm uppercase tracking-[0.24em] text-texto-largo">
              Ideas → proyectos → producción
            </p>

            <h1 className="max-w-5xl text-6xl font-semibold leading-[0.98] tracking-tight md:text-8xl">
              Construye proyectos con la claridad de un
              <span className="text-texto-principal"> Productor Ejecutivo.</span>
            </h1>

            <p className="mt-8 max-w-2xl text-xl leading-relaxed text-texto-largo">
              Creative OS convierte conversaciones en dirección, tareas,
              documentos, cronogramas y siguientes pasos visibles.
            </p>

            <div className="mt-10 flex flex-wrap gap-4">
              {hasUser ? (
                <button
                  type="button"
                  onClick={onEnterStudio}
                  className="rounded-full bg-rojo-base px-7 py-3.5 text-sm font-bold text-hueso transition hover:shadow-stencil"
                >
                  Continuar como {userName || 'Productor'}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onStart}
                  className="rounded-full bg-rojo-base px-7 py-3.5 text-sm font-bold text-hueso transition hover:shadow-stencil"
                >
                  Crear mi estudio
                </button>
              )}

              <a
                href="#como-funciona"
                className="rounded-full border border-borde bg-superficie-elevada px-7 py-3.5 text-sm font-semibold text-texto-largo transition hover:border-acento"
              >
                Ver cómo funciona
              </a>
            </div>
          </div>

          <div className="rounded-[32px] border border-borde bg-superficie-elevada p-7 shadow-2xl">
            <p className="text-xs uppercase tracking-[0.2em] text-texto-largo">
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

            <div className="mt-6 rounded-2xl border border-borde bg-superficie p-5">
              <p className="text-xs uppercase tracking-[0.18em] text-texto-principal">
                Productor Ejecutivo
              </p>

              <p className="mt-3 text-sm leading-relaxed text-texto-largo">
                Tu proyecto tiene una dirección clara. El siguiente frente
                debería ser estructurar la producción y los recursos mínimos.
              </p>
            </div>
          </div>
        </div>

        <section
          id="como-funciona"
          className="grid gap-5 border-t border-borde py-10 md:grid-cols-3"
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
    <div className="rounded-2xl border border-borde bg-superficie-elevada p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-texto-largo">
            {label}
          </p>

          <p className="mt-2 text-sm leading-relaxed text-texto-largo">
            {title}
          </p>
        </div>

        <span className="text-lg font-bold text-texto-principal">
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
    <div className="rounded-2xl border border-borde bg-superficie-elevada p-6">
      <p className="text-xs font-bold text-texto-principal">{number}</p>

      <h2 className="mt-5 text-xl font-semibold">{title}</h2>

      <p className="mt-3 text-sm leading-relaxed text-texto-largo">
        {description}
      </p>
    </div>
  );
}