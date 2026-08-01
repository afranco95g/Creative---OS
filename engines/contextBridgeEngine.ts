import {
  ContextExecutiveState,
  ContextExportDepth,
  CreativeContextPackage,
  SessionHandoff,
} from '../types/contextBridge';
import {
  ConversationMessage,
  ProjectGraph,
} from '../types/project';
import { WorkspaceProject } from '../types/workspace';
import { createId, now } from '../core/projectEngine';
import {
  buildExecutiveNarrative,
  ProjectExecutiveNarrative,
} from './executiveNarrativeEngine';

interface BuildContextPackageInput {
  project: WorkspaceProject;
  graph: ProjectGraph;
  messages: ConversationMessage[];
  progress: number;
  depth?: ContextExportDepth;
  executiveState?: Partial<ContextExecutiveState>;
  handoff?: SessionHandoff;
}

export function buildContextPackage({
  project,
  graph,
  messages,
  progress,
  depth = 'complete',
  executiveState = {},
  handoff,
}: BuildContextPackageInput): CreativeContextPackage {
  const narrative =
    buildExecutiveNarrative(graph);

  const openQuestions =
    executiveState.openQuestions ||
    buildExecutiveOpenQuestions(narrative);

  const nextSteps =
    executiveState.nextSteps ||
    buildExecutiveNextSteps(narrative);

  return {
    metadata: {
      id: createId(),
      generatedAt: now(),
      formatVersion: '1.3',
      source: 'creative-os',
      exportDepth: depth,
    },

    project: {
      id: project.id,
      title: graph.title || project.title,
      description: project.description,
      category: project.category,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      stage: String(graph.stage),
      progress,
    },

    graph,

    conversation: {
      messages,
      totalMessages: messages.length,
    },

    executiveState: {
      summary:
        executiveState.summary ||
        narrative.executiveSummary,

      maturityLevel:
        executiveState.maturityLevel ||
        narrative.maturityLevel,

      maturityLabel:
        executiveState.maturityLabel ||
        narrative.maturityLabel,

      strengths:
        executiveState.strengths ||
        narrative.strengths,

      uncertainties:
        executiveState.uncertainties ||
        narrative.uncertainties,

      currentPriority:
        executiveState.currentPriority ||
        narrative.currentPriority,

      risks:
        executiveState.risks ||
        narrative.strategicRisks,

      opportunities:
        executiveState.opportunities ||
        narrative.opportunities,

      executiveRecommendation:
        executiveState.executiveRecommendation ||
        narrative.executiveRecommendation,

      nextSprint:
        executiveState.nextSprint ||
        narrative.nextSprint,

      openQuestions,

      nextSteps,
    },

    handoff,
  };
}

function buildExecutiveOpenQuestions(
  narrative: ProjectExecutiveNarrative
): string[] {
  if (narrative.uncertainties.length === 0) {
    return [
      '¿Qué validación externa necesita el proyecto antes de avanzar?',
    ];
  }

  return narrative.uncertainties
    .slice(0, 5)
    .map((uncertainty) =>
      convertUncertaintyToQuestion(
        uncertainty
      )
    );
}

function convertUncertaintyToQuestion(
  uncertainty: string
): string {
  const cleanUncertainty =
    uncertainty
      .trim()
      .replace(/\.$/, '');

  return `¿Cómo podemos resolver esta incertidumbre: ${cleanUncertainty.toLowerCase()}?`;
}

function buildExecutiveNextSteps(
  narrative: ProjectExecutiveNarrative
): string[] {
  return [
    narrative.executiveRecommendation,
    narrative.currentPriority,
    narrative.nextSprint,
  ].filter(Boolean);
}