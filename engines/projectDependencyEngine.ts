// Motor de dependencias objetivo -> actividad -> presupuesto -> cronograma.
// Spec: specs/motor-de-dependencias-objetivo-actividad.md
//
// Función pura: recibe `tools: ProjectTools`, no lee el grafo completo, no
// tiene efectos secundarios, no usa la fecha de hoy ni nada no determinista
// salvo el `id` de cada hallazgo (mismo patrón que `projectConsistencyEngine`
// con `createId()`). Solo informa — no bloquea ni modifica nada.

import { createId } from '../core/projectEngine';
import type { DependencyFinding, ProjectTools } from '../types/project';

export function checkDependencyConsistency(tools: ProjectTools): DependencyFinding[] {
  const activities = tools.activities ?? [];
  const budgetLines = tools.budgetLines ?? [];
  const scheduleItems = tools.scheduleItems ?? [];
  const activityBudgetLinks = tools.activityBudgetLinks ?? [];

  const activityIds = new Set(activities.map((activity) => activity.id));
  const budgetLineIds = new Set(budgetLines.map((line) => line.id));

  const findings: DependencyFinding[] = [];

  for (const link of activityBudgetLinks) {
    const activityExists = activityIds.has(link.activityId);
    const budgetLineExists = budgetLineIds.has(link.budgetLineId);
    if (!activityExists || !budgetLineExists) {
      const missing = !activityExists && !budgetLineExists
        ? `la actividad (${link.activityId}) y la línea de presupuesto (${link.budgetLineId})`
        : !activityExists
          ? `la actividad (${link.activityId})`
          : `la línea de presupuesto (${link.budgetLineId})`;
      findings.push({
        id: createId(),
        type: 'orphan_budget_link',
        message: `El vínculo entre actividad y presupuesto ${link.id} referencia ${missing}, que ya no existe.`,
        relatedId: link.id,
      });
    }
  }

  for (const item of scheduleItems) {
    if (item.activityId && !activityIds.has(item.activityId)) {
      findings.push({
        id: createId(),
        type: 'orphan_schedule_item',
        message: `El ítem de cronograma "${item.name}" está vinculado a una actividad (${item.activityId}) que ya no existe.`,
        relatedId: item.id,
      });
    }
  }

  const linkedActivityIds = new Set(activityBudgetLinks.map((link) => link.activityId));
  const scheduledActivityIds = new Set(
    scheduleItems
      .filter((item): item is typeof item & { activityId: string } => Boolean(item.activityId))
      .map((item) => item.activityId)
  );

  for (const activity of activities) {
    const hasLink = linkedActivityIds.has(activity.id);
    const hasScheduleItem = scheduledActivityIds.has(activity.id);
    if (!hasLink && !hasScheduleItem) {
      findings.push({
        id: createId(),
        type: 'activity_without_link',
        message: `La actividad "${activity.title}" no está vinculada a ninguna línea de presupuesto ni ítem de cronograma.`,
        relatedId: activity.id,
      });
    }
  }

  return findings;
}
