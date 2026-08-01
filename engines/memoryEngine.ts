import {
  ConversationMessage,
  ProjectGraph,
  ProjectModule,
  ProjectModuleId,
} from '../types/project';
import { getStrongModules, getWeakModules } from '../core/projectEngine';

export interface ProjectMemory {
  knownModules: ProjectModule[];
  weakModules: ProjectModule[];
  recentMessages: ConversationMessage[];
  answeredQuestions: string[];
  repeatedQuestions: string[];
  currentFocusModule: ProjectModuleId | null;
  summary: string;
}

export function buildProjectMemory(
  graph: ProjectGraph,
  messages: ConversationMessage[]
): ProjectMemory {
  const knownModules = getStrongModules(graph, 10);
  const weakModules = getWeakModules(graph, 10);
  const recentMessages = messages.slice(-8);

  const producerQuestions = messages
    .filter((message) => message.role === 'producer' && message.response?.nextQuestion)
    .map((message) => message.response?.nextQuestion || '');

  const repeatedQuestions = findRepeatedQuestions(producerQuestions);

  const currentFocusModule = weakModules[0]?.id || null;

  return {
    knownModules,
    weakModules,
    recentMessages,
    answeredQuestions: producerQuestions,
    repeatedQuestions,
    currentFocusModule,
    summary: buildMemorySummary(graph, knownModules, weakModules, repeatedQuestions),
  };
}

function findRepeatedQuestions(questions: string[]): string[] {
  const normalized = questions.map((question) =>
    question.toLowerCase().trim()
  );

  return questions.filter((question, index) => {
    return normalized.indexOf(normalized[index]) !== index;
  });
}

function buildMemorySummary(
  graph: ProjectGraph,
  knownModules: ProjectModule[],
  weakModules: ProjectModule[],
  repeatedQuestions: string[]
): string {
  const known = knownModules.map((module) => module.title).join(', ');
  const weak = weakModules.slice(0, 5).map((module) => module.title).join(', ');

  const repeatedWarning =
    repeatedQuestions.length > 0
      ? ' Hay preguntas repetidas que deben evitarse en el siguiente turno.'
      : '';

  return `El proyecto "${graph.title}" está en etapa ${graph.stage}. Ya hay información sólida en: ${
    known || 'ningún módulo todavía'
  }. Falta fortalecer: ${weak || 'ningún módulo crítico'}.${repeatedWarning}`;
}

export function hasQuestionBeenAsked(
  memory: ProjectMemory,
  question: string
): boolean {
  return memory.answeredQuestions.some(
    (askedQuestion) =>
      askedQuestion.toLowerCase().trim() === question.toLowerCase().trim()
  );
}

export function getNextUnansweredModule(memory: ProjectMemory): ProjectModuleId | null {
  const next = memory.weakModules.find((module) => module.score < 75);
  return next?.id || null;
}