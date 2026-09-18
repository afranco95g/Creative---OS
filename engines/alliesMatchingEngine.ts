// Motor de emparejamiento necesidad↔servicio — Fase 3.
// Puro: no lee red, no lee la fecha de hoy, no tiene efectos secundarios.
// Basta una categoría en común entre las necesidades del proyecto y el
// service_categories de un aliado para sugerirlo (decisión de Andrés,
// 2026-09-17) — no hace falta que coincidan todas.

export type AllyActorType = 'space' | 'funder';

export interface AllyForMatching {
  actorType: AllyActorType;
  actorId: string;
  name: string;
  slug: string;
  serviceCategories: string[];
}

export interface AllyMatch {
  actorType: AllyActorType;
  actorId: string;
  name: string;
  slug: string;
  matchedCategories: string[];
}

export function matchAlliesToNeeds(needs: string[], allies: AllyForMatching[]): AllyMatch[] {
  if (needs.length === 0) return [];
  const needsSet = new Set(needs);

  const matches: AllyMatch[] = [];
  for (const ally of allies) {
    const matchedCategories = ally.serviceCategories.filter((category) => needsSet.has(category));
    if (matchedCategories.length === 0) continue;
    matches.push({
      actorType: ally.actorType,
      actorId: ally.actorId,
      name: ally.name,
      slug: ally.slug,
      matchedCategories,
    });
  }

  return matches;
}
