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

console.log('Project seed extraction: OK');
