// Motor de flujo de caja del proyecto — spec: specs/flujo-de-caja-con-condiciones.md (v3).
//
// Puro: no lee el grafo, no lee la fecha de hoy, no tiene efectos secundarios.
// Todo lo que necesita entra por parámetro (ver spec 6 y 9).

import { totalDeLinea } from '../core/budgetMath';
import type { Fuente, ID, Ingreso, ProjectBudgetLine, ProjectBudgetLineFuenteLink } from '../types/project';

export type VistaFlujo = 'comprometido' | 'aprobado' | 'completo';

export interface FlujoDeCaja {
  lineas: ProjectBudgetLine[];
  ingresos: Ingreso[];
  fuentes: Fuente[];
  saldoPropioInicialCop: number;
  toleranciaCop: number;
  // Opcional — ver specs/atribucion-egreso-a-fuente.md. Ausente o vacío se
  // comporta EXACTAMENTE igual que antes de esta entrega: todo egreso va a
  // la bolsa "propio", ninguna fuente resta egresos. A lo sumo un vínculo
  // por budgetLineId (el primero gana si hay duplicados).
  fuenteLinks?: ProjectBudgetLineFuenteLink[];
}

export interface Exposicion {
  desde: string;
  hasta: string;
  dias: number;
  montoMaximoCop: number;
}

export interface ClaridadDelPresupuesto {
  lineasSinFecha: ID[];
  lineasSinValor: ID[];
  lineasSinResponsable: ID[];
  ingresosSinFecha: ID[];
  totalEgresosCop: number;
  totalIngresosCop: number;
  diferenciaCop: number;
  estaFinanciado: boolean;
  listoParaPresentar: boolean;
}

export interface AnalisisDeFlujo {
  vista: VistaFlujo;
  curva: { fecha: string; saldoCop: number }[];
  exposicion: Exposicion | null;
  porBolsa: Record<ID | 'propio', { saldoMinimoCop: number; fecha: string | null }>;
  hayBloqueoPorRestriccion: boolean;
  gastosNoElegibles: { lineaId: ID; categoria: string; fuenteId: ID }[];
  // Distinto de gastosNoElegibles (heurístico, solo se calcula si ya hay
  // bloqueo). Este es exacto: viene de un vínculo real línea->fuente
  // (fuenteLinks), así que se reporta siempre que ese vínculo apunte a una
  // fuente restringida cuya categoría elegible no incluye la de la línea —
  // ver specs/atribucion-egreso-a-fuente.md.
  gastosAtribuidosNoElegibles: { lineaId: ID; categoria: string; fuenteId: ID }[];
  alertasAporteMinimo: { fuenteId: ID; faltanteCop: number; antesDe: string }[];
  claridad: ClaridadDelPresupuesto;
}

// ---------------------------------------------------------------------------
// Utilidades de fecha, todas en componentes UTC explícitos. `new Date(string)`
// combinado con métodos de zona horaria local es sensible a `TZ` del proceso;
// aquí no se usa nunca — ver spec 8.5.i.
// ---------------------------------------------------------------------------

const FORMATO_FECHA = /^(\d{4})-(\d{2})-(\d{2})$/;

function esFechaValida(valor: string): boolean {
  const match = FORMATO_FECHA.exec(valor);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return false;
  const millis = Date.UTC(year, month - 1, day);
  const comprobacion = new Date(millis);
  return comprobacion.getUTCFullYear() === year && comprobacion.getUTCMonth() === month - 1 && comprobacion.getUTCDate() === day;
}

function sumarDiasUtc(valor: string, dias: number): string {
  const match = FORMATO_FECHA.exec(valor);
  if (!match) throw new Error(`Fecha con formato inválido: ${valor}`);
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const millis = Date.UTC(year, month - 1, day) + dias * 86400000;
  const resultado = new Date(millis);
  const pad = (n: number, len: number) => String(n).padStart(len, '0');
  return `${pad(resultado.getUTCFullYear(), 4)}-${pad(resultado.getUTCMonth() + 1, 2)}-${pad(resultado.getUTCDate(), 2)}`;
}

function diasEntreInclusive(desde: string, hasta: string): number {
  const match = (valor: string) => {
    const m = FORMATO_FECHA.exec(valor)!;
    return Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  };
  return Math.round((match(hasta) - match(desde)) / 86400000) + 1;
}

function noVacia(valor: string | null | undefined): valor is string {
  return typeof valor === 'string' && valor.trim().length > 0;
}

// ---------------------------------------------------------------------------
// 5.10 — Validación. Errores, nunca correcciones silenciosas. Una línea o un
// ingreso sin fecha NO es un error: es un dato incompleto (ver `claridad`).
// ---------------------------------------------------------------------------

function validarFlujo(flujo: FlujoDeCaja): void {
  if (flujo.toleranciaCop < 0) {
    throw new Error(`FlujoDeCaja · toleranciaCop: no puede ser negativa (${flujo.toleranciaCop}).`);
  }

  for (const linea of flujo.lineas) {
    if (noVacia(linea.estimatedDate) && !esFechaValida(linea.estimatedDate)) {
      throw new Error(`Línea ${linea.id} · estimatedDate: fecha con formato inválido (${linea.estimatedDate}).`);
    }
    if (noVacia(linea.actualDate) && !esFechaValida(linea.actualDate)) {
      throw new Error(`Línea ${linea.id} · actualDate: fecha con formato inválido (${linea.actualDate}).`);
    }
  }

  for (const ingreso of flujo.ingresos) {
    if (ingreso.montoCop < 0) {
      throw new Error(`Ingreso ${ingreso.id} · montoCop: no puede ser negativo (${ingreso.montoCop}).`);
    }
    if (noVacia(ingreso.fechaDisparador) && !esFechaValida(ingreso.fechaDisparador)) {
      throw new Error(`Ingreso ${ingreso.id} · fechaDisparador: fecha con formato inválido (${ingreso.fechaDisparador}).`);
    }
    if (ingreso.latenciaDias < 0) {
      throw new Error(`Ingreso ${ingreso.id} · latenciaDias: no puede ser negativa (${ingreso.latenciaDias}).`);
    }
    if (ingreso.fuenteId !== null && !flujo.fuentes.some((fuente) => fuente.id === ingreso.fuenteId)) {
      throw new Error(`Ingreso ${ingreso.id} · fuenteId: no existe en fuentes (${ingreso.fuenteId}).`);
    }
  }

  for (const fuente of flujo.fuentes) {
    if (fuente.fechaInicioEjecucion !== null && noVacia(fuente.fechaInicioEjecucion) && !esFechaValida(fuente.fechaInicioEjecucion)) {
      throw new Error(`Fuente ${fuente.id} · fechaInicioEjecucion: fecha con formato inválido (${fuente.fechaInicioEjecucion}).`);
    }
    if (fuente.aporteMinimoInicioCop !== null && fuente.fechaInicioEjecucion === null) {
      throw new Error(`Fuente ${fuente.id} · aporteMinimoInicioCop: declarado sin fechaInicioEjecucion.`);
    }
  }
}

// ---------------------------------------------------------------------------
// 5.1 — Qué fecha usa el motor por línea de presupuesto.
// ---------------------------------------------------------------------------

function fechaEfectivaDeLinea(linea: ProjectBudgetLine): string | null {
  if (noVacia(linea.actualDate)) return linea.actualDate;
  if (noVacia(linea.estimatedDate)) return linea.estimatedDate;
  return null;
}

// ---------------------------------------------------------------------------
// 5.3 — El `status` de la línea da tres vistas sin construir escenarios.
// ---------------------------------------------------------------------------

function lineasParaVista(lineas: ProjectBudgetLine[], vista: VistaFlujo): ProjectBudgetLine[] {
  if (vista === 'comprometido') return lineas.filter((linea) => linea.status === 'committed' || linea.status === 'paid');
  if (vista === 'aprobado') return lineas.filter((linea) => linea.status === 'approved' || linea.status === 'committed' || linea.status === 'paid');
  return lineas.slice();
}

// ---------------------------------------------------------------------------
// Curva de caja. Un evento por movimiento; se acumulan por fecha porque el
// resultado neto de un día no depende del orden intradía (la suma es
// conmutativa) — que sea así es precisamente lo que evita las ventanas de
// exposición de un día que preocupaban a la v2 (spec 5.7). En empates de
// fecha el ingreso conceptualmente se acredita antes que el egreso; a nivel
// de saldo de cierre del día da el mismo resultado.
// ---------------------------------------------------------------------------

interface EventoFlujo {
  fecha: string;
  monto: number;
}

function eventosDeEgresos(lineas: ProjectBudgetLine[]): EventoFlujo[] {
  const eventos: EventoFlujo[] = [];
  for (const linea of lineas) {
    const fecha = fechaEfectivaDeLinea(linea);
    if (!fecha) continue;
    eventos.push({ fecha, monto: -totalDeLinea(linea) });
  }
  return eventos;
}

function eventosDeIngresos(ingresos: Ingreso[]): EventoFlujo[] {
  const eventos: EventoFlujo[] = [];
  for (const ingreso of ingresos) {
    if (!noVacia(ingreso.fechaDisparador)) continue;
    const fechaCredito = sumarDiasUtc(ingreso.fechaDisparador, ingreso.latenciaDias);
    eventos.push({ fecha: fechaCredito, monto: ingreso.montoCop });
  }
  return eventos;
}

function construirCurva(eventos: EventoFlujo[], saldoInicial: number): { fecha: string; saldoCop: number }[] {
  const porFecha = new Map<string, number>();
  for (const evento of eventos) {
    porFecha.set(evento.fecha, (porFecha.get(evento.fecha) ?? 0) + evento.monto);
  }
  const fechasOrdenadas = [...porFecha.keys()].sort();
  let saldo = saldoInicial;
  const curva: { fecha: string; saldoCop: number }[] = [];
  for (const fecha of fechasOrdenadas) {
    saldo += porFecha.get(fecha)!;
    curva.push({ fecha, saldoCop: saldo });
  }
  return curva;
}

function saldoMinimoDeCurva(curva: { fecha: string; saldoCop: number }[], inicial: number): { saldoMinimoCop: number; fecha: string | null } {
  let saldoMinimo = inicial;
  let fechaMinimo: string | null = null;
  for (const punto of curva) {
    if (punto.saldoCop < saldoMinimo) {
      saldoMinimo = punto.saldoCop;
      fechaMinimo = punto.fecha;
    }
  }
  return { saldoMinimoCop: saldoMinimo, fecha: fechaMinimo };
}

// ---------------------------------------------------------------------------
// Exposición: la peor ventana continua en la que la curva está por debajo de
// `-toleranciaCop`. "Peor" = mayor déficit; empate se rompe por más días.
// ---------------------------------------------------------------------------

function calcularExposicion(curva: { fecha: string; saldoCop: number }[], toleranciaCop: number): Exposicion | null {
  interface Ventana { desde: string; hasta: string; peor: number }
  const ventanas: Ventana[] = [];
  let actual: Ventana | null = null;

  for (const punto of curva) {
    const enDeficit = punto.saldoCop < -toleranciaCop;
    if (enDeficit) {
      if (actual) {
        actual.hasta = punto.fecha;
        actual.peor = Math.min(actual.peor, punto.saldoCop);
      } else {
        actual = { desde: punto.fecha, hasta: punto.fecha, peor: punto.saldoCop };
      }
    } else if (actual) {
      actual.hasta = sumarDiasUtc(punto.fecha, -1);
      ventanas.push(actual);
      actual = null;
    }
  }
  if (actual) ventanas.push(actual);
  if (!ventanas.length) return null;

  const peorVentana = ventanas.reduce((peor, candidata) => {
    if (!peor) return candidata;
    const magnitudCandidata = Math.abs(candidata.peor);
    const magnitudPeor = Math.abs(peor.peor);
    if (magnitudCandidata !== magnitudPeor) return magnitudCandidata > magnitudPeor ? candidata : peor;
    const diasCandidata = diasEntreInclusive(candidata.desde, candidata.hasta);
    const diasPeor = diasEntreInclusive(peor.desde, peor.hasta);
    return diasCandidata > diasPeor ? candidata : peor;
  }, null as Ventana | null)!;

  return {
    desde: peorVentana.desde,
    hasta: peorVentana.hasta,
    dias: diasEntreInclusive(peorVentana.desde, peorVentana.hasta),
    montoMaximoCop: Math.abs(peorVentana.peor),
  };
}

// ---------------------------------------------------------------------------
// 5.5 — Restricción de uso. `ProjectBudgetLine` no declara con qué fuente se
// paga cada egreso (no se modifica el tipo — spec 3 y 6), así que el motor no
// puede saber qué peso concreto cubrió cuál gasto. Por eso todo egreso se
// trata, para efectos de bolsa, como pagado con la bolsa `propio`; cada
// `Fuente` solo acumula los ingresos que tiene asignados por `fuenteId`.
//
// `hayBloqueoPorRestriccion` implementa la definición literal de spec 5.5
// párrafo 2: "el saldo puede estar positivo en total y bloqueado en la
// práctica" — el agregado de la vista termina en positivo mientras la bolsa
// `propio` —la única que en este modelo paga egresos— cae en negativo (ver
// `analizarFlujo`). No se usa ningún cruce de categorías para decidirlo: un
// cruce categórico (¿esta línea coincide con la lista de elegibles de esta
// fuente?) implicaría una causalidad egreso→fuente que el modelo de datos no
// puede conocer, porque no hay atribución real.
//
// `gastosNoElegibles` solo se calcula cuando `hayBloqueoPorRestriccion` ya es
// `true` (ver `analizarFlujo`). Calcularlo siempre, de forma independiente,
// lo vuelve en la práctica el complemento categórico de todo el presupuesto
// contra cada fuente restringida — listando líneas que nunca se intentó
// pagar con esa fuente, incluso en presupuestos sanos sin ningún problema
// real de caja. Acotarlo a los casos donde ya se detectó un bloqueo real es
// honesto sobre la limitación del modelo: no inventa una segunda heurística
// de atribución para "explicar" el bloqueo, solo lista candidatos plausibles
// en el momento en que el bloqueo ya es un hecho verificado por la
// definición de arriba.
// ---------------------------------------------------------------------------

function calcularGastosNoElegibles(lineas: ProjectBudgetLine[], fuentes: Fuente[], ingresos: Ingreso[]): { lineaId: ID; categoria: string; fuenteId: ID }[] {
  const resultado: { lineaId: ID; categoria: string; fuenteId: ID }[] = [];
  for (const fuente of fuentes) {
    if (!fuente.restringida || fuente.categoriasElegibles.length === 0) continue;
    const tieneSaldo = ingresos.some((ingreso) => ingreso.fuenteId === fuente.id && ingreso.montoCop > 0);
    if (!tieneSaldo) continue;
    for (const linea of lineas) {
      if (!fuente.categoriasElegibles.includes(linea.category)) {
        resultado.push({ lineaId: linea.id, categoria: linea.category, fuenteId: fuente.id });
      }
    }
  }
  return resultado;
}

// ---------------------------------------------------------------------------
// Atribución exacta (no heurística) — ver specs/atribucion-egreso-a-fuente.md.
// A diferencia de calcularGastosNoElegibles (candidatos, solo tras un
// bloqueo detectado), esto solo mira vínculos línea->fuente reales
// declarados en fuenteLinks: si existen, ya no hay ninguna causalidad que
// inferir, así que se reporta siempre que la fuente sea restringida y la
// categoría de la línea no esté entre sus categoriasElegibles.
// ---------------------------------------------------------------------------

function calcularGastosAtribuidosNoElegibles(lineas: ProjectBudgetLine[], fuentes: Fuente[], fuenteIdPorLinea: Map<ID, ID>): { lineaId: ID; categoria: string; fuenteId: ID }[] {
  const fuentesPorId = new Map(fuentes.map((fuente) => [fuente.id, fuente]));
  const resultado: { lineaId: ID; categoria: string; fuenteId: ID }[] = [];
  for (const linea of lineas) {
    const fuenteId = fuenteIdPorLinea.get(linea.id);
    if (fuenteId === undefined) continue;
    const fuente = fuentesPorId.get(fuenteId);
    if (!fuente || !fuente.restringida || fuente.categoriasElegibles.length === 0) continue;
    if (!fuente.categoriasElegibles.includes(linea.category)) {
      resultado.push({ lineaId: linea.id, categoria: linea.category, fuenteId: fuente.id });
    }
  }
  return resultado;
}

// ---------------------------------------------------------------------------
// 5.9 — Aporte Mínimo de Inicio. "Disponible antes de la fecha" es el saldo
// agregado de la curva de la vista, evaluado justo antes de
// `fechaInicioEjecucion` (con los eventos posteriores a esa fecha excluidos).
// ---------------------------------------------------------------------------

function saldoAntesDe(curva: { fecha: string; saldoCop: number }[], saldoInicial: number, fecha: string): number {
  let saldo = saldoInicial;
  for (const punto of curva) {
    if (punto.fecha >= fecha) break;
    saldo = punto.saldoCop;
  }
  return saldo;
}

function calcularAlertasAporteMinimo(fuentes: Fuente[], curvaAgregada: { fecha: string; saldoCop: number }[], saldoInicial: number): { fuenteId: ID; faltanteCop: number; antesDe: string }[] {
  const alertas: { fuenteId: ID; faltanteCop: number; antesDe: string }[] = [];
  for (const fuente of fuentes) {
    if (fuente.aporteMinimoInicioCop === null || !noVacia(fuente.fechaInicioEjecucion)) continue;
    const disponible = saldoAntesDe(curvaAgregada, saldoInicial, fuente.fechaInicioEjecucion);
    if (disponible < fuente.aporteMinimoInicioCop) {
      alertas.push({ fuenteId: fuente.id, faltanteCop: fuente.aporteMinimoInicioCop - disponible, antesDe: fuente.fechaInicioEjecucion });
    }
  }
  return alertas;
}

// ---------------------------------------------------------------------------
// 5.8 — Qué significa "presupuesto claro". Se calcula sobre TODO el
// presupuesto y TODOS los ingresos, sin filtrar por vista: es una propiedad
// del plan completo, no de un escenario.
// ---------------------------------------------------------------------------

function calcularClaridad(flujo: FlujoDeCaja): ClaridadDelPresupuesto {
  const lineasSinFecha = flujo.lineas.filter((linea) => fechaEfectivaDeLinea(linea) === null).map((linea) => linea.id);
  const lineasSinValor = flujo.lineas.filter((linea) => linea.unitValue === 0 || linea.quantity === 0).map((linea) => linea.id);
  const lineasSinResponsable = flujo.lineas.filter((linea) => !noVacia(linea.responsible)).map((linea) => linea.id);
  const ingresosSinFecha = flujo.ingresos.filter((ingreso) => !noVacia(ingreso.fechaDisparador)).map((ingreso) => ingreso.id);

  const totalEgresosCop = flujo.lineas.reduce((suma, linea) => suma + totalDeLinea(linea), 0);
  const totalIngresosCop = flujo.ingresos.reduce((suma, ingreso) => suma + ingreso.montoCop, 0);
  const diferenciaCop = totalIngresosCop - totalEgresosCop;

  return {
    lineasSinFecha,
    lineasSinValor,
    lineasSinResponsable,
    ingresosSinFecha,
    totalEgresosCop,
    totalIngresosCop,
    diferenciaCop,
    estaFinanciado: diferenciaCop >= 0,
    listoParaPresentar: lineasSinFecha.length === 0 && lineasSinValor.length === 0 && ingresosSinFecha.length === 0,
  };
}

// ---------------------------------------------------------------------------
// Función pública.
// ---------------------------------------------------------------------------

export function analizarFlujo(flujo: FlujoDeCaja, vista: VistaFlujo = 'aprobado'): AnalisisDeFlujo {
  validarFlujo(flujo);

  const lineasVista = lineasParaVista(flujo.lineas, vista);
  const eventosEgresos = eventosDeEgresos(lineasVista);
  const eventosIngresosTodos = eventosDeIngresos(flujo.ingresos);

  const curva = construirCurva([...eventosIngresosTodos, ...eventosEgresos], flujo.saldoPropioInicialCop);
  const exposicion = calcularExposicion(curva, flujo.toleranciaCop);

  const ingresosSinFuente = flujo.ingresos.filter((ingreso) => ingreso.fuenteId === null);
  const eventosIngresosPropio = eventosDeIngresos(ingresosSinFuente);

  // Mapa línea -> fuente, a lo sumo un vínculo por línea (el primero gana
  // si hubiera duplicados). Ver specs/atribucion-egreso-a-fuente.md.
  const fuenteLinks = flujo.fuenteLinks ?? [];
  const fuenteIdPorLinea = new Map<ID, ID>();
  for (const link of fuenteLinks) {
    if (!fuenteIdPorLinea.has(link.budgetLineId)) fuenteIdPorLinea.set(link.budgetLineId, link.fuenteId);
  }

  const lineasSinFuenteAtribuida = lineasVista.filter((linea) => !fuenteIdPorLinea.has(linea.id));
  const eventosEgresosPropio = eventosDeEgresos(lineasSinFuenteAtribuida);
  const curvaPropio = construirCurva([...eventosIngresosPropio, ...eventosEgresosPropio], flujo.saldoPropioInicialCop);

  const porBolsa: Record<ID | 'propio', { saldoMinimoCop: number; fecha: string | null }> = {
    propio: saldoMinimoDeCurva(curvaPropio, flujo.saldoPropioInicialCop),
  };
  for (const fuente of flujo.fuentes) {
    const ingresosDeFuente = flujo.ingresos.filter((ingreso) => ingreso.fuenteId === fuente.id);
    const lineasDeFuente = lineasVista.filter((linea) => fuenteIdPorLinea.get(linea.id) === fuente.id);
    const curvaFuente = construirCurva([...eventosDeIngresos(ingresosDeFuente), ...eventosDeEgresos(lineasDeFuente)], 0);
    porBolsa[fuente.id] = saldoMinimoDeCurva(curvaFuente, 0);
  }

  const saldoFinalAgregado = curva.length > 0 ? curva[curva.length - 1].saldoCop : flujo.saldoPropioInicialCop;
  const hayBloqueoPorRestriccion = saldoFinalAgregado > 0 && porBolsa.propio.saldoMinimoCop < 0;
  const gastosNoElegibles = hayBloqueoPorRestriccion
    ? calcularGastosNoElegibles(lineasVista, flujo.fuentes, flujo.ingresos)
    : [];
  const gastosAtribuidosNoElegibles = calcularGastosAtribuidosNoElegibles(lineasVista, flujo.fuentes, fuenteIdPorLinea);
  const alertasAporteMinimo = calcularAlertasAporteMinimo(flujo.fuentes, curva, flujo.saldoPropioInicialCop);

  return {
    vista,
    curva,
    exposicion,
    porBolsa,
    hayBloqueoPorRestriccion,
    gastosNoElegibles,
    gastosAtribuidosNoElegibles,
    alertasAporteMinimo,
    claridad: calcularClaridad(flujo),
  };
}

// ---------------------------------------------------------------------------
// 5.9 — Descripción en español, sin jerga, lista para mostrar al usuario.
// ---------------------------------------------------------------------------

const MESES_ES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

function partesDeFecha(fecha: string): { anio: number; mes: number; dia: number } {
  const match = FORMATO_FECHA.exec(fecha)!;
  return { anio: Number(match[1]), mes: Number(match[2]), dia: Number(match[3]) };
}

function formatearFechaLarga(fecha: string, incluirAnio: boolean): string {
  const { anio, mes, dia } = partesDeFecha(fecha);
  return incluirAnio ? `${dia} de ${MESES_ES[mes - 1]} de ${anio}` : `${dia} de ${MESES_ES[mes - 1]}`;
}

export function describirExposicion(analisis: AnalisisDeFlujo): string {
  const exposicion = analisis.exposicion;
  if (!exposicion) return 'No se detecta una ventana en la que el proyecto necesite plata propia.';

  const anioDesde = partesDeFecha(exposicion.desde).anio;
  const anioHasta = partesDeFecha(exposicion.hasta).anio;
  const desdeTexto = formatearFechaLarga(exposicion.desde, anioDesde !== anioHasta);
  const hastaTexto = formatearFechaLarga(exposicion.hasta, true);
  const montoTexto = exposicion.montoMaximoCop.toLocaleString('es-CO');

  return `Entre el ${desdeTexto} y el ${hastaTexto} vas a tener que poner ${montoTexto} de tu bolsillo durante ${exposicion.dias} días.`;
}
