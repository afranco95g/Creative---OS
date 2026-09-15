import assert from 'node:assert/strict';
import { checkDependencyConsistency } from '../engines/projectDependencyEngine';
import type {
  ProjectActivity,
  ProjectActivityBudgetLink,
  ProjectBudgetLine,
  ProjectObjective,
  ProjectScheduleItem,
  ProjectTools,
} from '../types/project';

function budgetLine(id: string): ProjectBudgetLine {
  return {
    id,
    category: 'General',
    concept: 'Línea de prueba',
    quantity: 1,
    unit: 'unidad',
    unitValue: 100,
    vatRate: 0,
    withholdingRate: 0,
    otherTaxes: 0,
    status: 'proposed',
    responsible: '',
    provider: '',
    estimatedDate: '',
    actualDate: '',
    source: 'manual',
  };
}

function scheduleItem(id: string, activityId: string | null): ProjectScheduleItem {
  return {
    id,
    name: `Ítem ${id}`,
    description: '',
    startsAt: '2026-01-01',
    endsAt: '2026-01-02',
    responsible: '',
    status: 'planned',
    budgetLineId: null,
    documentIds: [],
    tasks: [],
    milestone: false,
    activityId,
  };
}

function activity(id: string, objectiveId: string | null = null): ProjectActivity {
  return { id, objectiveId, title: `Actividad ${id}`, description: '', createdAt: '2026-01-01T00:00:00.000Z' };
}

function objective(id: string): ProjectObjective {
  return { id, title: `Objetivo ${id}`, description: '', createdAt: '2026-01-01T00:00:00.000Z' };
}

function link(id: string, activityId: string, budgetLineId: string): ProjectActivityBudgetLink {
  return { id, activityId, budgetLineId };
}

function baseTools(overrides: Partial<ProjectTools> = {}): ProjectTools {
  return {
    budgetLines: [],
    scheduleItems: [],
    grant: {
      opportunityId: '',
      opportunityName: '',
      objective: '',
      requirements: [],
      requiredDocuments: [],
      requiresBudget: true,
      requiresTimeline: true,
      attachments: [],
      evaluationCriteria: [],
      answers: {},
    },
    objectives: [],
    activities: [],
    activityBudgetLinks: [],
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// 1) Sin objectives/activities/activityBudgetLinks (y sin scheduleItems), no
// se produce ningún finding.
// ---------------------------------------------------------------------------
{
  const findings = checkDependencyConsistency(baseTools());
  assert.deepEqual(findings, [], '1 · un proyecto sin objectives/activities/links no produce ningún finding');
}

// ---------------------------------------------------------------------------
// 2) Un activityBudgetLink con budgetLineId inexistente produce exactamente
// un finding tipo orphan_budget_link.
// ---------------------------------------------------------------------------
{
  const tools = baseTools({
    activities: [activity('act-1')],
    budgetLines: [budgetLine('line-1')],
    activityBudgetLinks: [link('link-1', 'act-1', 'line-inexistente')],
    // La actividad sí está vinculada (aunque a una línea inexistente), así
    // que no debe aparecer también como activity_without_link.
  });
  const findings = checkDependencyConsistency(tools);
  const orphanLinks = findings.filter((f) => f.type === 'orphan_budget_link');
  assert.equal(orphanLinks.length, 1, '2 · exactamente un finding orphan_budget_link');
  assert.equal(orphanLinks[0].relatedId, 'link-1', '2 · relatedId apunta al link huérfano');
  assert.equal(findings.filter((f) => f.type === 'activity_without_link').length, 0, '2 · la actividad vinculada no cuenta como sin vínculo');
}

// ---------------------------------------------------------------------------
// 3) Un activityBudgetLink con activityId inexistente también produce
// exactamente un finding orphan_budget_link (no dos, aunque ambos ids
// fallaran).
// ---------------------------------------------------------------------------
{
  const tools = baseTools({
    budgetLines: [budgetLine('line-1')],
    activityBudgetLinks: [link('link-2', 'act-inexistente', 'line-1')],
  });
  const findings = checkDependencyConsistency(tools);
  const orphanLinks = findings.filter((f) => f.type === 'orphan_budget_link');
  assert.equal(orphanLinks.length, 1, '3 · exactamente un finding orphan_budget_link con activityId inexistente');
  assert.equal(orphanLinks[0].relatedId, 'link-2', '3 · relatedId apunta al link huérfano');
}

// ---------------------------------------------------------------------------
// 4) Un ProjectScheduleItem con activityId inexistente produce exactamente
// un finding orphan_schedule_item.
// ---------------------------------------------------------------------------
{
  const tools = baseTools({
    scheduleItems: [scheduleItem('item-1', 'act-inexistente')],
  });
  const findings = checkDependencyConsistency(tools);
  const orphanScheduleItems = findings.filter((f) => f.type === 'orphan_schedule_item');
  assert.equal(orphanScheduleItems.length, 1, '4 · exactamente un finding orphan_schedule_item');
  assert.equal(orphanScheduleItems[0].relatedId, 'item-1', '4 · relatedId apunta al ítem de cronograma huérfano');
}

// ---------------------------------------------------------------------------
// 5) Un ProjectScheduleItem con activityId: null nunca produce finding (el
// vínculo siempre es opcional).
// ---------------------------------------------------------------------------
{
  const tools = baseTools({
    scheduleItems: [scheduleItem('item-2', null)],
  });
  const findings = checkDependencyConsistency(tools);
  assert.deepEqual(findings, [], '5 · un ítem de cronograma sin actividad vinculada no produce finding');
}

// ---------------------------------------------------------------------------
// 6) Una ProjectActivity sin ningún link ni schedule item que la referencie
// produce un finding activity_without_link.
// ---------------------------------------------------------------------------
{
  const tools = baseTools({
    activities: [activity('act-2')],
  });
  const findings = checkDependencyConsistency(tools);
  assert.equal(findings.length, 1, '6 · exactamente un finding');
  assert.equal(findings[0].type, 'activity_without_link', '6 · el finding es activity_without_link');
  assert.equal(findings[0].relatedId, 'act-2', '6 · relatedId apunta a la actividad huérfana');
}

// ---------------------------------------------------------------------------
// 7) Una actividad referenciada solo por un activityBudgetLink (link válido)
// no cuenta como sin vínculo.
// ---------------------------------------------------------------------------
{
  const tools = baseTools({
    activities: [activity('act-3')],
    budgetLines: [budgetLine('line-3')],
    activityBudgetLinks: [link('link-3', 'act-3', 'line-3')],
  });
  const findings = checkDependencyConsistency(tools);
  assert.deepEqual(findings, [], '7 · actividad vinculada por presupuesto válido no produce ningún finding');
}

// ---------------------------------------------------------------------------
// 8) Una actividad referenciada solo por el activityId de un schedule item
// (sin ningún activityBudgetLink) tampoco cuenta como sin vínculo.
// ---------------------------------------------------------------------------
{
  const tools = baseTools({
    activities: [activity('act-4')],
    scheduleItems: [scheduleItem('item-4', 'act-4')],
  });
  const findings = checkDependencyConsistency(tools);
  assert.deepEqual(findings, [], '8 · actividad vinculada solo por cronograma no produce ningún finding');
}

// ---------------------------------------------------------------------------
// 9) tools sin objectives/activities/activityBudgetLinks definidos
// (campos opcionales ausentes) no lanza y no produce findings.
// ---------------------------------------------------------------------------
{
  const tools: ProjectTools = {
    budgetLines: [],
    scheduleItems: [],
    grant: {
      opportunityId: '',
      opportunityName: '',
      objective: '',
      requirements: [],
      requiredDocuments: [],
      requiresBudget: true,
      requiresTimeline: true,
      attachments: [],
      evaluationCriteria: [],
      answers: {},
    },
  };
  const findings = checkDependencyConsistency(tools);
  assert.deepEqual(findings, [], '9 · tools sin los campos opcionales no lanza y no produce findings');
}

console.log('Project dependency engine: OK');
