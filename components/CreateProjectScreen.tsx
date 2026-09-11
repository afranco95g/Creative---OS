'use client';

import { FormEvent, useState } from 'react';
import { WorkspaceProject } from '../types/workspace';
import { categoriaDesdeDisciplina, extraerSemilla, SemillaDeProyecto } from '../engines/projectSeedExtractor';

interface CreateProjectScreenProps {
  errorMessage?: string;
  onCancel: () => void;
  onCreate: (
    title: string,
    description: string,
    category: WorkspaceProject['category']
  ) => void;
}

const PROJECT_CATEGORIES: {
  id: WorkspaceProject['category'];
  label: string;
  description: string;
}[] = [
  {
    id: 'cultural',
    label: 'Cultural',
    description: 'Festivales, convocatorias, experiencias y programas culturales.',
  },
  {
    id: 'artistic',
    label: 'Artístico',
    description: 'Películas, música, exposiciones, publicaciones y procesos creativos.',
  },
  {
    id: 'event',
    label: 'Evento',
    description: 'Activaciones, encuentros, lanzamientos, ferias y conciertos.',
  },
  {
    id: 'product',
    label: 'Producto',
    description: 'Marcas, objetos, alimentos, servicios y nuevos productos.',
  },
  {
    id: 'social',
    label: 'Social',
    description: 'Fundaciones, comunidades, programas e iniciativas de impacto.',
  },
  {
    id: 'business',
    label: 'Empresa',
    description: 'Emprendimientos, estudios, organizaciones y nuevos negocios.',
  },
  {
    id: 'other',
    label: 'Otro',
    description: 'Una idea que todavía no encaja en una categoría específica.',
  },
];

export function CreateProjectScreen({
  errorMessage,
  onCancel,
  onCreate,
}: CreateProjectScreenProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [description, setDescription] = useState('');
  const [title, setTitle] = useState('');
  const [category, setCategory] =
    useState<WorkspaceProject['category']>('other');
  const [semilla, setSemilla] = useState<SemillaDeProyecto | null>(null);

  function handleDescriptionSubmit(event: FormEvent) {
    event.preventDefault();

    if (!description.trim()) return;

    const semillaExtraida = extraerSemilla(description);

    setSemilla(semillaExtraida);
    setTitle(semillaExtraida.nombreCandidato?.valor ?? '');
    setCategory(
      categoriaDesdeDisciplina(
        semillaExtraida.disciplinaCandidata?.valor ?? null
      )
    );
    setStep(2);
  }

  const huboExtraccion = Boolean(
    semilla &&
      (semilla.nombreCandidato ||
        semilla.disciplinaCandidata ||
        semilla.lugarCandidato ||
        semilla.intencionCandidata)
  );

  function handleProjectSubmit(event: FormEvent) {
    event.preventDefault();

    if (!title.trim() || !description.trim()) return;

    onCreate(title.trim(), description.trim(), category);
  }

  return (
    <main className="min-h-screen bg-superficie px-8 py-10 text-texto-largo">
      <section className="mx-auto max-w-4xl">
        <button
          type="button"
          onClick={step === 1 ? onCancel : () => setStep(1)}
          className="mb-12 text-sm text-texto-largo transition hover:text-texto-largo"
        >
          ← {step === 1 ? 'Volver al estudio' : 'Volver'}
        </button>

        <p className="text-sm font-bold uppercase tracking-[0.28em] text-texto-principal">
          Nuevo proyecto
        </p>

        {step === 1 ? (
          <form onSubmit={handleDescriptionSubmit}>
            <h1 className="mt-5 text-6xl font-semibold tracking-tight">
              Cuéntame qué quieres construir.
            </h1>

            <p className="mt-6 max-w-3xl text-xl leading-relaxed text-texto-largo">
              No necesitas tener el proyecto organizado. Escríbelo como se lo
              contarías a un productor durante una primera reunión.
            </p>

            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Por ejemplo: quiero crear una marca de gelato artesanal que empiece con activaciones culturales antes de abrir un espacio físico..."
              className="mt-10 min-h-[240px] w-full resize-none rounded-3xl border border-borde bg-superficie-elevada p-7 text-lg leading-relaxed text-texto-largo outline-none transition placeholder:text-texto-largo focus:border-acento"
            />

            <div className="mt-6 flex justify-end">
              <button
                type="submit"
                disabled={!description.trim()}
                className="rounded-full bg-rojo-base px-7 py-3 text-sm font-bold text-hueso transition hover:shadow-stencil disabled:cursor-not-allowed disabled:opacity-40"
              >
                Continuar
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleProjectSubmit}>
            <h1 className="mt-5 text-6xl font-semibold tracking-tight">
              {huboExtraccion
                ? 'Confirmemos lo que entendí.'
                : 'Démosle una primera identidad.'}
            </h1>

            <p className="mt-6 max-w-3xl text-xl leading-relaxed text-texto-largo">
              Esto solo configura el espacio inicial. El Productor Ejecutivo
              seguirá organizando el proyecto contigo.
            </p>

            <label className="mt-10 block">
              <span className="mb-2 block text-xs uppercase tracking-[0.18em] text-texto-largo">
                Nombre provisional
              </span>

              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Charlie Gelato"
                className="w-full rounded-2xl border border-borde bg-superficie-elevada px-5 py-4 text-lg text-texto-largo outline-none transition placeholder:text-texto-largo focus:border-acento"
              />

              {semilla?.nombreCandidato ? (
                <p>Lo tomé de: &quot;{semilla.nombreCandidato.razon}&quot;</p>
              ) : null}
            </label>

            <div className="mt-8">
              <p className="mb-4 text-xs uppercase tracking-[0.18em] text-texto-largo">
                ¿Qué tipo de proyecto se parece más?
              </p>

              {semilla?.disciplinaCandidata ? (
                <p>
                  Lo tomé de: &quot;{semilla.disciplinaCandidata.razon}&quot;
                </p>
              ) : null}

              <div className="grid grid-cols-2 gap-4">
                {PROJECT_CATEGORIES.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setCategory(item.id)}
                    className={`rounded-2xl border p-5 text-left transition ${
                      category === item.id
                        ? 'border-acento bg-superficie'
                        : 'border-borde bg-superficie-elevada hover:border-borde'
                    }`}
                  >
                    <p className="font-semibold text-texto-largo">{item.label}</p>

                    <p className="mt-2 text-sm leading-relaxed text-texto-largo">
                      {item.description}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-8 flex justify-end">
              <button
                type="submit"
                disabled={!title.trim()}
                className="rounded-full bg-rojo-base px-7 py-3 text-sm font-bold text-hueso transition hover:shadow-stencil disabled:cursor-not-allowed disabled:opacity-40"
              >
                Crear Mesa de Producción
              </button>
            </div>

            {errorMessage ? (
              <p className="mt-4 rounded-2xl border border-borde bg-rojo-base px-5 py-4 text-sm text-hueso">
                {errorMessage}
              </p>
            ) : null}
          </form>
        )}
      </section>
    </main>
  );
}
