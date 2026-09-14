import { createId, createInitialProjectGraph, now } from '../core/projectEngine';
import { createProjectControllerState, processProjectMessage } from '../core/projectController';
import type { ConversationMessage, ProjectGraph, ProjectModuleId } from '../types/project';
import { encontrarPreguntaPorTexto, seleccionarPreguntaDeApertura } from '../engines/openingBlockEngine';

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

function modulosCambiados(
  antes: Record<ProjectModuleId, ProjectGraph['modules'][ProjectModuleId]>,
  despues: Record<ProjectModuleId, ProjectGraph['modules'][ProjectModuleId]>
): ProjectModuleId[] {
  return (Object.keys(antes) as ProjectModuleId[]).filter((moduloId) => {
    const a = antes[moduloId];
    const d = despues[moduloId];
    return a.content !== d.content || a.score !== d.score || a.updatedAt !== d.updatedAt;
  });
}

// ---------------------------------------------------------------------------
// a) El caso que hoy falla: una respuesta a AP-02 que no matchea la lista de
// palabras clave de audiencia debe guardarse en community, y solo ahí.
//
// Nota: la spec (2.1 y 8.4.a) ilustra este caso con el texto literal "gente
// que patina en Bogotá". Ese texto exacto no sirve para probar la ruta que
// esta entrega corrige: "Bogotá" SÍ matchea la lista de palabras clave de
// `context` (la palabra "bogota" está en esa lista, conversationEngine.ts).
// Con ese texto el mensaje nunca llega al patch de respaldo — se resuelve
// por coincidencia de palabra clave de `context`, igual antes que después de
// este cambio, y no ejercita la ruta que se está corrigiendo. Se usa "gente
// que patina" (sin el lugar) para conservar la intención del escenario — una
// respuesta real a "¿Quién va a estar del otro lado?" que no matchea NINGUNA
// lista de palabras clave — sin la colisión accidental de `context`. Cambiar
// las listas de palabras clave está fuera de alcance de esta entrega (spec,
// sección 4), así que se ajusta el texto de prueba, no la lista.
// ---------------------------------------------------------------------------
{
  const t1 = processProjectMessage(
    createProjectControllerState({ ...createInitialProjectGraph(), title: 'Ruido Blanco' }),
    'Este proyecto se llama Culebreo.'
  );
  // Spec redaccion-de-la-apertura.md, 4.5 (enmienda del 2026-09-11): AP-02
  // trae el marcador `[oficio]` sin resolver en `BLOQUE_DE_APERTURA`, así que
  // ya no es una igualdad literal contra el texto entregado (que ya vino
  // sustituido). Se reconoce por código con la misma función que usa
  // `projectController` en producción.
  assert(
    encontrarPreguntaPorTexto(t1.response.nextQuestion ?? '')?.codigo === 'AP-02',
    `Después de T1 la pregunta pendiente debe ser AP-02, fue: "${t1.response.nextQuestion}"`
  );

  const modulosAntesDeT2 = t1.state.graph.modules;
  const t2 = processProjectMessage(t1.state, 'gente que patina');

  assert(
    t2.state.graph.modules.community.content === 'gente que patina',
    `community debe contener la respuesta literal, contiene: "${t2.state.graph.modules.community.content}"`
  );

  const cambiadosEnT2 = modulosCambiados(modulosAntesDeT2, t2.state.graph.modules);
  assert(
    cambiadosEnT2.length === 1 && cambiadosEnT2[0] === 'community',
    `El único módulo que debe cambiar en T2 es community, cambiaron: ${JSON.stringify(cambiadosEnT2)}`
  );

  // -------------------------------------------------------------------------
  // d) Sin copia doble: ningún otro módulo -- en particular el
  // recommendedModule de executiveInsight -- contiene el texto de la
  // respuesta.
  // -------------------------------------------------------------------------
  const recommendedModule = t1.state.executiveInsight.recommendedModule;
  if (recommendedModule !== 'community') {
    assert(
      !t2.state.graph.modules[recommendedModule].content.includes('gente que patina'),
      `El recommendedModule ("${recommendedModule}") no debe contener una copia de la respuesta de community`
    );
  }
  (Object.keys(t2.state.graph.modules) as ProjectModuleId[])
    .filter((moduloId) => moduloId !== 'community')
    .forEach((moduloId) => {
      assert(
        !t2.state.graph.modules[moduloId].content.includes('gente que patina'),
        `El módulo "${moduloId}" no debe contener una copia de la respuesta de community`
      );
    });

  console.log('answerRouting a/d: OK');
}

// ---------------------------------------------------------------------------
// b) Mensaje sin pregunta previa: proyecto vacío, primer mensaje "hola".
// Ningún módulo cambia de contenido ni de puntaje.
// ---------------------------------------------------------------------------
{
  const vacio = createInitialProjectGraph();
  const estadoInicial = createProjectControllerState(vacio);
  const resultado = processProjectMessage(estadoInicial, 'hola');

  const cambiados = modulosCambiados(estadoInicial.graph.modules, resultado.state.graph.modules);
  assert(
    cambiados.length === 0,
    `Ningún módulo debe cambiar tras "hola" sin pregunta previa, cambiaron: ${JSON.stringify(cambiados)}`
  );

  console.log('answerRouting b: OK');

  // -----------------------------------------------------------------------
  // c) No se desactiva una pregunta por accidente: tras (b),
  // seleccionarPreguntaDeApertura debe seguir devolviendo AP-01.
  // -----------------------------------------------------------------------
  assert(
    seleccionarPreguntaDeApertura(resultado.state.graph)?.codigo === 'AP-01',
    'Tras "hola" sin pregunta previa, AP-01 debe seguir siendo la pregunta de apertura'
  );

  console.log('answerRouting c: OK');
}

// ---------------------------------------------------------------------------
// e) Lo que matchea sigue igual: un mensaje que sí matchea una lista de
// palabras clave (budget, "costo") cae donde caía antes, con el mismo
// puntaje.
// ---------------------------------------------------------------------------
{
  const resultado = processProjectMessage(
    createProjectControllerState(createInitialProjectGraph()),
    'El costo del proyecto es alto.'
  );

  assert(
    resultado.state.graph.modules.budget.content === 'El costo del proyecto es alto.',
    `budget debe contener el texto que matcheó su lista de palabras clave, contiene: "${resultado.state.graph.modules.budget.content}"`
  );
  assert(
    resultado.state.graph.modules.budget.score === 30,
    `budget debe tener el mismo puntaje de siempre para este match (30), tiene: ${resultado.state.graph.modules.budget.score}`
  );

  console.log('answerRouting e: OK');
}

// ---------------------------------------------------------------------------
// Caso adicional: hubo pregunta, pero no mapea a ningún módulo (intención
// 'other'). El respaldo de recommendedModule debe seguir funcionando ahí --
// es el único caso para el que sigue corriendo (spec, 5.4 enmendada).
// ---------------------------------------------------------------------------
{
  const graph = createInitialProjectGraph();
  const estadoBase = createProjectControllerState(graph);

  const preguntaSinModulo: ConversationMessage = {
    id: createId(),
    role: 'producer',
    content: '¿Bla bla bla, dime algo random?',
    createdAt: now(),
  };

  const estadoConPreguntaSinModulo = {
    ...estadoBase,
    messages: [preguntaSinModulo],
  };

  const resultado = processProjectMessage(estadoConPreguntaSinModulo, 'Aquí va mi respuesta libre.');

  const recommendedModule = estadoBase.executiveInsight.recommendedModule;
  assert(
    resultado.state.graph.modules[recommendedModule].content.includes('Aquí va mi respuesta libre.'),
    `Cuando hubo pregunta pero no mapeó a ningún módulo, el respaldo de recommendedModule ("${recommendedModule}") debe seguir aplicando la respuesta, contiene: "${resultado.state.graph.modules[recommendedModule].content}"`
  );

  console.log('answerRouting (hubo pregunta, sin módulo): OK');
}

console.log('Answer routing: OK');
