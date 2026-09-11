import { createInitialProjectGraph } from '../core/projectEngine';
import type { ProjectGraph, ProjectModuleId } from '../types/project';
import {
  BLOQUE_DE_APERTURA,
  seleccionarPreguntaDeApertura,
  SIN_RESPUESTA_POR_AHORA,
} from '../engines/openingBlockEngine';
import { getNextBestQuestion } from '../engines/questionEngine';

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

console.log('Opening block: OK');
