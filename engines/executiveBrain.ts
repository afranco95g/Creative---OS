import {
  ConversationMessage,
  ProjectGraph,
  ProjectModule,
  ProjectModuleId,
} from '../types/project';
import {
  getProjectProgress,
  getStrongModules,
  getWeakModules,
} from '../core/projectEngine';
import { buildProjectMemory, ProjectMemory } from './memoryEngine';

export type ExecutivePriority =
  | 'clarify_project'
  | 'structure_execution'
  | 'strengthen_finances'
  | 'define_team'
  | 'prepare_documents'
  | 'prepare_human_review'
  | 'activate_ecosystem';

export interface ExecutiveInsight {
  priority: ExecutivePriority;
  title: string;
  summary: string;
  strongestModules: ProjectModule[];
  weakestModules: ProjectModule[];
  nextBestAction: string;
  recommendedModule: ProjectModuleId;
  memory: ProjectMemory;
  readiness: {
    project: number;
    documents: number;
    execution: number;
    ecosystem: number;
  };
}

export function analyzeProject(
  graph: ProjectGraph,
  messages: ConversationMessage[] = []
): ExecutiveInsight {
  const memory = buildProjectMemory(graph, messages);
  const projectProgress = getProjectProgress(graph);
  const strongestModules = getStrongModules(graph, 5);
  const weakestModules = getWeakModules(graph, 5);

  const recommendedModule = resolveRecommendedModule(graph, memory);
  const priority = resolvePriority(graph, projectProgress, recommendedModule);

  return {
    priority,
    title: getPriorityTitle(priority),
    summary: getExecutiveSummary(priority, graph, memory),
    strongestModules,
    weakestModules,
    nextBestAction: getNextBestAction(priority, recommendedModule, memory),
    recommendedModule,
    memory,
    readiness: {
      project: projectProgress,
      documents: calculateDocumentReadiness(graph),
      execution: calculateExecutionReadiness(graph),
      ecosystem: calculateEcosystemReadiness(graph),
    },
  };
}

function resolveRecommendedModule(
  graph: ProjectGraph,
  memory: ProjectMemory
): ProjectModuleId {
  const priorityOrder: ProjectModuleId[] = [
    'purpose',
    'problem',
    'community',
    'context',
    'generalObjective',
    'specificObjectives',
    'activities',
    'timeline',
    'budget',
    'team',
    'allies',
    'risks',
    'sustainability',
    'impact',
    'kpis',
    'documents',
    'opportunities',
  ];

  const nextFromMemory = memory.weakModules.find(
    (module) => module.score < 55 && priorityOrder.includes(module.id)
  );

  if (nextFromMemory) return nextFromMemory.id;

  const firstWeakModule = priorityOrder.find(
    (moduleId) => graph.modules[moduleId]?.score < 55
  );

  return firstWeakModule || 'documents';
}

function resolvePriority(
  graph: ProjectGraph,
  progress: number,
  recommendedModule: ProjectModuleId
): ExecutivePriority {
  if (progress < 25) return 'clarify_project';

  if (
    recommendedModule === 'budget' ||
    recommendedModule === 'sustainability'
  ) {
    return 'strengthen_finances';
  }

  if (recommendedModule === 'team') {
    return 'define_team';
  }

  if (
    recommendedModule === 'activities' ||
    recommendedModule === 'timeline' ||
    recommendedModule === 'specificObjectives'
  ) {
    return 'structure_execution';
  }

  if (progress >= 85) {
    return 'activate_ecosystem';
  }

  if (progress >= 75) {
    return 'prepare_human_review';
  }

  if (progress >= 65 && graph.modules.documents.score < 55) {
    return 'prepare_documents';
  }

  return 'structure_execution';
}

function getPriorityTitle(priority: ExecutivePriority): string {
  const titles: Record<ExecutivePriority, string> = {
    clarify_project: 'aclarar la base del proyecto',
    structure_execution: 'ordenar la ejecución',
    strengthen_finances: 'fortalecer la sostenibilidad financiera',
    define_team: 'definir el equipo de trabajo',
    prepare_documents: 'preparar documentos',
    prepare_human_review: 'preparar revisión humana',
    activate_ecosystem: 'activar conexiones del ecosistema',
  };

  return titles[priority];
}

function getExecutiveSummary(
  priority: ExecutivePriority,
  graph: ProjectGraph,
  memory: ProjectMemory
): string {
  const projectName = graph.title;
  const repeatedQuestionWarning =
    memory.repeatedQuestions.length > 0
      ? ' Además, evitaré repetir preguntas que ya fueron abordadas.'
      : '';

  const summaries: Record<ExecutivePriority, string> = {
    clarify_project:
      `El proyecto "${projectName}" todavía está en una etapa inicial. La prioridad es entender con claridad qué se quiere construir, para quién y por qué debería existir.${repeatedQuestionWarning}`,
    structure_execution:
      `El proyecto "${projectName}" ya tiene una base reconocible. Ahora conviene convertir esa idea en objetivos, actividades, cronograma y tareas concretas.${repeatedQuestionWarning}`,
    strengthen_finances:
      `El proyecto "${projectName}" necesita fortalecer su dimensión financiera: presupuesto, recursos disponibles, fuentes de ingreso y sostenibilidad.${repeatedQuestionWarning}`,
    define_team:
      `El proyecto "${projectName}" necesita aclarar quiénes lo hacen posible, qué roles existen y qué capacidades faltan.${repeatedQuestionWarning}`,
    prepare_documents:
      `El proyecto "${projectName}" ya puede empezar a convertirse en documentos útiles: One Pager, propuesta, cronograma, presupuesto o pitch.${repeatedQuestionWarning}`,
    prepare_human_review:
      `El proyecto "${projectName}" está cerca de una revisión humana. Conviene validar coherencia, presupuesto, riesgos y documentos antes de presentarlo.${repeatedQuestionWarning}`,
    activate_ecosystem:
      `El proyecto "${projectName}" está listo para buscar conexiones: aliados, proveedores, convocatorias, patrocinadores o mentores.${repeatedQuestionWarning}`,
  };

  return summaries[priority];
}

function getNextBestAction(
  priority: ExecutivePriority,
  moduleId: ProjectModuleId,
  memory: ProjectMemory
): string {
  const actions: Record<ExecutivePriority, string> = {
    clarify_project:
      'Responder una pregunta estratégica para aclarar propósito, problema o comunidad.',
    structure_execution:
      'Convertir la idea en actividades, objetivos específicos y un primer cronograma.',
    strengthen_finances:
      'Separar costos, recursos disponibles, inversión inicial y posibles fuentes de ingreso.',
    define_team:
      'Crear una lista inicial de roles, responsables y perfiles necesarios.',
    prepare_documents:
      'Generar el primer documento vivo desde el estado actual del proyecto.',
    prepare_human_review:
      'Preparar el proyecto para que una persona experta lo revise y deje recomendaciones.',
    activate_ecosystem:
      'Buscar oportunidades, aliados o perfiles que puedan ayudar a ejecutar el proyecto.',
  };

  const memoryNote =
    memory.repeatedQuestions.length > 0
      ? ' Evitando repetir preguntas anteriores.'
      : '';

  return `${actions[priority]} Módulo recomendado: ${moduleId}.${memoryNote}`;
}

function calculateDocumentReadiness(graph: ProjectGraph): number {
  const required: ProjectModuleId[] = [
    'purpose',
    'problem',
    'community',
    'generalObjective',
    'activities',
    'budget',
    'timeline',
  ];

  return calculateReadiness(graph, required);
}

function calculateExecutionReadiness(graph: ProjectGraph): number {
  const required: ProjectModuleId[] = [
    'specificObjectives',
    'activities',
    'timeline',
    'budget',
    'team',
    'risks',
  ];

  return calculateReadiness(graph, required);
}

function calculateEcosystemReadiness(graph: ProjectGraph): number {
  const required: ProjectModuleId[] = [
    'allies',
    'opportunities',
    'impact',
    'sustainability',
    'documents',
  ];

  return calculateReadiness(graph, required);
}

function calculateReadiness(
  graph: ProjectGraph,
  modules: ProjectModuleId[]
): number {
  const total = modules.reduce((sum, moduleId) => {
    return sum + (graph.modules[moduleId]?.score || 0);
  }, 0);

  return Math.round(total / modules.length);
}