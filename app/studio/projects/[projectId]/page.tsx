'use client';

import Link from 'next/link';
import {
  useParams,
  useRouter,
} from 'next/navigation';
import {
  useEffect,
  useState,
  useSyncExternalStore,
} from 'react';

import { ProjectToolsPanel } from '@/components/ProjectToolsPanel';

import {
  ProducerChat,
} from '@/components/ProducerChat';

import {
  ProjectDashboard,
} from '@/components/ProjectDashboard';

import {
  Sidebar,
} from '@/components/Sidebar';

import type {
  AppView,
} from '@/components/Sidebar';

import {
  projectStore,
} from '@/core/projectStore';

import type {
  ProjectStoreSnapshot,
} from '@/core/projectStore';

import {
  workspaceStore,
} from '@/core/workspaceStore';
import { cloudProjectToWorkspaceProject, loadFullCloudProject } from '@/services/projects/projectCloudService';
import { buildExecutiveActionPlan } from '@/engines/executiveReviewEngine';

import type {
  ProjectGraph,
  ProjectModule,
  ProjectStage,
} from '@/types/project';

import type {
  WorkspaceState,
} from '@/types/workspace';

const STAGE_LABELS: Record<
  ProjectStage,
  string
> = {
  idea: 'Idea',
  exploration: 'Exploración',
  structuring: 'Estructuración',
  validation: 'Validación',
  human_review: 'Revisión humana',
  ready_to_present: 'Listo para presentar',
  activation: 'Activación',
  execution: 'Ejecución',
  follow_up: 'Seguimiento',
  closed: 'Cerrado',
  learning: 'Aprendizaje',
};

export default function ProjectPage() {
  const router = useRouter();

  const params = useParams<{
    projectId: string;
  }>();

  const projectId = params.projectId;

  const workspaceState =
    useSyncExternalStore<WorkspaceState | null>(
      (listener) =>
        workspaceStore.subscribe(
          () => listener()
        ),
      () =>
        workspaceStore.getSnapshot(),
      () => null
    );

  const projectSnapshot =
    useSyncExternalStore<ProjectStoreSnapshot | null>(
      (listener) =>
        projectStore.subscribe(
          () => listener()
        ),
      () =>
        projectStore.getSnapshot(),
      () => null
    );

  const [
    activeView,
    setActiveView,
  ] = useState<AppView>('producer');

  const [
    loadedProjectId,
    setLoadedProjectId,
  ] = useState<string | null>(null);
  const [cloudLoadAttempted, setCloudLoadAttempted] = useState(false);
  const [cloudLoadError, setCloudLoadError] = useState('');

  const project =
    workspaceState?.projects.find(
      (currentProject) =>
        currentProject.id === projectId
    ) ?? null;

  useEffect(() => {
    if (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('view') === 'diagnosis') setActiveView('diagnosis');
  }, []);

  useEffect(() => {
    if (project || !workspaceState?.user || cloudLoadAttempted) return;
    setCloudLoadAttempted(true);
    void loadFullCloudProject(projectId)
      .then((cloudProject) => workspaceStore.mergeCloudProjects([cloudProjectToWorkspaceProject(cloudProject)]))
      .catch((error: unknown) => setCloudLoadError(error instanceof Error ? error.message : 'No fue posible recuperar el proyecto.'));
  }, [project, projectId, workspaceState?.user, cloudLoadAttempted]);

  /*
   * Carga en ProjectStore el grafo y la conversación
   * guardados dentro del Workspace.
   */
  useEffect(() => {
    if (!project) {
      return;
    }

    if (
      loadedProjectId === project.id
    ) {
      return;
    }

    projectStore.loadProject(
      project.graph,
      project.messages
    );

    workspaceStore.selectProject(
      project.id
    );

    setLoadedProjectId(
      project.id
    );
  }, [
    project,
    loadedProjectId,
  ]);

  /*
   * Guarda automáticamente en Workspace cada cambio
   * realizado por el Productor Ejecutivo.
   */
  useEffect(() => {
    if (!projectSnapshot) {
      return;
    }

    if (
      loadedProjectId !== projectId
    ) {
      return;
    }

    workspaceStore.updateProjectState(
      projectId,
      projectSnapshot.graph,
      projectSnapshot.messages
    );
  }, [
    projectId,
    loadedProjectId,
    projectSnapshot,
  ]);

  function handleBackToWorkspace() {
    router.push('/studio');
  }

  function handleSendMessage(
    message: string
  ) {
    projectStore.sendMessage(
      message
    );
  }

  if (!workspaceState) {
    return <ProjectLoading />;
  }

  if (!project) {
    if (workspaceState.user && !cloudLoadAttempted) return <ProjectLoading />;
    return <ProjectNotFound message={cloudLoadError} />;
  }

  if (
    !projectSnapshot ||
    loadedProjectId !== project.id
  ) {
    return (
      <main className="min-h-screen bg-[#050505] px-8 py-12 text-white">
        <div className="mx-auto max-w-5xl">
          <p className="text-sm uppercase tracking-[0.2em] text-[#767676]">
            Creative OS
          </p>

          <h1 className="mt-4 text-4xl font-semibold">
            Cargando {project.title}...
          </h1>
        </div>
      </main>
    );
  }

  const {
    graph,
    messages,
    progress,
  } = projectSnapshot;

  return (
    <div className="flex min-h-screen bg-[#050505] text-white">
      <Sidebar
        activeView={activeView}
        setActiveView={setActiveView}
        graph={graph}
        progress={progress}
        onBackToWorkspace={
          handleBackToWorkspace
        }
      />

      <main className="min-w-0 flex-1 overflow-x-hidden">
        <ProjectHeader
          graph={graph}
          description={
            project.description
          }
          progress={progress}
        />

        <div className="px-8 py-10">
          {activeView ===
            'producer' && (
            <ProducerChat
              graph={graph}
              messages={messages}
              progress={progress}
              onSendMessage={
                handleSendMessage
              }
            />
          )}

          {activeView ===
            'project' && (
            <ProjectDashboard
              graph={graph}
              projectId={projectId}
              onChange={(nextGraph) => projectStore.replaceGraph(nextGraph)}
            />
          )}

          {activeView ===
            'documents' && (
            <ProjectToolsPanel graph={graph} onChange={(nextGraph) => projectStore.replaceGraph(nextGraph)} />
          )}

          {activeView ===
            'diagnosis' && (
            <ExecutiveReview
              graph={graph}
              progress={progress}
            />
          )}

          {activeView ===
            'log' && (
            <LivingLog
              graph={graph}
            />
          )}
        </div>
      </main>
    </div>
  );
}

interface ProjectHeaderProps {
  graph: ProjectGraph;
  description: string;
  progress: number;
}

function ProjectHeader({
  graph,
  description,
  progress,
}: ProjectHeaderProps) {
  return (
    <header className="border-b border-[#232323] bg-[#080808] px-8 py-6">
      <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#767676]">
            Mesa de Producción
          </p>

          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">
            {graph.title}
          </h1>

          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[#A6A6A6]">
            {description ||
              'Proyecto sin descripción inicial.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-full border border-[#333333] bg-[#101010] px-4 py-2 text-xs text-[#A6A6A6]">
            {
              STAGE_LABELS[
                graph.stage
              ]
            }
          </span>

          <span className="rounded-full bg-[#D9FF00] px-4 py-2 text-xs font-bold text-black">
            {progress}% construido
          </span>
        </div>
      </div>
    </header>
  );
}

interface ExecutiveReviewProps {
  graph: ProjectGraph;
  progress: number;
}

function ExecutiveReview({
  graph,
  progress,
}: ExecutiveReviewProps) {
  const modules =
    Object.values(
      graph.modules
    );

  const strongestModules = [
    ...modules,
  ]
    .sort(
      (firstModule, secondModule) =>
        secondModule.score -
        firstModule.score
    )
    .slice(0, 5);

  const priorityModules = [
    ...modules,
  ]
    .sort(
      (firstModule, secondModule) =>
        firstModule.score -
        secondModule.score
    )
    .slice(0, 6);

  const pendingTasks =
    graph.tasks.filter(
      (task) =>
        task.status !== 'done'
    );

  const openRisks =
    graph.risks.filter(
      (risk) =>
        risk.status === 'open'
    );
  const actionPlan = buildExecutiveActionPlan(graph);

  return (
    <section className="mx-auto max-w-6xl space-y-10">
      <header>
        <p className="text-sm uppercase tracking-[0.25em] text-[#D9FF00]">
          Executive Review
        </p>

        <h2 className="mt-3 text-5xl font-semibold tracking-tight">
          Lectura ejecutiva del proyecto
        </h2>

        <p className="mt-4 max-w-3xl text-lg leading-relaxed text-[#A6A6A6]">
          Esta revisión organiza el nivel de preparación,
          las fortalezas, los vacíos y las prioridades
          detectadas a partir de la información actual.
        </p>
      </header>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <ReviewMetric
          label="Construcción"
          value={`${progress}%`}
          description="Promedio de avance de los módulos."
        />

        <ReviewMetric
          label="Etapa"
          value={
            STAGE_LABELS[
              graph.stage
            ]
          }
          description="Momento actual del proyecto."
        />

        <ReviewMetric
          label="Tareas pendientes"
          value={String(
            pendingTasks.length
          )}
          description="Acciones todavía abiertas."
        />

        <ReviewMetric
          label="Riesgos abiertos"
          value={String(
            openRisks.length
          )}
          description="Riesgos que requieren atención."
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <ReviewColumn
          eyebrow="Fortalezas actuales"
          title="Lo que ya tiene estructura"
          modules={strongestModules}
          emptyMessage="Todavía no hay módulos suficientemente desarrollados."
        />

        <ReviewColumn
          eyebrow="Prioridades"
          title="Lo que debe fortalecerse"
          modules={priorityModules}
          emptyMessage="No hay prioridades pendientes."
        />
      </div>

      <section className="rounded-3xl border border-[#232323] bg-[#101010] p-7">
        <p className="text-xs uppercase tracking-[0.2em] text-[#767676]">Plan del Productor Ejecutivo</p>
        <h3 className="mt-3 text-2xl font-semibold">Acciones justificadas según la etapa</h3>
        <div className="mt-6 space-y-4">{actionPlan.map((item)=><article key={item.id} className="rounded-2xl border border-white/10 bg-[#151515] p-5"><div className="flex justify-between gap-4"><strong>Prioridad {item.priority}: {item.action}</strong><span className="text-xs uppercase text-[#D9FF00]">{graph.modules[item.area].title}</span></div><p className="mt-3 text-sm text-[#aaa]"><b className="text-white">Por qué:</b> {item.reason}</p><p className="mt-2 text-sm text-[#aaa]"><b className="text-white">Resultado esperado:</b> {item.expectedResult}</p><p className="mt-2 text-xs text-[#777]">Dependencia: {item.dependency} · Responsable sugerido: {item.owner} · Estado: {item.status}</p></article>)}</div>
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-3xl border border-[#232323] bg-[#101010] p-7">
          <p className="text-xs uppercase tracking-[0.2em] text-[#767676]">
            Próximas acciones
          </p>

          <h3 className="mt-3 text-2xl font-semibold">
            Tareas abiertas
          </h3>

          {pendingTasks.length === 0 ? (
            <EmptyReviewState text="Todavía no hay tareas automáticas pendientes." />
          ) : (
            <div className="mt-6 space-y-3">
              {pendingTasks
                .slice(0, 6)
                .map((task) => (
                  <article
                    key={task.id}
                    className="rounded-2xl border border-[#232323] bg-[#151515] p-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-medium text-white">
                          {task.title}
                        </p>

                        <p className="mt-2 text-sm leading-relaxed text-[#A6A6A6]">
                          {task.description}
                        </p>
                      </div>

                      <span className="shrink-0 rounded-full border border-[#333333] px-3 py-1 text-[10px] uppercase text-[#A6A6A6]">
                        {
                          task.urgency
                        }
                      </span>
                    </div>
                  </article>
                ))}
            </div>
          )}
        </section>

        <section className="rounded-3xl border border-[#232323] bg-[#101010] p-7">
          <p className="text-xs uppercase tracking-[0.2em] text-[#767676]">
            Riesgos
          </p>

          <h3 className="mt-3 text-2xl font-semibold">
            Alertas del proyecto
          </h3>

          {openRisks.length === 0 ? (
            <EmptyReviewState text="No hay riesgos abiertos registrados." />
          ) : (
            <div className="mt-6 space-y-3">
              {openRisks
                .slice(0, 6)
                .map((risk) => (
                  <article
                    key={risk.id}
                    className="rounded-2xl border border-[#4A3216] bg-[#201608] p-4"
                  >
                    <p className="font-medium text-[#FFC857]">
                      {risk.title}
                    </p>

                    <p className="mt-2 text-sm leading-relaxed text-[#D4B878]">
                      {
                        risk.mitigationPlan
                      }
                    </p>

                    <div className="mt-3 flex gap-2 text-[10px] uppercase tracking-[0.12em] text-[#A98A49]">
                      <span>
                        Probabilidad:{' '}
                        {
                          risk.probability
                        }
                      </span>

                      <span>·</span>

                      <span>
                        Impacto:{' '}
                        {risk.impact}
                      </span>
                    </div>
                  </article>
                ))}
            </div>
          )}
        </section>
      </div>
    </section>
  );
}

interface ReviewMetricProps {
  label: string;
  value: string;
  description: string;
}

function ReviewMetric({
  label,
  value,
  description,
}: ReviewMetricProps) {
  return (
    <article className="rounded-3xl border border-[#232323] bg-[#101010] p-6">
      <p className="text-xs uppercase tracking-[0.18em] text-[#767676]">
        {label}
      </p>

      <p className="mt-4 text-3xl font-semibold text-[#D9FF00]">
        {value}
      </p>

      <p className="mt-3 text-sm leading-relaxed text-[#A6A6A6]">
        {description}
      </p>
    </article>
  );
}

interface ReviewColumnProps {
  eyebrow: string;
  title: string;
  modules: ProjectModule[];
  emptyMessage: string;
}

function ReviewColumn({
  eyebrow,
  title,
  modules,
  emptyMessage,
}: ReviewColumnProps) {
  return (
    <section className="rounded-3xl border border-[#232323] bg-[#101010] p-7">
      <p className="text-xs uppercase tracking-[0.2em] text-[#767676]">
        {eyebrow}
      </p>

      <h3 className="mt-3 text-2xl font-semibold">
        {title}
      </h3>

      {modules.length === 0 ? (
        <EmptyReviewState
          text={emptyMessage}
        />
      ) : (
        <div className="mt-6 space-y-4">
          {modules.map((module) => (
            <article
              key={module.id}
              className="rounded-2xl border border-[#232323] bg-[#151515] p-4"
            >
              <div className="flex items-center justify-between gap-5">
                <div>
                  <p className="font-medium text-white">
                    {module.title}
                  </p>

                  <p className="mt-1 text-xs text-[#767676]">
                    {module.description}
                  </p>
                </div>

                <span className="text-lg font-semibold text-[#D9FF00]">
                  {module.score}%
                </span>
              </div>

              <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-[#232323]">
                <div
                  className="h-full rounded-full bg-[#D9FF00]"
                  style={{
                    width: `${module.score}%`,
                  }}
                />
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function EmptyReviewState({
  text,
}: {
  text: string;
}) {
  return (
    <p className="mt-6 rounded-2xl border border-dashed border-[#333333] p-5 text-sm leading-relaxed text-[#767676]">
      {text}
    </p>
  );
}

function LivingLog({
  graph,
}: {
  graph: ProjectGraph;
}) {
  const events =
    graph.eventLog;

  return (
    <section className="mx-auto max-w-5xl space-y-10">
      <header>
        <p className="text-sm uppercase tracking-[0.25em] text-[#D9FF00]">
          Bitácora Viva
        </p>

        <h2 className="mt-3 text-5xl font-semibold tracking-tight">
          Historia del proyecto
        </h2>

        <p className="mt-4 max-w-3xl text-lg leading-relaxed text-[#A6A6A6]">
          Aquí queda registrado cómo la conversación
          modifica módulos, genera decisiones y fortalece
          la estructura del proyecto.
        </p>
      </header>

      {events.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-[#333333] bg-[#080808] p-10">
          <h3 className="text-2xl font-semibold">
            Todavía no hay movimientos
          </h3>

          <p className="mt-3 max-w-2xl text-[#A6A6A6]">
            Conversa con el Productor Ejecutivo para
            comenzar a construir la bitácora.
          </p>
        </div>
      ) : (
        <div className="relative space-y-5 pl-9 before:absolute before:bottom-0 before:left-3 before:top-0 before:w-px before:bg-[#D9FF00]/40">
          {events.map((event) => (
            <article
              key={event.id}
              className="relative rounded-3xl border border-[#232323] bg-[#101010] p-6 before:absolute before:-left-[31px] before:top-7 before:h-4 before:w-4 before:rounded-full before:bg-[#D9FF00]"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.16em] text-[#767676]">
                    {event.type.replaceAll(
                      '_',
                      ' '
                    )}
                  </p>

                  <h3 className="mt-2 text-xl font-semibold">
                    {event.title}
                  </h3>
                </div>

                <time className="text-xs text-[#767676]">
                  {new Date(
                    event.createdAt
                  ).toLocaleString(
                    'es-CO'
                  )}
                </time>
              </div>

              <p className="mt-4 text-sm leading-relaxed text-[#A6A6A6]">
                {event.description}
              </p>
            </article>
          ))}
        </div>
      )}

      <Link
        href="/studio"
        className="inline-flex text-sm font-semibold text-[#D9FF00]"
      >
        ← Volver al Executive Workspace
      </Link>
    </section>
  );
}

function ProjectLoading() {
  return (
    <main className="min-h-screen bg-[#050505] px-8 py-12 text-white">
      <div className="mx-auto max-w-6xl">
        <div className="h-5 w-40 animate-pulse rounded bg-[#232323]" />

        <div className="mt-5 h-14 w-2/3 animate-pulse rounded bg-[#151515]" />

        <div className="mt-10 grid gap-6 lg:grid-cols-[280px_1fr]">
          <div className="h-[700px] animate-pulse rounded-3xl bg-[#101010]" />

          <div className="h-[700px] animate-pulse rounded-3xl bg-[#101010]" />
        </div>
      </div>
    </main>
  );
}

function ProjectNotFound({ message = '' }: { message?: string }) {
  return (
    <main className="min-h-screen bg-[#050505] px-8 py-12 text-white">
      <div className="mx-auto max-w-3xl rounded-3xl border border-[#232323] bg-[#101010] p-8">
        <p className="text-xs uppercase tracking-[0.2em] text-[#767676]">
          Creative OS
        </p>

        <h1 className="mt-3 text-3xl font-semibold">
          Proyecto no encontrado
        </h1>

        <p className="mt-4 leading-relaxed text-[#A6A6A6]">
          {message || 'El proyecto no existe o no pertenece a esta cuenta.'}
        </p>

        <Link
          href="/studio"
          className="mt-7 inline-flex rounded-full bg-[#D9FF00] px-6 py-3 text-sm font-bold text-black"
        >
          Volver al estudio
        </Link>
      </div>
    </main>
  );
}
