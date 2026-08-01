import {
  ConversationMessage,
  ProjectGraph,
  ProjectModule,
  ProjectModuleId,
} from '../types/project';
import {
  getWeakModules,
} from '../core/projectEngine';

interface QuestionDefinition {
  initial: string;
  deepen: string;
}

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
      'Ya definimos que se busca reducir plástico de un solo uso. ¿Qué indicador permitiría medir esa reducción?',
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
  const weakModules =
    getWeakModules(
      graph,
      Object.keys(
        graph.modules
      ).length
    );

  const previousQuestions =
    getPreviousQuestions(messages);

  for (
    const module of weakModules
  ) {
    const question =
      selectQuestionForModule(
        module
      );

    if (
      !previousQuestions.has(
        normalizeText(question)
      )
    ) {
      return question;
    }
  }

  return 'Ya hemos recorrido las preguntas prioritarias. ¿Qué frente del proyecto te gustaría revisar, cambiar o convertir ahora en un documento?';
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