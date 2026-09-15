import type { ProjectBudgetLine } from '../types/project';

// Fuente única de la fórmula de total de una línea de presupuesto.
// Aritmética idéntica a la que vivía inline en:
//   - engines/projectConsistencyEngine.ts (`total`)
//   - engines/financialAuthorityEngine.ts (`graphTotal`)
// No se cambia el orden de las operaciones ni el redondeo.
export function totalDeLinea(linea: ProjectBudgetLine): number {
  const subtotal = linea.quantity * linea.unitValue;
  return subtotal + (subtotal * linea.vatRate) / 100 - (subtotal * linea.withholdingRate) / 100 + linea.otherTaxes;
}
