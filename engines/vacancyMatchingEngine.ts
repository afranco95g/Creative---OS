// Motor de emparejamiento vacante↔persona — Paso 3 del wizard de
// creación (aprobado 2026-09-18). Mismo principio que
// alliesMatchingEngine: puro, sin red, sin efectos secundarios.
//
// Deliberadamente NO reutiliza service_categories (vocabulario de lo
// que un space/funder ofrece como organización) — una vacante de
// proyecto busca una persona con un rol, que es people.roles. Mezclar
// los dos vocabularios sería el mismo error que ya corrigió
// alliesMatchingEngine para espacios/financiadores, pero al revés.

export interface PersonForMatching {
  id: string;
  fullName: string;
  slug: string;
  roles: string[];
}

export interface VacancyCandidateMatch {
  personId: string;
  fullName: string;
  slug: string;
}

export function matchPeopleToVacancy(
  roleNeeded: string | null,
  people: PersonForMatching[]
): VacancyCandidateMatch[] {
  // Vacante sin rol definido: no hay match automático, solo búsqueda
  // manual (la interfaz debe ofrecer buscar por nombre en ese caso).
  if (!roleNeeded) return [];

  return people
    .filter((person) => person.roles.includes(roleNeeded))
    .map((person) => ({
      personId: person.id,
      fullName: person.fullName,
      slug: person.slug,
    }));
}
