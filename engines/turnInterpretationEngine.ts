import { createId, now } from '../core/projectEngine';
import type { ProjectGraph, ProjectPatch, TurnInterpretation } from '../types/project';
import { detectFinancialSignals } from './budgetSignalProcessor';
import { classifyProjectEvidence } from './semanticClassificationEngine';
import { extraerSemilla } from './projectSeedExtractor';

const normalize = (value: string) => value.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

// Regla general de público: lo que sigue a estos disparadores, hasta el
// final de la frase o un punto. Reemplaza la lista cableada a un proyecto
// específico (spec 5.8).
const AUDIENCE_TRIGGER = /(?:para gente que |para personas que |dirigido a |para )([^.]+)/;

export function interpretTurn(input: string, graph: ProjectGraph, patches: ProjectPatch[]): TurnInterpretation {
  const text = normalize(input);
  const financialSignals = detectFinancialSignals(input);
  const semilla = extraerSemilla(input);
  const explicitFacts: TurnInterpretation['explicitFacts'] = [];
  const inferredFacts: TurnInterpretation['inferredFacts'] = [];

  const audienceMatch = AUDIENCE_TRIGGER.exec(text);
  const audience = audienceMatch ? audienceMatch[1].trim() : '';
  if (audience) explicitFacts.push({ field: 'audience', value: audience, confidence: 'preliminary', source: 'user' });

  if (semilla.disciplinaCandidata) explicitFacts.push({ field: 'discipline', value: semilla.disciplinaCandidata.valor, confidence: 'preliminary', source: 'user' });

  if (/no (?:tengo|tenemos).*(?:diseno|identidad).*(?:marca)/.test(text)) explicitFacts.push({ field: 'brand_identity', value: false, confidence: 'confirmed', source: 'user' });
  for (const signal of financialSignals.filter((item) => item.kind !== 'preliminary_margin')) explicitFacts.push({ field: signal.kind, value: signal.amount ?? signal.concept, confidence: signal.status === 'requires_estimate' ? 'requires_confirmation' : 'confirmed', source: 'user' });

  const needsBreakdown = financialSignals.some((signal) => signal.status === 'requires_breakdown');
  const costSignal = financialSignals.find((signal) => signal.kind === 'cost');
  const recommendedNextQuestion = needsBreakdown
    ? costSignal?.amount
      ? `Cuando dices que cada unidad cuesta COP ${costSignal.amount.toLocaleString('es-CO')}, ¿ese valor incluye únicamente materiales y fabricación, o también mano de obra, empaque, transporte, impuestos, diseño, comercialización y una parte de los gastos de la operación?`
      : '¿Ese costo incluye únicamente materiales y fabricación, o también incluye mano de obra, empaque, transporte, impuestos, diseño, comercialización, servicios y una parte de los gastos de la empresa?'
    : '';
  const summaryParts = [
    semilla.disciplinaCandidata ? `Registré nueva información de un proyecto de ${semilla.disciplinaCandidata.valor}` : 'Registré nueva información del proyecto',
    audience ? `dirigido preliminarmente a ${audience}` : '',
    financialSignals.find((s) => s.kind === 'cost')?.amount ? `con costo declarado de COP ${financialSignals.find((s) => s.kind === 'cost')!.amount!.toLocaleString('es-CO')}` : '',
    financialSignals.find((s) => s.kind === 'price')?.amount ? `y precio de venta de COP ${financialSignals.find((s) => s.kind === 'price')!.amount!.toLocaleString('es-CO')}` : '',
    explicitFacts.some((f) => f.field === 'brand_identity') ? 'La identidad de marca aún está pendiente' : '',
  ].filter(Boolean);

  const classifications = classifyProjectEvidence(input);
  return {
    understoodSummary: `${summaryParts.join('; ')}.`, explicitFacts, inferredFacts,
    updatedModules: Array.from(new Set(patches.map((patch) => patch.moduleId))), proposedPatches: patches,
    financialSignals, timelineSignals: [], riskSignals: needsBreakdown ? ['El costo declarado puede omitir costos indirectos.'] : [], contradictionSignals: [],
    pendingQuestions: needsBreakdown ? [{ id: createId(), area: 'budget', question: recommendedNextQuestion, reason: 'Validar el alcance del costo unitario antes de evaluar rentabilidad.', createdAt: now(), status: 'pending' }] : [],
    nextQuestionCandidates: recommendedNextQuestion ? [recommendedNextQuestion, '¿Quieres desglosar el costo unitario por componentes?'] : [],
    recommendedNextQuestion, confidence: explicitFacts.length ? 0.9 : 0.65, classifications,
  };
}
