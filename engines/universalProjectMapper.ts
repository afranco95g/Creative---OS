import { ProjectGraph, ProjectModuleId } from '../types/project';

export type ProjectAreaId =
  | 'direction'
  | 'production'
  | 'resources'
  | 'people'
  | 'communication'
  | 'ecosystem'
  | 'impact';

export interface ProjectArea {
  id: ProjectAreaId;
  title: string;
  question: string;
  description: string;
  moduleIds: ProjectModuleId[];
  score: number;
  status: 'empty' | 'building' | 'solid';
}

const AREA_DEFINITIONS: Omit<ProjectArea, 'score' | 'status'>[] = [
  {
    id: 'direction',
    title: 'Dirección',
    question: '¿Hacia dónde va el proyecto?',
    description: 'Identidad, propósito, problema, contexto, comunidad y objetivos.',
    moduleIds: [
      'identity',
      'purpose',
      'problem',
      'context',
      'community',
      'generalObjective',
      'specificObjectives',
    ],
  },
  {
    id: 'production',
    title: 'Producción',
    question: '¿Cómo sucede?',
    description: 'Actividades, cronograma, tareas, riesgos y entregables.',
    moduleIds: ['activities', 'timeline', 'tasks', 'risks', 'documents'],
  },
  {
    id: 'resources',
    title: 'Recursos',
    question: '¿Qué necesita para existir?',
    description: 'Presupuesto, sostenibilidad, financiación y recursos disponibles.',
    moduleIds: ['budget', 'sustainability'],
  },
  {
    id: 'people',
    title: 'Personas',
    question: '¿Quién lo hace posible?',
    description: 'Equipo, roles, aliados, comunidad y responsables.',
    moduleIds: ['team', 'allies', 'community'],
  },
  {
    id: 'communication',
    title: 'Comunicación',
    question: '¿Cómo se cuenta?',
    description: 'Narrativa, documentos, pitch, propuesta y forma de presentar.',
    moduleIds: ['documents', 'purpose', 'impact', 'opportunities'],
  },
  {
    id: 'ecosystem',
    title: 'Ecosistema',
    question: '¿Con quién se conecta?',
    description: 'Aliados, oportunidades, convocatorias, patrocinadores y red.',
    moduleIds: ['allies', 'opportunities', 'evidence'],
  },
  {
    id: 'impact',
    title: 'Impacto',
    question: '¿Qué cambia y cómo evoluciona?',
    description: 'Resultados, indicadores, sostenibilidad, aprendizaje y evolución.',
    moduleIds: ['impact', 'kpis', 'sustainability', 'evidence'],
  },
];

export function mapProjectToAreas(graph: ProjectGraph): ProjectArea[] {
  return AREA_DEFINITIONS.map((area) => {
    const score = calculateAreaScore(graph, area.moduleIds);

    return {
      ...area,
      score,
      status: getAreaStatus(score),
    };
  });
}

function calculateAreaScore(
  graph: ProjectGraph,
  moduleIds: ProjectModuleId[]
): number {
  if (moduleIds.length === 0) return 0;

  const total = moduleIds.reduce((sum, moduleId) => {
    return sum + (graph.modules[moduleId]?.score || 0);
  }, 0);

  return Math.round(total / moduleIds.length);
}

function getAreaStatus(score: number): ProjectArea['status'] {
  if (score >= 75) return 'solid';
  if (score >= 25) return 'building';
  return 'empty';
}