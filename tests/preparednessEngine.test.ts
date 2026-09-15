import assert from 'node:assert/strict';
import { getPreparednessSummary, seedPreparednessChecklist } from '../engines/preparednessEngine';
import { createInitialProjectGraph } from '../core/projectEngine';
import type { PreparednessChecklistItem } from '../types/project';

// ---------------------------------------------------------------------------
// a) seedPreparednessChecklist(): exactamente 8 ítems, 4 de cada área, todos
// en 'pendiente' con nota vacía. Se verifica area/title/status, no id — dos
// llamadas producen ids distintos por diseño (spec, sección "puntos de
// atención" del constructor).
// ---------------------------------------------------------------------------
{
  const items = seedPreparednessChecklist();

  assert.equal(items.length, 8, 'a · exactamente 8 ítems');

  const legal = items.filter((item) => item.area === 'legal');
  const mercadeo = items.filter((item) => item.area === 'mercadeo');
  assert.equal(legal.length, 4, 'a · 4 ítems de área legal');
  assert.equal(mercadeo.length, 4, 'a · 4 ítems de área mercadeo');

  assert.deepEqual(
    legal.map((item) => item.title),
    [
      'Estructura legal definida',
      'Contratos con el equipo',
      'Derechos de autor / propiedad intelectual',
      'Permisos y licencias',
    ],
    'a · títulos exactos de legal, en orden'
  );
  assert.deepEqual(
    mercadeo.map((item) => item.title),
    [
      'Público objetivo definido',
      'Identidad visual lista',
      'Plan de difusión',
      'Materiales de presentación (one-pager/portfolio)',
    ],
    'a · títulos exactos de mercadeo, en orden'
  );

  assert(items.every((item) => item.status === 'pendiente'), 'a · todos los ítems arrancan en pendiente');
  assert(items.every((item) => item.note === ''), 'a · todos los ítems arrancan sin nota');
  assert(items.every((item) => item.description.trim().length > 0), 'a · todos los ítems traen una descripción');

  const ids = new Set(items.map((item) => item.id));
  assert.equal(ids.size, 8, 'a · los 8 ids son distintos entre sí');
}

// ---------------------------------------------------------------------------
// b) Dos llamadas a seedPreparednessChecklist() producen ids distintos.
// ---------------------------------------------------------------------------
{
  const primera = seedPreparednessChecklist();
  const segunda = seedPreparednessChecklist();
  const idsPrimera = primera.map((item) => item.id);
  const idsSegunda = segunda.map((item) => item.id);
  assert(idsPrimera.every((id) => !idsSegunda.includes(id)), 'b · ids no se repiten entre llamadas distintas');
}

// ---------------------------------------------------------------------------
// c) getPreparednessSummary(): 2 de 4 ítems legal en 'listo' → 50%.
// ---------------------------------------------------------------------------
{
  const items = seedPreparednessChecklist();
  const legalIds = items.filter((item) => item.area === 'legal').map((item) => item.id);
  const conDosListos: PreparednessChecklistItem[] = items.map((item) =>
    legalIds.slice(0, 2).includes(item.id) ? { ...item, status: 'listo' } : item
  );

  const resumen = getPreparednessSummary(conDosListos);
  assert.equal(resumen.legalReadiness, 50, 'c · legalReadiness con 2 de 4 en listo');
  assert.equal(resumen.mercadeoReadiness, 0, 'c · mercadeoReadiness sin ítems en listo');
  assert.equal(resumen.overallReadiness, 25, 'c · overallReadiness: 2 de 8 en listo');
}

// ---------------------------------------------------------------------------
// d) getPreparednessSummary() con todos los ítems en 'listo'.
// ---------------------------------------------------------------------------
{
  const items = seedPreparednessChecklist().map((item) => ({ ...item, status: 'listo' as const }));
  const resumen = getPreparednessSummary(items);
  assert.equal(resumen.legalReadiness, 100, 'd · legalReadiness al 100%');
  assert.equal(resumen.mercadeoReadiness, 100, 'd · mercadeoReadiness al 100%');
  assert.equal(resumen.overallReadiness, 100, 'd · overallReadiness al 100%');
}

// ---------------------------------------------------------------------------
// e) getPreparednessSummary() con lista vacía no lanza y da 0% en todo.
// ---------------------------------------------------------------------------
{
  const resumen = getPreparednessSummary([]);
  assert.equal(resumen.legalReadiness, 0, 'e · legalReadiness vacío');
  assert.equal(resumen.mercadeoReadiness, 0, 'e · mercadeoReadiness vacío');
  assert.equal(resumen.overallReadiness, 0, 'e · overallReadiness vacío');
}

// ---------------------------------------------------------------------------
// f) createInitialProjectGraph() crea un proyecto con preparedness poblado:
// 8 ítems, todos en 'pendiente'.
// ---------------------------------------------------------------------------
{
  const graph = createInitialProjectGraph();
  const preparedness = graph.tools.preparedness;

  assert(preparedness, 'f · graph.tools.preparedness existe');
  assert.equal(preparedness!.length, 8, 'f · 8 ítems');
  assert(preparedness!.every((item) => item.status === 'pendiente'), 'f · todos en pendiente');
  assert.equal(
    preparedness!.filter((item) => item.area === 'legal').length,
    4,
    'f · 4 ítems legal'
  );
  assert.equal(
    preparedness!.filter((item) => item.area === 'mercadeo').length,
    4,
    'f · 4 ítems mercadeo'
  );
}

console.log('Preparedness engine: OK');
