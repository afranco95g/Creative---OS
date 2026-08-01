'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  useEffect,
  useSyncExternalStore,
} from 'react';

import {
  ContextBridgePanel,
} from '@/components/ContextBridgePanel';

import {
  ExecutiveMemoryPanel,
} from '@/components/ExecutiveMemoryPanel';

import {
  SessionHandoffPanel,
} from '@/components/SessionHandoffPanel';

import {
  workspaceStore,
} from '@/core/workspaceStore';

import {
  getProjectProgress,
} from '@/core/projectEngine';

import {
  useContextBridge,
} from '@/hooks/useContextBridge';

import {
  useExecutiveMemory,
  useExecutiveMemoryActions,
} from '@/hooks/useExecutiveMemory';

import {
  useExecutiveMemoryDetection,
} from '@/hooks/useExecutiveMemoryDetection';

import type {
  ExecutiveMemoryType,
} from '@/types/executiveMemory';

import type {
  WorkspaceProject,
  WorkspaceState,
} from '@/types/workspace';

interface DetectedMemoryCandidate {
  type: ExecutiveMemoryType;
  summary: string;
  reason?: string;
  confidence?: number;
}

export default function ProjectContinuityPage() {
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

  const project =
    workspaceState?.projects.find(
      (currentProject) =>
        currentProject.id === projectId
    ) ?? null;

  useEffect(() => {
    if (!project) {
      return;
    }

    if (
      workspaceState?.activeProjectId ===
      project.id
    ) {
      return;
    }

    workspaceStore.selectProject(
      project.id
    );
  }, [
    project,
    workspaceState?.activeProjectId,
  ]);

  if (!workspaceState) {
    return <ContinuityLoading />;
  }

  if (!project) {
    return (
      <ProjectNotFound
        projectId={projectId}
      />
    );
  }

  return (
    <ProjectContinuityWorkspace
      project={project}
    />
  );
}

function ProjectContinuityWorkspace({
  project,
}: {
  project: WorkspaceProject;
}) {
  const progress =
    getProjectProgress(
      project.graph
    );

  const memorySnapshot =
    useExecutiveMemory();

  const memoryActions =
    useExecutiveMemoryActions();

  const memoryDetection =
    useExecutiveMemoryDetection({
      projectId: project.id,
      graph: project.graph,
      messages: project.messages,
      existingMemories:
        memorySnapshot.memories,
      onCreateMemory:
        memoryActions.createMemory,
    });

  const contextBridge =
    useContextBridge({
      project,
      graph: project.graph,
      messages: project.messages,
      progress,
    });

  const projectMemories =
    memorySnapshot.memories.filter(
      (memory) =>
        memory.projectId === project.id
    );

  const activeMemories =
    projectMemories.filter(
      (memory) =>
        memory.status === 'active' ||
        memory.status === 'confirmed'
    );

  const proposedMemories =
    projectMemories.filter(
      (memory) =>
        memory.status === 'proposed'
    );

  function handleCreateMemory(
    type: ExecutiveMemoryType,
    summary: string,
    reason: string
  ) {
    memoryActions.createMemory({
      projectId: project.id,
      scope: 'project',
      type,
      summary,
      reason,
      confidence: 1,

      source: {
        type: 'manual',
        label:
          'Creado manualmente desde Creative OS',
      },

      tags: [
        'manual',
        'executive-memory',
      ],

      isSensitive: false,
    });
  }

  function handleProposeDetectedCandidate(
    candidate: DetectedMemoryCandidate
  ) {
    const originalCandidate =
      memoryDetection.candidates.find(
        (currentCandidate) =>
          currentCandidate.type ===
            candidate.type &&
          currentCandidate.summary ===
            candidate.summary
      );

    if (!originalCandidate) {
      return;
    }

    memoryDetection.proposeCandidate(
      originalCandidate
    );
  }

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <header className="border-b border-[#232323] bg-[#080808] px-6 py-7 sm:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-7 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <Link
                  href={`/studio/projects/${project.id}`}
                  className="text-[#767676] transition hover:text-white"
                >
                  ← Volver a la Mesa de Producción
                </Link>

                <span className="text-[#333333]">
                  /
                </span>

                <Link
                  href="/studio"
                  className="text-[#767676] transition hover:text-white"
                >
                  Executive Workspace
                </Link>
              </div>

              <p className="mt-8 text-xs font-semibold uppercase tracking-[0.24em] text-[#D9FF00]">
                Inteligencia y continuidad
              </p>

              <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
                {project.graph.title}
              </h1>

              <p className="mt-4 max-w-3xl text-base leading-7 text-[#A6A6A6]">
                Conserva las decisiones importantes,
                prepara el contexto del proyecto y
                transfiere el trabajo sin perder su
                intención, sus aprendizajes ni sus
                preguntas abiertas.
              </p>
            </div>

            <div className="grid min-w-72 grid-cols-3 gap-3">
              <SummaryMetric
                label="Construcción"
                value={`${progress}%`}
              />

              <SummaryMetric
                label="Memorias activas"
                value={String(
                  activeMemories.length
                )}
              />

              <SummaryMetric
                label="Por validar"
                value={String(
                  proposedMemories.length
                )}
              />
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl space-y-8 px-6 py-10 sm:px-8">
        <ExecutiveMemoryPanel
          projectId={project.id}
          memories={
            memorySnapshot.memories
          }
          detectedCandidates={
            memoryDetection.candidates
          }
          onCreateMemory={
            handleCreateMemory
          }
          onProposeDetectedCandidate={
            handleProposeDetectedCandidate
          }
          onProposeAllDetectedCandidates={
            memoryDetection.proposeAllCandidates
          }
          onConfirmMemory={
            memoryActions.confirmMemory
          }
          onRejectMemory={
            memoryActions.rejectMemory
          }
          onArchiveMemory={
            memoryActions.archiveMemory
          }
        />

        <section>
          <div className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#767676]">
              Puente de contexto
            </p>

            <h2 className="mt-2 text-3xl font-semibold">
              Continuar sin perder información
            </h2>

            <p className="mt-3 max-w-3xl text-sm leading-7 text-[#A6A6A6]">
              Creative OS puede empaquetar el estado
              completo del proyecto o preparar una
              entrega dirigida a otra persona, equipo,
              revisión o inteligencia.
            </p>
          </div>

          <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
            <ContextBridgePanel
              canExport={
                contextBridge.canExport
              }
              onExportJson={
                contextBridge.exportJson
              }
              onExportMarkdown={
                contextBridge.exportMarkdown
              }
            />

            <SessionHandoffPanel
              canExport={
                contextBridge.canExport
              }
              onExportMarkdown={
                contextBridge.exportHandoffMarkdown
              }
              onExportJson={
                contextBridge.exportHandoffJson
              }
            />
          </div>
        </section>

        <section className="rounded-3xl border border-[#232323] bg-[#101010] p-7">
          <p className="text-xs uppercase tracking-[0.2em] text-[#767676]">
            Cómo funciona
          </p>

          <h2 className="mt-3 text-2xl font-semibold">
            El proyecto conserva su inteligencia
          </h2>

          <div className="mt-7 grid gap-4 md:grid-cols-3">
            <InformationCard
              number="01"
              title="Recordar"
              description="Las decisiones, restricciones, criterios, riesgos y aprendizajes importantes permanecen asociados al proyecto."
            />

            <InformationCard
              number="02"
              title="Transferir"
              description="El Context Bridge convierte el estado del proyecto en un paquete legible por personas, equipos o sistemas."
            />

            <InformationCard
              number="03"
              title="Continuar"
              description="El Session Handoff define el objetivo, la pregunta, las restricciones y el resultado esperado de la siguiente sesión."
            />
          </div>
        </section>
      </div>
    </main>
  );
}

function SummaryMetric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <article className="rounded-2xl border border-[#232323] bg-[#101010] p-4 text-center">
      <p className="text-2xl font-semibold text-[#D9FF00]">
        {value}
      </p>

      <p className="mt-2 text-[10px] uppercase leading-4 tracking-[0.12em] text-[#767676]">
        {label}
      </p>
    </article>
  );
}

function InformationCard({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <article className="rounded-2xl border border-[#232323] bg-[#151515] p-5">
      <p className="text-xs font-semibold text-[#D9FF00]">
        {number}
      </p>

      <h3 className="mt-4 text-lg font-semibold">
        {title}
      </h3>

      <p className="mt-2 text-sm leading-6 text-[#8A8A8A]">
        {description}
      </p>
    </article>
  );
}

function ContinuityLoading() {
  return (
    <main className="min-h-screen bg-[#050505] px-8 py-12 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="h-4 w-52 animate-pulse rounded bg-[#232323]" />

        <div className="mt-7 h-14 w-2/3 animate-pulse rounded bg-[#151515]" />

        <div className="mt-12 h-96 animate-pulse rounded-3xl bg-[#101010]" />

        <div className="mt-8 grid gap-6 xl:grid-cols-2">
          <div className="h-80 animate-pulse rounded-3xl bg-[#101010]" />

          <div className="h-80 animate-pulse rounded-3xl bg-[#101010]" />
        </div>
      </div>
    </main>
  );
}

function ProjectNotFound({
  projectId,
}: {
  projectId: string;
}) {
  return (
    <main className="min-h-screen bg-[#050505] px-8 py-12 text-white">
      <div className="mx-auto max-w-3xl rounded-3xl border border-[#232323] bg-[#101010] p-8">
        <p className="text-xs uppercase tracking-[0.2em] text-[#767676]">
          Creative OS
        </p>

        <h1 className="mt-3 text-3xl font-semibold">
          Proyecto no encontrado
        </h1>

        <p className="mt-4 leading-7 text-[#A6A6A6]">
          No se encontró un proyecto asociado al
          identificador:
        </p>

        <code className="mt-3 block overflow-x-auto rounded-xl bg-[#080808] px-4 py-3 text-sm text-[#D9FF00]">
          {projectId}
        </code>

        <div className="mt-7 flex flex-wrap gap-3">
          <Link
            href="/studio"
            className="rounded-full bg-[#D9FF00] px-6 py-3 text-sm font-bold text-black"
          >
            Volver al estudio
          </Link>

          <Link
            href="/"
            className="rounded-full border border-[#333333] px-6 py-3 text-sm font-semibold text-white"
          >
            Ir al medio
          </Link>
        </div>
      </div>
    </main>
  );
}