import { createInitialProjectGraph } from '../core/projectEngine';
import { extractProjectPatchesFromMessage } from '../engines/conversationEngine';
import { interpretTurn } from '../engines/turnInterpretationEngine';

const message = 'Quiero crear una marca de zapatos para deportistas extremos, skate y BMX. Hacer cada zapato me cuesta COP 80.000 y lo vendo en COP 220.000. No tengo diseño de marca aún.';
const graph = createInitialProjectGraph();
const result = interpretTurn(message, graph, extractProjectPatchesFromMessage(message, graph));
const amount = (kind: string) => result.financialSignals.find((signal) => signal.kind === kind)?.amount;

if (amount('cost') !== 80000) throw new Error('No detectó costo COP 80.000');
if (amount('price') !== 220000) throw new Error('No detectó precio COP 220.000');
if (amount('preliminary_margin') !== 140000) throw new Error('No calculó margen preliminar COP 140.000');
if (!result.explicitFacts.some((fact) => fact.field === 'audience' && String(fact.value).includes('bmx'))) throw new Error('No detectó público BMX');
if (!result.explicitFacts.some((fact) => fact.field === 'brand_identity' && fact.value === false)) throw new Error('No detectó identidad pendiente');
if (!result.recommendedNextQuestion.includes('mano de obra')) throw new Error('No preguntó por costos omitidos');

console.log('Kicks interpretation: OK');
