import type { ProjectGraph, ProjectModuleId } from '../types/project';
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
}

/**
 * Texto literal que se guarda cuando la persona responde "no sé" a una
 * pregunta del bloque. Ver spec 5.3.
 */
export const SIN_RESPUESTA_POR_AHORA = 'Sin respuesta por ahora.';

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
    pregunta: '¿Qué es? Cuéntamelo en una o dos frases.',
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
    pregunta: '¿Quién va a estar del otro lado?',
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
    pregunta: '¿Qué te hizo querer hacer esto?',
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
    pregunta: '¿Qué falta hoy para esa gente, que esto viene a atender?',
    plantillaConContexto: '¿Qué les falta hoy a [RESPUESTA_AP02], que esto viene a atender?',
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
    pregunta: '¿Dónde pasa?',
    plantillaConContexto: null,
    opciones: null,
    intent: 'clarify_location',
    modulo: 'context',
    requiere: [],
    prioridadBase: 60,
    necesidad: 'Ubicar el proyecto en un territorio',
    aceptaNoSe: true,
  },
  {
    codigo: 'AP-06',
    pregunta: '¿Qué parte ya existe?',
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
    pregunta: '¿Quién tiene que decir sí para que esto pase?',
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

export function seleccionarPreguntaDeApertura(graph: ProjectGraph): PreguntaDeApertura | null {
  // Paso 1: descartar lo respondido — lo que ya se sabe no se pregunta.
  const sinResponder = BLOQUE_DE_APERTURA.filter((pregunta) => !estaPreguntaRespondida(pregunta, graph));

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

  return { ...elegida, pregunta: contextualizar(elegida, graph) };
}
