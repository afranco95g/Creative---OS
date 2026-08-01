import {
  BuildExecutiveConversationInput,
  ExecutiveConversationAction,
  ExecutiveConversationContext,
  ExecutiveConversationDecision,
  ExecutiveConversationIntervention,
  ExecutiveConversationMode,
  ExecutiveConversationResult,
  ExecutiveConversationSignal,
} from '../types/executiveConversation';
import {
  ExecutiveCuriosityItem,
} from '../types/executiveCuriosity';
import {
  ExecutiveMemoryItem,
} from '../types/executiveMemory';
import {
  ConversationMessage,
} from '../types/project';
import {
  buildExecutiveSessionResume,
} from './executiveConversationResumeEngine';
import {
  createId,
  now,
} from '../core/projectEngine';

const DEFAULT_POLICY = {
  minimumDeliveryConfidence: 0.55,
  maximumCognitiveCost: 0.75,
  maximumInterruptionRisk: 0.7,
  maximumRepetitionRisk: 0.65,
  maximumQuestionsPerIntervention: 1,
  recentMessageWindow: 6,
  allowSilence: true,
  allowTopicChange: true,
  requireHumanValidationForDecisions: true,
};

export function buildExecutiveConversation(
  input: BuildExecutiveConversationInput
): ExecutiveConversationResult {
  const context =
    buildConversationContext(input);

  const decision =
    decideConversationAction(context);

  const intervention =
    buildIntervention(
      context,
      decision
    );

  return {
    context,

    decision,

    intervention,

    messageDraft:
      intervention?.message
        ? {
            id: createId(),

            projectId:
              intervention.projectId,

            action:
              intervention.action,

            objective:
              intervention.objective,

            message:
              intervention.message,

            rationale:
              intervention.rationale,

            confidence:
              intervention.confidence,

            relatedCuriosityId:
              intervention.relatedCuriosityId,

            relatedMemoryIds:
              intervention.relatedMemoryIds,

            createdAt: now(),
          }
        : null,

    shouldUpdateConversationState:
      Boolean(intervention),

    shouldUpdateCuriosity:
      Boolean(
        intervention?.relatedCuriosityId
      ),

    shouldCreateMemoryCandidate:
      shouldCreateMemoryCandidate(
        context
      ),
  };
}

function buildConversationContext(
  input: BuildExecutiveConversationInput
): ExecutiveConversationContext {
  const recentMessageWindow =
    DEFAULT_POLICY.recentMessageWindow;

  const recentMessages =
    input.messages.slice(
      -recentMessageWindow
    );

  const recentUserMessages =
    recentMessages.filter(
      (message) =>
        message.role === 'user'
    );

  const recentAssistantMessages =
    recentMessages.filter(
      (message) =>
        message.role === 'producer'
    );

  const currentUserMessage =
    input.currentUserMessage ||
    [...recentUserMessages].at(-1);

  const mode =
    input.mode ||
    determineMode(
      input.messages,
      input.conversationState
    );

  return {
    projectId: input.projectId,

    graph: input.graph,

    messages: input.messages,

    memories: input.memories,

    curiosities: input.curiosities,

    conversationState:
      input.conversationState,

    mode,

    currentUserMessage,

    recentUserMessages,

    recentAssistantMessages,

    signals:
      detectConversationSignals(
        currentUserMessage,
        recentUserMessages
      ),
  };
}

function determineMode(
  messages: ConversationMessage[],
  conversationState:
    BuildExecutiveConversationInput['conversationState']
): ExecutiveConversationMode {
  if (messages.length === 0) {
    return 'first-session';
  }

  const hasPreviousState =
    Boolean(
      conversationState.understanding
        .lastIntervention
    ) ||
    Boolean(
      conversationState.understanding
        .nextBestIntervention
    ) ||
    conversationState.curiosities.length > 0;

  if (hasPreviousState) {
    return 'resume-session';
  }

  return 'active-conversation';
}

function detectConversationSignals(
  currentUserMessage:
    ConversationMessage | undefined,
  recentUserMessages:
    ConversationMessage[]
): ExecutiveConversationSignal[] {
  if (!currentUserMessage) {
    return [];
  }

  const content =
    String(
      currentUserMessage.content
    ).trim();

  const signals:
    ExecutiveConversationSignal[] = [];

  if (content.length >= 500) {
    signals.push(
      createSignal(
        'long-message',
        'El usuario está desarrollando una idea extensa.',
        0.9,
        currentUserMessage
      )
    );
  }

  if (
    content.length > 0 &&
    content.length <= 40
  ) {
    signals.push(
      createSignal(
        'short-message',
        'El usuario respondió de forma breve.',
        0.75,
        currentUserMessage
      )
    );
  }

  if (
    /\b(decidí|he decidido|decidimos|la decisión es|vamos a)\b/i.test(
      content
    )
  ) {
    signals.push(
      createSignal(
        'decision-language',
        'El mensaje contiene lenguaje de decisión.',
        0.85,
        currentUserMessage
      )
    );
  }

  if (
    /\b(no sé|no sabemos|no está claro|falta definir|tengo dudas)\b/i.test(
      content
    )
  ) {
    signals.push(
      createSignal(
        'uncertainty-language',
        'El mensaje contiene una incertidumbre explícita.',
        0.85,
        currentUserMessage
      )
    );
  }

  if (
    /\b(terminemos|dejemos hasta aquí|continuamos después|cerramos|por hoy)\b/i.test(
      content
    )
  ) {
    signals.push(
      createSignal(
        'closing-language',
        'El usuario parece querer cerrar la sesión.',
        0.9,
        currentUserMessage
      )
    );
  }

  if (
    /\b(estoy pensando|quiero explorar|se me ocurre|podríamos|qué tal si)\b/i.test(
      content
    )
  ) {
    signals.push(
      createSignal(
        'exploration-language',
        'El usuario está explorando posibilidades.',
        0.8,
        currentUserMessage
      )
    );
  }

  if (
    content.includes('?')
  ) {
    signals.push(
      createSignal(
        'question',
        'El usuario formuló una pregunta directa.',
        0.95,
        currentUserMessage
      )
    );
  }

  if (
    recentUserMessages.length >= 2
  ) {
    const previousMessage =
      String(
        recentUserMessages[
          recentUserMessages.length - 2
        ].content
      );

    if (
      detectTopicChange(
        previousMessage,
        content
      )
    ) {
      signals.push(
        createSignal(
          'topic-change',
          'El usuario parece haber cambiado de frente conversacional.',
          0.6,
          currentUserMessage
        )
      );
    }
  }

  return signals;
}

function decideConversationAction(
  context: ExecutiveConversationContext
): ExecutiveConversationDecision {
  if (
    context.mode === 'first-session'
  ) {
    return {
      shouldDeliver: true,

      action: 'resume',

      reason: 'first-session',

      objective:
        'Abrir una conversación libre y no obligatoria.',

      rationale:
        'Todavía no existe contexto suficiente para formular una pregunta específica.',

      confidence: 0.95,

      cognitiveCost: 0.15,

      interruptionRisk: 0.05,

      repetitionRisk: 0,

      relatedMemoryIds: [],
    };
  }

  if (
    context.mode === 'resume-session'
  ) {
    return buildResumeDecision(
      context
    );
  }

  if (
    hasSignal(
      context,
      'closing-language'
    )
  ) {
    return {
      shouldDeliver: true,

      action: 'close',

      reason: 'summary-needed',

      objective:
        'Cerrar la sesión conservando continuidad.',

      rationale:
        'El usuario indicó que desea terminar o pausar la conversación.',

      confidence: 0.9,

      cognitiveCost: 0.25,

      interruptionRisk: 0.1,

      repetitionRisk:
        calculateRepetitionRisk(
          context,
          'close'
        ),

      relatedMemoryIds:
        getRelevantMemoryIds(
          context.memories
        ),
    };
  }

  if (
    hasCriticalContradiction(
      context.memories
    )
  ) {
    return {
      shouldDeliver: true,

      action: 'challenge',

      reason: 'contradiction',

      objective:
        'Hacer visible una contradicción que puede afectar decisiones futuras.',

      rationale:
        'Existe al menos un recuerdo ejecutivo contradicho que requiere validación humana.',

      confidence: 0.85,

      cognitiveCost: 0.55,

      interruptionRisk: 0.35,

      repetitionRisk:
        calculateRepetitionRisk(
          context,
          'challenge'
        ),

      relatedMemoryIds:
        getContradictedMemoryIds(
          context.memories
        ),
    };
  }

  if (
    hasSignal(
      context,
      'long-message'
    ) ||
    hasSignal(
      context,
      'exploration-language'
    )
  ) {
    return {
      shouldDeliver: true,

      action: 'reflect',

      reason: 'user-elaboration',

      objective:
        'Devolver una síntesis breve sin interrumpir el desarrollo de la idea.',

      rationale:
        'El usuario está elaborando o explorando una idea y conviene demostrar comprensión antes de preguntar.',

      confidence: 0.8,

      cognitiveCost: 0.25,

      interruptionRisk: 0.15,

      repetitionRisk:
        calculateRepetitionRisk(
          context,
          'reflect'
        ),

      relatedMemoryIds:
        getRelevantMemoryIds(
          context.memories
        ),
    };
  }

  const selectedCuriosity =
    selectHighestValueCuriosity(
      context.curiosities
    );

  if (selectedCuriosity) {
    return {
      shouldDeliver: true,

      action:
        selectActionForCuriosity(
          selectedCuriosity
        ),

      reason: 'active-curiosity',

      objective:
        `Comprender mejor: ${selectedCuriosity.topic}`,

      rationale:
        selectedCuriosity.reason,

      confidence:
        selectedCuriosity.confidence,

      cognitiveCost:
        selectedCuriosity.score
          .cognitiveCost,

      interruptionRisk:
        selectedCuriosity.score
          .interruptionRisk,

      repetitionRisk:
        calculateCuriosityRepetitionRisk(
          context,
          selectedCuriosity
        ),

      relatedCuriosityId:
        selectedCuriosity.id,

      relatedMemoryIds:
        getRelevantMemoryIds(
          context.memories
        ),
    };
  }

  return {
    shouldDeliver:
      !DEFAULT_POLICY.allowSilence,

    action: 'listen',

    reason: 'low-value',

    objective:
      'Escuchar y actualizar el contexto sin introducir una nueva pregunta.',

    rationale:
      'No existe una intervención con suficiente valor en este momento.',

    confidence: 0.7,

    cognitiveCost: 0,

    interruptionRisk: 0,

    repetitionRisk: 0,

    relatedMemoryIds: [],
  };
}

function buildResumeDecision(
  context: ExecutiveConversationContext
): ExecutiveConversationDecision {
  const resume =
    buildExecutiveSessionResume({
      graph: context.graph,

      messages: context.messages,

      conversationState:
        context.conversationState,

      memories: context.memories,

      curiosities:
        context.curiosities,
    });

  return {
    shouldDeliver: true,

    action: 'resume',

    reason: 'session-resume',

    objective:
      resume.hasPreviousContext
        ? 'Recuperar el último estado de la conversación.'
        : 'Abrir una primera conversación libre.',

    rationale:
      resume.summary,

    confidence: 0.9,

    cognitiveCost: 0.25,

    interruptionRisk: 0.1,

    repetitionRisk:
      calculateRepetitionRisk(
        context,
        'resume'
      ),

    relatedCuriosityId:
      resume.nextIntervention
        ?.curiosityId,

    relatedMemoryIds:
      getRelevantMemoryIds(
        context.memories
      ),
  };
}

function buildIntervention(
  context: ExecutiveConversationContext,
  decision: ExecutiveConversationDecision
): ExecutiveConversationIntervention | null {
  const shouldDeliver =
    passesDeliveryPolicy(
      decision
    );

  if (
    !shouldDeliver &&
    decision.action !== 'listen'
  ) {
    return {
      id: createId(),

      projectId:
        context.projectId,

      mode: context.mode,

      action:
        decision.action,

      reason:
        decision.reason,

      objective:
        decision.objective,

      rationale:
        decision.rationale,

      confidence:
        decision.confidence,

      shouldDeliver: false,

      deliveryStatus:
        'suppressed',

      relatedCuriosityId:
        decision.relatedCuriosityId,

      relatedMemoryIds:
        decision.relatedMemoryIds,

      createdAt: now(),
    };
  }

  if (
    decision.action === 'listen'
  ) {
    return null;
  }

  const message =
    buildInterventionMessage(
      context,
      decision
    );

  return {
    id: createId(),

    projectId:
      context.projectId,

    mode:
      context.mode,

    action:
      decision.action,

    reason:
      decision.reason,

    objective:
      decision.objective,

    message,

    rationale:
      decision.rationale,

    confidence:
      decision.confidence,

    shouldDeliver: true,

    deliveryStatus:
      'pending',

    relatedCuriosityId:
      decision.relatedCuriosityId,

    relatedMemoryIds:
      decision.relatedMemoryIds,

    createdAt: now(),
  };
}

function buildInterventionMessage(
  context: ExecutiveConversationContext,
  decision: ExecutiveConversationDecision
): string {
  if (
    decision.action === 'resume'
  ) {
    return buildExecutiveSessionResume({
      graph: context.graph,

      messages: context.messages,

      conversationState:
        context.conversationState,

      memories: context.memories,

      curiosities:
        context.curiosities,
    }).suggestedMessage;
  }

  if (
    decision.action === 'reflect'
  ) {
    return buildReflectionMessage(
      context
    );
  }

  if (
    decision.action === 'close'
  ) {
    return buildClosingMessage(
      context
    );
  }

  if (
    decision.action === 'challenge'
  ) {
    return buildContradictionMessage(
      context.memories
    );
  }

  const curiosity =
    context.curiosities.find(
      (item) =>
        item.id ===
        decision.relatedCuriosityId
    );

  if (
    curiosity?.suggestedPrompt
  ) {
    return addFreedomClause(
      curiosity.suggestedPrompt
    );
  }

  return addFreedomClause(
    decision.objective
  );
}

function buildReflectionMessage(
  context: ExecutiveConversationContext
): string {
  const currentMessage =
    context.currentUserMessage
      ? String(
          context.currentUserMessage
            .content
        ).trim()
      : '';

  const summary =
    truncate(
      currentMessage,
      220
    );

  if (!summary) {
    return 'Estoy organizando lo que acabas de plantear. Puedes continuar desarrollando la idea y actualizaré el proyecto mientras conversamos.';
  }

  return `Entiendo que estás planteando lo siguiente: ${summary} Seguiré organizando esta información. Puedes continuar por ese frente o cambiar de tema; reorganizaré el proyecto mientras conversamos.`;
}

function buildClosingMessage(
  context: ExecutiveConversationContext
): string {
  const activeCuriosity =
    selectHighestValueCuriosity(
      context.curiosities
    );

  if (!activeCuriosity) {
    return 'Dejamos la sesión con el contexto actualizado. Cuando regreses, retomaremos desde este mismo punto sin empezar de cero.';
  }

  return `Dejamos la sesión con el contexto actualizado. El frente que permanece más abierto es ${activeCuriosity.topic}. Cuando regreses podemos retomarlo o continuar por cualquier otro tema.`;
}

function buildContradictionMessage(
  memories: ExecutiveMemoryItem[]
): string {
  const contradiction =
    memories.find(
      (memory) =>
        memory.status ===
          'contradicted' ||
        memory.type ===
          'contradiction'
    );

  if (!contradiction) {
    return 'Detecté una posible contradicción entre decisiones recientes. Conviene revisarla antes de seguir avanzando.';
  }

  return `Detecté una tensión que conviene revisar: ${contradiction.summary} Esto puede representar un cambio de criterio, no necesariamente un error. ¿Quieres reemplazar la decisión anterior o explorar ambas posibilidades?`;
}

function passesDeliveryPolicy(
  decision: ExecutiveConversationDecision
): boolean {
  return Boolean(
    decision.shouldDeliver &&
      decision.confidence >=
        DEFAULT_POLICY.minimumDeliveryConfidence &&
      decision.cognitiveCost <=
        DEFAULT_POLICY.maximumCognitiveCost &&
      decision.interruptionRisk <=
        DEFAULT_POLICY.maximumInterruptionRisk &&
      decision.repetitionRisk <=
        DEFAULT_POLICY.maximumRepetitionRisk
  );
}

function selectHighestValueCuriosity(
  curiosities: ExecutiveCuriosityItem[]
): ExecutiveCuriosityItem | null {
  return (
    [...curiosities]
      .filter(
        (curiosity) =>
          curiosity.status ===
            'urgent' ||
          curiosity.status ===
            'active' ||
          curiosity.status ===
            'partially-resolved'
      )
      .sort(
        (a, b) =>
          b.score.total -
          a.score.total
      )[0] || null
  );
}

function selectActionForCuriosity(
  curiosity: ExecutiveCuriosityItem
): ExecutiveConversationAction {
  if (
    curiosity.status ===
      'partially-resolved' &&
    curiosity.possibleInterventions.includes(
      'deepen'
    )
  ) {
    return 'deepen';
  }

  if (
    curiosity.askedCount > 0 &&
    curiosity.possibleInterventions.includes(
      'connect'
    )
  ) {
    return 'connect';
  }

  return (
    curiosity.possibleInterventions[0] ||
    'ask'
  );
}

function calculateRepetitionRisk(
  context: ExecutiveConversationContext,
  action: ExecutiveConversationAction
): number {
  const recentAssistantText =
    context.recentAssistantMessages
      .map((message) =>
        String(message.content)
      )
      .join(' ')
      .toLowerCase();

  if (
    recentAssistantText.includes(
      action.toLowerCase()
    )
  ) {
    return 0.65;
  }

  return 0.15;
}

function calculateCuriosityRepetitionRisk(
  context: ExecutiveConversationContext,
  curiosity: ExecutiveCuriosityItem
): number {
  if (
    curiosity.askedCount >= 2
  ) {
    return 0.85;
  }

  const recentAssistantText =
    context.recentAssistantMessages
      .map((message) =>
        String(message.content)
      )
      .join(' ')
      .toLowerCase();

  const normalizedTopic =
    curiosity.topic
      .trim()
      .toLowerCase();

  if (
    recentAssistantText.includes(
      normalizedTopic
    )
  ) {
    return 0.75;
  }

  return curiosity.askedCount > 0
    ? 0.5
    : 0.15;
}

function hasCriticalContradiction(
  memories: ExecutiveMemoryItem[]
): boolean {
  return memories.some(
    (memory) =>
      memory.status ===
        'contradicted' ||
      (
        memory.type ===
          'contradiction' &&
        (
          memory.status ===
            'active' ||
          memory.status ===
            'confirmed'
        )
      )
  );
}

function getContradictedMemoryIds(
  memories: ExecutiveMemoryItem[]
): string[] {
  return memories
    .filter(
      (memory) =>
        memory.status ===
          'contradicted' ||
        memory.type ===
          'contradiction'
    )
    .map(
      (memory) =>
        memory.id
    )
    .slice(0, 5);
}

function getRelevantMemoryIds(
  memories: ExecutiveMemoryItem[]
): string[] {
  return memories
    .filter(
      (memory) =>
        memory.status ===
          'active' ||
        memory.status ===
          'confirmed'
    )
    .slice(0, 5)
    .map(
      (memory) =>
        memory.id
    );
}

function shouldCreateMemoryCandidate(
  context: ExecutiveConversationContext
): boolean {
  return (
    hasSignal(
      context,
      'decision-language'
    ) ||
    hasSignal(
      context,
      'uncertainty-language'
    )
  );
}

function hasSignal(
  context: ExecutiveConversationContext,
  type:
    ExecutiveConversationSignal['type']
): boolean {
  return context.signals.some(
    (signal) =>
      signal.type === type
  );
}

function createSignal(
  type:
    ExecutiveConversationSignal['type'],
  description: string,
  confidence: number,
  message: ConversationMessage
): ExecutiveConversationSignal {
  return {
    id: createId(),

    type,

    description,

    confidence,

    sourceMessageId:
      getMessageId(message),
  };
}

function getMessageId(
  message: ConversationMessage
): string | undefined {
  if (
    'id' in message &&
    typeof message.id === 'string'
  ) {
    return message.id;
  }

  return undefined;
}

function detectTopicChange(
  previousMessage: string,
  currentMessage: string
): boolean {
  const previousWords =
    extractRelevantWords(
      previousMessage
    );

  const currentWords =
    extractRelevantWords(
      currentMessage
    );

  if (
    previousWords.length === 0 ||
    currentWords.length === 0
  ) {
    return false;
  }

  const sharedWords =
    currentWords.filter(
      (word) =>
        previousWords.includes(word)
    );

  const overlap =
    sharedWords.length /
    Math.max(
      previousWords.length,
      currentWords.length
    );

  return overlap < 0.1;
}

function extractRelevantWords(
  value: string
): string[] {
  return Array.from(
    new Set(
      value
        .toLowerCase()
        .normalize('NFD')
        .replace(
          /[\u0300-\u036f]/g,
          ''
        )
        .replace(
          /[^a-z0-9ñ\s]/g,
          ' '
        )
        .split(/\s+/)
        .filter(
          (word) =>
            word.length >= 5
        )
    )
  );
}

function addFreedomClause(
  message: string
): string {
  const cleanMessage =
    message.trim();

  return `${cleanMessage} Podemos explorar ese frente o continuar por cualquier otro tema; reorganizaré el proyecto mientras conversamos.`;
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