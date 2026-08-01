import { ProjectGraph, ProjectModuleId } from '../types/project';
import { ExecutiveInsight } from './executiveBrain';

export type ConversationStrategyMode =
  | 'ask'
  | 'deepen'
  | 'move_next'
  | 'summarize'
  | 'prepare_document';

export interface ConversationStrategy {
  mode: ConversationStrategyMode;
  focusModule: ProjectModuleId;
  question: string;
  reason: string;
}

const QUESTIONS: Record<ProjectModuleId, string> = {
  identity: '¿Cómo se llama o cómo te gustaría nombrar este proyecto?',
  purpose: '¿Por qué este proyecto debería existir?',
  problem: '¿Qué problema concreto resuelve este proyecto?',
  context: '¿Dónde nace este proyecto y qué hace relevante ese contexto?',
  community: '¿A qué personas les habla este proyecto?',
  generalObjective: '¿Cuál sería el objetivo general del proyecto?',
  specificObjectives: '¿Cuáles serían tres objetivos específicos?',
  activities: '¿Qué actividades concretas imaginas para ejecutarlo?',
  timeline: '¿En cuánto tiempo te gustaría desarrollarlo?',
  budget: '¿Qué presupuesto inicial o recursos disponibles tienes?',
  team: '¿Quiénes hacen parte del equipo y qué rol tendría cada persona?',
  allies: '¿Qué aliados podrían ayudar a que esto suceda?',
  risks: '¿Qué podría dificultar la ejecución del proyecto?',
  sustainability: '¿Cómo podría sostenerse este proyecto en el tiempo?',
  impact: '¿Qué impacto quieres generar?',
  kpis: '¿Cómo sabríamos que el proyecto está avanzando bien?',
  tasks: '¿Cuál sería la primera acción concreta esta semana?',
  decisions: '¿Qué decisión importante ya está tomada?',
  documents: '¿Qué documento quieres preparar primero?',
  evidence: '¿Qué evidencia o referencia respalda esta idea?',
  opportunities: '¿Qué oportunidad ves para activar este proyecto?',
};

export function buildConversationStrategy(
  graph: ProjectGraph,
  insight: ExecutiveInsight
): ConversationStrategy {
  const focusModule = insight.recommendedModule;
  const module = graph.modules[focusModule];

  if (insight.readiness.documents >= 70) {
    return {
      mode: 'prepare_document',
      focusModule: 'documents',
      question:
        'Ya tenemos suficiente base para empezar a preparar un documento. ¿Quieres que armemos primero un One Pager o una propuesta?',
      reason: 'El proyecto ya tiene suficiente información estructural para generar un primer entregable.',
    };
  }

  if (module.score >= 70) {
    return {
      mode: 'move_next',
      focusModule,
      question: QUESTIONS[focusModule],
      reason: 'Este módulo ya tiene una base suficiente; conviene avanzar al siguiente punto débil.',
    };
  }

  if (module.score >= 40) {
    return {
      mode: 'deepen',
      focusModule,
      question: QUESTIONS[focusModule],
      reason: 'El módulo tiene información inicial, pero todavía necesita precisión para ser útil en documentos.',
    };
  }

  return {
    mode: 'ask',
    focusModule,
    question: QUESTIONS[focusModule],
    reason: 'Este es el punto que más desbloquea el avance del proyecto en este momento.',
  };
}