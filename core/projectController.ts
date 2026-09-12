import type {
  ConversationMessage,
  ProducerResponse,
  KnowledgeGuidance,
  ProjectGraph,
  ProjectModuleId,
  ProjectPatch,
} from '../types/project';

import {
  runProductionPipeline,
} from '../engines/productionPipeline';

import {
  processConversationTurn,
} from '../engines/conversationEngine';

import {
  analyzeProject,
} from '../engines/executiveBrain';

import type {
  ExecutiveInsight,
} from '../engines/executiveBrain';

import {
  getNextBestQuestion,
  getQuestionIntent,
  isQuestionAlreadyAnswered,
  MODULO_POR_INTENCION,
} from '../engines/questionEngine';

import {
  encontrarPreguntaPorTexto,
  esRespuestaNoSe,
  SIN_RESPUESTA_POR_AHORA,
} from '../engines/openingBlockEngine';

import type {
  PreguntaDeApertura,
} from '../engines/openingBlockEngine';

import {
  getProjectProgress,
  getStrongModules,
  getWeakModules,
} from './projectEngine';

import {
  executeActions,
} from './actionEngine';

import type {
  ProjectAction,
} from './actionEngine';

export interface ProjectControllerState {
  graph: ProjectGraph;
  messages: ConversationMessage[];
  executiveInsight: ExecutiveInsight;
  progress: number;
}

export interface ProjectControllerTurnResult {
  state: ProjectControllerState;
  newMessages: ConversationMessage[];
  response: ProducerResponse;
}

const DECISION_EXPRESSIONS:
  RegExp[] = [
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
  ];

export function createProjectControllerState(
  graph: ProjectGraph
): ProjectControllerState {
  return {
    graph,

    messages: [],

    executiveInsight:
      analyzeProject(
        graph,
        []
      ),

    progress:
      getProjectProgress(graph),
  };
}

export function processProjectMessage(
  currentState:
    ProjectControllerState,
  userInput: string,
  knowledge?: KnowledgeGuidance
): ProjectControllerTurnResult {
  const cleanInput =
    userInput.trim();

  if (!cleanInput) {
    const response:
      ProducerResponse = {
        understood:
          'No recibí nueva información para integrar al proyecto.',

        organized:
          buildOrganizedList(
            currentState.graph
          ),

        gaps:
          buildGapList(
            currentState.graph
          ),

        nextQuestion:
          getNextBestQuestion(
            currentState.graph,
            currentState.messages
          ),
      };

    return {
      state: currentState,
      newMessages: [],
      response,
    };
  }

  // Spec no-se-sin-colateral.md, 5.2: si la última pregunta hecha fue una
  // del bloque de apertura y la respuesta de este turno es "no sé", se
  // desactiva el patch de respaldo de `extractProjectPatchesFromMessage`
  // (engines/conversationEngine.ts, catch-all de las líneas 494-501) para
  // que ese turno no escriba nada en ningún módulo distinto al de la
  // pregunta respondida. Sin el patch de respaldo, un "no sé" puede terminar
  // el turno con cero patches, y eso es correcto: no hay colateral que
  // revertir porque nunca se genera. El valor se calcula una sola vez, antes
  // de `processConversationTurn`, y se reutiliza más abajo en la acción
  // contextual de `inferContextualAnswerActions` (spec
  // bloque-de-apertura-y-extraccion.md, 5.3) en vez de volver a llamar a
  // `encontrarPreguntaDeAperturaPreguntada` con el mismo resultado.
  const preguntaDeAperturaRespondida =
    encontrarPreguntaDeAperturaPreguntada(
      currentState.messages
    );

  const respuestaNoSeDeApertura =
    preguntaDeAperturaRespondida !== null &&
    esRespuestaNoSe(cleanInput);

  // Spec respuestas-al-modulo-correcto.md, 5.1 y 5.3: el módulo de la
  // pregunta que se acaba de hacer (si la hubo, y si mapea a un módulo) es
  // el destino del patch de respaldo — nunca el módulo más débil del grafo.
  const resultadoPreguntaHecha =
    resultadoDePreguntaHecha(
      currentState.messages
    );

  const conversationResult =
    processConversationTurn(
      cleanInput,
      currentState.graph,
      {
        sinPatchDeRespaldo: respuestaNoSeDeApertura,
        moduloDeRespaldo: resultadoPreguntaHecha.modulo,
      }
    );

  const conversationGraph =
    conversationResult.nextGraph;

  const contextualActions =
    inferContextualAnswerActions(
      currentState,
      conversationGraph,
      cleanInput,
      conversationResult.patches,
      preguntaDeAperturaRespondida,
      resultadoPreguntaHecha
    );

  const decisionActions =
    inferDecisionActions(
      currentState.graph,
      cleanInput,
      conversationResult.patches
    );

  const inferredActions =
    inferActionsFromGraph(
      conversationGraph
    );

  const nextGraph =
    executeActions(
      conversationGraph,
      [
        ...contextualActions,
        ...decisionActions,
        ...inferredActions,
      ]
    );

  const nextMessagesPreview:
    ConversationMessage[] = [
      ...currentState.messages,
      ...conversationResult.messages,
    ];

  const pipelineResult =
    runProductionPipeline(
      nextGraph,
      nextMessagesPreview
    );

  const nextInsight =
    pipelineResult.executiveInsight;

  const nextProgress =
    getProjectProgress(nextGraph);

  const baseNextQuestion =
    getNextBestQuestion(
      nextGraph,
      nextMessagesPreview
    );
  const candidateNextQuestion = conversationResult.response.currentInterpretation?.suggestedQuestion
    || conversationResult.response.nextQuestion
    || enhanceQuestionWithKnowledge(baseNextQuestion, cleanInput, knowledge);
  const candidateIntent = getQuestionIntent(candidateNextQuestion);
  const alreadyAskedIntent = currentState.messages.some((message) => message.role === 'producer' && getQuestionIntent(message.response?.nextQuestion || message.content) === candidateIntent);
  const nextQuestion = candidateIntent !== 'other' && (isQuestionAlreadyAnswered(candidateIntent, nextGraph) || alreadyAskedIntent)
    ? baseNextQuestion
    : candidateNextQuestion;

  const registeredDecision =
    decisionActions.length > 0;

  const response:
    ProducerResponse = {
      ...conversationResult.response,
      understood: conversationResult.response.currentInterpretation?.knowledgeEntities.length
        ? conversationResult.response.understood
        : buildHumanUnderstanding(nextInsight, registeredDecision),

      organized: conversationResult.response.currentInterpretation?.organizedItems.length
        ? conversationResult.response.organized
        : buildOrganizedList(nextGraph),

      gaps:
        buildGapList(nextGraph),

      nextQuestion,
      sources: knowledge?.sources,
    };

  const nextMessages =
    attachResponseToProducerMessages(
      conversationResult.messages,
      response
    );

  const nextState:
    ProjectControllerState = {
      graph: nextGraph,

      messages: [
        ...currentState.messages,
        ...nextMessages,
      ],

      executiveInsight:
        nextInsight,

      progress:
        nextProgress,
    };

  if(process.env.NODE_ENV==='development')console.debug('[ExecutiveEngineV2 runtime]',{stage:'question-selected',candidateIntent,selectedIntent:getQuestionIntent(nextQuestion),knowledgeEntities:nextGraph.knowledge?.entities.length??0,financialProposals:nextGraph.financialAuthority?.proposals.length??0});

  return {
    state: nextState,
    newMessages: nextMessages,
    response,
  };
}

function attachResponseToProducerMessages(
  messages:
    ConversationMessage[],
  response: ProducerResponse
): ConversationMessage[] {
  return messages.map(
    (message) => {
      if (
        message.role !==
        'producer'
      ) {
        return message;
      }

      return {
        ...message,
        content: message.content || [response.understood,response.organized.length?`Organizado: ${response.organized.join('; ')}.`:'',response.gaps.length?`Por fortalecer: ${response.gaps.join('; ')}.`:'',response.nextQuestion?`Siguiente pregunta: ${response.nextQuestion}`:''].filter(Boolean).join('\n\n'),
        response,
      };
    }
  );
}

/**
 * La última pregunta hecha al usuario (la que `userInput` está respondiendo
 * en este turno), si es que corresponde a una de las siete del bloque de
 * apertura. `currentState.messages` es el historial previo a este turno, así
 * que el último mensaje `producer` es la pregunta que se está respondiendo
 * ahora.
 */
function encontrarPreguntaDeAperturaPreguntada(
  messages: ConversationMessage[]
): PreguntaDeApertura | null {
  const ultimoMensajeProducer = [...messages]
    .reverse()
    .find((message) => message.role === 'producer');

  const textoPregunta =
    ultimoMensajeProducer?.response?.nextQuestion ||
    ultimoMensajeProducer?.content;

  if (!textoPregunta) return null;

  return encontrarPreguntaPorTexto(textoPregunta);
}

/**
 * Spec respuestas-al-modulo-correcto.md, 5.1 (enmendada): distingue dos
 * situaciones que un solo `null` colapsaba y contradecía. `huboPregunta` es
 * true si existe algún mensaje `producer` previo con texto de pregunta,
 * independientemente de si esa pregunta se pudo mapear a un módulo.
 *
 * - Si no hubo pregunta previa (primer mensaje del proyecto, o el último
 *   mensaje `producer` no tiene texto de pregunta): `huboPregunta: false`,
 *   `modulo: null`. No se guarda nada.
 * - Si hubo pregunta y era del bloque de apertura: `huboPregunta: true`,
 *   `modulo` = el de esa pregunta.
 * - Si hubo pregunta y no era del bloque de apertura: se clasifica su texto
 *   con `getQuestionIntent` y se busca en `MODULO_POR_INTENCION`.
 *   `huboPregunta: true`, `modulo` = lo que encuentre, o `null` si la
 *   intención es `'other'` o no está en el mapa.
 */
function resultadoDePreguntaHecha(
  messages: ConversationMessage[]
): { huboPregunta: boolean; modulo: ProjectModuleId | null } {
  const preguntaDeApertura =
    encontrarPreguntaDeAperturaPreguntada(messages);

  if (preguntaDeApertura) {
    return { huboPregunta: true, modulo: preguntaDeApertura.modulo };
  }

  const ultimoMensajeProducer = [...messages]
    .reverse()
    .find((message) => message.role === 'producer');

  const textoPregunta =
    ultimoMensajeProducer?.response?.nextQuestion ||
    ultimoMensajeProducer?.content;

  if (!textoPregunta) {
    return { huboPregunta: false, modulo: null };
  }

  const intent = getQuestionIntent(textoPregunta);
  const modulo = MODULO_POR_INTENCION[intent] ?? null;

  return { huboPregunta: true, modulo };
}

function inferContextualAnswerActions(
  currentState:
    ProjectControllerState,
  conversationGraph:
    ProjectGraph,
  userInput: string,
  patches: ProjectPatch[],
  preguntaDeAperturaRespondida:
    PreguntaDeApertura | null,
  resultadoPreguntaHecha:
    { huboPregunta: boolean; modulo: ProjectModuleId | null }
): ProjectAction[] {
  // Spec no-se-sin-colateral.md, 5.4: si la última pregunta hecha fue una
  // del bloque de apertura (las siete aceptan "no sé") y la respuesta,
  // normalizada y sola, es una variante de "no sé", se guarda el texto
  // literal `Sin respuesta por ahora.` sin subir el puntaje, con
  // `operation: 'set'` — no `'strengthen'` — para que "se guarda el texto
  // literal" se cumpla por la operación misma y no por que el módulo
  // llegue vacío. Esto corre antes de que la respuesta caiga al camino
  // genérico de abajo, que guardaría el texto crudo del usuario y subiría
  // el puntaje 25 puntos.
  if (
    preguntaDeAperturaRespondida &&
    esRespuestaNoSe(userInput)
  ) {
    return [
      {
        type: 'update_module',
        moduleId: preguntaDeAperturaRespondida.modulo,
        value: SIN_RESPUESTA_POR_AHORA,
        evidenceQuote: userInput,
        scoreBoost: 0,
        operation: 'set',
      },
    ];
  }

  // Spec respuestas-al-modulo-correcto.md, 5.4 (enmendada): el respaldo de
  // `recommendedModule` solo corre en el único caso para el que fue
  // escrito — hubo pregunta pero no mapeó a ningún módulo. Si no hubo
  // pregunta (nada que responder), o si hubo y sí mapeó a un módulo (que ya
  // recibió el patch de respaldo en `conversationEngine`, spec 5.3), esta
  // función no debe escribir una segunda copia en `recommendedModule`.
  if (
    !resultadoPreguntaHecha.huboPregunta ||
    resultadoPreguntaHecha.modulo !== null
  ) {
    return [];
  }

  const recommendedModule =
    currentState
      .executiveInsight
      .recommendedModule;

  const previousModule =
    currentState.graph.modules[
      recommendedModule
    ];

  const updatedModule =
    conversationGraph.modules[
      recommendedModule
    ];

  if (
    !previousModule ||
    !updatedModule
  ) {
    return [];
  }

  const recommendedModuleWasUpdated =
    updatedModule.content !==
      previousModule.content ||
    updatedModule.score >
      previousModule.score ||
    updatedModule.updatedAt !==
      previousModule.updatedAt;

  if (
    recommendedModuleWasUpdated
  ) {
    return [];
  }

  const hasMeaningfulSemanticPatch =
    patches.some(
      (patch) =>
        patch.scoreBoost >= 18
    );

  if (
    hasMeaningfulSemanticPatch
  ) {
    return [];
  }

  if (
    updatedModule.score >= 75
  ) {
    return [];
  }

  return [
    {
      type: 'update_module',

      moduleId:
        recommendedModule,

      value: userInput,

      evidenceQuote:
        userInput,

      scoreBoost: 25,
    },
  ];
}

function inferDecisionActions(
  graph: ProjectGraph,
  userInput: string,
  patches: ProjectPatch[]
): ProjectAction[] {
  const normalizedInput =
    normalizeForMatching(
      userInput
    );

  const isExplicitDecision =
    DECISION_EXPRESSIONS.some(
      (expression) =>
        expression.test(
          normalizedInput
        )
    );

  if (!isExplicitDecision) {
    return [];
  }

  const alreadyRecorded =
    graph.decisions.some(
      (decision) =>
        decisionsAreEquivalent(
          decision.decision,
          userInput
        )
    );

  if (alreadyRecorded) {
    return [];
  }

  const relatedModules =
    getRelatedDecisionModules(
      patches
    );

  return [
    {
      type:
        'record_decision',

      title:
        buildDecisionTitle(
          normalizedInput
        ),

      context:
        `Decisión registrada durante la construcción del proyecto "${graph.title}".`,

      decision:
        userInput,

      reason:
        'La razón de esta decisión todavía no fue especificada en la conversación.',

      relatedModules,
    },
  ];
}

function getRelatedDecisionModules(
  patches: ProjectPatch[]
): ProjectModuleId[] {
  const modules =
    new Set<ProjectModuleId>([
      'decisions',
    ]);

  patches.forEach((patch) => {
    if (
      patch.moduleId !==
        'tasks' &&
      patch.moduleId !==
        'documents' &&
      patch.moduleId !==
        'evidence'
    ) {
      modules.add(
        patch.moduleId
      );
    }
  });

  return Array.from(
    modules
  ).slice(0, 5);
}

function buildDecisionTitle(
  normalizedInput: string
): string {
  if (
    /\b(lugar|sede|ubicacion|se hara en|se realizara en)\b/.test(
      normalizedInput
    )
  ) {
    return (
      'Lugar definido para el proyecto'
    );
  }

  if (
    /\b(fecha|dia|mes|semana)\b/.test(
      normalizedInput
    )
  ) {
    return (
      'Fecha definida para el proyecto'
    );
  }

  if (
    /\b(presupuesto|costo|inversion|precio)\b/.test(
      normalizedInput
    )
  ) {
    return (
      'Decisión presupuestal'
    );
  }

  if (
    /\b(aliado|marca|espacio|proveedor)\b/.test(
      normalizedInput
    )
  ) {
    return (
      'Alianza definida para el proyecto'
    );
  }

  return (
    'Decisión registrada desde la conversación'
  );
}

function decisionsAreEquivalent(
  existingDecision: string,
  newDecision: string
): boolean {
  const normalizedExisting =
    normalizeForMatching(
      existingDecision
    );

  const normalizedNew =
    normalizeForMatching(
      newDecision
    );

  return (
    normalizedExisting ===
      normalizedNew ||
    normalizedExisting.includes(
      normalizedNew
    ) ||
    normalizedNew.includes(
      normalizedExisting
    )
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
      /[̀-ͯ]/g,
      ''
    )
    .replace(
      /\bdicid/g,
      'decid'
    )
    .replace(/\s+/g, ' ');
}

function inferActionsFromGraph(
  graph: ProjectGraph
): ProjectAction[] {
  const actions:
    ProjectAction[] = [];

  const hasTask = (
    title: string
  ) =>
    graph.tasks.some(
      (task) =>
        task.title === title
    );

  if (
    graph.modules.budget
      .score < 25 &&
    !hasTask(
      'Construir presupuesto preliminar'
    )
  ) {
    actions.push({
      type: 'create_task',

      title:
        'Construir presupuesto preliminar',

      description:
        'Definir costos principales, recursos disponibles, inversión inicial y posibles fuentes de ingreso.',

      moduleId: 'budget',

      urgency: 'medium',

      importance: 'high',
    });
  }

  if (
    graph.modules.timeline
      .score < 25 &&
    !hasTask(
      'Definir primer cronograma'
    )
  ) {
    actions.push({
      type: 'create_task',

      title:
        'Definir primer cronograma',

      description:
        'Organizar el proyecto en fases iniciales: preparación, producción, lanzamiento y seguimiento.',

      moduleId: 'timeline',

      urgency: 'medium',

      importance: 'high',
    });
  }

  if (
    graph.modules.team.score <
      25 &&
    !hasTask(
      'Definir equipo mínimo'
    )
  ) {
    actions.push({
      type: 'create_task',

      title:
        'Definir equipo mínimo',

      description:
        'Identificar roles, responsables y capacidades necesarias para ejecutar el proyecto.',

      moduleId: 'team',

      urgency: 'low',

      importance: 'high',
    });
  }

  if (
    graph.modules.risks.score <
      20 &&
    graph.modules.budget.score >
      20
  ) {
    const riskExists =
      graph.risks.some(
        (risk) =>
          risk.title ===
          'Riesgo financiero inicial'
      );

    if (!riskExists) {
      actions.push({
        type: 'detect_risk',

        title:
          'Riesgo financiero inicial',

        riskType:
          'financial',

        probability:
          'medium',

        impact: 'high',

        mitigationPlan:
          'Separar inversión inicial, costos mínimos y posibles fuentes de financiación antes de comprometer la ejecución.',
      });
    }
  }

  return actions.slice(0, 3);
}

function buildHumanUnderstanding(
  insight: ExecutiveInsight,
  registeredDecision: boolean
): string {
  const priority =
    insight.title?.trim();

  const summary =
    insight.summary?.trim();

  if (registeredDecision) {
    const nextPriority =
      priority
        ? ` La siguiente prioridad es ${priority.toLowerCase()}.`
        : '';

    return (
      'Entendido. Registré esta información como una decisión del proyecto, la añadí al historial de decisiones y la conecté con los módulos relacionados.' +
      nextPriority
    );
  }

  if (
    !priority &&
    !summary
  ) {
    return (
      'Perfecto. Ya integré esta información ' +
      'dentro de la estructura del proyecto.'
    );
  }

  if (!priority) {
    return (
      'Perfecto. Ya integré esta información. ' +
      summary
    );
  }

  if (!summary) {
    return (
      'Perfecto. Ya integré esta información. ' +
      `Ahora la prioridad es ${priority.toLowerCase()}.`
    );
  }

  return (
    'Perfecto. Ya integré esta información al proyecto. ' +
    `Ahora la prioridad es ${priority.toLowerCase()}. ` +
    summary
  );
}

function buildOrganizedList(
  graph: ProjectGraph
): string[] {
  const strongModules =
    getStrongModules(
      graph,
      5
    ).map(
      (module) =>
        module.title
    );

  if (
    strongModules.length === 0
  ) {
    return [
      'Primeras ideas del proyecto',
    ];
  }

  return strongModules;
}

function buildGapList(
  graph: ProjectGraph
): string[] {
  return getWeakModules(
    graph,
    4
  ).map(
    (module) =>
      module.title
  );
}

function enhanceQuestionWithKnowledge(question:string,input:string,knowledge?:KnowledgeGuidance){if(!knowledge?.snippets.length)return question;const text=`${input} ${knowledge.topics.join(' ')} ${knowledge.snippets.join(' ')}`.toLowerCase();if(/costo|costeo|presupuesto|margen|precio/.test(text))return '¿Ese valor incluye costos directos, mano de obra, costos indirectos, impuestos y contingencias, o todavía debemos construir ese desglose?';if(/indicador|impacto|resultado|evaluacion/.test(text))return '¿Qué cambio observable esperas, cómo lo medirás y qué evidencia permitirá atribuirlo al proyecto?';if(/poblacion|publico|comunidad|beneficiario/.test(text))return '¿Quién es el público prioritario, qué necesidad verificable tiene y con qué evidencia lo sabemos?';if(/derecho|legal|permiso|licencia/.test(text))return '¿Qué permisos, licencias o derechos condicionan la ejecución y quién debe validarlos antes del piloto?';return question;}
