import { createId, now } from '../core/projectEngine';
import type { ProjectGraph, ProjectPatch, TurnInterpretation } from '../types/project';
import { detectFinancialSignals } from './budgetSignalProcessor';

const normalize = (value: string) => value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

export function interpretTurn(input: string, graph: ProjectGraph, patches: ProjectPatch[]): TurnInterpretation {
  const text = normalize(input);
  const financialSignals = detectFinancialSignals(input);
  const explicitFacts: TurnInterpretation['explicitFacts'] = [];
  const inferredFacts: TurnInterpretation['inferredFacts'] = [];
  if (/zapato|calzado/.test(text)) explicitFacts.push({ field: 'product', value: 'calzado', confidence: 'confirmed', source: 'user' });
  const audiences = ['skate', 'bmx', 'deportes extremos'].filter((term) => text.includes(term));
  if (audiences.length) explicitFacts.push({ field: 'audience', value: audiences.join(', '), confidence: 'preliminary', source: 'user' });
  if (/no (?:tengo|tenemos).*(?:diseno|identidad).*(?:marca)/.test(text)) explicitFacts.push({ field: 'brand_identity', value: false, confidence: 'confirmed', source: 'user' });
  if (/zapato|calzado/.test(text)) inferredFacts.push({ field: 'project_type', value: 'producto o emprendimiento de calzado', confidence: 'preliminary', source: 'system_inference' });
  for (const signal of financialSignals.filter((item) => item.kind !== 'preliminary_margin')) explicitFacts.push({ field: signal.kind, value: signal.amount ?? signal.concept, confidence: signal.status === 'requires_estimate' ? 'requires_confirmation' : 'confirmed', source: 'user' });

  const needsBreakdown = financialSignals.some((signal) => signal.status === 'requires_breakdown');
  const recommendedNextQuestion = needsBreakdown
    ? 'Cuando dices que fabricar cada zapato cuesta COP 80.000, ¿ese valor incluye únicamente materiales y fabricación o también incluye mano de obra, empaque, transporte, impuestos, diseño, comercialización, servicios y una parte de los gastos de la empresa?'
    : '';
  const summaryParts = [
    explicitFacts.find((fact) => fact.field === 'product') ? 'El proyecto propone un producto de calzado' : 'Registré nueva información del proyecto',
    audiences.length ? `dirigido preliminarmente a comunidades de ${audiences.join(', ')}` : '',
    financialSignals.find((s) => s.kind === 'cost')?.amount ? `con costo declarado de COP ${financialSignals.find((s) => s.kind === 'cost')!.amount!.toLocaleString('es-CO')}` : '',
    financialSignals.find((s) => s.kind === 'price')?.amount ? `y precio de venta de COP ${financialSignals.find((s) => s.kind === 'price')!.amount!.toLocaleString('es-CO')}` : '',
    explicitFacts.some((f) => f.field === 'brand_identity') ? 'La identidad de marca aún está pendiente' : '',
  ].filter(Boolean);

  return {
    understoodSummary: `${summaryParts.join('; ')}.`, explicitFacts, inferredFacts,
    updatedModules: Array.from(new Set(patches.map((patch) => patch.moduleId))), proposedPatches: patches,
    financialSignals, timelineSignals: [], riskSignals: needsBreakdown ? ['El costo declarado puede omitir costos indirectos.'] : [], contradictionSignals: [],
    pendingQuestions: needsBreakdown ? [{ id: createId(), area: 'budget', question: recommendedNextQuestion, reason: 'Validar el alcance del costo unitario antes de evaluar rentabilidad.', createdAt: now(), status: 'pending' }] : [],
    nextQuestionCandidates: recommendedNextQuestion ? [recommendedNextQuestion, '¿Quieres desglosar el costo unitario por componentes?'] : [],
    recommendedNextQuestion, confidence: explicitFacts.length ? 0.9 : 0.65,
  };
}
