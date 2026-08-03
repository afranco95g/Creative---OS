import {
  ConversationMessage,
  ProducerResponse,
  ProjectGraph,
  ProjectModuleId,
  ProjectPatch,
} from '../types/project';

import {
  applyPatches,
  createId,
  getStrongModules,
  getWeakModules,
  now,
} from '../core/projectEngine';

import {
  getNextBestQuestion,
} from './questionEngine';
import { interpretTurn } from './turnInterpretationEngine';
import { classifyProjectEvidence } from './semanticClassificationEngine';

const DECISION_EXPRESSIONS: RegExp[] = [
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

function textIncludes(
  normalizedText: string,
  words: string[]
): boolean {
  return words.some((word) =>
    normalizedText.includes(
      normalizeForMatching(word)
    )
  );
}

function matchesAny(
  normalizedText: string,
  expressions: RegExp[]
): boolean {
  return expressions.some(
    (expression) =>
      expression.test(normalizedText)
  );
}

function createPatch(
  moduleId: ProjectModuleId,
  value: string,
  scoreBoost: number
): ProjectPatch {
  return {
    id: createId(),
    moduleId,
    operation: 'strengthen',
    value,
    evidenceQuote: value,
    scoreBoost,
    source: 'conversation',
    createdAt: now(),
  };
}

export function extractProjectPatchesFromMessage(
  message: string,
  graph: ProjectGraph
): ProjectPatch[] {
  const semantic = classifyProjectEvidence(message).filter((item) => item.confidence >= 0.8 && !item.requiresConfirmation);
  if (semantic.length) return semantic.map((item) => ({ ...createPatch(item.targetModule, item.extractedContent, Math.round(item.confidence * 35)), evidenceQuote: item.evidenceQuote }));
  const patches: ProjectPatch[] = [];

  const updatedModules =
    new Set<ProjectModuleId>();

  const normalizedMessage =
    normalizeForMatching(message);

  const addPatch = (
    moduleId: ProjectModuleId,
    scoreBoost: number
  ) => {
    if (
      updatedModules.has(moduleId)
    ) {
      return;
    }

    patches.push(
      createPatch(
        moduleId,
        message,
        scoreBoost
      )
    );

    updatedModules.add(moduleId);
  };

  if (
    textIncludes(
      normalizedMessage,
      [
        'se llama',
        'nombre del proyecto',
        'nombre de la marca',
        'identidad',
      ]
    )
  ) {
    addPatch('identity', 20);
  }

  if (
    textIncludes(
      normalizedMessage,
      [
        'quiero',
        'crear',
        'hacer',
        'montar',
        'abrir',
        'desarrollar',
      ]
    )
  ) {
    addPatch('purpose', 25);

    addPatch(
      'generalObjective',
      18
    );
  }

  if (
    textIncludes(
      normalizedMessage,
      [
        'problema',
        'necesidad',
        'falta',
        'dificil',
        'dolor',
        'resolver',
        'frustracion',
      ]
    )
  ) {
    addPatch('problem', 30);
  }

  if (
    textIncludes(
      normalizedMessage,
      [
        'bogota',
        'suba',
        'chapinero',
        'localidad',
        'barrio',
        'ciudad',
        'territorio',
        'colombia',
        'lugar',
        'sede',
        'ubicacion',
        'aforo',
        'capacidad para',
      ]
    ) ||
    /\bse (hara|realizara) en\b/.test(
      normalizedMessage
    )
  ) {
    addPatch('context', 30);
  }

  if (
    textIncludes(
      normalizedMessage,
      [
        'skaters',
        'skate',
        'bmx',
        'deportes extremos',
        'artistas',
        'emprendedores',
        'jovenes',
        'comunidad',
        'clientes',
        'beneficiarios',
        'publico',
        'audiencia',
        'asistentes',
        'capacidad para',
        'aforo',
      ]
    )
  ) {
    addPatch('community', 30);
  }

  if (
    textIncludes(
      normalizedMessage,
      [
        'objetivo',
        'objetivos',
        'meta',
        'metas',
      ]
    )
  ) {
    addPatch(
      'specificObjectives',
      25
    );
  }

  if (
    textIncludes(
      normalizedMessage,
      [
        'taller',
        'evento',
        'feria',
        'activacion',
        'clase',
        'sesion',
        'concierto',
        'exposicion',
        'showcase',
        'show case',
        'concurso',
      ]
    )
  ) {
    addPatch('activities', 30);
  }

  if (
    textIncludes(
      normalizedMessage,
      [
        'semana',
        'mes',
        'fecha',
        'cronograma',
        'duracion',
        'dias',
        'fases',
      ]
    )
  ) {
    addPatch('timeline', 30);
  }

  if (
    textIncludes(
      normalizedMessage,
      [
        'presupuesto',
        'pesos',
        'millones',
        '$',
        'costo',
        'inversion',
        'financiacion',
        'ventas',
      ]
    )
  ) {
    addPatch('budget', 30);
  }

  if (
    textIncludes(
      normalizedMessage,
      [
        'equipo',
        'rol',
        'responsable',
        'productor',
        'diseñador',
        'tallerista',
        'coordinador',
        'director',
      ]
    )
  ) {
    addPatch('team', 30);
  }

  if (
    textIncludes(
      normalizedMessage,
      [
        'aliado',
        'aliados',
        'marca',
        'espacio aliado',
        'institucion',
        'proveedor',
        'periodista',
        'empresa',
        'patrocinador',
      ]
    )
  ) {
    addPatch('allies', 30);
  }

  if (
    textIncludes(
      normalizedMessage,
      [
        'riesgo',
        'riesgos',
        'problema de ejecucion',
        'dificultad',
        'obstaculo',
      ]
    )
  ) {
    addPatch('risks', 25);
  }

  if (
    textIncludes(
      normalizedMessage,
      [
        'sostenible',
        'sostenibilidad',
        'continuidad',
        'futuro',
        'mantener',
        'ingresos',
      ]
    )
  ) {
    addPatch(
      'sustainability',
      30
    );
  }

  if (
    textIncludes(
      normalizedMessage,
      [
        'impacto',
        'beneficiar',
        'beneficiarios',
        'transformar',
        'social',
        'cultural',
        'ambiental',
      ]
    )
  ) {
    addPatch('impact', 30);
  }

  if (
    textIncludes(
      normalizedMessage,
      [
        'indicador',
        'indicadores',
        'medir',
        'metrica',
        'kpi',
        'resultado',
      ]
    )
  ) {
    addPatch('kpis', 25);
  }

  if (
    textIncludes(
      normalizedMessage,
      [
        'tarea',
        'pendiente',
        'urgente',
        'importante',
        'hacer esta semana',
      ]
    )
  ) {
    addPatch('tasks', 25);
  }

  if (
    matchesAny(
      normalizedMessage,
      DECISION_EXPRESSIONS
    )
  ) {
    addPatch('decisions', 35);
  }

  if (
    textIncludes(
      normalizedMessage,
      [
        'documento',
        'one pager',
        'pitch',
        'propuesta',
        'convocatoria',
        'presupuesto',
        'cronograma',
      ]
    )
  ) {
    addPatch('documents', 25);
  }

  if (
    textIncludes(
      normalizedMessage,
      [
        'evidencia',
        'foto',
        'archivo',
        'referencia',
        'antecedente',
        'experiencia previa',
      ]
    )
  ) {
    addPatch('evidence', 25);
  }

  if (
    textIncludes(
      normalizedMessage,
      [
        'oportunidad',
        'convocatoria',
        'patrocinador',
        'financiador',
        'cliente',
        'mentor',
      ]
    )
  ) {
    addPatch(
      'opportunities',
      25
    );
  }

  if (patches.length === 0) {
    const nextModule =
      getWeakModules(
        graph,
        1
      )[0]?.id || 'context';

    addPatch(nextModule, 12);
  }

  return patches;
}

function buildProducerResponse(
  graph: ProjectGraph,
  patches: ProjectPatch[],
  interpretation: ReturnType<typeof interpretTurn>
): ProducerResponse {
  const updatedModules = patches
    .map(
      (patch) =>
        graph.modules[
          patch.moduleId
        ]?.title
    )
    .filter(
      (
        title
      ): title is string =>
        Boolean(title)
    );

  const strongModules =
    getStrongModules(
      graph,
      3
    ).map(
      (module) =>
        module.title
    );

  const weakModules =
    getWeakModules(
      graph,
      3
    ).map(
      (module) =>
        module.title
    );

  const recognizedDecision =
    patches.some(
      (patch) =>
        patch.moduleId ===
        'decisions'
    );

  return {
    understood: interpretation.explicitFacts.length
      ? interpretation.understoodSummary
      : recognizedDecision
        ? 'Entendido. Registré esta información como una decisión del proyecto y la conecté con las áreas relacionadas. También quedará disponible para revisión en la memoria ejecutiva.'
        : 'Perfecto. Ya integré esta información al proyecto. Estamos convirtiendo la idea en una estructura que después podrá servir para una convocatoria, una propuesta, un presupuesto o una presentación.',

    organized: interpretation.explicitFacts.length
      ? interpretation.explicitFacts.map((fact) => `${fact.confidence === 'confirmed' ? 'Confirmado' : 'Preliminar'} · ${fact.field}: ${String(fact.value)}`).slice(0, 6)
      : Array.from(new Set([...updatedModules, ...strongModules])).slice(0, 5),

    gaps: weakModules,

    nextQuestion: interpretation.recommendedNextQuestion || getNextBestQuestion(graph),
    nextQuestionOptions: interpretation.recommendedNextQuestion ? [
      'Solo materiales y fabricación.',
      'Incluye materiales y mano de obra.',
      'Incluye todos los costos.',
      'No lo sé todavía.',
      'Quiero desglosarlo.',
    ] : undefined,
    interpretation,
  };
}

export function processConversationTurn(
  message: string,
  graph: ProjectGraph
) {
  const patches =
    extractProjectPatchesFromMessage(
      message,
      graph
    );

  const nextGraph =
    applyPatches(
      graph,
      patches
    );

  const interpretation = interpretTurn(message, nextGraph, patches);
  if (interpretation.financialSignals.length) {
    nextGraph.tools.proposedFinancialSignals = [
      ...(nextGraph.tools.proposedFinancialSignals ?? []),
      ...interpretation.financialSignals.filter((signal) => signal.requiresConfirmation),
    ];
  }
  if (interpretation.pendingQuestions.length) {
    nextGraph.tools.pendingQuestions = [
      ...(nextGraph.tools.pendingQuestions ?? []),
      ...interpretation.pendingQuestions,
    ];
  }

  const response =
    buildProducerResponse(
      nextGraph,
      patches,
      interpretation
    );

  const userMessage:
    ConversationMessage = {
      id: createId(),
      role: 'user',
      content: message,
      createdAt: now(),
    };

  const producerMessage:
    ConversationMessage = {
      id: createId(),
      role: 'producer',
      content: producerResponseToNarrative(response),
      response,
      createdAt: now(),
    };

  return {
    nextGraph,

    messages: [
      userMessage,
      producerMessage,
    ],

    patches,

    response,
  };
}

export function producerResponseToNarrative(response: ProducerResponse): string {
  return [response.understood,response.organized.length?`Organizado: ${response.organized.join('; ')}.`:'',response.gaps.length?`Por fortalecer: ${response.gaps.join('; ')}.`:'',response.nextQuestion?`Siguiente pregunta: ${response.nextQuestion}`:''].filter(Boolean).join('\n\n');
}
