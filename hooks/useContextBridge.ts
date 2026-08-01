'use client';

import { useCallback } from 'react';
import { buildContextPackage } from '../engines/contextBridgeEngine';
import { serializeContextPackage } from '../engines/contextBridgeSerializer';
import { buildSessionHandoff } from '../engines/sessionHandoffEngine';
import { downloadTextFile } from '../core/utils/downloadFile';
import {
  ContextDestination,
  ContextExportDepth,
  ContextExportFormat,
} from '../types/contextBridge';
import {
  ConversationMessage,
  ProjectGraph,
} from '../types/project';
import { WorkspaceProject } from '../types/workspace';

interface UseContextBridgeInput {
  project: WorkspaceProject | null;
  graph: ProjectGraph;
  messages: ConversationMessage[];
  progress: number;
}

interface ExportContextOptions {
  format: ContextExportFormat;
  depth?: ContextExportDepth;
}

export interface SessionHandoffFormValue {
  objective: string;
  primaryQuestion: string;
  expectedOutput: string;
  destination: ContextDestination;
  constraints: string[];
  successCriteria: string[];
  nextSprint: string;
}

export function useContextBridge({
  project,
  graph,
  messages,
  progress,
}: UseContextBridgeInput) {
  const exportContext = useCallback(
    ({
      format,
      depth = 'complete',
    }: ExportContextOptions) => {
      if (!project) {
        console.error(
          'No existe un proyecto activo para exportar.'
        );

        return;
      }

      const contextPackage = buildContextPackage({
        project,
        graph,
        messages,
        progress,
        depth,
      });

      downloadContextPackage(
        contextPackage,
        format,
        graph.title || project.title
      );
    },
    [
      project,
      graph,
      messages,
      progress,
    ]
  );

  const exportHandoff = useCallback(
    (
      value: SessionHandoffFormValue,
      format: ContextExportFormat
    ) => {
      if (!project) {
        console.error(
          'No existe un proyecto activo para preparar el handoff.'
        );

        return;
      }

      const handoff = buildSessionHandoff({
        graph,
        objective: value.objective,
        primaryQuestion: value.primaryQuestion,
        expectedOutput: value.expectedOutput,
        destination: value.destination,
        constraints: value.constraints,
        successCriteria: value.successCriteria,
        nextSprint: value.nextSprint,

        openQuestions:
          buildOpenQuestionsFromGraph(graph),

        risks:
          extractRiskSummaries(graph),

        blockers:
          buildBlockersFromGraph(graph),

        continuationInstructions: [
          'Usa este paquete como fuente principal de contexto.',
          'Distingue claramente hechos, hipótesis, decisiones y preguntas abiertas.',
          'No inventes información que no esté contenida en el paquete.',
          'Explica las recomendaciones y sus implicaciones.',
          'Conserva la intención original del proyecto.',
          'Prioriza acciones que reduzcan incertidumbre y generen movimiento.',
        ],
      });

      const contextPackage = buildContextPackage({
        project,
        graph,
        messages,
        progress,
        depth: 'complete',
        handoff,
        executiveState: {
          openQuestions: handoff.openQuestions,
          risks: handoff.risks,
        },
      });

      downloadContextPackage(
        contextPackage,
        format,
        `${graph.title || project.title}-handoff`
      );
    },
    [
      project,
      graph,
      messages,
      progress,
    ]
  );

  const exportJson = useCallback(() => {
    exportContext({
      format: 'json',
      depth: 'complete',
    });
  }, [exportContext]);

  const exportMarkdown = useCallback(() => {
    exportContext({
      format: 'markdown',
      depth: 'executive',
    });
  }, [exportContext]);

  const exportHandoffJson = useCallback(
    (value: SessionHandoffFormValue) => {
      exportHandoff(value, 'json');
    },
    [exportHandoff]
  );

  const exportHandoffMarkdown = useCallback(
    (value: SessionHandoffFormValue) => {
      exportHandoff(value, 'markdown');
    },
    [exportHandoff]
  );

  return {
    exportContext,
    exportJson,
    exportMarkdown,
    exportHandoffJson,
    exportHandoffMarkdown,
    canExport: Boolean(project),
  };
}

function downloadContextPackage(
  contextPackage: ReturnType<typeof buildContextPackage>,
  format: ContextExportFormat,
  projectName: string
) {
  const serializedContext =
    serializeContextPackage(
      contextPackage,
      format
    );

  const safeProjectName =
    createSafeFileName(projectName);

  const fileName =
    `${safeProjectName}-creative-context.` +
    serializedContext.fileExtension;

  downloadTextFile(
    serializedContext.content,
    fileName,
    serializedContext.mimeType
  );
}

function buildOpenQuestionsFromGraph(
  graph: ProjectGraph
): string[] {
  return Object.values(graph.modules)
    .filter((module) => module.score === 0)
    .slice(0, 5)
    .map(
      (module) =>
        `¿Qué información falta para fortalecer "${module.title}"?`
    );
}

function extractRiskSummaries(
  graph: ProjectGraph
): string[] {
  return graph.risks.map((risk) => {
    if (typeof risk === 'string') {
      return risk;
    }

    if (
      typeof risk === 'object' &&
      risk !== null
    ) {
      if (
        'title' in risk &&
        typeof risk.title === 'string'
      ) {
        return risk.title;
      }

      if (
        'description' in risk &&
        typeof risk.description === 'string'
      ) {
        return risk.description;
      }
    }

    return 'Riesgo registrado sin descripción.';
  });
}

function buildBlockersFromGraph(
  graph: ProjectGraph
): string[] {
  const emptyPriorityModules =
    Object.values(graph.modules)
      .filter((module) => module.score === 0)
      .slice(0, 3);

  return emptyPriorityModules.map(
    (module) =>
      `El área "${module.title}" todavía no tiene información suficiente.`
  );
}

function createSafeFileName(
  value: string
): string {
  return (
    value
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') ||
    'project'
  );
}