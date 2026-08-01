'use client';

export type EcosystemEntityType =
  | 'person'
  | 'space'
  | 'brand';

export interface EcosystemEntityOption {
  id: string;
  type: EcosystemEntityType;
  name: string;
  description: string;
  badge?: string;
  verified?: boolean;
}

interface EntitySwitcherProps {
  entities: EcosystemEntityOption[];
  selectedEntityId: string;
  onSelect: (entityId: string) => void;
}

const entityTypeLabels: Record<
  EcosystemEntityType,
  string
> = {
  person: 'Perfil personal',
  space: 'Espacio',
  brand: 'Marca u organización',
};

export function EntitySwitcher({
  entities,
  selectedEntityId,
  onSelect,
}: EntitySwitcherProps) {
  return (
    <section
      aria-labelledby="entity-switcher-title"
      className="rounded-[32px] border border-white/10 bg-[#0A0A0A] p-6 md:p-7"
    >
      <div className="flex flex-col gap-3">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#767676]">
          Identidad activa
        </p>

        <h2
          id="entity-switcher-title"
          className="text-2xl font-bold tracking-[-0.03em]"
        >
          ¿Desde dónde quieres gestionar el ecosistema?
        </h2>

        <p className="max-w-3xl text-sm leading-7 text-[#888888]">
          Tu cuenta puede participar como persona y también
          representar espacios, marcas u organizaciones. Elige
          una identidad para ver sus herramientas y su
          información.
        </p>
      </div>

      <div
        className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3"
        role="radiogroup"
        aria-label="Identidades disponibles"
      >
        {entities.map((entity) => {
          const isSelected =
            selectedEntityId === entity.id;

          return (
            <button
              key={`${entity.type}-${entity.id}`}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => onSelect(entity.id)}
              className={[
                'group relative min-h-[150px] rounded-3xl border p-5 text-left transition',
                isSelected
                  ? 'border-[#D9FF00] bg-[#D9FF00]/[0.07]'
                  : 'border-white/10 bg-[#111111] hover:border-white/25',
              ].join(' ')}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p
                    className={[
                      'text-[10px] font-bold uppercase tracking-[0.17em]',
                      isSelected
                        ? 'text-[#D9FF00]'
                        : 'text-[#666666]',
                    ].join(' ')}
                  >
                    {entityTypeLabels[entity.type]}
                  </p>

                  {entity.badge ? (
                    <p className="mt-2 text-xs text-[#777777]">
                      {entity.badge}
                    </p>
                  ) : null}
                </div>

                <span
                  aria-hidden="true"
                  className={[
                    'flex h-6 w-6 items-center justify-center rounded-full border text-xs',
                    isSelected
                      ? 'border-[#D9FF00] bg-[#D9FF00] text-black'
                      : 'border-white/20 text-[#666666]',
                  ].join(' ')}
                >
                  {isSelected ? '✓' : ''}
                </span>
              </div>

              <h3 className="mt-6 text-xl font-bold">
                {entity.name}
              </h3>

              <p className="mt-2 line-clamp-2 text-sm leading-6 text-[#888888]">
                {entity.description}
              </p>

              {entity.verified ? (
                <span className="mt-4 inline-flex rounded-full bg-[#D9FF00] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-black">
                  Verificado
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </section>
  );
}