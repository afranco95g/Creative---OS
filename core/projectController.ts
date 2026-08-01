import type {
  ConversationMessage,
  ProducerResponse,
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
} from '../engines/questionEngine';

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
  userInput: string
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

  const conversationResult =
    processConversationTurn(
      cleanInput,
      currentState.graph
    );

  const contextualActions =
    inferContextualAnswerActions(
      currentState,
      conversationResult.nextGraph,
      cleanInput,
      conversationResult.patches
    );

  const decisionActions =
    inferDecisionActions(
      currentState.graph,
      cleanInput,
      conversationResult.patches
    );

  const inferredActions =
    inferActionsFromGraph(
      conversationResult.nextGraph
    );

  const nextGraph =
    executeActions(
      conversationResult.nextGraph,
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

  const nextQuestion =
    getNextBestQuestion(
      nextGraph,
      nextMessagesPreview
    );

  const registeredDecision =
    decisionActions.length > 0;

  const response:
    ProducerResponse = {
      understood:
        buildHumanUnderstanding(
          nextInsight,
          registeredDecision
        ),

      organized:
        buildOrganizedList(
          nextGraph
        ),

      gaps:
        buildGapList(nextGraph),

      nextQuestion,
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
        response,
      };
    }
  );
}

function inferContextualAnswerActions(
  currentState:
    ProjectControllerState,
  conversationGraph:
    ProjectGraph,
  userInput: string,
  patches: ProjectPatch[]
): ProjectAction[] {
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
      /[\u0300-\u036f]/g,
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