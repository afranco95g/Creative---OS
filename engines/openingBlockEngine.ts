import type { ProjectGraph, ProjectModuleId } from '../types/project';
import type { ProjectType } from '../types/projectKnowledge';
import type { QuestionIntent } from './questionEngine';

/**
 * El bloque de apertura y su regla de selección.
 * Ver specs/bloque-de-apertura-y-extraccion.md, secciones 5.1 a 5.4.
 *
 * `seleccionarPreguntaDeApertura` es la interfaz que la entrega siguiente va a
 * extender: recibe el grafo, devuelve una pregunta o nada, y no tiene efectos.
 */

export interface PreguntaDeApertura {
  codigo: string;
  pregunta: string;
  plantillaConContexto: string | null;
  opciones: string[] | null;
  intent: QuestionIntent;
  modulo: ProjectModuleId;
  requiere: string[]; // preparación: qué debe estar respondido antes
  prioridadBase: number; // necesidad: qué tan urgente es hoy
  necesidad: string; // qué necesidad del proyecto atiende, en una frase
  aceptaNoSe: true;
  /**
   * Spec redaccion-de-la-apertura.md, 4.3: solo `AP-05` lo trae. Restringe la
   * pregunta a los `primaryType` de la familia con locación (evento, taller,
   * activación...). Si `primaryType` no está definido, la pregunta se hace
   * igual (no se puede descartar sin saber la disciplina).
   */
  arquetipos?: ProjectType[];
}

/**
 * Texto literal que se guarda cuando la persona responde "no sé" a una
 * pregunta del bloque. Ver spec 5.3.
 */
export const SIN_RESPUESTA_POR_AHORA = 'Sin respuesta por ahora.';

/**
 * Spec redaccion-de-la-apertura.md, 4.3: la familia de `primaryType` con
 * locación física — evento, taller, activación, experiencia, obra artística
 * (cubre rodaje y montaje: no hay otro `ProjectType` de los trece que los
 * represente) y programa (cubre residencia: una residencia es un programa de
 * estadía/producción en un lugar). El resto (producto, servicio, negocio,
 * campaña, investigación, iniciativa comunitaria, otro) no tiene un lugar que
 * preguntar.
 */
const ARQUETIPOS_CON_LOCACION: ProjectType[] = [
  'event',
  'workshop',
  'experience',
  'btl_activation',
  'artistic_project',
  'program',
];

const OPCIONES_AP07 = [
  'El Estado (una convocatoria pública)',
  'CoCrea o un fondo privado',
  'Una marca (patrocinio)',
  'Un espacio que me programe',
  'Alguien que me compre',
  'Un aliado o coproductor',
  'Yo, voy a crear el fondo',
  'El Estado, para formalizarme',
  'Todavía no sé',
];

export const BLOQUE_DE_APERTURA: PreguntaDeApertura[] = [
  {
    codigo: 'AP-01',
    pregunta: 'Cuéntame qué es, en una o dos frases.',
    plantillaConContexto: null,
    opciones: null,
    intent: 'clarify_project_type',
    modulo: 'identity',
    requiere: [],
    prioridadBase: 100,
    necesidad: 'Saber qué es el proyecto',
    aceptaNoSe: true,
  },
  {
    codigo: 'AP-02',
    pregunta: '¿Para quién está pensado tu [oficio]?',
    plantillaConContexto: null,
    opciones: null,
    intent: 'clarify_audience',
    modulo: 'community',
    requiere: [],
    prioridadBase: 90,
    necesidad: 'Saber para quién es',
    aceptaNoSe: true,
  },
  {
    codigo: 'AP-03',
    pregunta: '¿Qué te hizo querer hacer tu [oficio]?',
    plantillaConContexto: null,
    opciones: null,
    intent: 'clarify_purpose',
    modulo: 'purpose',
    requiere: [],
    prioridadBase: 80,
    necesidad: 'Tener el origen del proyecto contado con palabras propias',
    aceptaNoSe: true,
  },
  {
    codigo: 'AP-04',
    pregunta: '¿Qué viste que hacía falta?',
    plantillaConContexto: '¿Qué viste que les hacía falta a [RESPUESTA_AP02]?',
    opciones: null,
    intent: 'clarify_problem',
    modulo: 'problem',
    requiere: ['AP-02'],
    prioridadBase: 70,
    necesidad: 'Saber qué necesidad atiende',
    aceptaNoSe: true,
  },
  {
    codigo: 'AP-05',
    pregunta: '¿Tienes locación para tu [oficio]?',
    plantillaConContexto: null,
    opciones: null,
    intent: 'clarify_location',
    modulo: 'context',
    requiere: [],
    prioridadBase: 60,
    necesidad: 'Ubicar el proyecto en un territorio',
    aceptaNoSe: true,
    arquetipos: ARQUETIPOS_CON_LOCACION,
  },
  {
    codigo: 'AP-06',
    pregunta: '¿Qué ya tienes hecho?',
    plantillaConContexto: null,
    opciones: null,
    intent: 'clarify_phase',
    modulo: 'activities',
    requiere: [],
    prioridadBase: 50,
    necesidad: 'Saber en qué estado real está',
    aceptaNoSe: true,
  },
  {
    codigo: 'AP-07',
    pregunta: '¿Quién tiene que decir que sí?',
    plantillaConContexto: null,
    opciones: OPCIONES_AP07,
    intent: 'clarify_intent',
    modulo: 'opportunities',
    requiere: ['AP-01'],
    prioridadBase: 40,
    necesidad: 'Saber a quién hay que convencer',
    aceptaNoSe: true,
  },
];

const LIMITE_CONTEXTO = 80;
const MARCADOR_CONTEXTO = '[RESPUESTA_AP02]';
const MARCADOR_OFICIO = '[oficio]';

function tieneContenido(graph: ProjectGraph, moduloId: ProjectModuleId): boolean {
  return Boolean(graph.modules[moduloId]?.content.trim());
}

/**
 * Preparación (5.4.4): ¿está respondida? Regla única, la misma que 5.5 usa
 * para extender `isQuestionAlreadyAnswered` en `questionEngine.ts`.
 */
export function estaPreguntaRespondida(pregunta: PreguntaDeApertura, graph: ProjectGraph): boolean {
  if (tieneContenido(graph, pregunta.modulo)) return true;
  if (pregunta.modulo === 'identity') return Boolean(graph.knowledge?.projectType.primaryType);
  return false;
}

/**
 * Spec redaccion-de-la-apertura.md, 4.3: si la pregunta trae `arquetipos`,
 * solo se hace cuando `primaryType` está en esa lista. Sin `primaryType`
 * conocido no se puede descartar, así que la pregunta se hace igual (mejor
 * preguntar de más que perder el dato).
 */
export function aplicaPreguntaDeApertura(pregunta: PreguntaDeApertura, graph: ProjectGraph): boolean {
  if (!pregunta.arquetipos) return true;

  const primaryType = graph.knowledge?.projectType.primaryType;
  if (!primaryType) return true;

  return pregunta.arquetipos.includes(primaryType);
}

/**
 * Spec redaccion-de-la-apertura.md, 4.2: la palabra de la disciplina, o
 * `proyecto` si no hay disciplina. Switch exhaustivo sobre `ProjectType`
 * (el `never` de `default` hace que agregar un miembro nuevo al tipo rompa
 * la compilación aquí hasta que se le asigne palabra).
 */
export function palabraDelOficio(graph: ProjectGraph): string {
  const primaryType = graph.knowledge?.projectType.primaryType;
  if (!primaryType) return 'proyecto';

  switch (primaryType) {
    case 'product':
      return 'producto';
    case 'service':
      return 'servicio';
    case 'event':
      return 'evento';
    case 'workshop':
      return 'taller';
    case 'experience':
      return 'experiencia';
    case 'artistic_project':
      return 'obra';
    case 'community_initiative':
      return 'iniciativa';
    case 'business':
      return 'negocio';
    case 'campaign':
      return 'campaña';
    case 'btl_activation':
      return 'activación';
    case 'research':
      return 'investigación';
    case 'program':
      return 'programa';
    case 'other':
      return 'proyecto';
    default: {
      const _exhaustivo: never = primaryType;
      return _exhaustivo;
    }
  }
}

function recortarEnLimiteDePalabra(texto: string, maxLength: number): string | null {
  if (texto.length <= maxLength) return texto;

  const cortado = texto.slice(0, maxLength);
  const ultimoEspacio = cortado.lastIndexOf(' ');

  if (ultimoEspacio <= 0) return null;

  return cortado.slice(0, ultimoEspacio);
}

/**
 * Interpolación de un valor ya guardado, no generación de texto (spec 5.1).
 * Usa el módulo de su prerrequisito para encontrar la respuesta a interpolar.
 */
function contextualizar(pregunta: PreguntaDeApertura, graph: ProjectGraph): string {
  if (!pregunta.plantillaConContexto) return pregunta.pregunta;

  const codigoPrerequisito = pregunta.requiere[0];
  const prerequisito = BLOQUE_DE_APERTURA.find((item) => item.codigo === codigoPrerequisito);
  if (!prerequisito) return pregunta.pregunta;

  const contenido = graph.modules[prerequisito.modulo]?.content.trim() ?? '';
  if (!contenido || contenido === SIN_RESPUESTA_POR_AHORA) return pregunta.pregunta;

  const recorte = recortarEnLimiteDePalabra(contenido, LIMITE_CONTEXTO);
  if (recorte === null) return pregunta.pregunta;

  return pregunta.plantillaConContexto.replace(MARCADOR_CONTEXTO, recorte);
}

/**
 * Sustitución del marcador de oficio (spec 4.2): un `replace` sobre el texto
 * ya contextualizado, igual que la interpolación de `contextualizar`. No
 * genera lenguaje; si el texto no trae el marcador, lo devuelve intacto.
 */
function sustituirOficio(texto: string, graph: ProjectGraph): string {
  return texto.replace(MARCADOR_OFICIO, palabraDelOficio(graph));
}

/**
 * Normalización de texto local a este archivo. Es deliberadamente una copia
 * de la de `questionEngine.ts` (minúsculas, sin tildes, sin puntuación, con
 * `trim()` final para que las comparaciones por prefijo/sufijo no se rompan
 * por espacios que deja la puntuación reemplazada): `questionEngine.ts` ya
 * importa valores de este archivo (`BLOQUE_DE_APERTURA`,
 * `seleccionarPreguntaDeApertura`), así que importar de vuelta un valor de
 * `questionEngine.ts` aquí crearía un ciclo de importación en tiempo de
 * ejecución, no solo de tipos.
 */
// Rango Unicode de las marcas diacríticas combinadas (0x0300-0x036f), que
// `normalize('NFD')` separa de la letra base. Se construye con
// `String.fromCharCode` sobre literales numéricos, no con un escape `\u...`
// en el propio código fuente, para que no quede ambigüedad de codificación
// en el archivo.
const MARCAS_DIACRITICAS = new RegExp(
  `[${String.fromCharCode(0x0300)}-${String.fromCharCode(0x036f)}]`,
  'g'
);

function normalizarTexto(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(MARCAS_DIACRITICAS, '')
    .replace(/[^a-z0-9ñ\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const RESPUESTAS_NO_SE = ['no se', 'ninguna', 'ninguno', 'nada', 'todavia no', 'no aplica'];

/**
 * Spec 5.3: la respuesta normalizada, sola (no dentro de una frase más
 * larga), coincide con una de las variantes de "no sé". `no sé`/`no se` y
 * `todavía no`/`todavia no` normalizan al mismo valor, por eso la lista tiene
 * seis entradas y no ocho.
 */
export function esRespuestaNoSe(respuesta: string): boolean {
  return RESPUESTAS_NO_SE.includes(normalizarTexto(respuesta));
}

/**
 * Compara `textoNormalizado` contra una plantilla que puede traer un
 * marcador (de contexto o de oficio) por prefijo/sufijo, en vez de por
 * igualdad exacta: el marcador se reemplaza por un valor variable (la
 * respuesta de AP-02 recortada, o la palabra del oficio) antes de llegar
 * aquí, así que la plantilla original ya no es un match exacto.
 */
function coincidePorMarcador(plantilla: string, marcador: string, textoNormalizado: string): boolean {
  const [prefijo, sufijo] = plantilla.split(marcador);
  const prefijoNormalizado = normalizarTexto(prefijo);
  const sufijoNormalizado = normalizarTexto(sufijo);

  return (
    textoNormalizado.startsWith(prefijoNormalizado) &&
    textoNormalizado.endsWith(sufijoNormalizado)
  );
}

function coincideConTexto(pregunta: PreguntaDeApertura, textoNormalizado: string): boolean {
  if (textoNormalizado === normalizarTexto(pregunta.pregunta)) return true;

  if (
    pregunta.pregunta.includes(MARCADOR_OFICIO) &&
    coincidePorMarcador(pregunta.pregunta, MARCADOR_OFICIO, textoNormalizado)
  ) {
    return true;
  }

  if (!pregunta.plantillaConContexto) return false;

  return coincidePorMarcador(pregunta.plantillaConContexto, MARCADOR_CONTEXTO, textoNormalizado);
}

/**
 * Encuentra, a partir del texto ya hecho de una pregunta (literal o
 * contextualizado), cuál de las siete de `BLOQUE_DE_APERTURA` es. Se usa
 * tanto para clasificar la intención en `questionEngine.getQuestionIntent`
 * como para reconocer, en `projectController`, si la última pregunta hecha
 * fue una del bloque y por lo tanto acepta "no sé" (spec 5.3).
 */
export function encontrarPreguntaPorTexto(texto: string): PreguntaDeApertura | null {
  const textoNormalizado = normalizarTexto(texto);
  return BLOQUE_DE_APERTURA.find((pregunta) => coincideConTexto(pregunta, textoNormalizado)) ?? null;
}

export function seleccionarPreguntaDeApertura(graph: ProjectGraph): PreguntaDeApertura | null {
  // Paso 0: descartar lo que no aplica por arquetipo (spec 4.3) — por
  // ejemplo AP-05 para una disciplina sin locación.
  // Paso 1: descartar lo respondido — lo que ya se sabe no se pregunta.
  const sinResponder = BLOQUE_DE_APERTURA.filter(
    (pregunta) => aplicaPreguntaDeApertura(pregunta, graph) && !estaPreguntaRespondida(pregunta, graph)
  );

  // Paso 2: descartar lo que todavía no se puede preguntar — sin sus
  // prerrequisitos respondidos, la pregunta no es respondible.
  const respondidas = new Set(
    BLOQUE_DE_APERTURA.filter((pregunta) => estaPreguntaRespondida(pregunta, graph)).map((pregunta) => pregunta.codigo)
  );
  const disponibles = sinResponder.filter((pregunta) => pregunta.requiere.every((codigo) => respondidas.has(codigo)));

  // Paso 3: ordenar por necesidad — prioridadBase de mayor a menor.
  // Paso 4: desempatar por código ascendente.
  const ordenadas = [...disponibles].sort(
    (a, b) => b.prioridadBase - a.prioridadBase || a.codigo.localeCompare(b.codigo)
  );

  // Paso 5: devolver la primera, o null si no queda ninguna.
  const elegida = ordenadas[0] ?? null;
  if (!elegida) return null;

  return { ...elegida, pregunta: sustituirOficio(contextualizar(elegida, graph), graph) };
}
