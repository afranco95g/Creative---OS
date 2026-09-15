import { extraerSemilla } from '../engines/projectSeedExtractor';

function assertEqual(actual: unknown, expected: unknown, message: string) {
  if (actual !== expected) {
    throw new Error(`${message} — esperado ${JSON.stringify(expected)}, obtuvo ${JSON.stringify(actual)}`);
  }
}

// Caso 1: nombre entre comillas, disciplina musical, lugar Medellín, sin intención.
const caso1 = extraerSemilla('quiero sacar mi EP "Ruido Blanco" en Medellín en marzo');
assertEqual(caso1.nombreCandidato?.valor, 'Ruido Blanco', 'Caso 1 · nombre');
assertEqual(caso1.disciplinaCandidata?.valor, 'musical', 'Caso 1 · disciplina');
assertEqual(caso1.lugarCandidato?.valor, 'Medellín', 'Caso 1 · lugar');
assertEqual(caso1.intencionCandidata, null, 'Caso 1 · intención');

// Caso 2: convocatoria pública, disciplina audiovisual, lugar Quibdó, sin nombre.
const caso2 = extraerSemilla('voy a aplicar a la convocatoria de estímulos con un documental en Quibdó');
assertEqual(caso2.nombreCandidato, null, 'Caso 2 · nombre');
assertEqual(caso2.disciplinaCandidata?.valor, 'audiovisual', 'Caso 2 · disciplina');
assertEqual(caso2.lugarCandidato?.valor, 'Quibdó', 'Caso 2 · lugar');
assertEqual(caso2.intencionCandidata?.valor, 'convocatoria_publica', 'Caso 2 · intención');

// Caso 3: el importante — comprueba que el extractor no inventa.
const caso3 = extraerSemilla('quiero hacer algo bonito');
assertEqual(caso3.nombreCandidato, null, 'Caso 3 · nombre');
assertEqual(caso3.disciplinaCandidata, null, 'Caso 3 · disciplina');
assertEqual(caso3.lugarCandidato, null, 'Caso 3 · lugar');
assertEqual(caso3.intencionCandidata, null, 'Caso 3 · intención');

// Caso 4: "en <mes>" y "en <duración>" no se toman por lugares.
const caso4 = extraerSemilla('en marzo quiero montar la obra en tres meses');
assertEqual(caso4.lugarCandidato, null, 'Caso 4 · lugar');

// Caso 5: 'se llamará'
const caso5 = extraerSemilla('El proyecto se llamará Ríos de Fuego, será presentado en abril.');
assertEqual(caso5.nombreCandidato?.valor, 'Ríos de Fuego', 'Caso 5 · nombre');

// Caso 6: 'se llamara'
const caso6 = extraerSemilla('El disco se llamara Marea Alta, sale en julio.');
assertEqual(caso6.nombreCandidato?.valor, 'Marea Alta', 'Caso 6 · nombre');

// Caso 7: 'se va a llamar'
const caso7 = extraerSemilla('El podcast se va a llamar Radio Ficción, empieza en mayo.');
assertEqual(caso7.nombreCandidato?.valor, 'Radio Ficción', 'Caso 7 · nombre');

// Caso 8: 'lo vamos a llamar'
const caso8 = extraerSemilla('Al colectivo lo vamos a llamar Tierra Nueva, así quedó decidido.');
assertEqual(caso8.nombreCandidato?.valor, 'Tierra Nueva', 'Caso 8 · nombre');

// Caso 9: 'lo llamaremos'
const caso9 = extraerSemilla('Finalmente lo llamaremos Semillas del Sur, para el lanzamiento.');
assertEqual(caso9.nombreCandidato?.valor, 'Semillas del Sur', 'Caso 9 · nombre');

// Caso 10: 'quiero llamarlo'
const caso10 = extraerSemilla('Quiero llamarlo Puentes Sonoros, es mi primer EP.');
assertEqual(caso10.nombreCandidato?.valor, 'Puentes Sonoros', 'Caso 10 · nombre');

// Caso 11: 'quiero llamarla'
const caso11 = extraerSemilla('Quiero llamarla Casa de Barro, la exposición itinerante.');
assertEqual(caso11.nombreCandidato?.valor, 'Casa de Barro', 'Caso 11 · nombre');

// Caso 12: 'llamado'
const caso12 = extraerSemilla('Estoy preparando un cortometraje llamado Sombras Largas, para el festival.');
assertEqual(caso12.nombreCandidato?.valor, 'Sombras Largas', 'Caso 12 · nombre');

// Caso 13: 'llamada'
const caso13 = extraerSemilla('Estoy montando una obra llamada Piel de Agua, para octubre.');
assertEqual(caso13.nombreCandidato?.valor, 'Piel de Agua', 'Caso 13 · nombre');

// Caso 14: 'de nombre'
const caso14 = extraerSemilla('Vengo con un proyecto de nombre Cauce Vivo, listo para producción.');
assertEqual(caso14.nombreCandidato?.valor, 'Cauce Vivo', 'Caso 14 · nombre');

// Caso 15: 'bajo el nombre'
const caso15 = extraerSemilla('Vamos a lanzarlo bajo el nombre Ecos del Pacífico, en diciembre.');
assertEqual(caso15.nombreCandidato?.valor, 'Ecos del Pacífico', 'Caso 15 · nombre');

// Caso 16: 'con el nombre'
const caso16 = extraerSemilla('Registramos el proyecto con el nombre Voces de Barro, ante la cámara.');
assertEqual(caso16.nombreCandidato?.valor, 'Voces de Barro', 'Caso 16 · nombre');

// Caso 17: 'el nombre es'
const caso17 = extraerSemilla('El nombre es Tierra Firme, así quedó definido.');
assertEqual(caso17.nombreCandidato?.valor, 'Tierra Firme', 'Caso 17 · nombre');

// Caso 18: 'el nombre del proyecto es'
const caso18 = extraerSemilla('El nombre del proyecto es Aguas Claras, confirmado con el equipo.');
assertEqual(caso18.nombreCandidato?.valor, 'Aguas Claras', 'Caso 18 · nombre');

console.log('Project seed extraction: OK');
