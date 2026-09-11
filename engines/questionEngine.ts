import {
  ConversationMessage,
  ProjectGraph,
  ProjectModule,
  ProjectModuleId,
} from '../types/project';
import {
  getWeakModules,
} from '../core/projectEngine';
import { seleccionarPreguntaDeApertura } from './openingBlockEngine';

interface QuestionDefinition {
  initial: string;
  deepen: string;
}

export type QuestionIntent = 'clarify_project_name' | 'clarify_project_type' | 'clarify_purpose' | 'clarify_problem' | 'clarify_audience' | 'clarify_location' | 'clarify_objective' | 'clarify_activities' | 'clarify_date' | 'clarify_quantity' | 'clarify_budget' | 'clarify_responsibility' | 'clarify_allies' | 'clarify_risks' | 'clarify_sustainability' | 'clarify_impact' | 'clarify_metrics' | 'clarify_tasks' | 'clarify_decisions' | 'clarify_documents' | 'clarify_evidence' | 'clarify_opportunities' | 'clarify_phase' | 'clarify_intent' | 'other';

const MODULE_INTENTS: Partial<Record<ProjectModuleId, QuestionIntent>> = {
  identity: 'clarify_project_name', community: 'clarify_audience', context: 'clarify_location',
  purpose: 'clarify_purpose', problem: 'clarify_problem', generalObjective: 'clarify_objective', specificObjectives: 'clarify_objective',
  activities: 'clarify_activities', timeline: 'clarify_date', budget: 'clarify_budget', team: 'clarify_responsibility',
  allies: 'clarify_allies', risks: 'clarify_risks', sustainability: 'clarify_sustainability', impact: 'clarify_impact',
  kpis: 'clarify_metrics', tasks: 'clarify_tasks', decisions: 'clarify_decisions', documents: 'clarify_documents',
  evidence: 'clarify_evidence', opportunities: 'clarify_opportunities',
};

const STRATEGIC_QUESTIONS: Record<
  ProjectModuleId,
  QuestionDefinition
> = {
  identity: {
    initial:
      '¿Cómo se llama o cómo te gustaría nombrar este proyecto por ahora?',
    deepen:
      'Ya existe una identidad inicial. ¿Qué debería hacer diferente o reconocible a este proyecto frente a otras alternativas?',
  },

  purpose: {
    initial:
      '¿Por qué este proyecto debería existir y qué lo hace importante para ti?',
    deepen:
      'Ya entiendo la intención general. ¿Qué principio no debería perder el proyecto mientras crece?',
  },

  problem: {
    initial:
      '¿Qué problema concreto o necesidad real busca resolver este proyecto?',
    deepen:
      'Ya identificamos el problema general. ¿Cómo se manifiesta hoy y para quién resulta más importante resolverlo?',
  },

  context: {
    initial:
      '¿Dónde nace esta idea y qué está pasando en ese contexto que la hace relevante?',
    deepen:
      'Ya entiendo que el proyecto nace cerca de una comunidad concreta. ¿Qué evidencia permitiría validar que esta necesidad ocurre con suficiente frecuencia?',
  },

  community: {
    initial:
      '¿A qué personas les habla este proyecto y qué sabes de esa comunidad?',
    deepen:
      'Ya tenemos una comunidad inicial. ¿Quién sería la primera persona dispuesta a probar o comprar esta propuesta?',
  },

  generalObjective: {
    initial:
      'Si tuvieras que resumir el resultado principal de este proyecto en una frase, ¿cuál sería?',
    deepen:
      'El resultado general está tomando forma. ¿Qué tendría que existir al final para considerar cumplido este objetivo?',
  },

  specificObjectives: {
    initial:
      '¿Cuáles serían tres objetivos específicos que ayudarían a cumplir ese objetivo general?',
    deepen:
      'Ya hay objetivos iniciales. ¿Cuál de ellos debe ocurrir primero para desbloquear los demás?',
  },

  activities: {
    initial:
      '¿Qué actividades concretas imaginas para lograr esos objetivos?',
    deepen:
      'Ya identificamos algunas actividades. ¿Cuál sería la primera que permitiría obtener aprendizaje real?',
  },

  timeline: {
    initial:
      '¿En cuánto tiempo te gustaría ejecutar este proyecto y qué fases tendría?',
    deepen:
      'Ya existe un horizonte de tiempo. ¿Qué hito debería quedar cumplido durante el primer mes?',
  },

  budget: {
    initial:
      '¿Qué presupuesto, recursos o costos iniciales necesita este proyecto para empezar?',
    deepen:
      'Ya sabemos qué recursos faltan. ¿Cuál sería el costo mínimo para construir y probar un primer prototipo?',
  },

  team: {
    initial:
      '¿Quiénes hacen parte del equipo y qué rol tendría cada persona?',
    deepen:
      'Ya existen algunas capacidades aliadas. ¿Quién asumirá la responsabilidad de coordinar el proyecto completo?',
  },

  allies: {
    initial:
      '¿Qué aliados, espacios, marcas, instituciones o personas podrían ayudar a que esto suceda?',
    deepen:
      'Ya identificamos aliados iniciales. ¿Qué aportará concretamente cada uno y qué necesitará recibir a cambio?',
  },

  risks: {
    initial:
      '¿Qué podría dificultar la ejecución del proyecto y cómo podríamos anticiparlo?',
    deepen:
      'Ya existe un riesgo identificado. ¿Qué acción concreta permitiría reducirlo antes de invertir más recursos?',
  },

  sustainability: {
    initial:
      '¿Cómo podría continuar este proyecto después de su primera ejecución?',
    deepen:
      'Ya está clara la sostenibilidad del producto. ¿Cómo se sostendrá económicamente la operación del proyecto?',
  },

  impact: {
    initial:
      '¿Qué cambio concreto te gustaría que este proyecto genere en las personas o comunidad?',
    deepen:
      'Ya identificamos el cambio que buscas generar. ¿Qué indicador permitiría medir ese cambio?',
  },

  kpis: {
    initial:
      '¿Cómo sabríamos que el proyecto está avanzando bien? ¿Qué indicadores podríamos medir?',
    deepen:
      'Ya existe un primer hito. ¿Qué tres métricas revisarías cada mes para decidir si continuar, ajustar o detener?',
  },

  tasks: {
    initial:
      '¿Cuál sería la primera acción concreta que habría que hacer esta semana?',
    deepen:
      'Ya existen tareas iniciales. ¿Quién será responsable y cuál es la fecha límite de la primera?',
  },

  decisions: {
    initial:
      '¿Hay alguna decisión importante que ya tengas tomada sobre este proyecto?',
    deepen:
      'Ya existen definiciones importantes. ¿Cuál debería registrarse formalmente como una decisión del proyecto?',
  },

  documents: {
    initial:
      '¿Qué documento te gustaría poder generar primero: One Pager, pitch, presupuesto, cronograma o propuesta?',
    deepen:
      'Ya elegiste el primer documento. ¿Para quién debe estar escrito y qué decisión debería ayudarle a tomar?',
  },

  evidence: {
    initial:
      '¿Tienes alguna evidencia, referencia, foto, documento, experiencia o antecedente que respalde esta idea?',
    deepen:
      'Ya existe información inicial. ¿Qué prueba externa podríamos conseguir para validar el problema o la demanda?',
  },

  opportunities: {
    initial:
      '¿Qué oportunidad concreta ves para que este proyecto encuentre apoyo, financiación o aliados?',
    deepen:
      'Ya existe una oportunidad inicial. ¿Qué conexión concreta podría activarse durante las próximas cuatro semanas?',
  },
};

export function getNextBestQuestion(
  graph: ProjectGraph,
  messages: ConversationMessage[] = []
): string {
  const preguntaDeApertura = seleccionarPreguntaDeApertura(graph);
  if (preguntaDeApertura) return preguntaDeApertura.pregunta;

  const weakModules =
    getWeakModules(
      graph,
      Object.keys(
        graph.modules
      ).length
    );

  const previousQuestions =
    getPreviousQuestions(messages);
  const previousIntents: Set<QuestionIntent> = new Set(messages.filter((message) => message.role === 'producer').map((message) => getQuestionIntent(message.response?.nextQuestion || message.content)).filter((intent) => intent !== 'other'));

  for (
    const module of weakModules
  ) {
    const question =
      selectQuestionForModule(
        module
      );
    const intent = MODULE_INTENTS[module.id] ?? getQuestionIntent(question);

    if (
      !isQuestionAlreadyAnswered(intent, graph) &&
      !previousIntents.has(intent) &&
      !previousQuestions.has(
        normalizeText(question)
      )
    ) {
      return question;
    }
  }

  return 'Ya hemos recorrido las preguntas prioritarias. ¿Qué frente del proyecto te gustaría revisar, cambiar o convertir ahora en un documento?';
}

export function getQuestionIntent(question: string): QuestionIntent {
  const text = normalizeText(question);
  if (/como se llama|como te gustaria nombrar|nombre del proyecto/.test(text)) return 'clarify_project_name';
  if (/tipo de proyecto|formato del proyecto/.test(text)) return 'clarify_project_type';
  if (/por que|principio no deberia perder/.test(text)) return 'clarify_purpose';
  if (/problema|necesidad real/.test(text)) return 'clarify_problem';
  if (/a que personas|comunidad|publico|audiencia/.test(text)) return 'clarify_audience';
  if (/donde|lugar|ubicacion|region/.test(text)) return 'clarify_location';
  if (/objetivo|resultado principal|resultado general/.test(text)) return 'clarify_objective';
  if (/actividades|primera que permitiria/.test(text)) return 'clarify_activities';
  if (/cuando|fecha|tiempo|primer mes/.test(text)) return 'clarify_date';
  if (/cuantos|cantidad/.test(text)) return 'clarify_quantity';
  if (/presupuesto|costo|valor|tarifa|honorarios/.test(text)) return 'clarify_budget';
  if (/quien|responsable|equipo|rol/.test(text)) return 'clarify_responsibility';
  if (/aliados|instituciones|marcas/.test(text)) return 'clarify_allies';
  if (/riesgo|dificultar|reducirlo/.test(text)) return 'clarify_risks';
  if (/sostener|sostenibilidad|continuar este proyecto/.test(text)) return 'clarify_sustainability';
  if (/impacto|cambio concreto|indicador/.test(text)) return 'clarify_impact';
  if (/metricas|indicadores|avanzando bien/.test(text)) return 'clarify_metrics';
  if (/accion concreta|tarea/.test(text)) return 'clarify_tasks';
  if (/decision/.test(text)) return 'clarify_decisions';
  if (/documento|one pager|pitch/.test(text)) return 'clarify_documents';
  if (/evidencia|referencia|prueba externa/.test(text)) return 'clarify_evidence';
  if (/oportunidad|financiacion|conexion concreta/.test(text)) return 'clarify_opportunities';
  return 'other';
}

export function isQuestionAlreadyAnswered(intent: QuestionIntent, graph: ProjectGraph): boolean {
  const active = (graph.knowledge?.entities ?? []).filter((entity) => entity.status !== 'superseded' && entity.status !== 'contradicted');
  const hasKey = (...keys: string[]) => active.some((entity) => entity.key && keys.includes(entity.key));
  const hasModule = (id: ProjectModuleId) => Boolean(graph.modules[id]?.content.trim());
  switch (intent) {
    case 'clarify_project_name': return !isPlaceholderTitle(graph.title);
    case 'clarify_project_type': return Boolean(graph.knowledge?.projectType.primaryType) || hasModule('identity');
    case 'clarify_audience': return hasModule('community') || hasKey('expected_attendance', 'previous_attendance');
    case 'clarify_purpose': return hasModule('purpose');
    case 'clarify_problem': return hasModule('problem');
    case 'clarify_location': return hasModule('context') || hasKey('artist_regional_context');
    case 'clarify_phase': return hasModule('activities');
    case 'clarify_intent': return hasModule('opportunities');
    case 'clarify_date': return hasModule('timeline') || active.some((entity) => entity.type === 'timeline_fact');
    case 'clarify_quantity': return hasKey('artist_requirement', 'expected_attendance');
    case 'clarify_budget': return hasModule('budget') || active.some((entity) => entity.type === 'financial_fact');
    case 'clarify_responsibility': return hasModule('team') || active.some((entity) => entity.type === 'responsibility');
    default: return false;
  }
}

function isPlaceholderTitle(title: string): boolean {
  const value = normalizeText(title);
  return !value || /^(proyecto sin nombre|sin titulo|untitled|nuevo proyecto|proyecto nuevo)$/.test(value);
}

export function getNextModuleToStrengthen(
  graph: ProjectGraph
): ProjectModuleId | null {
  const weakModules =
    getWeakModules(
      graph,
      Object.keys(
        graph.modules
      ).length
    );

  return (
    weakModules.find(
      (module) =>
        module.score < 75
    )?.id || null
  );
}

function selectQuestionForModule(
  module: ProjectModule
): string {
  const definition =
    STRATEGIC_QUESTIONS[
      module.id
    ];

  if (
    hasMeaningfulInformation(
      module
    )
  ) {
    return definition.deepen;
  }

  return definition.initial;
}

function hasMeaningfulInformation(
  module: ProjectModule
): boolean {
  const content =
    module.content.trim();

  return Boolean(
    content.length >= 60 ||
    module.evidence.length >= 2 ||
    module.score >= 40
  );
}

function getPreviousQuestions(
  messages: ConversationMessage[]
): Set<string> {
  const questions =
    messages
      .filter(
        (message) =>
          message.role ===
          'producer'
      )
      .map(
        (message) =>
          message.response
            ?.nextQuestion ||
          message.content
      )
      .filter(
        (
          question
        ): question is string =>
          Boolean(
            question?.trim()
          )
      )
      .map(normalizeText);

  return new Set(
    questions
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
    .replace(
      /[^a-z0-9ñ\s]/g,
      ' '
    )
    .replace(/\s+/g, ' ');
}
