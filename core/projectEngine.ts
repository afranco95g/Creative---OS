import {
  Evidence,
  ProjectEvent,
  ProjectGraph,
  ProjectModule,
  ProjectModuleId,
  ProjectPatch,
  ProjectStage,
} from '../types/project';

export function createId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return Math.random().toString(36).slice(2);
}

export function now() {
  return new Date().toISOString();
}

function createEvidence(quote: string, source: Evidence['source'] = 'conversation'): Evidence {
  return {
    id: createId(),
    source,
    quote,
    createdAt: now(),
  };
}

function getModuleStatus(score: number) {
  if (score >= 75) return 'solid';
  if (score >= 25) return 'building';
  return 'empty';
}

function createModule(
  id: ProjectModuleId,
  title: string,
  description: string
): ProjectModule {
  return {
    id,
    title,
    description,
    content: '',
    score: 0,
    status: 'empty',
    evidence: [],
    updatedAt: now(),
  };
}

export function createInitialProjectGraph(): ProjectGraph {
  return {
    id: createId(),
    title: 'Proyecto sin nombre',
    stage: 'idea',
    createdAt: now(),
    updatedAt: now(),
    tasks: [],
    decisions: [],
    risks: [],
    team: [],
    documents: [],
    eventLog: [],
    tools: {
      budgetLines: [],
      scheduleItems: [],
      grant: {
        opportunityId: '',
        opportunityName: '',
        objective: '',
        requirements: [],
        requiredDocuments: [],
        requiresBudget: true,
        requiresTimeline: true,
        attachments: [],
        evaluationCriteria: [],
        answers: {},
      },
    },
    modules: {
      identity: createModule(
        'identity',
        'Identidad',
        'Nombre, esencia y descripción breve del proyecto.'
      ),
      purpose: createModule(
        'purpose',
        'Propósito',
        'Razón de ser del proyecto y sentido estratégico.'
      ),
      problem: createModule(
        'problem',
        'Problema / necesidad',
        'Situación, tensión u oportunidad que el proyecto busca transformar.'
      ),
      context: createModule(
        'context',
        'Contexto',
        'Territorio, momento, comunidad, conversación o entorno donde nace.'
      ),
      community: createModule(
        'community',
        'Comunidad',
        'Personas, públicos, clientes, beneficiarios o aliados a quienes se dirige.'
      ),
      generalObjective: createModule(
        'generalObjective',
        'Objetivo general',
        'Resultado principal que el proyecto busca alcanzar.'
      ),
      specificObjectives: createModule(
        'specificObjectives',
        'Objetivos específicos',
        'Objetivos concretos que permiten cumplir el objetivo general.'
      ),
      activities: createModule(
        'activities',
        'Actividades',
        'Acciones, talleres, eventos, producción, entregables o fases de trabajo.'
      ),
      timeline: createModule(
        'timeline',
        'Cronograma',
        'Fases, fechas, duración, secuencia y dependencias.'
      ),
      budget: createModule(
        'budget',
        'Presupuesto',
        'Recursos, costos, inversión, ingresos, financiación y brechas financieras.'
      ),
      team: createModule(
        'team',
        'Equipo',
        'Personas, roles, perfiles, responsabilidades y necesidades de talento.'
      ),
      allies: createModule(
        'allies',
        'Aliados',
        'Espacios, marcas, instituciones, proveedores, mentores o colaboradores.'
      ),
      risks: createModule(
        'risks',
        'Riesgos',
        'Factores financieros, operativos, legales, humanos o técnicos que pueden afectar el proyecto.'
      ),
      sustainability: createModule(
        'sustainability',
        'Sostenibilidad',
        'Cómo continúa y se financia el proyecto después de su primera ejecución.'
      ),
      impact: createModule(
        'impact',
        'Impacto',
        'Resultados esperados, beneficiarios, transformación y valor generado.'
      ),
      kpis: createModule(
        'kpis',
        'Indicadores',
        'Métricas de avance, impacto, ejecución, comunidad y sostenibilidad.'
      ),
      tasks: createModule(
        'tasks',
        'Tareas',
        'Acciones pendientes, urgentes, importantes y responsables.'
      ),
      decisions: createModule(
        'decisions',
        'Decisiones',
        'Decisiones tomadas, razones, alternativas e implicaciones.'
      ),
      documents: createModule(
        'documents',
        'Documentos',
        'One Pager, pitch, convocatoria, presupuesto, cronograma y propuestas.'
      ),
      evidence: createModule(
        'evidence',
        'Evidencias',
        'Fuentes, soportes, registros y materiales que respaldan el proyecto.'
      ),
      opportunities: createModule(
        'opportunities',
        'Oportunidades',
        'Convocatorias, alianzas, clientes, patrocinadores, proveedores o conexiones posibles.'
      ),
    },
  };
}

function mergeContent(previous: string, next: string, operation: ProjectPatch['operation']) {
  if (operation === 'set') return next;

  if (!previous) return next;

  if (previous.toLowerCase().includes(next.toLowerCase())) {
    return previous;
  }

  return `${previous}\n\n${next}`;
}

function inferStage(graph: ProjectGraph): ProjectStage {
  const scores = Object.values(graph.modules).map((module) => module.score);
  const average = Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);

  if (average >= 80) return 'ready_to_present';
  if (average >= 60) return 'validation';
  if (average >= 25) return 'structuring';
  if (average > 0) return 'exploration';

  return 'idea';
}

export function applyPatch(graph: ProjectGraph, patch: ProjectPatch): ProjectGraph {
  const currentModule = graph.modules[patch.moduleId];

  if (!currentModule) return graph;

  const nextScore = Math.min(100, Math.max(currentModule.score, currentModule.score + patch.scoreBoost));

  const nextModule: ProjectModule = {
    ...currentModule,
    content: mergeContent(currentModule.content, patch.value, patch.operation),
    score: nextScore,
    status: getModuleStatus(nextScore),
    evidence: [
      ...currentModule.evidence,
      createEvidence(patch.evidenceQuote, patch.source),
    ],
    updatedAt: now(),
  };

  const event: ProjectEvent = {
    id: createId(),
    type: 'module_updated',
    title: `${currentModule.title} actualizado`,
    description: `Se fortaleció ${currentModule.title} a partir de una conversación.`,
    moduleId: currentModule.id,
    createdAt: now(),
  };

  const nextGraph: ProjectGraph = {
    ...graph,
    modules: {
      ...graph.modules,
      [patch.moduleId]: nextModule,
    },
    eventLog: [event, ...graph.eventLog],
    updatedAt: now(),
  };

  return {
    ...nextGraph,
    stage: inferStage(nextGraph),
  };
}

export function applyPatches(graph: ProjectGraph, patches: ProjectPatch[]) {
  return patches.reduce((currentGraph, patch) => applyPatch(currentGraph, patch), graph);
}

export function getProjectProgress(graph: ProjectGraph) {
  const modules = Object.values(graph.modules);

  if (modules.length === 0) return 0;

  const total = modules.reduce((sum, module) => sum + module.score, 0);

  return Math.round(total / modules.length);
}

export function getWeakModules(graph: ProjectGraph, limit = 5) {
  return Object.values(graph.modules)
    .filter((module) => module.score < 55)
    .sort((a, b) => a.score - b.score)
    .slice(0, limit);
}

export function getStrongModules(graph: ProjectGraph, limit = 5) {
  return Object.values(graph.modules)
    .filter((module) => module.score >= 55)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
