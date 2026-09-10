# Spec: Flujo de Caja con Condiciones — motor de cálculo

Todas las secciones son obligatorias. Si una sección no aplica, se escribe
explícitamente "ninguno"/"ninguna" y por qué.

## 1. Objetivo

Un motor determinista y puro que, dados los ingresos con su condición de desembolso y los egresos con su fecha de pago, calcule la curva de caja de un proyecto y encuentre la ventana de exposición: cuánta plata propia necesita el ejecutor y durante cuántos días.

## 2. Por qué ahora

Hoy el sistema tiene un módulo `budget` que responde "cuánto cuesta el proyecto", `budgetSignalProcessor` que detecta montos en el texto, y `financialAuthorityEngine` con reglas de autoridad. **Ninguno modela el tiempo del dinero.**

El problema real, en palabras del dueño del producto: una convocatoria entrega el 80% al inicio y el 20% restante solo contra ejecución del 100% del proyecto. Eso obliga al ejecutor a financiar de su propio bolsillo el último tramo — más el margen de error — durante semanas o meses. Muchos no tienen esa plata, se enteran tarde, y el proyecto queda ejecutado y sin pagar. Un presupuesto no ve ese problema porque el presupuesto cuadra: entran 20 millones, salen 20 millones. Lo que no cuadra es *cuándo*.

Esta pieza es la que permite advertirlo **antes de postularse**, y es la innovación específica del sector que el producto quiere aportar. No existe en Notion ni en Miro porque no es gestión de proyectos: es modelar condiciones de desembolso reales del financiamiento cultural.

## 3. Archivos que se crean o se modifican

**Se crean:**
- `types/cashFlow.ts` — los tipos del dominio. Solo tipos e interfaces, sin lógica.
- `engines/cashFlowEngine.ts` — el motor. Funciones puras, sin efectos.
- `tests/cashFlow.test.ts` — las pruebas, siguiendo el patrón de los tests existentes en `tests/`.

**Se modifica:**
- `package.json` — agregar `node .test-tools/tests/cashFlow.test.js` al final de la cadena del script `test`, después de `muscoRuntimeIntegration.test.js`, manteniendo el encadenamiento con `&&`. No se toca ningún otro script.

El constructor no debe tocar nada fuera de esta lista sin detenerse a preguntar. En particular: no toca `engines/budgetSignalProcessor.ts`, ni `engines/financialAuthorityEngine.ts`, ni `types/project.ts`.

## 4. Fuera de alcance

Nombrado explícitamente porque parece relacionado y NO se hace en esta entrega:

- **Persistencia.** No se crean tablas, ni migraciones, ni consultas a Supabase. El motor recibe datos en memoria y devuelve un resultado. Guardar el flujo de un proyecto real es una entrega posterior, y se diseña *después* de validar que el cálculo es correcto.
- **Interfaz de usuario.** No se crea ningún componente, ni panel, ni pantalla. Nada visual.
- **Integración con el presupuesto existente.** No se conecta con el módulo `budget` del `ProjectGraph`. Se conectará después, con su propia spec.
- **Recomendaciones.** El motor NO sugiere qué hacer con la brecha (buscar un crédito puente, renegociar, reducir alcance). Calcula y nombra el riesgo; no aconseja. Esta frontera es deliberada y tiene razón legal: aconsejar sobre plata es asesoría financiera, y el borrador de política del proyecto (C.2) es explícito en que la plataforma no promete resultados económicos.
- **Escenarios y sensibilidad.** No se calculan variantes ("qué pasa si el desembolso se atrasa 30 días más"). Es lo obvio que sigue, y va en su propia entrega.
- **Múltiples monedas.** Solo pesos colombianos.

## 5. Decisiones ya tomadas

El constructor no decide nada de esto:

**Nombres exactos de los tipos** (en `types/cashFlow.ts`):

- `CondicionDesembolso` — union de literales string, exactamente estos seis valores:
  `'sin_condicion' | 'anticipo' | 'contra_entrega' | 'contra_informe_aprobado' | 'contra_ejecucion_total' | 'contra_legalizacion'`
- `Ingreso` — `{ id: string; concepto: string; montoCop: number; condicion: CondicionDesembolso; fechaDisparador: string; latenciaDias: number }`
- `Egreso` — `{ id: string; concepto: string; montoCop: number; fechaPago: string }`
- `FlujoDeCaja` — `{ ingresos: Ingreso[]; egresos: Egreso[]; saldoInicialCop: number }`
- `PuntoDeFlujo` — `{ fecha: string; ingresosCop: number; egresosCop: number; saldoCop: number }`
- `VentanaDeExposicion` — `{ fechaInicio: string; fechaFin: string; dias: number; exposicionMaximaCop: number; fechaExposicionMaxima: string }`
- `AnalisisDeFlujo` — `{ curva: PuntoDeFlujo[]; ventanas: VentanaDeExposicion[]; exposicionMaximaCop: number; diasEnExposicion: number; saldoFinalCop: number; requiereFinanciacionPropia: boolean }`

**Semántica del modelo:**

- `fechaDisparador` es cuándo ocurre el hecho que habilita el pago (se firma el contrato, se entrega el informe, se termina la ejecución). **No es cuándo llega la plata.**
- `latenciaDias` son los días entre ese hecho y la plata efectivamente en la cuenta. Un ingreso `contra_informe_aprobado` no llega el día que se entrega el informe: llega semanas después. Esa distinción es el corazón de la herramienta.
- La fecha efectiva de un ingreso es `fechaDisparador + latenciaDias`.
- **El motor nunca inventa una latencia.** Si un ingreso trae `latenciaDias: 0`, se respeta el 0. Se exporta además una constante `LATENCIAS_SUGERIDAS: Record<CondicionDesembolso, number>` que una futura interfaz puede usar para prellenar el campo, pero **el motor no la aplica nunca de forma silenciosa**. Valores sugeridos: `sin_condicion: 0`, `anticipo: 15`, `contra_entrega: 30`, `contra_informe_aprobado: 45`, `contra_ejecucion_total: 45`, `contra_legalizacion: 60`.

**Dinero:**
- Todos los montos son enteros en pesos colombianos. Sin decimales, sin centavos.
- **Ninguna operación sobre dinero usa punto flotante.** Sumas y restas de enteros únicamente. Si hace falta dividir para presentación (por ejemplo días a semanas), se hace con `Math.round` y fuera del cálculo de saldos.
- `exposicionMaximaCop` se reporta como número **positivo** (la magnitud de la deuda), no como saldo negativo.

**Fechas:**
- Formato `'YYYY-MM-DD'` en strings, siempre.
- **La aritmética de fechas no puede verse afectada por la zona horaria.** Colombia es UTC-5, y `new Date('2026-03-12').getDate()` devuelve 11 en esa zona. Ese error produciría fechas corridas un día en silencio. El constructor debe usar operaciones en UTC (`Date.UTC`, `getUTCDate`, etc.) o aritmética pura sobre los componentes de la fecha.
- **Prohibido `Date.now()` y `new Date()` sin argumento** en cualquier parte del motor. El resultado debe ser reproducible: los mismos datos de entrada producen siempre exactamente el mismo resultado.

**Comportamiento del cálculo:**
- La `curva` solo tiene puntos en los días donde hay al menos un movimiento. No se rellenan los días intermedios.
- El `saldoCop` de cada punto es el acumulado incluyendo ese día.
- Una ventana de exposición empieza el primer día en que el saldo acumulado queda negativo y termina el **día anterior** al día en que vuelve a ser cero o positivo.
- `dias` cuenta los días calendario en exposición, **inclusive de ambos extremos**.
- Puede haber más de una ventana. `ventanas` las devuelve en orden cronológico.
- `exposicionMaximaCop` es la peor de todas las ventanas. Si no hay ninguna, es `0`.
- `diasEnExposicion` es la suma de los `dias` de todas las ventanas.
- `requiereFinanciacionPropia` es `true` si y solo si hay al menos una ventana.
- Si dos movimientos caen el mismo día, **los ingresos se acreditan antes que los egresos**. Es el supuesto conservador correcto: si la plata entra y sale el mismo día, no hay exposición.
- Entrada vacía (sin ingresos ni egresos) devuelve `curva: []`, `ventanas: []`, `exposicionMaximaCop: 0`, `diasEnExposicion: 0`, `saldoFinalCop` igual al saldo inicial, `requiereFinanciacionPropia: false`. No lanza error.

**Errores:**
- Un monto negativo, una fecha con formato inválido o una `latenciaDias` negativa lanzan `Error` con un mensaje que nombra el `id` y el campo problemático. No se corrigen en silencio.

## 6. Interfaces y contratos que hay que respetar

Dos funciones exportadas de `engines/cashFlowEngine.ts`, con estas firmas exactas:

```ts
export function analizarFlujo(flujo: FlujoDeCaja): AnalisisDeFlujo

export function describirExposicion(analisis: AnalisisDeFlujo): string
```

`describirExposicion` devuelve una frase en español, armada de forma determinista, del estilo: `"Necesitas poder financiar COP 4.000.000 con recursos propios durante 55 días."` Si no hay exposición, devuelve `"El proyecto no requiere financiación propia en ningún momento."` Formatea los montos con `Intl.NumberFormat('es-CO')`. **Describe el número, no aconseja qué hacer** — la frontera de la sección 4 aplica aquí.

`engines/cashFlowEngine.ts` **no importa nada de React, Next, Supabase ni del navegador.** Es un módulo puro que debe poder ejecutarse con `node` sin ningún entorno. Esto sigue la arquitectura de capas del Documento 7 del proyecto, donde la capa de inteligencia no depende del framework.

Interfaz intercambiable: ninguna. Esta entrega no interpreta texto libre.

## 7. Tests que van a romperse a propósito

**Ninguno.** Esta entrega es puramente aditiva: crea archivos nuevos y solo agrega una línea al final de la cadena del script `test`. Los siete tests existentes deben seguir pasando exactamente igual. Si alguno se rompe, **es una regresión real** y el constructor debe detenerse y reportarla, no reescribir el test.

## 8. Criterio de aceptación verificable

El auditor comprueba todo esto:

**a) Compila y pasa.** `npm run typecheck` sin errores y `npm test` con 8 pruebas en OK (las 7 existentes más la nueva).

**b) El caso canónico 80/20 da los números exactos.** `tests/cashFlow.test.ts` debe incluir este caso con estos valores:

- `saldoInicialCop: 0`
- Ingreso `anticipo`: 16.000.000, `fechaDisparador: '2026-03-01'`, `latenciaDias: 15` → efectivo 2026-03-16
- Ingreso `contra_ejecucion_total`: 4.000.000, `fechaDisparador: '2026-06-30'`, `latenciaDias: 45` → efectivo 2026-08-14
- Cuatro egresos de 5.000.000 cada uno: 2026-03-20, 2026-04-20, 2026-05-20, 2026-06-20

Resultado esperado, y el test debe afirmar cada valor:
- `ventanas.length === 1`
- `ventanas[0].fechaInicio === '2026-06-20'`
- `ventanas[0].fechaFin === '2026-08-13'`
- `ventanas[0].dias === 55`
- `exposicionMaximaCop === 4000000`
- `ventanas[0].fechaExposicionMaxima === '2026-06-20'`
- `saldoFinalCop === 0`
- `requiereFinanciacionPropia === true`

**c) Los otros casos cubiertos**, cada uno con su afirmación:
- Todo por anticipado, sin exposición: `requiereFinanciacionPropia === false`, `exposicionMaximaCop === 0`, `ventanas.length === 0`.
- Dos ventanas separadas: `ventanas.length === 2`, en orden cronológico.
- Ingreso y egreso el mismo día por el mismo monto: no genera ventana (el ingreso se acredita primero).
- Entrada vacía: no lanza error y devuelve la forma descrita en la sección 5.
- Monto negativo: lanza `Error` cuyo mensaje contiene el `id` del movimiento.

**d) Determinismo, verificable leyendo el código.** Un `grep` de `Date.now(`, `new Date()` sin argumento, `Math.random`, `parseFloat` y `toFixed` en `engines/cashFlowEngine.ts` no debe devolver nada.

**e) Pureza de capa, verificable leyendo los imports.** `engines/cashFlowEngine.ts` no importa `react`, `next`, `@supabase/*` ni nada de `components/`.

**f) La zona horaria no corre las fechas.** Un test que use una fecha en frontera de mes (por ejemplo un disparador el `'2026-03-31'` con latencia 1, que debe dar `'2026-04-01'`) debe pasar. El auditor puede confirmarlo además corriendo el test con `TZ=America/Bogota` y con `TZ=UTC`: el resultado debe ser idéntico.

## 9. Qué queda determinista y por qué

**Todo.** No hay ninguna parte de esta entrega que use un modelo de lenguaje, heurísticas difusas o inferencia. Es aritmética de enteros sobre fechas y montos declarados.

Y es deliberado, por tres razones acumuladas:

1. **Legal.** Esta pieza va a producir afirmaciones sobre plata de terceros ("necesitas 4 millones durante 55 días"). Si alguien decide postularse o no con base en ese número, la conclusión tiene que poder reconstruirse, mostrarse y defenderse. Un cálculo con reglas se audita línea por línea; una respuesta de un modelo no se puede reproducir. Es la frontera que el proyecto ya fijó como no negociable: el modelo lee y redacta, las reglas deciden sobre dinero.
2. **Producto.** La confianza en esta herramienta depende de que el número sea siempre el mismo con los mismos datos. Un resultado que varía destruye la utilidad.
3. **Económico.** No agrega ningún costo por uso, y funciona sin conexión a ningún proveedor externo.

La interpretación de texto libre — leer "me dan el 80% al principio y el resto al final" y convertirlo en `Ingreso[]` — es un problema distinto, va en la entrega de extracción, y **debe entregar sus resultados a este motor ya estructurados**. Este motor nunca recibe texto libre.
