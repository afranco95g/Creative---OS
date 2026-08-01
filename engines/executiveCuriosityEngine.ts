import {
  ExecutiveCuriosityItem,
  ExecutiveCuriosityScore,
  ExecutiveCuriosityType,
  ExecutiveIntervention,
  ExecutiveInterventionType,
} from '../types/executiveCuriosity';
import {
  ExecutiveMemoryItem,
} from '../types/executiveMemory';
import {
  ConversationMessage,
  ProjectGraph,
} from '../types/project';
import {
  createId,
  now,
} from '../core/projectEngine';

interface BuildExecutiveCuriosityInput {
  projectId: string;
  graph: ProjectGraph;
  messages: ConversationMessage[];
  memories: ExecutiveMemoryItem[];
  existingCuriosities?: ExecutiveCuriosityItem[];
}

interface CuriositySeed {
  type: ExecutiveCuriosityType;
  topic: string;
  reason: string;
  moduleId?: string;
  suggestedPrompt: string;
  possibleInterventions: ExecutiveInterventionType[];
  impact: number;
  urgency: number;
  uncertaintyReduction: number;
  unblockPotential: number;
  cognitiveCost: number;
  interruptionRisk: number;
  confidence: number;
}

const MODULE_CURIOSITY_MAP: Record<
  string,
  Omit<CuriositySeed, 'reason'>
> = {
  identity: {
    type: 'strategic',
    topic: 'identidad del proyecto',
    suggestedPrompt:
      'Todavía no tengo una imagen clara de la identidad del proyecto. ¿Cómo te gustaría que alguien lo describiera después de conocerlo por primera vez?',
    possibleInterventions: [
      'ask',
      'deepen',
      'summarize',
    ],
    impact: 0.8,
    urgency: 0.65,
    uncertaintyReduction: 0.8,
    unblockPotential: 0.75,
    cognitiveCost: 0.35,
    interruptionRisk: 0.25,
    confidence: 0.8,
  },

  purpose: {
    type: 'strategic',
    topic: 'propósito',
    suggestedPrompt:
      'Entiendo la intención general, pero todavía quiero comprender por qué este proyecto debería existir. ¿Qué cambio esperas producir?',
    possibleInterventions: [
      'ask',
      'deepen',
      'confirm',
    ],
    impact: 0.95,
    urgency: 0.8,
    uncertaintyReduction: 0.9,
    unblockPotential: 0.9,
    cognitiveCost: 0.4,
    interruptionRisk: 0.25,
    confidence: 0.9,
  },

  problem: {
    type: 'strategic',
    topic: 'problema o necesidad',
    suggestedPrompt:
      'Hay algo que todavía no termino de entender: ¿qué problema concreto, tensión u oportunidad hace necesario este proyecto?',
    possibleInterventions: [
      'ask',
      'deepen',
      'contrast',
    ],
    impact: 0.95,
    urgency: 0.8,
    uncertaintyReduction: 0.9,
    unblockPotential: 0.9,
    cognitiveCost: 0.45,
    interruptionRisk: 0.3,
    confidence: 0.9,
  },

  context: {
    type: 'strategic',
    topic: 'contexto',
    suggestedPrompt:
      '¿Qué está ocurriendo ahora, en este territorio o comunidad, que vuelve relevante este proyecto?',
    possibleInterventions: [
      'ask',
      'connect',
      'deepen',
    ],
    impact: 0.7,
    urgency: 0.45,
    uncertaintyReduction: 0.65,
    unblockPotential: 0.55,
    cognitiveCost: 0.4,
    interruptionRisk: 0.35,
    confidence: 0.75,
  },

  community: {
    type: 'relational',
    topic: 'público o comunidad inicial',
    suggestedPrompt:
      'Ya entiendo mejor la idea general. Lo que todavía no logro visualizar es quién recibirá valor primero. ¿A quién imaginas llegando inicialmente?',
    possibleInterventions: [
      'ask',
      'deepen',
      'connect',
    ],
    impact: 0.9,
    urgency: 0.7,
    uncertaintyReduction: 0.85,
    unblockPotential: 0.8,
    cognitiveCost: 0.35,
    interruptionRisk: 0.25,
    confidence: 0.85,
  },

  activities: {
    type: 'operational',
    topic: 'primera activación',
    suggestedPrompt:
      '¿Cuál sería la versión más pequeña del proyecto que podríamos producir para aprender algo real?',
    possibleInterventions: [
      'ask',
      'propose',
      'contrast',
    ],
    impact: 0.85,
    urgency: 0.65,
    uncertaintyReduction: 0.75,
    unblockPotential: 0.9,
    cognitiveCost: 0.45,
    interruptionRisk: 0.3,
    confidence: 0.8,
  },

  timeline: {
    type: 'operational',
    topic: 'secuencia y tiempos',
    suggestedPrompt:
      'Todavía no está clara la secuencia de producción. ¿Qué tendría que ocurrir primero para que el resto pueda avanzar?',
    possibleInterventions: [
      'ask',
      'propose',
      'summarize',
    ],
    impact: 0.75,
    urgency: 0.6,
    uncertaintyReduction: 0.7,
    unblockPotential: 0.85,
    cognitiveCost: 0.4,
    interruptionRisk: 0.3,
    confidence: 0.75,
  },

  budget: {
    type: 'economic',
    topic: 'recursos y modelo económico',
    suggestedPrompt:
      'Antes de construir un presupuesto detallado, necesito entender qué recursos ya existen y cuáles todavía tendríamos que conseguir.',
    possibleInterventions: [
      'ask',
      'deepen',
      'propose',
    ],
    impact: 0.85,
    urgency: 0.65,
    uncertaintyReduction: 0.8,
    unblockPotential: 0.8,
    cognitiveCost: 0.5,
    interruptionRisk: 0.35,
    confidence: 0.8,
  },

  team: {
    type: 'human',
    topic: 'equipo y responsabilidades',
    suggestedPrompt:
      '¿Quiénes ya están realmente involucrados y qué responsabilidad puede asumir cada persona?',
    possibleInterventions: [
      'ask',
      'confirm',
      'connect',
    ],
    impact: 0.8,
    urgency: 0.6,
    uncertaintyReduction: 0.75,
    unblockPotential: 0.8,
    cognitiveCost: 0.35,
    interruptionRisk: 0.25,
    confidence: 0.8,
  },

  allies: {
    type: 'relational',
    topic: 'aliados y capacidades externas',
    suggestedPrompt:
      '¿Qué capacidad necesita el proyecto que podría existir ya dentro de otra persona, espacio u organización?',
    possibleInterventions: [
      'ask',
      'connect',
      'remember',
    ],
    impact: 0.75,
    urgency: 0.45,
    uncertaintyReduction: 0.65,
    unblockPotential: 0.75,
    cognitiveCost: 0.35,
    interruptionRisk: 0.3,
    confidence: 0.75,
  },

  risks: {
    type: 'risk',
    topic: 'riesgos principales',
    suggestedPrompt:
      'Si intentáramos activar este proyecto mañana, ¿qué podría detenerlo o hacerlo fallar?',
    possibleInterventions: [
      'ask',
      'contrast',
      'propose',
    ],
    impact: 0.85,
    urgency: 0.6,
    uncertaintyReduction: 0.75,
    unblockPotential: 0.75,
    cognitiveCost: 0.45,
    interruptionRisk: 0.35,
    confidence: 0.8,
  },

  sustainability: {
    type: 'economic',
    topic: 'sostenibilidad',
    suggestedPrompt:
      '¿Qué tendría que ocurrir para que este proyecto pueda continuar después de su primera ejecución?',
    possibleInterventions: [
      'ask',
      'deepen',
      'propose',
    ],
    impact: 0.8,
    urgency: 0.45,
    uncertaintyReduction: 0.7,
    unblockPotential: 0.65,
    cognitiveCost: 0.45,
    interruptionRisk: 0.4,
    confidence: 0.75,
  },

  opportunities: {
    type: 'relational',
    topic: 'oportunidades de activación',
    suggestedPrompt:
      '¿Qué relación, espacio, convocatoria o momento podría acelerar este proyecto si lográramos activarlo?',
    possibleInterventions: [
      'ask',
      'connect',
      'propose',
    ],
    impact: 0.7,
    urgency: 0.4,
    uncertaintyReduction: 0.6,
    unblockPotential: 0.7,
    cognitiveCost: 0.35,
    interruptionRisk: 0.35,
    confidence: 0.7,
  },
};

export function buildExecutiveCuriosities({
  projectId,
  graph,
  messages,
  memories,
  existingCuriosities = [],
}: BuildExecutiveCuriosityInput): ExecutiveCuriosityItem[] {
  const seeds = Object.values(graph.modules)
    .filter((module) => module.score < 60)
    .map((module) =>
      createSeedFromModule(
        module.id,
        module.title,
        module.score
      )
    )
    .filter(
      (seed): seed is CuriositySeed =>
        Boolean(seed)
    );

  const adjustedSeeds = seeds.map((seed) =>
    adjustSeedWithContext(
      seed,
      messages,
      memories
    )
  );

  const newCuriosities = adjustedSeeds
    .filter(
      (seed) =>
        !curiosityAlreadyExists(
          seed,
          existingCuriosities
        )
    )
    .map((seed) =>
      createCuriosityItem(
        projectId,
        seed
      )
    )
    .sort(
      (a, b) =>
        b.score.total - a.score.total
    );

  return newCuriosities;
}

export function selectNextBestIntervention(
  projectId: string,
  curiosities: ExecutiveCuriosityItem[]
): ExecutiveIntervention | null {
  const eligibleCuriosities =
    curiosities
      .filter(
        (curiosity) =>
          curiosity.status === 'active' ||
          curiosity.status === 'urgent' ||
          curiosity.status === 'latent' ||
          curiosity.status ===
            'partially-resolved'
      )
      .sort(
        (a, b) =>
          b.score.total - a.score.total
      );

  const selected =
    eligibleCuriosities[0];

  if (!selected) {
    return null;
  }

  const interventionType =
    chooseInterventionType(selected);

  return {
    id: createId(),
    projectId,
    type: interventionType,
    objective:
      `Comprender mejor: ${selected.topic}`,
    message:
      selected.suggestedPrompt,
    curiosityId: selected.id,
    rationale: selected.reason,
    confidence: selected.confidence,
    createdAt: now(),
    outcome: 'not-delivered',
  };
}

function createSeedFromModule(
  moduleId: string,
  moduleTitle: string,
  score: number
): CuriositySeed | null {
  const template =
    MODULE_CURIOSITY_MAP[moduleId];

  if (!template) {
    return null;
  }

  return {
    ...template,
    moduleId,
    reason:
      score === 0
        ? `${moduleTitle} todavía no tiene información suficiente y puede limitar decisiones posteriores.`
        : `${moduleTitle} tiene señales iniciales, pero todavía necesita mayor claridad.`,
  } as CuriositySeed;
}

function adjustSeedWithContext(
  seed: CuriositySeed,
  messages: ConversationMessage[],
  memories: ExecutiveMemoryItem[]
): CuriositySeed {
  const recentConversation =
    messages
      .slice(-6)
      .map((message) =>
        String(message.content)
      )
      .join(' ')
      .toLowerCase();

  const memoryText =
    memories
      .filter(
        (memory) =>
          memory.status === 'active' ||
          memory.status === 'confirmed'
      )
      .map((memory) =>
        `${memory.summary} ${memory.detail || ''}`
      )
      .join(' ')
      .toLowerCase();

  const normalizedTopic =
    seed.topic.toLowerCase();

  const appearsInConversation =
    recentConversation.includes(
      normalizedTopic
    );

  const appearsInMemory =
    memoryText.includes(
      normalizedTopic
    );

  return {
    ...seed,

    urgency: normalizeScore(
      seed.urgency +
        (appearsInConversation
          ? -0.15
          : 0)
    ),

    uncertaintyReduction:
      normalizeScore(
        seed.uncertaintyReduction +
          (appearsInMemory
            ? -0.2
            : 0)
      ),

    interruptionRisk:
      normalizeScore(
        seed.interruptionRisk +
          (appearsInConversation
            ? 0.15
            : 0)
      ),

    confidence:
      normalizeScore(
        seed.confidence +
          (appearsInMemory
            ? -0.1
            : 0)
      ),
  };
}

function createCuriosityItem(
  projectId: string,
  seed: CuriositySeed
): ExecutiveCuriosityItem {
  const timestamp = now();

  const score =
    calculateCuriosityScore(seed);

  return {
    id: createId(),

    projectId,

    type: seed.type,

    topic: seed.topic,

    reason: seed.reason,

    status:
      score.total >= 0.75
        ? 'urgent'
        : score.total >= 0.55
          ? 'active'
          : 'latent',

    priority: score.total,

    confidence: seed.confidence,

    score,

    evidence: [
      {
        sourceType:
          'project-graph',

        referenceId:
          seed.moduleId,

        label:
          'Área con información insuficiente',

        confidence:
          seed.confidence,
      },
    ],

    possibleInterventions:
      seed.possibleInterventions,

    suggestedPrompt:
      seed.suggestedPrompt,

    askedCount: 0,

    createdAt: timestamp,

    updatedAt: timestamp,
  };
}

function calculateCuriosityScore(
  seed: CuriositySeed
): ExecutiveCuriosityScore {
  const positive =
    seed.impact * 0.25 +
    seed.urgency * 0.2 +
    seed.uncertaintyReduction * 0.25 +
    seed.unblockPotential * 0.2;

  const negative =
    seed.cognitiveCost * 0.05 +
    seed.interruptionRisk * 0.05;

  const total =
    normalizeScore(
      positive - negative
    );

  return {
    impact: seed.impact,
    urgency: seed.urgency,
    uncertaintyReduction:
      seed.uncertaintyReduction,
    unblockPotential:
      seed.unblockPotential,
    cognitiveCost:
      seed.cognitiveCost,
    interruptionRisk:
      seed.interruptionRisk,
    total,
  };
}

function chooseInterventionType(
  curiosity: ExecutiveCuriosityItem
): ExecutiveInterventionType {
  if (
    curiosity.askedCount > 1 &&
    curiosity.possibleInterventions.includes(
      'wait'
    )
  ) {
    return 'wait';
  }

  if (
    curiosity.status ===
      'partially-resolved' &&
    curiosity.possibleInterventions.includes(
      'deepen'
    )
  ) {
    return 'deepen';
  }

  return (
    curiosity.possibleInterventions[0] ||
    'ask'
  );
}

function curiosityAlreadyExists(
  seed: CuriositySeed,
  existingCuriosities:
    ExecutiveCuriosityItem[]
): boolean {
  const normalizedTopic =
    normalizeText(seed.topic);

  return existingCuriosities.some(
    (curiosity) =>
      normalizeText(
        curiosity.topic
      ) === normalizedTopic &&
      curiosity.status !==
        'invalidated'
  );
}

function normalizeText(
  value: string
): string {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(
      /[\u0300-\u036f]/g,
      ''
    )
    .replace(/\s+/g, ' ');
}

function normalizeScore(
  value: number
): number {
  return Math.max(
    0,
    Math.min(1, value)
  );
}