# Spec corta: Ampliar DISPARADORES_NOMBRE en projectSeedExtractor

## 1. Qué se construye

La lista `DISPARADORES_NOMBRE` en `engines/projectSeedExtractor.ts` pasa de 5
a 19 frases disparadoras que la función `extraerPorDisparador` reconoce para
extraer el nombre candidato de un proyecto desde texto libre. Se agregan
casos de prueba nuevos, uno por cada una de las 14 frases nuevas.

## 2. Por qué

Instrucción directa del usuario: la lista actual (`engines/projectSeedExtractor.ts:53`)
solo reconoce 5 formas de anunciar un nombre ('que se llama', 'se llama',
'lo llamo', 'lo llamé', 'titulado') y deja fuera variantes de tiempo futuro,
voz pasiva y fórmulas con "nombre" que un usuario real usa igual de seguido.

## 3. Archivos y qué cambia en cada uno

- `engines/projectSeedExtractor.ts` — reemplaza íntegra la declaración de
  `DISPARADORES_NOMBRE` (línea 53 actual) por la lista de 19 frases de la
  sección 4. Ninguna otra función del archivo cambia
  (`extraerPorDisparador`, `extraerNombre`, `extraerPorMayusculas`,
  `extraerDisciplina`, `extraerLugar`, `extraerIntencion` quedan
  exactamente igual).
- `tests/projectSeedExtraction.test.ts` — se agregan 14 casos nuevos al
  final del archivo (después del Caso 4, antes del `console.log` final),
  uno por cada frase nueva, sin tocar los Casos 1 a 4 existentes.

**Corrección sobre la instrucción original:** el usuario pidió editar
`.test-tools/tests/projectSeedExtraction.test.js` — ese archivo es **salida
compilada**, no la fuente. El script `npm test` corre
`tsc -p tests/tsconfig.tests.json` antes de ejecutar los `.js`, así que
cualquier edición directa al `.js` se sobreescribe en la siguiente
compilación. La fuente real y editable es `tests/projectSeedExtraction.test.ts`
(confirmado: ambos archivos tienen el mismo contenido de los Casos 1-4,
literal, y el `.ts` importa `extraerSemilla` igual que el `.js` compilado lo
re-exporta vía `require`). Se edita el `.ts`; el `.js` se regenera solo al
correr `npm test`.

## 4. Decisiones ya tomadas

Lista completa que reemplaza el arreglo entero (no se agrega al lado, se
reemplaza):

```ts
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
```

Las 14 frases nuevas respecto a la lista actual son: `se llamará`,
`se llamara`, `se va a llamar`, `lo vamos a llamar`, `lo llamaremos`,
`quiero llamarlo`, `quiero llamarla`, `llamado`, `llamada`, `de nombre`,
`bajo el nombre`, `con el nombre`, `el nombre es`,
`el nombre del proyecto es`. Los 5 casos existentes (Caso 1 a 4) ya cubren
implícitamente `que se llama`/`titulado` a través de otras rutas de
extracción — no hace falta un caso nuevo para las 5 frases que ya estaban.

Casos nuevos exactos a agregar (frase → oración de entrada → valor
esperado en `nombreCandidato.valor`). Cada oración se diseñó para que
**ninguna otra vía de extracción interfiera**: sin comillas (para que
`extraerEntreComillas` no dispare antes), con una coma inmediatamente
después del nombre (para acotar la captura `[^,.;:\n]+`), y sin que otra
frase disparadora de la lista aparezca antes en el mismo texto.

1. `se llamará` → `'El proyecto se llamará Ríos de Fuego, será presentado en abril.'` → `'Ríos de Fuego'`
2. `se llamara` → `'El disco se llamara Marea Alta, sale en julio.'` → `'Marea Alta'`
3. `se va a llamar` → `'El podcast se va a llamar Radio Ficción, empieza en mayo.'` → `'Radio Ficción'`
4. `lo vamos a llamar` → `'Al colectivo lo vamos a llamar Tierra Nueva, así quedó decidido.'` → `'Tierra Nueva'`
5. `lo llamaremos` → `'Finalmente lo llamaremos Semillas del Sur, para el lanzamiento.'` → `'Semillas del Sur'`
6. `quiero llamarlo` → `'Quiero llamarlo Puentes Sonoros, es mi primer EP.'` → `'Puentes Sonoros'`
7. `quiero llamarla` → `'Quiero llamarla Casa de Barro, la exposición itinerante.'` → `'Casa de Barro'`
8. `llamado` → `'Estoy preparando un cortometraje llamado Sombras Largas, para el festival.'` → `'Sombras Largas'`
9. `llamada` → `'Estoy montando una obra llamada Piel de Agua, para octubre.'` → `'Piel de Agua'`
10. `de nombre` → `'Vengo con un proyecto de nombre Cauce Vivo, listo para producción.'` → `'Cauce Vivo'`
11. `bajo el nombre` → `'Vamos a lanzarlo bajo el nombre Ecos del Pacífico, en diciembre.'` → `'Ecos del Pacífico'`
12. `con el nombre` → `'Registramos el proyecto con el nombre Voces de Barro, ante la cámara.'` → `'Voces de Barro'`
13. `el nombre es` → `'El nombre es Tierra Firme, así quedó definido.'` → `'Tierra Firme'`
14. `el nombre del proyecto es` → `'El nombre del proyecto es Aguas Claras, confirmado con el equipo.'` → `'Aguas Claras'`

Formato de cada caso nuevo — mismo patrón `assertEqual` que los Casos 1-4,
un bloque por frase, comentario `// Caso N: <frase>` arriba:

```ts
// Caso 5: 'se llamará'
const caso5 = extraerSemilla('El proyecto se llamará Ríos de Fuego, será presentado en abril.');
assertEqual(caso5.nombreCandidato?.valor, 'Ríos de Fuego', 'Caso 5 · nombre');
```

Numerar del Caso 5 al Caso 18 (14 casos nuevos), en el mismo orden de la
tabla de arriba. Solo se assertea `nombreCandidato?.valor` en los casos
nuevos — no se agregan asserts de disciplina/lugar/intención porque esta
spec solo amplía el reconocimiento de nombre, no toca esas funciones.

## 5. Cómo se verifica

1. `npm run typecheck` — sin errores.
2. `npm test` — todo verde, sin modificar ningún caso existente (Caso 1 a
   4 intactos, literalmente iguales byte a byte).
3. `grep -c "^const caso" tests/projectSeedExtraction.test.ts` → `18`
   (4 existentes + 14 nuevos).
4. Lectura de diff de `engines/projectSeedExtractor.ts`: el único cambio
   es la línea de `DISPARADORES_NOMBRE` (ahora multilínea, 19 elementos);
   ninguna otra línea del archivo cambia.
5. Confirmar que `.test-tools/tests/projectSeedExtraction.test.js` no se
   edita a mano — se regenera solo al correr `npm test` (paso `tsc -p
   tests/tsconfig.tests.json` del script), y su contenido después de esa
   compilación debe reflejar los 18 casos.

## 6. Qué no se toca

- Ninguna otra función de `engines/projectSeedExtractor.ts`
  (`extraerPorDisparador`, `extraerNombre`, `extraerPorMayusculas`,
  `extraerDisciplina`, `extraerLugar`, `extraerIntencion`, `TERMINOS_POR_DISCIPLINA`,
  `TOPONIMOS`, `GRUPOS_INTENCION`).
- `CreateProjectScreen.tsx` ni ningún otro componente de UI.
- Los Casos 1 a 4 existentes de `tests/projectSeedExtraction.test.ts` —
  se agregan casos nuevos al final, no se reordenan ni se modifican los
  existentes.
- Cualquier otro archivo del repo.
