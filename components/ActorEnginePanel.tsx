'use client';

import { Building2, HandCoins, MapPin, Plus, UserRound, X } from 'lucide-react';
import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';

import { actorEngine, type ActorType } from '../engines/actorEngine';
import type {
  Entity,
  EntityValidationResult,
  EntityVersion,
} from '../core/entities/entity.types';

interface ActorEnginePanelProps {
  userId: string;
}

interface ActorRecord {
  entity: Entity;
  version: EntityVersion | null;
  validation: EntityValidationResult;
}

const actorOptions: Array<{
  type: ActorType;
  label: string;
  description: string;
  icon: typeof UserRound;
}> = [
  {
    type: 'person',
    label: 'Persona',
    description: 'Artista, productor, periodista, gestor o profesional creativo.',
    icon: UserRound,
  },
  {
    type: 'space',
    label: 'Espacio',
    description: 'Taller, galería, estudio, escenario o lugar cultural.',
    icon: MapPin,
  },
  {
    type: 'organization',
    label: 'Organización',
    description: 'Colectivo, empresa, fundación, medio o institución.',
    icon: Building2,
  },
  {
    type: 'funder',
    label: 'Financiador',
    description: 'Marca, fondo, institución o aliado que moviliza recursos.',
    icon: HandCoins,
  },
];

const typeLabels: Record<string, string> = Object.fromEntries(
  actorOptions.map(({ type, label }) => [type, label])
);

export function ActorEnginePanel({ userId }: ActorEnginePanelProps) {
  const [records, setRecords] = useState<ActorRecord[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [actorType, setActorType] = useState<ActorType>('space');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [createdName, setCreatedName] = useState<string | null>(null);

  const refresh = useCallback(() => {
    setRecords(actorEngine.getActorRecordsForUser(userId));
  }, [userId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const totals = useMemo(
    () => ({
      all: records.length,
      ready: records.filter(({ validation }) => validation.valid).length,
      building: records.filter(({ validation }) => !validation.valid).length,
    }),
    [records]
  );

  function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const cleanName = name.trim();

    if (cleanName.length < 2) {
      setError('Escribe un nombre de al menos dos caracteres.');
      return;
    }

    try {
      actorEngine.createActor({
        actorType,
        ownerUserId: userId,
        name: cleanName,
      });

      setCreatedName(cleanName);
      setName('');
      setIsOpen(false);
      refresh();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'No fue posible crear el actor.'
      );
    }
  }

  return (
    <section className="rounded-[36px] border border-[#D9FF00]/20 bg-[#0A0A0A] p-7 md:p-9">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#D9FF00]">
            Actor Engine v1
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-[-0.03em]">
            Actores creados con el nuevo núcleo
          </h2>
          <p className="mt-4 text-sm leading-7 text-[#929292]">
            Esta sección ya trabaja con el Kernel local-first. Los actores se guardan
            en este dispositivo y luego podrán sincronizarse con Supabase cuando
            conectemos la capa de nube.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setError(null);
            setIsOpen(true);
          }}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-[#D9FF00] px-5 py-3 text-sm font-bold text-black transition hover:bg-white"
        >
          <Plus size={17} />
          Crear actor
        </button>
      </div>

      <div className="mt-7 grid gap-3 sm:grid-cols-3">
        <KernelMetric label="Actores locales" value={totals.all} />
        <KernelMetric label="En construcción" value={totals.building} />
        <KernelMetric label="Listos para revisión" value={totals.ready} />
      </div>

      {createdName ? (
        <div className="mt-6 flex items-start justify-between gap-4 rounded-2xl border border-[#D9FF00]/20 bg-[#D9FF00]/5 px-5 py-4">
          <p className="text-sm leading-6 text-[#D9FF00]">
            <strong>{createdName}</strong> fue creado correctamente y ya existe en el Actor Engine.
          </p>
          <button
            type="button"
            onClick={() => setCreatedName(null)}
            aria-label="Cerrar confirmación"
            className="text-[#D9FF00]/60 transition hover:text-[#D9FF00]"
          >
            <X size={17} />
          </button>
        </div>
      ) : null}

      {records.length === 0 ? (
        <div className="mt-7 rounded-3xl border border-dashed border-white/15 bg-white/[0.02] p-8 text-center">
          <p className="text-lg font-semibold">Todavía no hay actores en el nuevo motor</p>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-[#777777]">
            Crea el primero para comprobar el flujo completo: definición → entidad → versión → membresía → capacidades → evento.
          </p>
        </div>
      ) : (
        <div className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {records.map(({ entity, version, validation }) => (
            <article
              key={entity.id}
              className="rounded-3xl border border-white/10 bg-[#111111] p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#777777]">
                    {typeLabels[entity.type] ?? entity.type}
                  </p>
                  <h3 className="mt-2 text-xl font-semibold">
                    {version?.name ?? 'Actor sin nombre'}
                  </h3>
                </div>
                <span className="rounded-full border border-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#A6A6A6]">
                  {entity.status === 'draft' ? 'Borrador' : entity.status}
                </span>
              </div>

              <div className="mt-6">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#777777]">Completitud</span>
                  <span className="font-bold text-[#D9FF00]">{validation.completion}%</span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-[#D9FF00] transition-all"
                    style={{ width: `${validation.completion}%` }}
                  />
                </div>
              </div>

              <p className="mt-5 text-xs leading-5 text-[#686868]">
                {version
                  ? `${Object.keys(version.capabilities).length} capacidades inicializadas · versión ${version.number}`
                  : 'No se encontró una versión editable.'}
              </p>

              <button
                type="button"
                disabled
                title="El Builder se conecta en el siguiente sprint"
                className="mt-5 w-full rounded-full border border-white/10 px-4 py-2.5 text-sm font-semibold text-[#666666]"
              >
                Abrir Builder — siguiente sprint
              </button>
            </article>
          ))}
        </div>
      )}

      {isOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="create-actor-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
        >
          <form
            onSubmit={handleCreate}
            className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-[32px] border border-white/10 bg-[#0B0B0B] p-6 shadow-2xl sm:p-8"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#D9FF00]">
                  Actor Engine
                </p>
                <h3 id="create-actor-title" className="mt-3 text-3xl font-bold">
                  Crear un actor
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="Cerrar"
                className="rounded-full border border-white/10 p-2 text-[#777777] transition hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <fieldset className="mt-8">
              <legend className="text-sm font-semibold">¿Qué vas a representar?</legend>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {actorOptions.map((option) => {
                  const Icon = option.icon;
                  const selected = actorType === option.type;

                  return (
                    <button
                      key={option.type}
                      type="button"
                      onClick={() => setActorType(option.type)}
                      className={[
                        'rounded-2xl border p-4 text-left transition',
                        selected
                          ? 'border-[#D9FF00] bg-[#D9FF00]/8'
                          : 'border-white/10 bg-[#111111] hover:border-white/25',
                      ].join(' ')}
                    >
                      <Icon size={21} className={selected ? 'text-[#D9FF00]' : 'text-[#777777]'} />
                      <p className="mt-3 font-semibold">{option.label}</p>
                      <p className="mt-2 text-xs leading-5 text-[#777777]">
                        {option.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <label className="mt-7 block">
              <span className="text-sm font-semibold">Nombre del actor</span>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Ej. Taller La Tata"
                autoFocus
                className="mt-3 w-full rounded-2xl border border-white/10 bg-[#111111] px-4 py-3.5 text-white outline-none transition placeholder:text-[#4C4C4C] focus:border-[#D9FF00]"
              />
            </label>

            {error ? (
              <p className="mt-4 rounded-2xl border border-red-400/20 bg-red-400/5 px-4 py-3 text-sm text-red-200">
                {error}
              </p>
            ) : null}

            <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-full border border-white/10 px-5 py-3 text-sm font-semibold"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="rounded-full bg-[#D9FF00] px-5 py-3 text-sm font-bold text-black transition hover:bg-white"
              >
                Crear borrador
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </section>
  );
}

function KernelMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#111111] p-4">
      <p className="text-2xl font-bold text-[#D9FF00]">{value}</p>
      <p className="mt-1 text-[10px] uppercase tracking-[0.14em] text-[#777777]">{label}</p>
    </div>
  );
}
