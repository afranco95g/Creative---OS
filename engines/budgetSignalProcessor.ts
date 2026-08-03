import { createId } from '../core/projectEngine';
import type { FinancialSignal } from '../types/project';

function normalize(input: string) {
  return input.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function parseCop(value: string): number {
  return Number(value.replace(/[^0-9]/g, ''));
}

export function detectFinancialSignals(input: string): FinancialSignal[] {
  const text = normalize(input);
  const signals: FinancialSignal[] = [];
  const money = '(?:cop\\s*|\\$\\s*)?([0-9]{1,3}(?:[.,][0-9]{3})+|[0-9]+)';
  const cost = new RegExp(`(?:me cuesta|cuesta|costo(?: de)?|fabricar(?:lo|la|los|las)? cuesta)\\s*${money}`, 'i').exec(text);
  const price = new RegExp(`(?:lo vendo en|la vendo en|vendo (?:en|a)|precio(?: de venta)?(?: es|:)?)\\s*${money}`, 'i').exec(text);

  if (cost) signals.push({ id: createId(), kind: 'cost', concept: 'Costo unitario declarado', amount: parseCop(cost[1]), currency: 'COP', quantity: 1, unit: /zapato|calzado/.test(text) ? 'par' : 'unidad', status: 'requires_breakdown', source: 'conversation', requiresConfirmation: true });
  if (price) signals.push({ id: createId(), kind: 'price', concept: 'Precio de venta declarado', amount: parseCop(price[1]), currency: 'COP', quantity: 1, unit: /zapato|calzado/.test(text) ? 'par' : 'unidad', status: 'declared', source: 'conversation', requiresConfirmation: true });
  if (cost && price) signals.push({ id: createId(), kind: 'preliminary_margin', concept: 'Margen bruto preliminar por unidad', amount: parseCop(price[1]) - parseCop(cost[1]), currency: 'COP', quantity: 1, unit: /zapato|calzado/.test(text) ? 'par' : 'unidad', status: 'estimated', source: 'conversation', requiresConfirmation: false });
  if (/no (?:tengo|tenemos).*(?:diseno|identidad).*(?:marca)|(?:diseno|identidad) de marca.*(?:pendiente|falta)/.test(text)) signals.push({ id: createId(), kind: 'cost', concept: 'Desarrollo de identidad de marca', amount: null, currency: 'COP', quantity: 1, unit: 'servicio', status: 'requires_estimate', source: 'conversation', requiresConfirmation: true });
  return signals;
}
