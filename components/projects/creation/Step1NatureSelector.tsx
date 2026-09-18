'use client';

import { NATURE_OPTIONS } from './steps';
import type { ProjectNature } from './steps';

interface Step1NatureSelectorProps {
  selected: ProjectNature | null;
  onSelect: (nature: ProjectNature) => void;
}

export function Step1NatureSelector({
  selected,
  onSelect,
}: Step1NatureSelectorProps) {
  return (
    <section className="max-w-3xl">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-neutral-500">
        Primer paso
      </p>

      <h2 className="mt-4 text-4xl font-black tracking-[-0.04em] sm:text-5xl">
        ¿Qué vas a crear?
      </h2>

      <p className="mt-5 max-w-2xl text-lg leading-8 text-neutral-400">
        Elige qué se va a producir, operativamente. Todo lo demás —
        visión, presupuesto, equipo — lo construyes después, en
        conversación.
      </p>

      <div className="mt-10 grid gap-4 md:grid-cols-2">
        {NATURE_OPTIONS.map((option) => {
          const isSelected = selected === option.id;

          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onSelect(option.id)}
              className={`group min-h-44 rounded-3xl border p-6 text-left transition ${
                isSelected
                  ? 'border-white bg-white/[0.09]'
                  : 'border-white/10 bg-white/[0.035] hover:border-white/30 hover:bg-white/[0.07]'
              }`}
            >
              <div className="flex h-full flex-col">
                <h3 className="text-2xl font-bold tracking-tight">
                  {option.label}
                </h3>

                <p className="mt-3 flex-1 text-sm leading-6 text-neutral-400">
                  {option.description}
                </p>

                <span className="mt-6 text-sm font-semibold text-neutral-200 transition group-hover:translate-x-1">
                  {isSelected ? 'Seleccionado ✓' : 'Seleccionar →'}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
