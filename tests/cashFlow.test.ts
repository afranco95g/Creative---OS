import assert from 'node:assert/strict';
import { analizarFlujo, describirExposicion } from '../engines/cashFlowEngine';
import type { FlujoDeCaja } from '../engines/cashFlowEngine';
import type { Fuente, Ingreso, ProjectBudgetLine } from '../types/project';

let contadorId = 0;
const nextId = (prefix: string) => `${prefix}-${++contadorId}`;

function linea(overrides: Partial<ProjectBudgetLine> = {}): ProjectBudgetLine {
  return {
    id: nextId('linea'),
    category: 'general',
    concept: 'concepto',
    quantity: 1,
    unit: 'unidad',
    unitValue: 0,
    vatRate: 0,
    withholdingRate: 0,
    otherTaxes: 0,
    status: 'approved',
    responsible: 'Responsable',
    provider: '',
    estimatedDate: '',
    actualDate: '',
    source: 'manual',
    ...overrides,
  };
}

function ingreso(overrides: Partial<Ingreso> = {}): Ingreso {
  return {
    id: nextId('ingreso'),
    concepto: 'ingreso',
    montoCop: 0,
    condicion: 'sin_condicion',
    fechaDisparador: '',
    latenciaDias: 0,
    fuenteId: null,
    ...overrides,
  };
}

function fuente(overrides: Partial<Fuente> = {}): Fuente {
  return {
    id: nextId('fuente'),
    nombre: 'Fuente',
    tipo: 'otro',
    restringida: false,
    categoriasElegibles: [],
    aporteMinimoInicioCop: null,
    fechaInicioEjecucion: null,
    ...overrides,
  };
}

function flujo(overrides: Partial<FlujoDeCaja> = {}): FlujoDeCaja {
  return {
    lineas: [],
    ingresos: [],
    fuentes: [],
    saldoPropioInicialCop: 0,
    toleranciaCop: 0,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// a) El caso por defecto, sin ninguna fuente.
// ---------------------------------------------------------------------------
{
  const l1 = linea({ unitValue: 1000000, status: 'approved', estimatedDate: '2026-01-10' });
  const l2 = linea({ unitValue: 500000, status: 'committed', estimatedDate: '2026-01-15' });
  const l3 = linea({ unitValue: 2000000, status: 'proposed', estimatedDate: '2026-01-20' });
  const i1 = ingreso({ montoCop: 500000, fechaDisparador: '2026-01-01' });
  const i2 = ingreso({ montoCop: 300000, fechaDisparador: '2026-01-12' });

  const f = flujo({ lineas: [l1, l2, l3], ingresos: [i1, i2] });
  const analisis = analizarFlujo(f);

  assert.equal(analisis.vista, 'aprobado', 'a · vista por defecto');
  assert.equal(analisis.curva.length, 4, 'a · la curva tiene un punto por fecha con movimiento (proposed excluida del default)');
  assert.deepEqual(Object.keys(analisis.porBolsa), ['propio'], 'a · porBolsa solo tiene la llave propio');
  assert.equal(analisis.claridad.totalEgresosCop, 3500000, 'a · totalEgresosCop incluye TODAS las líneas, no solo la vista');
  assert.equal(analisis.claridad.totalIngresosCop, 800000, 'a · totalIngresosCop');
  assert.equal(analisis.claridad.diferenciaCop, -2700000, 'a · diferenciaCop');
  assert.equal(analisis.claridad.estaFinanciado, false, 'a · estaFinanciado');
  assert.equal(analisis.claridad.listoParaPresentar, true, 'a · listoParaPresentar: todo tiene fecha y valor');
}

// ---------------------------------------------------------------------------
// b) El 80/20.
// ---------------------------------------------------------------------------
{
  const e1 = linea({ category: 'produccion', unitValue: 5000000, status: 'approved', estimatedDate: '2026-04-01' });
  const e2 = linea({ category: 'produccion', unitValue: 5000000, status: 'approved', estimatedDate: '2026-05-01' });
  const e3 = linea({ category: 'produccion', unitValue: 10000000, status: 'approved', estimatedDate: '2026-06-20' });
  const anticipo = ingreso({ montoCop: 16000000, condicion: 'anticipo', fechaDisparador: '2026-03-01', latenciaDias: 15 });
  const final = ingreso({ montoCop: 4000000, condicion: 'contra_ejecucion_total', fechaDisparador: '2026-06-30', latenciaDias: 45 });

  const f = flujo({ lineas: [e1, e2, e3], ingresos: [anticipo, final] });
  const analisis = analizarFlujo(f);

  assert(analisis.exposicion, 'b · debe haber exposición');
  assert.equal(analisis.exposicion!.desde, '2026-06-20', 'b · desde');
  assert.equal(analisis.exposicion!.hasta, '2026-08-13', 'b · hasta');
  assert.equal(analisis.exposicion!.dias, 55, 'b · dias');
  assert.equal(analisis.exposicion!.montoMaximoCop, 4000000, 'b · montoMaximoCop');

  const frase = describirExposicion(analisis);
  assert.equal(
    frase,
    'Entre el 20 de junio y el 13 de agosto de 2026 vas a tener que poner 4.000.000 de tu bolsillo durante 55 días.',
    'b · describirExposicion produce la frase exacta del ejemplo de la spec'
  );
}

// ---------------------------------------------------------------------------
// c) Bloqueo por restricción.
// ---------------------------------------------------------------------------
{
  const fuenteRestringida = fuente({ restringida: true, categoriasElegibles: ['produccion'] });
  const ingresoRestringido = ingreso({ montoCop: 10000000, fuenteId: fuenteRestringida.id, fechaDisparador: '2026-01-01' });
  const egresoHonorarios = linea({ category: 'honorarios', unitValue: 5000000, status: 'approved', estimatedDate: '2026-02-01' });

  const f = flujo({ lineas: [egresoHonorarios], ingresos: [ingresoRestringido], fuentes: [fuenteRestringida] });
  const analisis = analizarFlujo(f);

  const saldoFinalAgregado = analisis.curva[analisis.curva.length - 1].saldoCop;
  assert(saldoFinalAgregado > 0, 'c · agregado positivo');
  assert(analisis.porBolsa.propio.saldoMinimoCop < 0, 'c · porBolsa.propio negativo');
  assert.equal(analisis.hayBloqueoPorRestriccion, true, 'c · hayBloqueoPorRestriccion');
  assert(
    analisis.gastosNoElegibles.some((g) => g.lineaId === egresoHonorarios.id && g.fuenteId === fuenteRestringida.id && g.categoria === 'honorarios'),
    'c · el egreso queda listado en gastosNoElegibles'
  );
}

// ---------------------------------------------------------------------------
// d) Aporte Mínimo de Inicio.
// ---------------------------------------------------------------------------
{
  const fuenteConAmi = fuente({ aporteMinimoInicioCop: 3000000, fechaInicioEjecucion: '2026-04-01' });
  const ingresoTemprano = ingreso({ montoCop: 1000000, fechaDisparador: '2026-03-01' });

  const f = flujo({ ingresos: [ingresoTemprano], fuentes: [fuenteConAmi] });
  const analisis = analizarFlujo(f);

  assert.equal(analisis.alertasAporteMinimo.length, 1, 'd · una alerta');
  assert.equal(analisis.alertasAporteMinimo[0].fuenteId, fuenteConAmi.id, 'd · fuenteId');
  assert.equal(analisis.alertasAporteMinimo[0].faltanteCop, 2000000, 'd · faltanteCop');
  assert.equal(analisis.alertasAporteMinimo[0].antesDe, '2026-04-01', 'd · antesDe');
}

// ---------------------------------------------------------------------------
// e) Las tres vistas.
// ---------------------------------------------------------------------------
{
  const ingresoBase = ingreso({ montoCop: 5000000, fechaDisparador: '2026-01-01' });
  const comprometida = linea({ unitValue: 2000000, status: 'committed', estimatedDate: '2026-01-05' });
  const aprobada = linea({ unitValue: 4000000, status: 'approved', estimatedDate: '2026-01-10' });
  const propuesta = linea({ unitValue: 50000000, status: 'proposed', estimatedDate: '2026-01-15' });

  const f = flujo({ lineas: [comprometida, aprobada, propuesta], ingresos: [ingresoBase] });

  const vistaComprometido = analizarFlujo(f, 'comprometido');
  const vistaAprobado = analizarFlujo(f, 'aprobado');
  const vistaCompleto = analizarFlujo(f, 'completo');

  const finalDe = (curva: { saldoCop: number }[]) => curva[curva.length - 1].saldoCop;
  assert.equal(finalDe(vistaComprometido.curva), 3000000, 'e · comprometido: saldo final');
  assert.equal(finalDe(vistaAprobado.curva), -1000000, 'e · aprobado: saldo final');
  assert.equal(finalDe(vistaCompleto.curva), -51000000, 'e · completo: saldo final');

  assert.equal(vistaComprometido.exposicion, null, 'e · comprometido sin exposición');
  assert(vistaAprobado.exposicion, 'e · aprobado con exposición');
  assert(vistaCompleto.exposicion, 'e · completo con exposición');
  assert(
    vistaCompleto.exposicion!.montoMaximoCop > vistaAprobado.exposicion!.montoMaximoCop,
    'e · completo es estrictamente peor que aprobado — aprobado queda en medio'
  );
}

// ---------------------------------------------------------------------------
// f) Línea sin fecha.
// ---------------------------------------------------------------------------
{
  const sinFecha = linea({ unitValue: 1000000, estimatedDate: '', actualDate: '' });
  const f = flujo({ lineas: [sinFecha] });

  const analisis = analizarFlujo(f);
  assert.equal(analisis.curva.length, 0, 'f · la línea sin fecha no aparece en la curva');
  assert(analisis.claridad.lineasSinFecha.includes(sinFecha.id), 'f · aparece en claridad.lineasSinFecha');
}

// ---------------------------------------------------------------------------
// g) listoParaPresentar con déficit.
// ---------------------------------------------------------------------------
{
  const costosa = linea({ unitValue: 10000000, status: 'approved', estimatedDate: '2026-02-01', responsible: 'Alguien' });
  const ingresoParcial = ingreso({ montoCop: 2000000, fechaDisparador: '2026-01-01' });

  const f = flujo({ lineas: [costosa], ingresos: [ingresoParcial] });
  const analisis = analizarFlujo(f);

  assert(analisis.claridad.diferenciaCop < 0, 'g · diferenciaCop negativo');
  assert.equal(analisis.claridad.estaFinanciado, false, 'g · estaFinanciado');
  assert.equal(analisis.claridad.listoParaPresentar, true, 'g · listoParaPresentar sigue en true: faltar plata no descalifica');
}

// ---------------------------------------------------------------------------
// h) Mismo día.
// ---------------------------------------------------------------------------
{
  const mismoDia = linea({ unitValue: 1000000, status: 'approved', estimatedDate: '2026-05-05' });
  const ingresoMismoDia = ingreso({ montoCop: 1000000, fechaDisparador: '2026-05-05' });

  const f = flujo({ lineas: [mismoDia], ingresos: [ingresoMismoDia] });
  const analisis = analizarFlujo(f);

  assert.equal(analisis.exposicion, null, 'h · sin exposición cuando ingreso y egreso coinciden en fecha y monto');
}

// ---------------------------------------------------------------------------
// i) Zona horaria.
// ---------------------------------------------------------------------------
{
  const disparador = ingreso({ montoCop: 100000, fechaDisparador: '2026-03-31', latenciaDias: 1 });
  const f = flujo({ ingresos: [disparador] });

  const analisis = analizarFlujo(f);
  assert.equal(analisis.curva.length, 1, 'i · un solo punto en la curva');
  assert.equal(
    analisis.curva[0].fecha,
    '2026-04-01',
    'i · disparador 2026-03-31 + latencia 1 día = 2026-04-01, sin importar TZ del proceso (correr con TZ=America/Bogota y TZ=UTC debe dar lo mismo)'
  );
}

// ---------------------------------------------------------------------------
// j) describirExposicion sin exposición.
// ---------------------------------------------------------------------------
{
  const f = flujo();
  const analisis = analizarFlujo(f);

  assert.equal(analisis.exposicion, null, 'j · sin lineas ni ingresos, no hay exposición');
  assert.equal(
    describirExposicion(analisis),
    'No se detecta una ventana en la que el proyecto necesite plata propia.',
    'j · describirExposicion fija el texto exacto para el caso sin exposición'
  );
}

console.log('Cash flow engine: OK');
