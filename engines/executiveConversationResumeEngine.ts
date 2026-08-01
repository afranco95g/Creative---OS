import {
  ExecutiveConversationState,
  ExecutiveCuriosityItem,
  ExecutiveIntervention,
} from '../types/executiveCuriosity';
import {
  ExecutiveMemoryItem,
} from '../types/executiveMemory';
import {
  ConversationMessage,
  ProjectGraph,
} from '../types/project';

export interface ExecutiveSessionResume {
  hasPreviousContext: boolean;

  title: string;

  summary: string;

  understoodTopics: string[];

  openTopics: string[];

  lastIntervention?: ExecutiveIntervention;

  nextIntervention?: ExecutiveIntervention;

  suggestedMessage: string;
}

interface BuildExecutiveSessionResumeInput {
  graph: ProjectGraph;

  messages: ConversationMessage[];

  conversationState:
    ExecutiveConversationState;

  memories: ExecutiveMemoryItem[];

  curiosities: ExecutiveCuriosityItem[];
}

export function buildExecutiveSessionResume({
  graph,
  messages,
  conversationState,
  memories,
  curiosities,
}: BuildExecutiveSessionResumeInput):
  ExecutiveSessionResume {
  const hasPreviousContext =
    messages.length > 0 ||
    memories.length > 0 ||
    curiosities.length > 0;

  if (!hasPreviousContext) {
    return buildFirstSessionResume(
      graph
    );
  }

  const understoodTopics =
    buildUnderstoodTopics(
      conversationState,
      memories
    );

  const openTopics =
    buildOpenTopics(
      conversationState,
      curiosities
    );

  const lastIntervention =
    conversationState.understanding
      .lastIntervention;

  const nextIntervention =
    conversationState.understanding
      .nextBestIntervention;

  const summary =
    buildSessionSummary(
      graph,
      understoodTopics,
      openTopics
    );

  return {
    hasPreviousContext: true,

    title: 'Retomemos desde donde quedamos',

    summary,

    understoodTopics,

    openTopics,

    lastIntervention,

    nextIntervention,

    suggestedMessage:
      buildSuggestedResumeMessage(
        graph,
        understoodTopics,
        openTopics,
        nextIntervention
      ),
  };
}

function buildFirstSessionResume(
  graph: ProjectGraph
): ExecutiveSessionResume {
  const projectTitle =
    graph.title || 'este proyecto';

  return {
    hasPreviousContext: false,

    title: 'Comencemos la conversación',

    summary:
      `Todavía estamos construyendo el contexto inicial de ${projectTitle}.`,

    understoodTopics: [],

    openTopics: [],

    suggestedMessage:
      'Cuéntame lo que tengas en mente. Iré organizando el proyecto mientras conversamos y te haré preguntas únicamente cuando puedan ayudar a avanzar.',
  };
}

function buildUnderstoodTopics(
  conversationState:
    ExecutiveConversationState,
  memories: ExecutiveMemoryItem[]
): string[] {
  const stateTopics =
    conversationState.understanding
      .understoodTopics || [];

  const memoryTopics =
    memories
      .filter(
        (memory) =>
          memory.status === 'active' ||
          memory.status === 'confirmed'
      )
      .slice(0, 5)
      .map((memory) =>
        cleanMemorySummary(
          memory.summary
        )
      );

  return unique([
    ...stateTopics,
    ...memoryTopics,
  ]).slice(0, 5);
}

function buildOpenTopics(
  conversationState:
    ExecutiveConversationState,
  curiosities: ExecutiveCuriosityItem[]
): string[] {
  const stateTopics = [
    ...(
      conversationState.understanding
        .partiallyUnderstoodTopics || []
    ),
    ...(
      conversationState.understanding
        .unresolvedTopics || []
    ),
  ];

  const curiosityTopics =
    curiosities
      .filter(
        (curiosity) =>
          curiosity.status === 'active' ||
          curiosity.status === 'urgent' ||
          curiosity.status ===
            'partially-resolved'
      )
      .sort(
        (a, b) =>
          b.score.total -
          a.score.total
      )
      .slice(0, 5)
      .map(
        (curiosity) =>
          curiosity.topic
      );

  return unique([
    ...stateTopics,
    ...curiosityTopics,
  ]).slice(0, 5);
}

function buildSessionSummary(
  graph: ProjectGraph,
  understoodTopics: string[],
  openTopics: string[]
): string {
  const projectTitle =
    graph.title || 'El proyecto';

  if (
    understoodTopics.length === 0 &&
    openTopics.length === 0
  ) {
    return `${projectTitle} conserva contexto previo, pero todavía necesitamos organizar mejor qué quedó claro y qué sigue abierto.`;
  }

  if (understoodTopics.length === 0) {
    return `${projectTitle} tiene varios frentes todavía abiertos. La conversación puede continuar libremente mientras Creative OS reorganiza las prioridades.`;
  }

  if (openTopics.length === 0) {
    return `${projectTitle} ya tiene una base de comprensión útil. Podemos continuar hacia decisiones, producción o validación externa.`;
  }

  return `${projectTitle} ya tiene algunas definiciones importantes y todavía conserva varios frentes abiertos. Podemos retomar la prioridad sugerida o continuar por cualquier otro tema.`;
}

function buildSuggestedResumeMessage(
  graph: ProjectGraph,
  understoodTopics: string[],
  openTopics: string[],
  nextIntervention:
    ExecutiveIntervention | undefined
): string {
  const projectTitle =
    graph.title || 'el proyecto';

  const understoodText =
    buildUnderstoodSentence(
      understoodTopics
    );

  const openText =
    buildOpenSentence(
      openTopics
    );

  const interventionText =
    nextIntervention?.message
      ? ` En este momento me interesa explorar ${nextIntervention.objective.toLowerCase()}.`
      : '';

  return [
    `La última vez estuvimos trabajando en ${projectTitle}.`,
    understoodText,
    openText,
    interventionText,
    'Podemos retomar ese frente o continuar por cualquier tema; reorganizaré mi comprensión mientras conversamos.',
  ]
    .filter(Boolean)
    .join(' ');
}

function buildUnderstoodSentence(
  topics: string[]
): string {
  if (topics.length === 0) {
    return '';
  }

  if (topics.length === 1) {
    return `Ya tengo mayor claridad sobre ${topics[0]}.`;
  }

  return `Ya tengo mayor claridad sobre ${joinNaturalList(
    topics.slice(0, 3)
  )}.`;
}

function buildOpenSentence(
  topics: string[]
): string {
  if (topics.length === 0) {
    return '';
  }

  if (topics.length === 1) {
    return `Todavía queda abierto ${topics[0]}.`;
  }

  return `Todavía quedan abiertos ${joinNaturalList(
    topics.slice(0, 3)
  )}.`;
}

function cleanMemorySummary(
  value: string
): string {
  return value
    .replace(
      /^(decisión detectada|hipótesis detectada|prioridad detectada|restricción detectada|riesgo detectado|oportunidad detectada|aprendizaje detectado|compromiso detectado|cambio de dirección detectado|pregunta abierta detectada):\s*/i,
      ''
    )
    .trim();
}

function joinNaturalList(
  items: string[]
): string {
  if (items.length === 0) {
    return '';
  }

  if (items.length === 1) {
    return items[0];
  }

  if (items.length === 2) {
    return `${items[0]} y ${items[1]}`;
  }

  return `${items
    .slice(0, -1)
    .join(', ')} y ${items.at(-1)}`;
}

function unique(
  items: string[]
): string[] {
  const seen =
    new Set<string>();

  return items.filter((item) => {
    const normalized =
      normalizeText(item);

    if (
      !normalized ||
      seen.has(normalized)
    ) {
      return false;
    }

    seen.add(normalized);

    return true;
  });
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