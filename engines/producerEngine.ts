import { ConversationMessage, ProjectGraph } from '../types/project';
import { getProjectProgress, getStrongModules, getWeakModules } from '../core/projectEngine';
import { processConversationTurn } from './conversationEngine';

export interface ProducerTurnResult {
  nextGraph: ProjectGraph;
  messages: ConversationMessage[];
  progress: number;
  strongModules: string[];
  weakModules: string[];
  summary: string;
}

export function processProducerTurn(
  userInput: string,
  graph: ProjectGraph
): ProducerTurnResult {
  const result = processConversationTurn(userInput, graph);

  const progress = getProjectProgress(result.nextGraph);

  const strongModules = getStrongModules(result.nextGraph, 5).map(
    (module) => module.title
  );

  const weakModules = getWeakModules(result.nextGraph, 5).map(
    (module) => module.title
  );

  const summary = buildExecutiveSummary(result.nextGraph, progress);

  return {
    nextGraph: result.nextGraph,
    messages: result.messages,
    progress,
    strongModules,
    weakModules,
    summary,
  };
}

function buildExecutiveSummary(graph: ProjectGraph, progress: number): string {
  if (progress < 25) {
    return `El proyecto está en una fase inicial. Ya empezamos a organizar la idea, pero todavía necesitamos aclarar propósito, comunidad, problema, presupuesto, equipo y cronograma.`;
  }

  if (progress < 50) {
    return `El proyecto ya tiene una base reconocible. Ahora debemos fortalecer los módulos que permitirán convertirlo en una propuesta presentable: objetivos, actividades, presupuesto, equipo e impacto.`;
  }

  if (progress < 75) {
    return `El proyecto está tomando forma. Ya puede empezar a generar documentos iniciales, aunque todavía conviene fortalecer sostenibilidad, riesgos, indicadores y oportunidades.`;
  }

  return `El proyecto tiene una estructura sólida. El siguiente paso es preparar documentos, revisar oportunidades y considerar una revisión humana para fortalecerlo antes de presentarlo.`;
}