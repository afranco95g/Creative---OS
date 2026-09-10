import assert from 'node:assert/strict';
import { createInitialProjectGraph } from '../core/projectEngine';
import { createProjectControllerState, processProjectMessage } from '../core/projectController';
import { getNextBestQuestion, getQuestionIntent } from '../engines/questionEngine';

process.env.NEXT_PUBLIC_FINANCIAL_AUTHORITY_V2 = 'true';

const initial = createInitialProjectGraph();
initial.id = 'musco-runtime-test';
initial.title = 'MUSCO';

const first = processProjectMessage(
  createProjectControllerState(initial),
  'Quiero que el evento consista de un concierto como actividad principal: el concierto seria tipo festival y tendria un total de 30 artistas de diferentes regiones de Colombia. La idea seria cobrar un ticket de 320,000 pesos COP, y a todos los artistas pagarles por su presentacion, pero aun no se como dividir esos pagos, hay artistas que por su trayectoria cobran mas.'
);

assert.notEqual(getQuestionIntent(first.response.nextQuestion), 'clarify_project_name', 'No debe volver a preguntar el nombre conocido.');
assert(first.state.graph.knowledge?.entities.some((entity) => entity.key === 'artist_requirement'));
assert(first.state.graph.knowledge?.entities.some((entity) => entity.key === 'intended_ticket_price'));
assert(first.state.graph.knowledge?.entities.some((entity) => entity.key === 'artist_fee_variability'));
assert(first.state.graph.knowledge?.entities.some((entity) => entity.key === 'artist_fee_need'));
assert(first.state.graph.knowledge?.entities.some((entity) => entity.key === 'artist_fee_distribution_uncertainty'));
assert.equal(first.state.graph.tools.budgetLines.length, 0, 'No crea una linea legacy en cero.');

const second = processProjectMessage(
  first.state,
  'Segun averiguaciones, cada artista cobraria aproximadamente 2 millones.'
);
const proposal = second.state.graph.financialAuthority?.proposals.find((item) => item.status === 'pending');
assert(proposal, 'Debe materializar una propuesta financiera pendiente con el flag activo.');
assert.equal(proposal.quantity, 30);
assert.equal(proposal.unitPrice.amount, 2_000_000);
assert.equal(proposal.calculatedTotal.amount, 60_000_000);
assert.equal(second.state.graph.financialAuthority?.items.length, 0, 'La propuesta no se convierte en presupuesto antes de aceptarla.');
assert.equal(second.state.graph.tools.budgetLines.length, 0, 'No crea una linea legacy antes de aceptar.');
assert(second.response.organized.some((item) => item.includes('60.000.000')), 'La respuesta debe exponer el total preliminar.');
assert.notEqual(getQuestionIntent(second.response.nextQuestion), 'clarify_project_name');
assert.notEqual(getQuestionIntent(second.response.nextQuestion), getQuestionIntent(first.response.nextQuestion), 'No repite la misma intencion de pregunta.');
assert(second.state.graph.knowledge?.entities.some((entity) => entity.key === 'artist_requirement'), 'El conocimiento del primer turno persiste.');

const splitFirst = processProjectMessage(createProjectControllerState({...createInitialProjectGraph(), title:'MUSCO'}), 'Seran 30 artistas.');
const splitSecond = processProjectMessage(splitFirst.state, 'Cada uno cuesta aproximadamente 2 millones.');
assert.equal(splitSecond.state.graph.financialAuthority?.proposals[0]?.calculatedTotal.amount, 60_000_000, 'Compone cantidad y costo aunque lleguen en turnos separados.');

const placeholder = createInitialProjectGraph();
placeholder.title = 'Proyecto sin nombre';
assert.equal(getQuestionIntent(getNextBestQuestion(placeholder)), 'clarify_project_name', 'Un proyecto realmente sin nombre conserva la pregunta de identidad.');

console.log('MUSCO runtime integration: OK');
