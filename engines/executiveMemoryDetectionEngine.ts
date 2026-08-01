import type {
  ConversationMessage,
  ProjectGraph,
} from '../types/project';

import type {
  CreateExecutiveMemoryInput,
  ExecutiveMemoryType,
} from '../types/executiveMemory';

interface DetectExecutiveMemoriesInput {
  projectId: string;
  graph: ProjectGraph;
  messages: ConversationMessage[];
}

interface MemoryPattern {
  type: ExecutiveMemoryType;
  expressions: RegExp[];
}

const MEMORY_PATTERNS:
  MemoryPattern[] = [
    {
      type: 'decision',

      expressions: [
        /\bdecidi\b/,
        /\bdecidimos\b/,
        /\bhe decidido\b/,
        /\bhemos decidido\b/,
        /\bla decision es\b/,
        /\bdecision tomada\b/,
        /\bacordamos\b/,
        /\bhemos acordado\b/,
        /\bdefinimos\b/,
        /\bhemos definido\b/,
        /\bqueda definido\b/,
        /\belegimos\b/,
        /\bescogimos\b/,
        /\bseleccionamos\b/,
        /\bse hara\b/,
        /\bse realizara\b/,
        /\bsera en\b/,
        /\bvamos a usar\b/,
      ],
    },

    {
      type: 'hypothesis',

      expressions: [
        /\bcreemos que\b/,
        /\bcreo que\b/,
        /\bpensamos que\b/,
        /\bla hipotesis\b/,
        /\bpodria funcionar\b/,
        /\bprobablemente\b/,
      ],
    },

    {
      type: 'constraint',

      expressions: [
        /\bno tenemos\b/,
        /\bno existe\b/,
        /\bsolo contamos con\b/,
        /\bel limite\b/,
        /\bno podemos\b/,
        /\bdepende de\b/,
      ],
    },

    {
      type: 'criterion',

      expressions: [
        /\bsolo si\b/,
        /\bsiempre que\b/,
        /\bdebe cumplir\b/,
        /\bel criterio\b/,
        /\bno deberia\b/,
        /\bes importante que\b/,
      ],
    },

    {
      type: 'risk',

      expressions: [
        /\bel riesgo\b/,
        /\bpodria salir mal\b/,
        /\bpuede afectar\b/,
        /\bnos preocupa\b/,
        /\bpodria impedir\b/,
      ],
    },

    {
      type: 'opportunity',

      expressions: [
        /\bla oportunidad\b/,
        /\bpodemos aprovechar\b/,
        /\bpodria abrir\b/,
        /\bnos permitiria\b/,
        /\bexiste la posibilidad\b/,
      ],
    },

    {
      type: 'commitment',

      expressions: [
        /\bme comprometo\b/,
        /\bse encargara\b/,
        /\bqueda responsable\b/,
        /\bva a entregar\b/,
        /\bdebe hacer\b/,
      ],
    },

    {
      type: 'direction-change',

      expressions: [
        /\ben lugar de\b/,
        /\bcambiamos\b/,
        /\bya no\b/,
        /\bahora sera\b/,
        /\bantes.*ahora\b/,
      ],
    },

    {
      type: 'learning',

      expressions: [
        /\baprendimos\b/,
        /\bnos dimos cuenta\b/,
        /\bfunciona mejor\b/,
        /\bdescubrimos\b/,
        /\bla leccion\b/,
      ],
    },

    {
      type: 'priority',

      expressions: [
        /\bla prioridad\b/,
        /\blo primero\b/,
        /\bantes de\b/,
        /\blo mas importante\b/,
        /\bdebemos comenzar\b/,
      ],
    },

    {
      type: 'open-question',

      expressions: [
        /\bno sabemos\b/,
        /\bfalta definir\b/,
        /\bqueda por resolver\b/,
        /\bdebemos averiguar\b/,
        /\bno esta claro\b/,
      ],
    },
  ];

export function detectExecutiveMemoryCandidates({
  projectId,
  graph,
  messages,
}: DetectExecutiveMemoriesInput): CreateExecutiveMemoryInput[] {
  const userMessages =
    messages.filter(
      (message) =>
        message.role === 'user'
    );

  const latestMessages =
    userMessages.slice(-12);

  const candidates =
    latestMessages.flatMap(
      (message) =>
        detectFromMessage(
          projectId,
          message,
          graph
        )
    );

  return removeDuplicateCandidates(
    candidates
  );
}

function detectFromMessage(
  projectId: string,
  message: ConversationMessage,
  graph: ProjectGraph
): CreateExecutiveMemoryInput[] {
  const content = String(
    message.content
  ).trim();

  if (
    !content ||
    content.length < 12
  ) {
    return [];
  }

  const normalizedContent =
    normalizeForMatching(content);

  const matchedTypes =
    MEMORY_PATTERNS.filter(
      (pattern) =>
        pattern.expressions.some(
          (expression) =>
            expression.test(
              normalizedContent
            )
        )
    );

  return matchedTypes.map(
    (pattern) => ({
      projectId,

      scope: 'project',

      type: pattern.type,

      summary:
        createMemorySummary(
          content,
          pattern.type
        ),

      detail: content,

      reason: buildReason(
        pattern.type,
        graph.title
      ),

      confidence:
        getInitialConfidence(
          pattern.type,
          normalizedContent
        ),

      source: {
        type: 'conversation',

        referenceId:
          getMessageReference(
            message
          ),

        label:
          'Detectado desde la conversación',

        excerpt:
          truncate(
            content,
            240
          ),
      },

      tags: [
        'automatic-detection',
        pattern.type,
      ],

      isSensitive: false,
    })
  );
}

function normalizeForMatching(
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
    .replace(
      /\bdicid/g,
      'decid'
    )
    .replace(/\s+/g, ' ');
}

function createMemorySummary(
  content: string,
  type: ExecutiveMemoryType
): string {
  const firstSentence =
    content
      .split(
        /(?<=[.!?])\s+/
      )
      .find(Boolean) ||
    content;

  const cleanSentence =
    truncate(
      firstSentence.trim(),
      180
    );

  return `${getTypePrefix(
    type
  )}: ${cleanSentence}`;
}

function getTypePrefix(
  type: ExecutiveMemoryType
): string {
  const labels: Record<
    ExecutiveMemoryType,
    string
  > = {
    decision:
      'Decisión detectada',

    hypothesis:
      'Hipótesis detectada',

    constraint:
      'Restricción detectada',

    criterion:
      'Criterio detectado',

    risk:
      'Riesgo detectado',

    opportunity:
      'Oportunidad detectada',

    commitment:
      'Compromiso detectado',

    contradiction:
      'Contradicción detectada',

    'direction-change':
      'Cambio de dirección detectado',

    learning:
      'Aprendizaje detectado',

    priority:
      'Prioridad detectada',

    'open-question':
      'Pregunta abierta detectada',
  };

  return labels[type];
}

function buildReason(
  type: ExecutiveMemoryType,
  projectTitle: string
): string {
  return (
    `Creative OS detectó una posible ${type} ` +
    `dentro de la conversación de "${projectTitle}". ` +
    'Debe validarse antes de influir en futuras decisiones.'
  );
}

function getInitialConfidence(
  type: ExecutiveMemoryType,
  normalizedContent: string
): number {
  if (
    type === 'decision' &&
    /\b(decidimos|he decidido|hemos decidido|la decision es|acordamos|definimos|elegimos|escogimos|seleccionamos|se hara|se realizara)\b/.test(
      normalizedContent
    )
  ) {
    return 0.86;
  }

  if (
    type === 'hypothesis' ||
    type === 'open-question'
  ) {
    return 0.55;
  }

  return 0.65;
}

function removeDuplicateCandidates(
  candidates:
    CreateExecutiveMemoryInput[]
): CreateExecutiveMemoryInput[] {
  const seen = new Set<string>();

  return candidates.filter(
    (candidate) => {
      const key = [
        candidate.projectId,
        candidate.type,
        normalizeForMatching(
          candidate.summary
        ),
      ].join(':');

      if (seen.has(key)) {
        return false;
      }

      seen.add(key);

      return true;
    }
  );
}

function getMessageReference(
  message: ConversationMessage
): string | undefined {
  if (
    'id' in message &&
    typeof message.id ===
      'string'
  ) {
    return message.id;
  }

  return undefined;
}

function truncate(
  value: string,
  maximumLength: number
): string {
  if (
    value.length <=
    maximumLength
  ) {
    return value;
  }

  return `${value
    .slice(
      0,
      maximumLength - 1
    )
    .trim()}…`;
}