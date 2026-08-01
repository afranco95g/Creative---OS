import { ProjectGraph } from '../types/project';
import {
  mapProjectToAreas,
  ProjectArea,
} from './universalProjectMapper';

export interface AreaExecutiveNarrative {
  interpretation: string;
  nextStep: string;
}

export type ProjectMaturityLevel =
  | 'exploratory'
  | 'emerging'
  | 'structured'
  | 'activation-ready';

export interface ProjectExecutiveNarrative {
  executiveSummary: string;
  maturityLevel: ProjectMaturityLevel;
  maturityLabel: string;

  strengths: string[];
  uncertainties: string[];
  strategicRisks: string[];
  opportunities: string[];

  currentPriority: string;
  executiveRecommendation: string;
  nextSprint: string;
}

/**
 * Conserva la lectura narrativa individual de cada área.
 * Esta función continúa siendo compatible con ProjectDashboard.
 */
export function buildAreaNarrative(
  area: ProjectArea
): AreaExecutiveNarrative {
  if (area.score >= 75) {
    return {
      interpretation: `${area.title} tiene una base sólida. Ya existe suficiente claridad para utilizar esta información en documentos y decisiones.`,
      nextStep:
        'Mantener esta área actualizada mientras avanzan las demás.',
    };
  }

  if (area.score >= 40) {
    return {
      interpretation: `${area.title} está tomando forma, pero todavía necesita más precisión para orientar mejor el proyecto.`,
      nextStep: `Profundizar en: ${area.question}`,
    };
  }

  if (area.score > 0) {
    return {
      interpretation: `${area.title} ya tiene señales iniciales, pero todavía no ofrece suficiente claridad para tomar decisiones importantes.`,
      nextStep:
        'Conversar sobre esta área para convertir las señales iniciales en una estructura más clara.',
    };
  }

  return {
    interpretation: `${area.title} todavía no ha sido trabajada. Por ahora representa una incertidumbre abierta dentro del proyecto.`,
    nextStep: `Empezar respondiendo: ${area.question}`,
  };
}

/**
 * Construye una lectura ejecutiva completa del proyecto.
 *
 * No se limita al porcentaje de progreso:
 * interpreta fortalezas, incertidumbres, riesgos,
 * oportunidades y la siguiente prioridad.
 */
export function buildExecutiveNarrative(
  graph: ProjectGraph
): ProjectExecutiveNarrative {
  const areas = mapProjectToAreas(graph);

  const averageScore = getAverageScore(areas);
  const maturityLevel = getMaturityLevel(averageScore);

  const strengths = buildStrengths(areas);
  const uncertainties = buildUncertainties(areas);
  const strategicRisks = buildStrategicRisks(
    graph,
    areas
  );
  const opportunities = buildOpportunities(
    graph,
    areas
  );

  const priorityArea = getPriorityArea(areas);

  const currentPriority = priorityArea
    ? `Fortalecer ${priorityArea.title}: ${priorityArea.question}`
    : 'Preparar el proyecto para una revisión ejecutiva y su siguiente etapa de activación.';

  return {
    executiveSummary: buildExecutiveSummary(
      graph,
      averageScore,
      maturityLevel,
      strengths,
      uncertainties
    ),

    maturityLevel,

    maturityLabel:
      getMaturityLabel(maturityLevel),

    strengths,

    uncertainties,

    strategicRisks,

    opportunities,

    currentPriority,

    executiveRecommendation:
      buildExecutiveRecommendation(
        maturityLevel,
        priorityArea
      ),

    nextSprint: buildNextSprint(
      maturityLevel,
      priorityArea
    ),
  };
}

function getAverageScore(
  areas: ProjectArea[]
): number {
  if (areas.length === 0) return 0;

  const total = areas.reduce(
    (sum, area) => sum + area.score,
    0
  );

  return Math.round(total / areas.length);
}

function getMaturityLevel(
  score: number
): ProjectMaturityLevel {
  if (score < 25) return 'exploratory';
  if (score < 50) return 'emerging';
  if (score < 75) return 'structured';

  return 'activation-ready';
}

function getMaturityLabel(
  level: ProjectMaturityLevel
): string {
  if (level === 'exploratory') {
    return 'Exploratorio';
  }

  if (level === 'emerging') {
    return 'En estructuración';
  }

  if (level === 'structured') {
    return 'Estructurado';
  }

  return 'Preparado para activación';
}

function buildStrengths(
  areas: ProjectArea[]
): string[] {
  const solidAreas = areas
    .filter((area) => area.score >= 60)
    .sort((a, b) => b.score - a.score);

  if (solidAreas.length === 0) {
    return [
      'El proyecto ya cuenta con una intención inicial que puede convertirse en una estructura más clara.',
    ];
  }

  return solidAreas
    .slice(0, 4)
    .map(
      (area) =>
        `${area.title} presenta una base relativamente sólida con un avance del ${area.score}%.`
    );
}

function buildUncertainties(
  areas: ProjectArea[]
): string[] {
  const weakAreas = areas
    .filter((area) => area.score < 40)
    .sort((a, b) => a.score - b.score);

  if (weakAreas.length === 0) {
    return [
      'No se detectan incertidumbres críticas en las áreas principales.',
    ];
  }

  return weakAreas
    .slice(0, 5)
    .map((area) => {
      if (area.score === 0) {
        return `${area.title} todavía no tiene información suficiente.`;
      }

      return `${area.title} tiene señales iniciales, pero todavía necesita mayor precisión.`;
    });
}

function buildStrategicRisks(
  graph: ProjectGraph,
  areas: ProjectArea[]
): string[] {
  const risks = extractGraphRisks(graph);

  const weakDirection = areas.find(
    (area) => area.id === 'direction'
  );

  const weakResources = areas.find(
    (area) => area.id === 'resources'
  );

  const weakProduction = areas.find(
    (area) => area.id === 'production'
  );

  if (
    weakDirection &&
    weakDirection.score < 25
  ) {
    risks.push(
      'El proyecto puede avanzar hacia actividades concretas sin haber consolidado todavía una dirección estratégica.'
    );
  }

  if (
    weakResources &&
    weakResources.score < 25
  ) {
    risks.push(
      'Todavía no existe suficiente claridad sobre los recursos y la sostenibilidad necesarios para ejecutar el proyecto.'
    );
  }

  if (
    weakProduction &&
    weakProduction.score < 25
  ) {
    risks.push(
      'La intención del proyecto aún no se ha traducido en una ruta operativa verificable.'
    );
  }

  return unique(risks).slice(0, 5);
}

function buildOpportunities(
  graph: ProjectGraph,
  areas: ProjectArea[]
): string[] {
  const opportunities =
    extractGraphOpportunities(graph);

  const ecosystemArea = areas.find(
    (area) => area.id === 'ecosystem'
  );

  const communicationArea = areas.find(
    (area) => area.id === 'communication'
  );

  if (
    ecosystemArea &&
    ecosystemArea.score >= 40
  ) {
    opportunities.push(
      'El proyecto ya contiene información suficiente para empezar a explorar aliados, espacios o capacidades del ecosistema.'
    );
  }

  if (
    communicationArea &&
    communicationArea.score >= 40
  ) {
    opportunities.push(
      'La narrativa disponible puede comenzar a traducirse en documentos, presentaciones o contenidos de comunicación.'
    );
  }

  if (opportunities.length === 0) {
    opportunities.push(
      'La principal oportunidad inmediata consiste en convertir la intención inicial en una propuesta más definida y compartible.'
    );
  }

  return unique(opportunities).slice(0, 5);
}

function getPriorityArea(
  areas: ProjectArea[]
): ProjectArea | null {
  const orderedAreas = [...areas].sort(
    (a, b) => a.score - b.score
  );

  return orderedAreas[0] || null;
}

function buildExecutiveSummary(
  graph: ProjectGraph,
  averageScore: number,
  maturityLevel: ProjectMaturityLevel,
  strengths: string[],
  uncertainties: string[]
): string {
  const title =
    graph.title || 'El proyecto';

  const maturityText =
    getMaturityLabel(maturityLevel).toLowerCase();

  const mainStrength =
    strengths[0] ||
    'Existe una intención inicial identificable.';

  const mainUncertainty =
    uncertainties[0] ||
    'No se detectan incertidumbres críticas.';

  return `${title} se encuentra en un estado ${maturityText}, con un nivel general de preparación cercano al ${averageScore}%. ${mainStrength} ${mainUncertainty} La prioridad no debería ser agregar más actividades, sino reducir la incertidumbre que actualmente limita la siguiente decisión importante.`;
}

function buildExecutiveRecommendation(
  maturityLevel: ProjectMaturityLevel,
  priorityArea: ProjectArea | null
): string {
  const areaName =
    priorityArea?.title || 'el proyecto';

  if (maturityLevel === 'exploratory') {
    return `Evitar avanzar prematuramente hacia cronogramas o presupuestos detallados. La siguiente conversación debe concentrarse en ${areaName} y producir una definición que permita orientar las demás áreas.`;
  }

  if (maturityLevel === 'emerging') {
    return `Convertir la información disponible en decisiones verificables. El frente prioritario es ${areaName}, porque su fortalecimiento puede desbloquear tareas, responsables y documentos.`;
  }

  if (maturityLevel === 'structured') {
    return `Cerrar los vacíos operativos de ${areaName}, revisar riesgos y preparar los documentos necesarios para una validación externa o una prueba piloto.`;
  }

  return 'Realizar una revisión ejecutiva final, confirmar responsables y recursos, y preparar el proyecto para activación o conexión con el ecosistema.';
}

function buildNextSprint(
  maturityLevel: ProjectMaturityLevel,
  priorityArea: ProjectArea | null
): string {
  const areaName =
    priorityArea?.title || 'las áreas pendientes';

  if (maturityLevel === 'exploratory') {
    return `Sprint de definición: fortalecer ${areaName} y reducir las principales incertidumbres estratégicas.`;
  }

  if (maturityLevel === 'emerging') {
    return `Sprint de estructuración: convertir ${areaName} en decisiones, tareas y entregables concretos.`;
  }

  if (maturityLevel === 'structured') {
    return `Sprint de preparación: cerrar ${areaName}, validar riesgos y completar documentos prioritarios.`;
  }

  return 'Sprint de activación: validar el proyecto con actores externos y preparar su ejecución.';
}

function extractGraphRisks(
  graph: ProjectGraph
): string[] {
  return graph.risks
    .map((risk) => {
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

      return '';
    })
    .filter(Boolean);
}

function extractGraphOpportunities(
  graph: ProjectGraph
): string[] {
  const opportunitiesModule =
    graph.modules.opportunities;

  if (!opportunitiesModule?.content?.trim()) {
    return [];
  }

  return opportunitiesModule.content
    .split('\n')
    .map((item) =>
      item.replace(/^[-•]\s*/, '').trim()
    )
    .filter(Boolean);
}

function unique(items: string[]): string[] {
  return Array.from(
    new Set(items.map((item) => item.trim()))
  ).filter(Boolean);
}