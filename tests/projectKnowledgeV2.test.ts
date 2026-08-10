import { createInitialProjectGraph } from '../core/projectEngine';
import { interpretProjectMessage, mergeProjectKnowledge } from '../engines/projectKnowledgeEngine';
import type { FinancialKnowledgeValue } from '../types/projectKnowledge';

function assert(condition: unknown, message: string): asserts condition { if (!condition) throw new Error(message); }
const interpret=(message:string,graph=createInitialProjectGraph())=>interpretProjectMessage({message,graph});

const kicks=interpret('Quiero crear una marca de zapatos para skate y BMX. Hacer cada par me cuesta 80.000 pesos y quiero venderlo a 220.000. Todavía no tengo diseño de marca.');
const kicksByKey=(key:string)=>kicks.knowledgeEntities.find(entity=>entity.key===key);
assert(kicks.projectTypeSignals.includes('product')&&kicks.projectTypeSignals.includes('business'),'Kicks debe detectar product y business.');
assert((kicksByKey('production_cost_unit')?.value as FinancialKnowledgeValue).amount===80000,'Kicks debe detectar costo 80.000.');
assert((kicksByKey('intended_sale_price')?.value as FinancialKnowledgeValue).amount===220000,'Kicks debe detectar precio 220.000.');
assert((kicksByKey('preliminary_unit_spread')?.value as FinancialKnowledgeValue).amount===140000,'Kicks debe calcular diferencia preliminar.');
assert(!kicks.knowledgeEntities.some(entity=>/profit|utilidad/i.test(`${entity.key} ${entity.label}`)),'La diferencia no puede llamarse utilidad.');
assert(kicksByKey('brand_design_need')?.type==='need','Kicks debe detectar necesidad de diseño.');
assert(kicks.clarificationIntent==='clarify_cost_scope','Kicks debe aclarar alcance del costo.');

const event=interpret('El festival será para 500 personas el 20 de noviembre. Queremos 10 artistas pero todavía no tenemos espacio.');
assert(event.projectTypeSignals.includes('event'),'Debe detectar evento.');
assert(event.knowledgeEntities.some(entity=>entity.key==='expected_attendance'&&entity.value===500),'Debe detectar aforo 500.');
assert(event.knowledgeEntities.some(entity=>entity.type==='timeline_fact'),'Debe detectar fecha.');
assert(event.knowledgeEntities.some(entity=>entity.key==='artist_requirement'),'Debe detectar requisito de artistas.');
assert(event.knowledgeEntities.some(entity=>entity.key==='venue_need'),'Debe detectar necesidad de espacio.');
assert(!event.knowledgeEntities.some(entity=>entity.key==='city'||entity.key==='artist_fee'),'No debe inventar ciudad ni fee.');

const responsibility=interpret('Laura se encargará de comunicaciones y Pedro de producción.');
assert(responsibility.knowledgeEntities.filter(entity=>entity.type==='actor').length===2,'Debe detectar dos actores.');
assert(responsibility.knowledgeEntities.filter(entity=>entity.type==='responsibility').length===2,'Debe detectar dos responsabilidades.');

let correctedGraph=createInitialProjectGraph();
correctedGraph=mergeProjectKnowledge(correctedGraph,interpret('El costo es 80.000.',correctedGraph));
correctedGraph=mergeProjectKnowledge(correctedGraph,interpret('En realidad 80.000 son solo materiales.',correctedGraph));
const costHistory=correctedGraph.knowledge!.entities.filter(entity=>entity.key==='production_cost_unit');
assert(costHistory.length===2,'La corrección debe conservar dos versiones históricas.');
assert(costHistory.filter(entity=>entity.status!=='superseded').length===1,'Solo una versión del costo puede permanecer activa.');
assert(costHistory.some(entity=>entity.status==='superseded'&&entity.supersededBy),'La versión anterior debe quedar superseded.');

const artistic=interpret('Estoy investigando cómo cambia nuestra relación con el cuerpo cuando interactuamos con máquinas. Quiero convertir esa investigación en una performance, pero todavía no sé si quiero venderla.');
assert(artistic.projectTypeSignals.includes('artistic_project'),'Debe detectar proyecto artístico.');
assert(artistic.driverSignals.includes('research')&&artistic.driverSignals.includes('exploration'),'Debe detectar research y exploration.');
assert(!artistic.driverSignals.includes('problem'),'No debe inventar un problema.');

const consolidated=interpret('Llevamos cinco años haciendo este festival. La última edición tuvo 2.300 asistentes, un presupuesto de 180 millones y un equipo de 22 personas.');
assert(consolidated.knowledgeEntities.some(entity=>entity.key==='operational_history'),'Debe capturar trayectoria.');
assert(consolidated.knowledgeEntities.some(entity=>entity.key==='previous_attendance'&&entity.value===2300),'Debe capturar asistencia histórica.');
assert(consolidated.knowledgeEntities.some(entity=>entity.key==='historical_budget'&&(entity.value as FinancialKnowledgeValue).amount===180000000),'Debe capturar presupuesto histórico.');
assert(consolidated.knowledgeEntities.some(entity=>entity.key==='historical_team_size'&&entity.value===22),'Debe capturar equipo histórico.');
assert(consolidated.warnings.includes('possible_stage_mismatch'),'Debe alertar posible stage mismatch.');

const duplicateGraph=createInitialProjectGraph();const one=interpret('Lo vendo a 220.000.',duplicateGraph);const once=mergeProjectKnowledge(duplicateGraph,one);const twice=mergeProjectKnowledge(once,interpret('Lo vendo a 220.000.',once));
assert(twice.knowledge!.entities.filter(entity=>entity.key==='intended_sale_price').length===1,'Debe deduplicar el mismo precio.');

console.log('Project Knowledge V2: OK');
