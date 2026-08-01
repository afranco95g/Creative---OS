'use client';

import { FormEvent, useState } from 'react';
import { WorkspaceProject } from '../types/workspace';

interface CreateProjectScreenProps {
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
  onCancel,
  onCreate,
}: CreateProjectScreenProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [description, setDescription] = useState('');
  const [title, setTitle] = useState('');
  const [category, setCategory] =
    useState<WorkspaceProject['category']>('other');

  function handleDescriptionSubmit(event: FormEvent) {
    event.preventDefault();

    if (!description.trim()) return;

    setStep(2);
  }

  function handleProjectSubmit(event: FormEvent) {
    event.preventDefault();

    if (!title.trim() || !description.trim()) return;

    onCreate(title.trim(), description.trim(), category);
  }

  return (
    <main className="min-h-screen bg-[#050505] px-8 py-10 text-white">
      <section className="mx-auto max-w-4xl">
        <button
          type="button"
          onClick={step === 1 ? onCancel : () => setStep(1)}
          className="mb-12 text-sm text-[#A6A6A6] transition hover:text-white"
        >
          ← {step === 1 ? 'Volver al estudio' : 'Volver'}
        </button>

        <p className="text-sm font-bold uppercase tracking-[0.28em] text-[#D9FF00]">
          Nuevo proyecto
        </p>

        {step === 1 ? (
          <form onSubmit={handleDescriptionSubmit}>
            <h1 className="mt-5 text-6xl font-semibold tracking-tight">
              Cuéntame qué quieres construir.
            </h1>

            <p className="mt-6 max-w-3xl text-xl leading-relaxed text-[#A6A6A6]">
              No necesitas tener el proyecto organizado. Escríbelo como se lo
              contarías a un productor durante una primera reunión.
            </p>

            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Por ejemplo: quiero crear una marca de gelato artesanal que empiece con activaciones culturales antes de abrir un espacio físico..."
              className="mt-10 min-h-[240px] w-full resize-none rounded-3xl border border-[#232323] bg-[#101010] p-7 text-lg leading-relaxed text-white outline-none transition placeholder:text-[#5F5F5F] focus:border-[#D9FF00]"
            />

            <div className="mt-6 flex justify-end">
              <button
                type="submit"
                disabled={!description.trim()}
                className="rounded-full bg-[#D9FF00] px-7 py-3 text-sm font-bold text-black transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                Continuar
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleProjectSubmit}>
            <h1 className="mt-5 text-6xl font-semibold tracking-tight">
              Démosle una primera identidad.
            </h1>

            <p className="mt-6 max-w-3xl text-xl leading-relaxed text-[#A6A6A6]">
              Esto solo configura el espacio inicial. El Productor Ejecutivo
              seguirá organizando el proyecto contigo.
            </p>

            <label className="mt-10 block">
              <span className="mb-2 block text-xs uppercase tracking-[0.18em] text-[#767676]">
                Nombre provisional
              </span>

              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Charlie Gelato"
                className="w-full rounded-2xl border border-[#232323] bg-[#101010] px-5 py-4 text-lg text-white outline-none transition placeholder:text-[#5F5F5F] focus:border-[#D9FF00]"
              />
            </label>

            <div className="mt-8">
              <p className="mb-4 text-xs uppercase tracking-[0.18em] text-[#767676]">
                ¿Qué tipo de proyecto se parece más?
              </p>

              <div className="grid grid-cols-2 gap-4">
                {PROJECT_CATEGORIES.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setCategory(item.id)}
                    className={`rounded-2xl border p-5 text-left transition ${
                      category === item.id
                        ? 'border-[#D9FF00] bg-[#15170A]'
                        : 'border-[#232323] bg-[#101010] hover:border-[#4A4A4A]'
                    }`}
                  >
                    <p className="font-semibold text-white">{item.label}</p>

                    <p className="mt-2 text-sm leading-relaxed text-[#A6A6A6]">
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
                className="rounded-full bg-[#D9FF00] px-7 py-3 text-sm font-bold text-black transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                Crear Mesa de Producción
              </button>
            </div>
          </form>
        )}
      </section>
    </main>
  );
}