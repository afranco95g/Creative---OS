'use client';

import { ProjectGraph, ConversationMessage } from '../types/project';
import { getAllDocumentReadiness } from '../engines/documentEngine';
import { buildProductionUpdate } from '../engines/productionEngine';
import { explainProjectProgress } from '../core/projectEngine';

interface LivingWorkspaceProps {
  graph: ProjectGraph;
  messages: ConversationMessage[];
  progress: number;
}

export function LivingWorkspace({ graph, messages, progress }: LivingWorkspaceProps) {
  const documents = getAllDocumentReadiness(graph).slice(0, 4);
  const production = buildProductionUpdate(graph);
  const recentEvents = graph.eventLog.slice(0, 5);
  const strongModules = Object.values(graph.modules)
    .filter((module) => module.score >= 55)
    .slice(0, 5);
  const weakModules = Object.values(graph.modules)
    .filter((module) => module.score < 55)
    .slice(0, 5);
  const progressExplanation = explainProjectProgress(graph);

  return (
    <aside className="sticky top-12 h-fit max-h-[calc(100vh-96px)] overflow-y-auto rounded-3xl border border-borde bg-superficie-elevada p-6">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-texto-largo">
          Workspace vivo
        </p>

        <h3 className="mt-3 text-2xl font-semibold text-texto-largo">
          {graph.title}
        </h3>
<div className="mt-5 rounded-2xl border border-borde bg-superficie p-4">
  <p className="mb-2 text-xs uppercase tracking-[0.18em] text-texto-largo">
    Productor pensando
  </p>
  <p className="text-sm leading-relaxed text-texto-principal">
    {production.producerThought}
  </p>
</div>
        <div className="mt-5">
          <div className="mb-2 flex justify-between text-xs text-texto-largo">
            <span>Construcción del proyecto</span>
            <span>{progress}%</span>
          </div>

          <div className="h-1.5 rounded-full bg-borde">
            <div
              className="h-full rounded-full bg-rojo-base"
              style={{ width: `${progress}%` }}
            />
          </div>
          <details className="mt-4 rounded-xl border border-borde/10 p-3 text-xs text-texto-largo">
            <summary className="cursor-pointer text-texto-principal">Por qué estás en {progress}%</summary>
            <p className="mt-3"><span className="text-texto-largo">Confirmado:</span> {progressExplanation.confirmed.join(', ') || 'Base inicial'}</p>
            <p className="mt-2"><span className="text-texto-largo">En construcción:</span> {progressExplanation.building.join(', ') || 'Sin módulos intermedios'}</p>
            <p className="mt-2"><span className="text-texto-largo">Pendiente:</span> {progressExplanation.pending.join(', ') || 'Revisión final'}</p>
            <p className="mt-2"><span className="text-texto-largo">Próximo avance:</span> fortalecer {progressExplanation.recommended}.</p>
          </details>
        </div>
      </div>

      <Panel title="Ya quedó organizado">
        {strongModules.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {strongModules.map((module) => (
              <span
                key={module.id}
                className="rounded-full border border-borde bg-superficie-elevada px-3 py-1 text-xs text-emerald-700"
              >
                ✓ {module.title}
              </span>
            ))}
          </div>
        ) : (
          <Empty text="Aún estamos construyendo la base del proyecto." />
        )}
      </Panel>

      <Panel title="Falta fortalecer">
        <div className="space-y-3">
          {weakModules.map((module) => (
            <div key={module.id}>
              <div className="flex justify-between text-xs">
                <span className="text-texto-largo">{module.title}</span>
                <span className="text-texto-largo">{module.score}%</span>
              </div>
              <div className="mt-2 h-1 rounded-full bg-borde">
                <div
                  className="h-full rounded-full bg-rojo-base"
                  style={{ width: `${module.score}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="Documentos vivos">
        <div className="space-y-3">
          {documents.map((item) => (
            <div key={item.definition.id}>
              <div className="flex justify-between text-xs">
                <span className="text-texto-largo">{item.definition.title}</span>
                <span className="text-texto-largo">{item.readiness}%</span>
              </div>
              <div className="mt-2 h-1 rounded-full bg-borde">
                <div
                  className="h-full rounded-full bg-rojo-base"
                  style={{ width: `${item.readiness}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </Panel>

     <Panel title="Última producción">
  {production.recentEvents.length > 0 ? (
    <div className="space-y-3">
      {production.recentEvents.map((event, index) => (
        <div
          key={`${event.title}-${index}`}
          className="rounded-2xl border border-borde bg-superficie p-4"
        >
          <p className="text-sm font-medium text-texto-largo">
            {event.title}
          </p>

          <p className="mt-1 text-xs leading-relaxed text-texto-largo">
            {event.description}
          </p>
        </div>
      ))}
    </div>
  ) : (
    <Empty text="La producción aparecerá aquí cuando el proyecto empiece a avanzar." />
  )}
</Panel>
<Panel title="Tareas creadas">
  {production.createdTasks.length > 0 ? (
    <div className="space-y-2">
      {production.createdTasks.map((task) => (
        <div
          key={task}
          className="rounded-2xl border border-borde bg-superficie px-4 py-3"
        >
          <p className="text-sm text-texto-largo">○ {task}</p>
        </div>
      ))}
    </div>
  ) : (
    <Empty text="Las tareas aparecerán automáticamente cuando el sistema detecte próximos pasos." />
  )}
</Panel>
    </aside>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-8 border-t border-borde pt-6">
      <p className="mb-4 text-xs uppercase tracking-[0.18em] text-texto-largo">
        {title}
      </p>
      {children}
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="text-sm leading-relaxed text-texto-largo">{text}</p>;
}
