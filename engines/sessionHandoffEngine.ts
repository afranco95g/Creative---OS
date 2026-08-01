import {
  ContextDestination,
  SessionChange,
  SessionDecision,
  SessionHandoff,
  SessionIntent,
} from '../types/contextBridge';
import { ProjectGraph } from '../types/project';
import { createId, now } from '../core/projectEngine';

interface BuildSessionHandoffInput {
  graph: ProjectGraph;

  objective: string;

  primaryQuestion: string;

  expectedOutput: string;

  destination?: ContextDestination;

  constraints?: string[];

  successCriteria?: string[];

  changes?: SessionChange[];

  decisions?: SessionDecision[];

  hypotheses?: string[];

  openQuestions?: string[];

  blockers?: string[];

  risks?: string[];

  nextPriority?: string;

  nextSprint?: string;

  continuationInstructions?: string[];
}

export function buildSessionHandoff({
  graph,
  objective,
  primaryQuestion,
  expectedOutput,
  destination = 'external-ai',
  constraints = [],
  successCriteria = [],
  changes = [],
  decisions = [],
  hypotheses = [],
  openQuestions = [],
  blockers = [],
  risks = [],
  nextPriority = '',
  nextSprint = '',
  continuationInstructions = [],
}: BuildSessionHandoffInput): SessionHandoff {
  const intent: SessionIntent = {
    objective: objective.trim(),
    primaryQuestion: primaryQuestion.trim(),
    expectedOutput: expectedOutput.trim(),
    destination,
    constraints: cleanList(constraints),
    successCriteria: cleanList(successCriteria),
  };

  return {
    sessionId: createId(),
    generatedAt: now(),

    intent,

    changes,

    decisions,

    hypotheses: cleanList(hypotheses),

    openQuestions: cleanList(openQuestions),

    blockers: cleanList(blockers),

    risks: cleanList(risks),

    nextPriority:
      nextPriority.trim() ||
      buildDefaultNextPriority(graph),

    nextSprint:
      nextSprint.trim() ||
      'Continuar fortaleciendo el proyecto activo.',

    continuationInstructions:
      cleanList(continuationInstructions).length > 0
        ? cleanList(continuationInstructions)
        : buildDefaultContinuationInstructions(),
  };
}

function buildDefaultNextPriority(
  graph: ProjectGraph
): string {
  const emptyModules = Object.values(
    graph.modules
  ).filter((module) => module.score === 0);

  if (emptyModules.length === 0) {
    return 'Preparar el proyecto para revisión, activación o conexión con el ecosistema.';
  }

  const firstEmptyModule = emptyModules[0];

  return `Fortalecer el área "${firstEmptyModule.title}".`;
}

function buildDefaultContinuationInstructions(): string[] {
  return [
    'Usa el paquete de contexto como fuente principal.',
    'Distingue hechos, hipótesis, decisiones y preguntas abiertas.',
    'No inventes información ausente.',
    'Explica las recomendaciones.',
    'Conserva la intención original del proyecto.',
    'Prioriza acciones que reduzcan incertidumbre.',
  ];
}

function cleanList(items: string[]): string[] {
  return items
    .map((item) => item.trim())
    .filter(Boolean);
}