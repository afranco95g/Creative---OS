import { createId, createInitialProjectGraph, now } from '../core/projectEngine';
import { createProjectControllerState, processProjectMessage } from '../core/projectController';
import type { ProjectControllerState } from '../core/projectController';
import type { ConversationMessage, ProjectGraph, ProjectModuleId } from '../types/project';
import {
  BLOQUE_DE_APERTURA,
  seleccionarPreguntaDeApertura,
  SIN_RESPUESTA_POR_AHORA,
} from '../engines/openingBlockEngine';
import type { PreguntaDeApertura } from '../engines/openingBlockEngine';
import { getNextBestQuestion } from '../engines/questionEngine';

/**
 * Spec no-se-sin-colateral.md, sección 7 (enmendada): los escenarios 8, 9 y
 * 10 fijaban un accidente -- T1 caía en `identity` porque el patch de
 * respaldo elegía el módulo más débil del grafo sin que hubiera pregunta
 * previa. Eso nunca fue una conducta correcta (criterio 8.3, redacción
 * definitiva: el patch de respaldo ya no conoce `getWeakModules`, solo
 * conoce `moduloDeRespaldo`, y sin pregunta previa ese valor es `null`).
 *
 * Para que T1 siga siendo un mensaje que legítimamente aterriza en
 * `identity`, se siembra el turno que falta al inicio: un mensaje
 * `producer` con el texto exacto de una pregunta del bloque de apertura,
 * igual que hace el "caso adicional" de answerRouting.test.ts (líneas
 * 145-170). Con esa pregunta ya "hecha" en el turno anterior,
 * `resultadoDePreguntaHecha` (core/projectController.ts) encuentra
 * `moduloDeRespaldo` real y el patch de respaldo aplica el mismo
 * `scoreBoost: 12` que aplicaba antes por accidente -- el resultado
 * numérico no cambia, la causa sí.
 *
 * Acepta un `graph` opcional (por defecto uno vacío) para poder combinar,
 * si algún escenario futuro lo necesitara, la pregunta sembrada con
 * contenido sembrado directamente en el grafo vía `conContenido` -- ninguno
 * de los escenarios 8, 9 o 10 usa hoy esa combinación: los tres siembran
 * solo la pregunta AP-01, sin tocar el grafo.
 */
function estadoConPreguntaDeAperturaPreguntada(
  pregunta: PreguntaDeApertura,
  graph: ProjectGraph = { ...createInitialProjectGraph(), title: 'Ruido Blanco' }
): ProjectControllerState {
  const mensaje: ConversationMessage = {
    id: createId(),
    role: 'producer',
    content: pregunta.pregunta,
    createdAt: now(),
  };

  return {
    ...createProjectControllerState(graph),
    messages: [mensaje],
  };
}

function conContenido(
  graph: ProjectGraph,
  moduloId: ProjectModuleId,
  content: string
): ProjectGraph {
  return {
    ...graph,
    modules: {
      ...graph.modules,
      [moduloId]: { ...graph.modules[moduloId], content, score: 60 },
    },
  };
}

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

// Escenario 1: proyecto vacío → AP-01.
const vacio = createInitialProjectGraph();
assert(seleccionarPreguntaDeApertura(vacio)?.codigo === 'AP-01', 'Proyecto vacío debe devolver AP-01');

// Escenario 2: solo identity con contenido → AP-02, no AP-01.
const soloIdentity = conContenido(createInitialProjectGraph(), 'identity', 'Un EP de música electrónica.');
assert(seleccionarPreguntaDeApertura(soloIdentity)?.codigo === 'AP-02', 'Con identity respondida debe devolver AP-02');

// Escenario 3: preparación — prerrequisito. identity, purpose, context,
// activities y opportunities llenos; community y problem vacíos → AP-02,
// nunca AP-04.
let preparacion = createInitialProjectGraph();
preparacion = conContenido(preparacion, 'identity', 'Un EP de música electrónica.');
preparacion = conContenido(preparacion, 'purpose', 'Quiero contar una historia.');
preparacion = conContenido(preparacion, 'context', 'Bogotá.');
preparacion = conContenido(preparacion, 'activities', 'Ya grabamos tres canciones.');
preparacion = conContenido(preparacion, 'opportunities', 'Una convocatoria del Ministerio.');
const seleccionPreparacion = seleccionarPreguntaDeApertura(preparacion);
assert(seleccionPreparacion?.codigo === 'AP-02', 'Debe devolver AP-02 cuando community y problem están vacíos');
assert(seleccionPreparacion?.codigo !== 'AP-04', 'Nunca debe devolver AP-04 sin que community esté respondida');

// Escenario 4: contextualización. community con contenido real → la
// pregunta devuelta para AP-04 contiene ese texto.
let contextualizado = createInitialProjectGraph();
contextualizado = conContenido(contextualizado, 'identity', 'Un EP de música electrónica.');
contextualizado = conContenido(contextualizado, 'purpose', 'Quiero contar una historia.');
contextualizado = conContenido(contextualizado, 'community', 'gente que patina en Bogotá');
const seleccionContextualizada = seleccionarPreguntaDeApertura(contextualizado);
assert(seleccionContextualizada?.codigo === 'AP-04', 'Debe devolver AP-04 cuando community ya está respondida');
assert(
  Boolean(seleccionContextualizada?.pregunta.includes('gente que patina en Bogotá')),
  'La pregunta de AP-04 debe contener el contenido de community'
);

// Escenario 5: "no sé" satisface el prerrequisito, pero con redacción base.
let noSe = createInitialProjectGraph();
noSe = conContenido(noSe, 'identity', 'Un EP de música electrónica.');
noSe = conContenido(noSe, 'purpose', 'Quiero contar una historia.');
noSe = conContenido(noSe, 'community', SIN_RESPUESTA_POR_AHORA);
const seleccionNoSe = seleccionarPreguntaDeApertura(noSe);
assert(seleccionNoSe?.codigo === 'AP-04', 'AP-04 debe poder devolverse cuando community es "Sin respuesta por ahora."');
const ap04Base = BLOQUE_DE_APERTURA.find((pregunta) => pregunta.codigo === 'AP-04')!;
assert(seleccionNoSe?.pregunta === ap04Base.pregunta, 'AP-04 debe usar la redacción base cuando no hay contenido real que interpolar');

// Escenario 6: bloque agotado — los siete módulos con contenido.
let agotado = createInitialProjectGraph();
agotado = conContenido(agotado, 'identity', 'Un EP de música electrónica.');
agotado = conContenido(agotado, 'community', 'gente que patina en Bogotá');
agotado = conContenido(agotado, 'purpose', 'Quiero contar una historia.');
agotado = conContenido(agotado, 'problem', 'No hay espacios para patinar de noche.');
agotado = conContenido(agotado, 'context', 'Bogotá.');
agotado = conContenido(agotado, 'activities', 'Ya grabamos tres canciones.');
agotado = conContenido(agotado, 'opportunities', 'Una convocatoria del Ministerio.');
assert(seleccionarPreguntaDeApertura(agotado) === null, 'El bloque agotado debe devolver null');
const siguientePregunta = getNextBestQuestion(agotado);
assert(Boolean(siguientePregunta), 'getNextBestQuestion debe seguir devolviendo algo no vacío');
assert(
  !BLOQUE_DE_APERTURA.some((pregunta) => pregunta.pregunta === siguientePregunta),
  'La pregunta de módulos débiles no debe ser ninguna de las siete del bloque de apertura'
);

// Escenario 7: "no sé" no sube el puntaje, y AP-03 no se vuelve a preguntar.
let noSubePuntaje = createInitialProjectGraph();
noSubePuntaje = {
  ...noSubePuntaje,
  modules: {
    ...noSubePuntaje.modules,
    purpose: { ...noSubePuntaje.modules.purpose, content: SIN_RESPUESTA_POR_AHORA },
  },
};
assert(noSubePuntaje.modules.purpose.score === 0, 'El puntaje del módulo purpose no debe subir por un "no sé"');
assert(
  seleccionarPreguntaDeApertura(noSubePuntaje)?.codigo !== 'AP-03',
  'AP-03 no debe volver a devolverse después de un "no sé"'
);

// Escenario 8: "no sé" a una pregunta del bloque no debe dejar un
// colateral en ningún otro módulo. Spec no-se-sin-colateral.md, 5.6: se
// compara el mapa completo de módulos, no un módulo nombrado a mano — un
// aserto que solo mira `problem` puede quedar vacío si el colateral real
// cae en otro módulo (2.3/2.4 de la spec) sin que nadie lo note.
//
// Montaje (sección 7, enmendada): T1 ya no es el primer mensaje del
// proyecto sin pregunta previa -- se siembra un mensaje `producer` con el
// texto de AP-01 antes de T1, para que T1 responda a una pregunta real
// hecha en el turno anterior. Ningún assert de este escenario cambió.
const preguntaAp01 = BLOQUE_DE_APERTURA.find((pregunta) => pregunta.codigo === 'AP-01')!;
const t1 = processProjectMessage(
  estadoConPreguntaDeAperturaPreguntada(preguntaAp01),
  'Es un EP de música electrónica que estoy grabando.'
);
const preguntaAp02 = BLOQUE_DE_APERTURA.find((pregunta) => pregunta.codigo === 'AP-02')!;
assert(
  t1.response.nextQuestion === preguntaAp02.pregunta,
  `Después de T1 la siguiente pregunta debe ser AP-02, fue: "${t1.response.nextQuestion}"`
);

const modulosAntesDeT2 = t1.state.graph.modules;
const t2 = processProjectMessage(t1.state, 'no sé');

assert(
  t2.state.graph.modules.community.content === SIN_RESPUESTA_POR_AHORA,
  'El módulo de la pregunta respondida (community, AP-02) debe guardar el texto literal "Sin respuesta por ahora."'
);
assert(t2.state.graph.modules.community.score === 0, 'El puntaje de community no debe subir por el "no sé"');

const modulosCambiadosEnT2 = (Object.keys(modulosAntesDeT2) as ProjectModuleId[]).filter((moduloId) => {
  const antes = modulosAntesDeT2[moduloId];
  const despues = t2.state.graph.modules[moduloId];
  return (
    antes.content !== despues.content ||
    antes.score !== despues.score ||
    antes.updatedAt !== despues.updatedAt
  );
});
assert(
  modulosCambiadosEnT2.length === 1 && modulosCambiadosEnT2[0] === 'community',
  `El único módulo cambiado por el "no sé" a AP-02 debe ser community, cambiaron: ${JSON.stringify(modulosCambiadosEnT2)}`
);

// Escenario 9: los eventos nuevos de `eventLog` que este turno agrega y que
// traen `moduleId` deben apuntar todos a `community` — ninguno a otro
// módulo. `eventLog` se expone al usuario como `recentEvents`
// (engines/productionEngine.ts:36-41, components/LivingWorkspace.tsx:122-138),
// así que un evento con `moduleId` distinto de `community` sería un
// colateral visible en el panel "Workspace vivo". Igual que en el 8, no se
// nombra `problem` ni ningún otro módulo a mano: se recorren los eventos
// nuevos completos.
//
// Montaje: este escenario no crea su propio T1/T2 -- reutiliza `t1` y `t2`
// del escenario 8, así que hereda su montaje (la pregunta AP-01 sembrada
// antes de T1) sin cambio adicional aquí.
const eventLogIdsAntesDeT2 = new Set(
  t1.state.graph.eventLog.map((event) => event.id)
);
const eventosNuevosDeT2 = t2.state.graph.eventLog.filter(
  (event) => !eventLogIdsAntesDeT2.has(event.id)
);
const eventosNuevosConModuloDistinto = eventosNuevosDeT2.filter(
  (event) => event.moduleId && event.moduleId !== 'community'
);
assert(
  eventosNuevosConModuloDistinto.length === 0,
  `Todo evento nuevo de eventLog con moduleId tras el "no sé" a AP-02 debe apuntar a community, con moduleId distinto: ${JSON.stringify(eventosNuevosConModuloDistinto)}`
);

// Escenario 10: spec no-se-sin-colateral.md, 5.6. Tres turnos reales por
// `processProjectMessage`.
//
// Montaje (sección 7, enmendada): se siembra únicamente la pregunta AP-01
// como turno anterior a T1, igual que el escenario 8 -- ningún módulo se
// siembra directamente en el grafo. Con esa siembra, T1 solo pobla
// `identity` (vía el patch de respaldo sobre `moduloDeRespaldo`,
// `scoreBoost: 12` -- "Es un EP de música electrónica que estoy grabando."
// no matchea ninguna lista de palabras clave de
// `extractProjectPatchesFromMessage` ni ninguna regla de
// `classifyProjectEvidence`, engines/semanticClassificationEngine.ts:3-13).
//
// Con `identity` ya respondida (AP-01), la pregunta pendiente tras T1 es
// AP-02 (`community`), la de mayor prioridad entre las que faltan -- igual
// que en el escenario 8, porque el montaje es idéntico.
//
// Tras el "no sé" a AP-02 (T2, que responde `community`), la siguiente
// pregunta pendiente es AP-03 (`purpose`): con `identity` y `community` ya
// respondidas, `purpose` es la de mayor prioridad entre las que faltan.
// El "no sé" de T3 responde entonces a AP-03, no a AP-04 -- la colisión
// estructural que la spec 5.6 pedía verificar cae sobre `purpose` con este
// montaje mínimo, no sobre `problem`.
const t1Diez = processProjectMessage(
  estadoConPreguntaDeAperturaPreguntada(preguntaAp01),
  'Es un EP de música electrónica que estoy grabando.'
);
assert(
  t1Diez.response.nextQuestion === preguntaAp02.pregunta,
  `Después de T1 la pregunta pendiente debe ser AP-02, fue: "${t1Diez.response.nextQuestion}"`
);

const t2Diez = processProjectMessage(t1Diez.state, 'no sé');

const preguntaAp03 = BLOQUE_DE_APERTURA.find((pregunta) => pregunta.codigo === 'AP-03')!;
const preguntaPendienteAntesDeT3 = t2Diez.response.nextQuestion;
assert(
  preguntaPendienteAntesDeT3 === preguntaAp03.pregunta,
  `Después de T2 (el "no sé" que responde AP-02) la pregunta pendiente debe ser AP-03, fue: "${preguntaPendienteAntesDeT3}"`
);

const modulosAntesDeT3 = t2Diez.state.graph.modules;
const eventLogIdsAntesDeT3 = new Set(t2Diez.state.graph.eventLog.map((event) => event.id));

const t3Diez = processProjectMessage(t2Diez.state, 'no sé');

assert(
  t3Diez.state.graph.modules.purpose.content === SIN_RESPUESTA_POR_AHORA,
  `purpose.content debe ser exactamente "${SIN_RESPUESTA_POR_AHORA}", sin concatenación, fue: "${t3Diez.state.graph.modules.purpose.content}"`
);
assert(
  t3Diez.state.graph.modules.purpose.score === 0,
  `purpose.score debe ser 0, fue: ${t3Diez.state.graph.modules.purpose.score}`
);

const modulosCambiadosEnT3 = (Object.keys(modulosAntesDeT3) as ProjectModuleId[]).filter((moduloId) => {
  const antes = modulosAntesDeT3[moduloId];
  const despues = t3Diez.state.graph.modules[moduloId];
  return (
    antes.content !== despues.content ||
    antes.score !== despues.score ||
    antes.updatedAt !== despues.updatedAt
  );
});
assert(
  modulosCambiadosEnT3.length === 1 && modulosCambiadosEnT3[0] === 'purpose',
  `El único módulo cambiado en T3 debe ser purpose, cambiaron: ${JSON.stringify(modulosCambiadosEnT3)}`
);

const eventosNuevosDeT3 = t3Diez.state.graph.eventLog.filter(
  (event) => !eventLogIdsAntesDeT3.has(event.id)
);
assert(
  !eventosNuevosDeT3.some(
    (event) => event.moduleId === 'purpose' && /fortaleci/i.test(event.description)
  ),
  `Ningún evento nuevo de T3 debe describir a purpose como fortalecido, eventos nuevos: ${JSON.stringify(eventosNuevosDeT3)}`
);

// Escenario 11: spec nombre-antes-del-bloque.md, 5. Título real (no
// placeholder) y módulos vacíos → `getNextBestQuestion` sigue devolviendo el
// texto de AP-01, no la pregunta del nombre. Protege que el paso 1 nuevo
// (nombre antes del bloque) no se dispare en el flujo normal, donde el
// título ya viene resuelto.
const conTituloReal = { ...createInitialProjectGraph(), title: 'Kicks' };
const preguntaConTituloReal = getNextBestQuestion(conTituloReal);
assert(
  preguntaConTituloReal === preguntaAp01.pregunta,
  `Con título real, getNextBestQuestion debe devolver AP-01, fue: "${preguntaConTituloReal}"`
);

// Escenario 12: enmienda a la spec nombre-antes-del-bloque.md que resolvió
// la contradicción con los escenarios 8-10 — fija en un assert explícito el
// otro lado del criterio 5.5: grafo con título placeholder (el default de
// `createInitialProjectGraph`) y módulos vacíos → `getNextBestQuestion`
// devuelve la pregunta del nombre (STRATEGIC_QUESTIONS.identity.initial en
// engines/questionEngine.ts), nunca el texto de AP-01. Antes esto solo se
// verificaba indirectamente en tests/muscoRuntimeIntegration.test.ts.
const conTituloPlaceholder = createInitialProjectGraph();
const preguntaConTituloPlaceholder = getNextBestQuestion(conTituloPlaceholder);
const preguntaDeNombre = '¿Cómo se llama o cómo te gustaría nombrar este proyecto por ahora?';
assert(
  preguntaConTituloPlaceholder === preguntaDeNombre,
  `Con título placeholder, getNextBestQuestion debe devolver la pregunta del nombre, fue: "${preguntaConTituloPlaceholder}"`
);
assert(
  preguntaConTituloPlaceholder !== preguntaAp01.pregunta,
  'Con título placeholder, getNextBestQuestion no debe devolver AP-01'
);

console.log('Opening block: OK');
