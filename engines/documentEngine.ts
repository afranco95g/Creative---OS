import {
  CompiledDocument,
  DocumentDefinition,
  ProjectGraph,
  ProjectModuleId,
} from '../types/project';
import { createId, now } from '../core/projectEngine';

export const DOCUMENT_DEFINITIONS: DocumentDefinition[] = [
  {
    id: 'one-pager',
    title: 'One Pager',
    description: 'Resumen ejecutivo de una página para presentar rápidamente el proyecto.',
    purpose: 'Presentar la esencia del proyecto de forma clara, breve y convincente.',
    targetAudience: 'ally',
    requiredModules: [
      'identity',
      'purpose',
      'problem',
      'community',
      'generalObjective',
      'activities',
      'budget',
    ],
  },
  {
    id: 'proposal',
    title: 'Propuesta de proyecto',
    description: 'Documento estructurado para presentar el proyecto ante aliados, clientes o instituciones.',
    purpose: 'Explicar qué se hará, por qué, cómo, con quién y con qué recursos.',
    targetAudience: 'client',
    requiredModules: [
      'identity',
      'context',
      'problem',
      'community',
      'generalObjective',
      'specificObjectives',
      'activities',
      'timeline',
      'budget',
      'team',
      'impact',
    ],
  },
  {
    id: 'grant-application',
    title: 'Base para convocatoria',
    description: 'Estructura base para aplicar a convocatorias culturales, sociales o creativas.',
    purpose: 'Preparar la información esencial que suelen pedir las convocatorias.',
    targetAudience: 'grant',
    requiredModules: [
      'identity',
      'context',
      'problem',
      'community',
      'generalObjective',
      'specificObjectives',
      'activities',
      'timeline',
      'budget',
      'team',
      'impact',
      'sustainability',
      'evidence',
    ],
  },
  {
    id: 'timeline',
    title: 'Cronograma',
    description: 'Plan de fases, actividades, tiempos y responsables.',
    purpose: 'Ordenar la ejecución del proyecto.',
    targetAudience: 'internal',
    requiredModules: [
      'generalObjective',
      'specificObjectives',
      'activities',
      'timeline',
      'team',
    ],
  },
  {
    id: 'budget',
    title: 'Presupuesto',
    description: 'Documento financiero inicial del proyecto.',
    purpose: 'Organizar costos, inversión, recursos y necesidades financieras.',
    targetAudience: 'internal',
    requiredModules: [
      'activities',
      'timeline',
      'budget',
      'team',
      'sustainability',
    ],
  },
  {
    id: 'pitch',
    title: 'Pitch',
    description: 'Narrativa breve para presentar el proyecto a patrocinadores, inversionistas o aliados.',
    purpose: 'Convencer a alguien de apoyar, financiar o sumarse al proyecto.',
    targetAudience: 'sponsor',
    requiredModules: [
      'identity',
      'purpose',
      'problem',
      'community',
      'impact',
      'budget',
      'allies',
      'opportunities',
    ],
  },
];

export interface DocumentReadiness {
  definition: DocumentDefinition;
  readiness: number;
  completedModules: ProjectModuleId[];
  missingModules: ProjectModuleId[];
}

export function getDocumentReadiness(
  graph: ProjectGraph,
  definition: DocumentDefinition
): DocumentReadiness {
  const completedModules = definition.requiredModules.filter(
    (moduleId) => graph.modules[moduleId]?.score >= 55
  );

  const missingModules = definition.requiredModules.filter(
    (moduleId) => graph.modules[moduleId]?.score < 55
  );

  const readiness = Math.round(
    (completedModules.length / definition.requiredModules.length) * 100
  );

  return {
    definition,
    readiness,
    completedModules,
    missingModules,
  };
}

export function getAllDocumentReadiness(graph: ProjectGraph): DocumentReadiness[] {
  return DOCUMENT_DEFINITIONS.map((definition) =>
    getDocumentReadiness(graph, definition)
  );
}

export function compileDocument(
  graph: ProjectGraph,
  definitionId: string
): CompiledDocument {
  const definition = DOCUMENT_DEFINITIONS.find((doc) => doc.id === definitionId);

  if (!definition) {
    throw new Error(`Document definition not found: ${definitionId}`);
  }

  const readiness = getDocumentReadiness(graph, definition).readiness;

  return {
    id: createId(),
    definitionId: definition.id,
    title: definition.title,
    readiness,
    content: buildDocumentContent(graph, definition),
    createdAt: now(),
    updatedAt: now(),
  };
}

function buildDocumentContent(
  graph: ProjectGraph,
  definition: DocumentDefinition
): string {
  const sections = definition.requiredModules.map((moduleId) => {
    const module = graph.modules[moduleId];

    return `## ${module.title}

${module.content || `Pendiente por fortalecer: ${module.description}`}
`;
  });

  return `# ${definition.title}

Proyecto: ${graph.title}

Propósito del documento:
${definition.purpose}

Estado de preparación:
${getDocumentReadiness(graph, definition).readiness}%

---

${sections.join('\n---\n')}`;
}