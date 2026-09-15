import type { WorkspaceProject } from '../types/workspace';

/**
 * Extractor determinista del texto libre de la pantalla 1.
 * Reglas y listas explícitas, sin modelo. Ver specs/bloque-de-apertura-y-extraccion.md, sección 5.6.
 *
 * Es la interfaz intercambiable: si algún día la extracción deja de ser regex,
 * se reemplaza la implementación de `extraerSemilla` y nada más.
 */

export interface SemillaDeProyecto {
  nombreCandidato: { valor: string; razon: string } | null;
  disciplinaCandidata: { valor: string; razon: string } | null;
  lugarCandidato: { valor: string; razon: string } | null;
  intencionCandidata: { valor: string; razon: string } | null;
}

const ACENTOS: Record<string, string> = {
  á: 'a', é: 'e', í: 'i', ó: 'o', ú: 'u', ü: 'u', ñ: 'n',
  Á: 'a', É: 'e', Í: 'i', Ó: 'o', Ú: 'u', Ü: 'u', Ñ: 'n',
};

function normalizarCaracter(caracter: string): string {
  return ACENTOS[caracter] ?? caracter.toLowerCase();
}

/**
 * Normaliza a minúsculas sin tildes conservando la longitud exacta del texto
 * original, para poder mapear un índice de coincidencia de vuelta al texto
 * original sin perder la capitalización real.
 */
function normalizarConservandoLongitud(texto: string): string {
  return texto.split('').map(normalizarCaracter).join('');
}

function escaparRegex(valor: string): string {
  return valor.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// --- Nombre ---------------------------------------------------------------

function extraerEntreComillas(texto: string): { valor: string; razon: string } | null {
  const regex = /"([^"]{1,80})"|'([^']{1,80})'|«([^»]{1,80})»/;
  const match = regex.exec(texto);
  if (!match) return null;

  const valor = (match[1] ?? match[2] ?? match[3] ?? '').trim();
  if (!valor) return null;

  return { valor, razon: match[0] };
}

const DISPARADORES_NOMBRE = [
  'que se llama',
  'se llama',
  'se llamará',
  'se llamara',
  'se va a llamar',
  'lo vamos a llamar',
  'lo llamaremos',
  'lo llamo',
  'lo llamé',
  'quiero llamarlo',
  'quiero llamarla',
  'titulado',
  'llamado',
  'llamada',
  'de nombre',
  'bajo el nombre',
  'con el nombre',
  'el nombre es',
  'el nombre del proyecto es',
];

function extraerPorDisparador(texto: string): { valor: string; razon: string } | null {
  const patron = new RegExp(`(?:${DISPARADORES_NOMBRE.map(escaparRegex).join('|')})\\s+([^,.;:\\n]+)`, 'i');
  const match = patron.exec(texto);
  if (!match) return null;

  const valor = match[1].trim();
  if (!valor) return null;

  return { valor, razon: match[0].trim() };
}

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

function extraerPorMayusculas(texto: string): { valor: string; razon: string } | null {
  const palabra = '[A-ZÁÉÍÓÚÑ][a-záéíóúñ]*';
  const secuencia = new RegExp(`${palabra}(?:\\s${palabra}){0,3}`, 'g');

  let match: RegExpExecArray | null;
  while ((match = secuencia.exec(texto))) {
    const inicio = match.index;
    const antes = texto.slice(0, inicio).replace(/\s+$/, '');
    const esInicioDeOracion = antes.length === 0 || /[.!?]$/.test(antes);

    if (esInicioDeOracion) continue;

    const candidato = match[0];
    const normalizado = normalizarConservandoLongitud(candidato).toLowerCase();

    if (TOPONIMOS.includes(normalizado) || MESES.includes(normalizado)) continue;

    return { valor: candidato, razon: candidato };
  }

  return null;
}

function extraerNombre(textoLibre: string): { valor: string; razon: string } | null {
  return (
    extraerEntreComillas(textoLibre) ??
    extraerPorDisparador(textoLibre) ??
    extraerPorMayusculas(textoLibre)
  );
}

// --- Disciplina -------------------------------------------------------------

/**
 * Vocabulario por disciplina. Fuente única de verdad: pensado para que la
 * siguiente entrega lo amplíe sin tocar la lógica de conteo.
 */
export const TERMINOS_POR_DISCIPLINA: Record<string, string[]> = {
  musical: ['ep', 'album', 'disco', 'sencillo', 'single', 'cancion', 'canciones', 'banda', 'concierto', 'gira', 'master', 'mezcla', 'sello'],
  audiovisual: ['cortometraje', 'largometraje', 'documental', 'serie', 'pelicula', 'rodaje', 'guion', 'tratamiento', 'post', 'montaje'],
  escenicas: ['obra de teatro', 'montaje escenico', 'danza', 'dramaturgia', 'temporada', 'sala', 'funcion'],
  visuales: ['exposicion', 'muestra', 'galeria', 'curaduria', 'instalacion', 'mural', 'obra plastica'],
  editorial: ['libro', 'novela', 'poemario', 'manuscrito', 'editorial', 'tiraje', 'fanzine', 'revista'],
  diseno: ['coleccion', 'prototipo', 'identidad', 'marca de ropa', 'diseno de'],
  videojuegos: ['videojuego', 'juego', 'build', 'gdd'],
  patrimonio: ['patrimonio', 'saberes', 'salvaguarda', 'tradicion', 'portador'],
  artesania: ['artesania', 'artesanal', 'oficio', 'tejido', 'ceramica'],
};

function extraerDisciplina(textoLibre: string): { valor: string; razon: string } | null {
  const normalizado = normalizarConservandoLongitud(textoLibre).toLowerCase();

  let mejor: { disciplina: string; encontrados: string[] } | null = null;
  let hayEmpate = false;

  for (const [disciplina, terminos] of Object.entries(TERMINOS_POR_DISCIPLINA)) {
    const encontrados = terminos.filter((termino) => new RegExp(`\\b${escaparRegex(termino)}\\b`).test(normalizado));
    if (!encontrados.length) continue;

    if (!mejor || encontrados.length > mejor.encontrados.length) {
      mejor = { disciplina, encontrados };
      hayEmpate = false;
    } else if (encontrados.length === mejor.encontrados.length) {
      hayEmpate = true;
    }
  }

  if (!mejor || hayEmpate) return null;

  return { valor: mejor.disciplina, razon: mejor.encontrados.join(', ') };
}

/**
 * Mapeo de disciplina a categoría de WorkspaceProject, para preseleccionar
 * el botón de categoría en la pantalla 2 (spec 5.6).
 */
export function categoriaDesdeDisciplina(disciplina: string | null): WorkspaceProject['category'] {
  if (!disciplina) return 'other';
  if (['musical', 'audiovisual', 'escenicas', 'visuales', 'editorial'].includes(disciplina)) return 'artistic';
  if (['diseno', 'artesania', 'videojuegos'].includes(disciplina)) return 'product';
  if (disciplina === 'patrimonio') return 'cultural';
  return 'other';
}

// --- Lugar ------------------------------------------------------------------

const TOPONIMOS = [
  'bogota', 'medellin', 'cali', 'barranquilla', 'cartagena', 'bucaramanga', 'pereira', 'manizales',
  'santa marta', 'cucuta', 'ibague', 'villavicencio', 'pasto', 'monteria', 'neiva', 'armenia', 'popayan',
  'valledupar', 'sincelejo', 'tunja', 'riohacha', 'florencia', 'quibdo', 'yopal', 'mocoa', 'leticia',
  'arauca', 'inirida', 'mitu', 'puerto carreno', 'san andres', 'choco', 'guajira', 'amazonas', 'pacifico', 'caribe',
];

const TOPONIMOS_REGEX = new RegExp(
  `\\b(${[...TOPONIMOS].sort((a, b) => b.length - a.length).map(escaparRegex).join('|')})\\b`
);

function extraerPorFraseDeCiudad(texto: string): { valor: string; razon: string } | null {
  const patrones = [/en la ciudad de\s+([A-Za-zÀ-ÿ][A-Za-zÀ-ÿ\s]*?)(?=[,.;:\n]|$)/i, /en el municipio de\s+([A-Za-zÀ-ÿ][A-Za-zÀ-ÿ\s]*?)(?=[,.;:\n]|$)/i];

  for (const patron of patrones) {
    const match = patron.exec(texto);
    if (match) {
      const valor = match[1].trim();
      if (valor) return { valor, razon: match[0].trim() };
    }
  }

  return null;
}

function extraerLugar(textoLibre: string): { valor: string; razon: string } | null {
  const normalizado = normalizarConservandoLongitud(textoLibre);
  const match = TOPONIMOS_REGEX.exec(normalizado);

  if (match && typeof match.index === 'number') {
    const valor = textoLibre.slice(match.index, match.index + match[0].length);
    return { valor, razon: valor };
  }

  return extraerPorFraseDeCiudad(textoLibre);
}

// --- Intención ---------------------------------------------------------------

const GRUPOS_INTENCION: { intencion: string; frases: string[] }[] = [
  { intencion: 'convocatoria_publica', frases: ['convocatoria', 'aplicar a', 'postular', 'estimulos'] },
  { intencion: 'convocatoria_privada', frases: ['cocrea', 'beneficio tributario'] },
  { intencion: 'patrocinio', frases: ['patrocinio', 'patrocinador', 'marca que'] },
  { intencion: 'programacion', frases: ['que me programen', 'tocar en', 'presentarme en'] },
  { intencion: 'venta', frases: ['vender', 'venta', 'comprador'] },
];

function extraerIntencion(textoLibre: string): { valor: string; razon: string } | null {
  const normalizado = normalizarConservandoLongitud(textoLibre).toLowerCase();

  for (const grupo of GRUPOS_INTENCION) {
    for (const frase of grupo.frases) {
      const match = new RegExp(`\\b${escaparRegex(frase)}\\b`).exec(normalizado);
      if (match && typeof match.index === 'number') {
        const razon = textoLibre.slice(match.index, match.index + match[0].length);
        return { valor: grupo.intencion, razon };
      }
    }
  }

  return null;
}

// --- Entrada pública ----------------------------------------------------------

export function extraerSemilla(textoLibre: string): SemillaDeProyecto {
  return {
    nombreCandidato: extraerNombre(textoLibre),
    disciplinaCandidata: extraerDisciplina(textoLibre),
    lugarCandidato: extraerLugar(textoLibre),
    intencionCandidata: extraerIntencion(textoLibre),
  };
}
