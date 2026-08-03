'use client';

import { ProjectGraph } from '../types/project';
import { mapProjectToAreas } from '../engines/universalProjectMapper';
import { buildAreaNarrative } from '../engines/executiveNarrativeEngine';
import { EcosystemSignalConsent } from './projects/EcosystemSignalConsent';
import { BudgetSuggestion } from './projects/BudgetSuggestion';
import { ProjectReanalysis } from './projects/ProjectReanalysis';

interface ProjectDashboardProps {
  graph: ProjectGraph;
  projectId: string;
  onChange?: (graph: ProjectGraph) => void;
}

const AREA_ICONS: Record<string, string> = {
  direction: '🎯',
  production: '⚙️',
  resources: '💰',
  people: '👥',
  communication: '📣',
  ecosystem: '🤝',
  impact: '📈',
};

export function ProjectDashboard({ graph, projectId, onChange }: ProjectDashboardProps) {
  const areas = mapProjectToAreas(graph);

  return (
    <section className="mx-auto max-w-6xl space-y-10">
      <div>
        <p className="mb-3 text-sm uppercase tracking-[0.25em] text-[#D9FF00]">
          Proyecto
        </p>

        <h1 className="text-5xl font-semibold tracking-tight text-white">
          Áreas del proyecto
        </h1>

        <p className="mt-4 max-w-3xl text-lg leading-relaxed text-[#A6A6A6]">
          Creative OS organiza la información interna del proyecto en áreas de
          trabajo más claras. Cada área combina avance numérico con lectura
          ejecutiva.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-5">
        {areas.map((area) => {
          const narrative = buildAreaNarrative(area);

          return (
            <div
              key={area.id}
              className="rounded-3xl border border-[#232323] bg-[#101010] p-7"
            >
              <div className="mb-5 flex items-start justify-between gap-6">
                <div>
                  <div className="mb-3 text-3xl">
                    {AREA_ICONS[area.id] || '•'}
                  </div>

                  <h3 className="text-2xl font-semibold text-white">
                    {area.title}
                  </h3>

                  <p className="mt-2 text-sm text-[#D9FF00]">
                    {area.question}
                  </p>
                </div>

                <span className="text-2xl font-bold text-[#D9FF00]">
                  {area.score}%
                </span>
              </div>

              <div className="mb-5 h-1.5 overflow-hidden rounded-full bg-[#232323]">
                <div
                  className="h-full rounded-full bg-[#D9FF00]"
                  style={{ width: `${area.score}%` }}
                />
              </div>

              <p className="text-sm leading-relaxed text-[#A6A6A6]">
                {area.description}
              </p>

              <p className="mt-5 text-xs uppercase tracking-[0.18em] text-[#767676]">
                Estado: {getStatusLabel(area.status)}
              </p>

              <div className="mt-5 rounded-2xl border border-[#232323] bg-[#151515] p-4">
                <p className="text-sm leading-relaxed text-white">
                  {narrative.interpretation}
                </p>

                <p className="mt-3 text-xs uppercase tracking-[0.16em] text-[#D9FF00]">
                  Siguiente paso
                </p>

                <p className="mt-1 text-sm leading-relaxed text-[#A6A6A6]">
                  {narrative.nextStep}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <EcosystemSignalConsent projectId={projectId} />
      {onChange ? <ProjectReanalysis graph={graph} onChange={onChange} /> : null}
      <BudgetSuggestion projectId={projectId} budgetContent={graph.modules.budget.content} />
    </section>
  );
}

function getStatusLabel(status: string) {
  if (status === 'solid') return 'Sólida';
  if (status === 'building') return 'En construcción';
  return 'Por construir';
}
