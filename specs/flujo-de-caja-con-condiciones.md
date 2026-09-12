# Spec: Flujo de caja del proyecto — motor de cálculo

**Versión 3 · 2026-09-11 — reemplaza por completo la v2.**

**Qué cambió, y por qué es un cambio de fondo.** La v2 estaba organizada alrededor
de la trampa 80/20 de una convocatoria pública. Andrés corrigió el encuadre:

> *"flujo de caja debe ser una herramienta para manejar las finanzas y presupuesto
> del proyecto, eso debe ser en primera instancia no para las convocatorias sino
> para todo, pues para un proyecto aplicar al ecosistema debe tener su presupuesto
> claro."*

La consecuencia concreta es que la v2 **obligaba a todo el mundo a pasar por un
formulario con forma de convocatoria**: cada peso tenía que pertenecer a un `Fondo`
con `desembolsos` y `condiciones`. Un músico que paga la mezcla de su bolsillo no
tiene fondos ni condiciones de desembolso, y con la v2 no podía usar la herramienta.

En la v3 el caso por defecto es **entra plata, sale plata**. Una convocatoria es
**un tipo de fuente de ingreso** que además trae condiciones y restricciones. Las
tres formas de exposición siguen siendo lo que el motor *detecta*; dejan de ser
aquello de lo que el motor *trata*.

Y una segunda corrección, también de Andrés: las latencias de desembolso **no las
pone el software.** Ver 5.6.

Todas las secciones son obligatorias. Si una no aplica, se escribe "ninguna" y por qué.

---

## 1. Objetivo

Un motor determinista y puro que, dado el presupuesto de un proyecto y sus fuentes
de ingreso con fechas, calcule **cuándo el proyecto se queda sin plata**, con cuánta
plata propia hay que taparlo, y por cuántos días — y que además diga si el
presupuesto está lo bastante claro para presentar el proyecto al ecosistema.

## 2. Por qué ahora

Dos razones, y la segunda es la que define la prioridad.

**El presupuesto no tiene tiempo.** `ProjectBudgetLine` ya guarda `estimatedDate` y
`actualDate` por línea, y `ProjectToolsPanel` los muestra. **Nadie calcula nada con
ellos.** El presupuesto suma bien y no sabe en qué orden pasa. Un presupuesto que
cuadra puede dejar al proyecto sin plata en mayo y el sistema hoy no lo ve.

**Un presupuesto claro es el requisito de entrada al ecosistema.** Esa es la frase
de Andrés y cambia la naturaleza de la herramienta: no es una calculadora opcional
para quien tenga una convocatoria, es el mínimo que cualquier proyecto necesita para
poder conversar con un espacio, una marca, un aliado o un financiador. Por eso entra
antes que las ramas de intención: todas las ramas lo necesitan.

Las tres formas en que un proyecto cultural se queda sin plata siguen siendo el
contenido técnico del motor, y la investigación que las produjo sigue siendo válida:
**exposición de cola** (la plata llega tarde — el 80/20), **exposición de cabeza**
(hay que probar que se tiene plata antes de arrancar — el Aporte Mínimo de Inicio),
y **restricción de uso** (la plata existe pero no se puede usar para esa línea). Lo
que cambia es que ninguna de las tres es obligatoria para usar la herramienta.

## 3. Archivos que se crean o se modifican

**Se crean:**

- `engines/cashFlowEngine.ts` — el motor. Puro, sin lectura del grafo.
- `core/budgetMath.ts` — la fórmula de total de una línea de presupuesto, **una sola
  vez** (ver 5.2).
- `tests/cashFlow.test.ts`

**Se modifican:**

- `engines/projectConsistencyEngine.ts` — su `total()` inline pasa a importar de
  `core/budgetMath.ts`. Aritmética idéntica.
- `engines/financialAuthorityEngine.ts` — su `graphTotal()` inline pasa a importar de
  `core/budgetMath.ts`. Aritmética idéntica.
- `types/project.ts` — se agregan los tipos del lado de ingresos (5.4). **No se
  modifica `ProjectBudgetLine`.**
- `package.json` — el test nuevo entra al script `test`.

**No se toca `ProjectToolsPanel.tsx`.** Esta entrega es el motor; la interfaz es la
siguiente. Un motor sin interfaz es verificable por tests; una interfaz sin motor no
es nada.

## 4. Fuera de alcance

- **La interfaz.** Ni pestaña, ni gráfica, ni formulario de ingresos.
- **Escenarios y reservas** (SOP 4 de ODA). Ver 5.3: el `status` que ya existe en las
  líneas da tres vistas sin construir la maquinaria de escenarios, y eso alcanza para
  esta entrega.
- **Reforecast** (SOP 3). El presupuesto hoy se edita, no se reproyecta. Otra entrega.
- **Conexión bancaria.** No existe y no va a existir pronto. Todo se declara a mano.
- **Contabilidad.** El Culebreo acompaña proyectos, no lleva la contabilidad de
  nadie. No hay asientos, no hay estados financieros, no hay cierre.
- **Impuestos como asesoría.** El motor usa los campos de IVA y retención que el
  usuario ya llenó. No decide tarifas ni aconseja sobre ellas.
- **La base de convocatorias.** El software no aloja convocatorias: son públicas.
  Quien crea el proyecto escribe las condiciones de su propia convocatoria (5.6).

## 5. Decisiones ya tomadas

### 5.1 El motor no tiene modelo de egresos propio

**Consume `ProjectBudgetLine[]`.** No se crea ningún tipo `Egreso`.

La razón es de producto antes que técnica: si el motor tuviera su propio modelo de
gastos, habría **dos lugares donde meter plata**, se desincronizarían, y el usuario
tendría que mantener ambos. Es exactamente la trampa que el proyecto ya decidió no
pisar — *"no vamos a hacer otro Notion"*.

Y técnicamente no hace falta inventar nada: `ProjectBudgetLine` ya trae `category`,
`concept`, `quantity`, `unitValue`, `vatRate`, `withholdingRate`, `otherTaxes`,
`status`, `responsible`, `provider`, `estimatedDate` y `actualDate`. Es más completo
que el `Egreso` que la v2 proponía.

**Qué fecha usa el motor:** `actualDate` cuando está presente y no vacía, si no
`estimatedDate`. Una línea **sin ninguna de las dos no se puede ubicar en el tiempo**
y no entra en la curva: se reporta aparte en `lineasSinFecha`. No se le inventa una
fecha y no se descarta en silencio — una línea sin fecha es precisamente una de las
cosas que hacen que un presupuesto no esté claro (5.8).

### 5.2 La fórmula del total se escribe una sola vez

Hoy existe **dos veces**, en línea y minificada:

- `engines/projectConsistencyEngine.ts:10` → `total(line)`
- `engines/financialAuthorityEngine.ts:8` → `graphTotal(l)`

Ambas calculan `subtotal + IVA − retención + otrosImpuestos`, con
`subtotal = quantity × unitValue`.

Si el motor de flujo de caja la escribe otra vez, son **tres copias de una fórmula
de plata**. Tres copias es como se desincronizan: alguien arregla un redondeo en una
y el sistema empieza a dar dos totales distintos para la misma línea, y no hay forma
de decir cuál es el bueno. `CLAUDE.md` ya fija que la plata es determinista y
auditable por razón legal, no solo técnica. Tres fórmulas no son auditables.

```ts
// core/budgetMath.ts
export function totalDeLinea(linea: ProjectBudgetLine): number;
```

**Aritmética idéntica a la de hoy**, incluido el orden de las operaciones. Esta
entrega **no arregla** el redondeo ni cambia la semántica de la retención, aunque
haya dudas sobre ellos: cambiar la aritmética y extraerla en el mismo movimiento
haría imposible saber a qué se debe una diferencia. Si hay que corregirla, se corrige
después, en un solo lugar — que es justamente el punto de extraerla.

### 5.3 El `status` de la línea da tres vistas sin construir escenarios

`BudgetLineStatus` ya distingue `proposed` · `approved` · `committed` · `paid`. Un
flujo de caja que trata un gasto propuesto como seguro miente.

El motor calcula la curva **tres veces**, con el mismo código y distinto filtro:

| Vista | Incluye | Para qué sirve |
|---|---|---|
| `comprometido` | `committed` + `paid` | Lo que ya no se puede deshacer. El piso real. |
| `aprobado` | `approved` + lo anterior | El plan vigente. **Es la vista por defecto.** |
| `completo` | todo, `proposed` incluido | El plan con todo lo que se está pensando. |

Eso entrega el valor de los escenarios de ODA sin construir `LiquidityScenario`,
`Driver` ni versionado de pronósticos. **Es el mínimo experimento útil**, y si resulta
que la gente necesita más, se construye con evidencia en vez de por anticipación.

La exposición que se reporta como titular es la de la vista `aprobado`.

### 5.4 El lado de los ingresos, que es lo único nuevo

```ts
export type CondicionDeIngreso =
  | 'sin_condicion'            // ya está o va a estar, sin trámite
  | 'anticipo'
  | 'contra_acta_de_inicio'
  | 'contra_entrega'
  | 'contra_informe_aprobado'
  | 'contra_ejecucion_total'   // el 20% del 80/20
  | 'contra_legalizacion';

export type TipoDeFuente =
  | 'propio'                   // el bolsillo de quien hace el proyecto
  | 'venta'                    // boletería, producto, servicio
  | 'cliente'                  // un contrato, una factura
  | 'patrocinio'
  | 'convocatoria_publica'
  | 'convocatoria_privada'
  | 'otro';

export interface Ingreso {
  id: ID;
  concepto: string;
  montoCop: number;
  condicion: CondicionDeIngreso;
  fechaDisparador: string;     // el día del hecho que habilita el cobro
  latenciaDias: number;        // del hecho a la plata en cuenta. Lo pone el usuario.
  fuenteId: ID | null;         // null = ingreso suelto, sin fuente con reglas
}

export interface Fuente {
  id: ID;
  nombre: string;
  tipo: TipoDeFuente;
  restringida: boolean;
  categoriasElegibles: string[];        // vacío = sin restricción
  aporteMinimoInicioCop: number | null; // el AMI de CoCrea
  fechaInicioEjecucion: string | null;
}
```

**`Fuente` es opcional y `fuenteId` puede ser `null`.** Este es el corazón de la
corrección de encuadre: el proyecto por defecto tiene ingresos sueltos y ninguna
fuente. Un músico registra *"venta de 40 boletas, 2026-05-10, 1.200.000"* y ya
tiene flujo de caja. Solo quien tiene una convocatoria, un patrocinio con tramos o un
contrato por entregables necesita declarar una `Fuente`, y lo hace porque esa fuente
**tiene reglas que el ingreso suelto no tiene**.

Todos los ingresos sin fuente se tratan como una bolsa implícita llamada `propio`,
sin restricciones de categoría. Eso hace que el caso por defecto no requiera ningún
concepto nuevo del usuario, y que el análisis por bolsa de la v2 siga funcionando sin
casos especiales.

### 5.5 La restricción de uso se evalúa solo si existe

Si una `Fuente` tiene `restringida: true` y `categoriasElegibles` no vacío, un egreso
pagado con esa fuente cuya `category` no esté en la lista es **no elegible**. Se
reporta, con el `id` de la línea y la categoría ofensora. No se bloquea nada y no se
recategoriza nada: el motor informa, el usuario decide.

El hallazgo de la v2 sigue en pie y es la razón de que el análisis corra por bolsa y
no solo en agregado: **el saldo puede estar positivo en total y bloqueado en la
práctica.** Un proyecto con dieciséis millones de una convocatoria destinados a
producción no puede taparse un hueco de otra línea con esa plata, aunque la suma dé
positivo. Un motor de saldo único le diría que está tranquilo.

### 5.6 Las latencias las pone el usuario. El software no las sabe.

La v2 exportaba `LATENCIAS_SUGERIDAS` con siete valores (anticipo 15 días, acta de
inicio 20, entrega 30, informe aprobado 45, ejecución total 45, legalización 60).
**Esa constante se elimina por completo.**

Andrés fue explícito: el software no aloja convocatorias, porque las convocatorias
son públicas. Quien crea el proyecto en la plataforma escribe las condiciones de la
suya, leyéndolas del documento que tiene en la mano.

Y hay una razón más fuerte para no dejar esos números ni como sugerencia: eran
estimaciones mías. Un valor prellenado que el usuario no corrige se convierte en un
dato falso que después alimenta una advertencia de exposición con cifras inventadas.
Para una herramienta cuyo propósito es decirle a alguien cuánta plata propia va a
tener que poner, eso es peor que un campo vacío.

**Lo que sí es nuestro es el vocabulario.** Las siete `CondicionDeIngreso` se quedan,
y son el aporte real de la herramienta en este punto: nombran los siete modos en que
un desembolso puede estar condicionado. Saber que lo tuyo es `contra_ejecucion_total`
y no `contra_entrega` es la diferencia entre entender el 80/20 y descubrirlo tarde.
**El vocabulario es nuestro; los números son del usuario.**

> **Nota para después, no para esta entrega.** Si el usuario registra la latencia que
> su convocatoria prometió y después la fecha en que la plata llegó de verdad, la
> plataforma acumula datos reales sobre cuánto se demora en pagar la financiación
> cultural en Colombia. Eso no lo tiene nadie, es determinista, y no necesita ningún
> modelo. Es candidato fuerte a ser la innovación financiera del producto — y tiene
> preguntas de datos personales y de agregación que hay que resolver antes. Queda
> anotado aquí para que no se pierda.

### 5.7 Mismo día: el ingreso se acredita primero, y la razón de la v2 era falsa

Se mantiene la regla: si un ingreso y un egreso caen el mismo día, el ingreso se
acredita primero.

La v2 justificaba esto llamándolo "el supuesto conservador". **Eso era falso:** es el
supuesto *optimista* — el conservador sería asumir que la plata no alcanzó a estar
disponible. Vale corregir el razonamiento aunque la decisión no cambie, porque un
comentario que dice lo contrario de lo que hace el código es peor que ninguno.

La decisión correcta no es "ser conservador", es **no ser conservador dos veces.** La
incertidumbre de cuándo llega la plata ya está modelada en `latenciaDias`, que es
donde vive de verdad. Si además se asume lo peor dentro del día, la cautela se
compone y el motor produce ventanas de un día en cada coincidencia de fechas. Una
herramienta que avisa todos los días deja de ser leída, y eso es un modo de fallar
tan real como equivocarse en la cifra.

Dicho de otra forma: si la latencia del usuario es correcta, el mismo día significa
que la plata está. La cautela pertenece a la latencia, no al orden intradía.

### 5.8 Qué significa "presupuesto claro"

Esto es nuevo en la v3 y sale directamente de *"para aplicar al ecosistema debe tener
su presupuesto claro"*. El motor devuelve un diagnóstico, no un puntaje:

```ts
export interface ClaridadDelPresupuesto {
  lineasSinFecha: ID[];              // no se pueden ubicar en el tiempo
  lineasSinValor: ID[];              // unitValue o quantity en 0
  lineasSinResponsable: ID[];
  ingresosSinFecha: ID[];
  totalEgresosCop: number;
  totalIngresosCop: number;
  diferenciaCop: number;             // ingresos − egresos
  estaFinanciado: boolean;           // diferenciaCop >= 0
  listoParaPresentar: boolean;
}
```

`listoParaPresentar` es `true` cuando **no hay líneas sin fecha, ni líneas sin valor,
ni ingresos sin fecha** — no exige `estaFinanciado`. La razón importa: un proyecto
que sabe exactamente cuánto cuesta, cuándo, y que le faltan ocho millones **está
listo para presentarse**; es justamente el proyecto que tiene algo concreto que
pedirle al ecosistema. El que no está listo es el que no sabe lo que cuesta.

`lineasSinResponsable` se reporta pero **no afecta** `listoParaPresentar`: importa
para producir, no para presentar.

**Ningún umbral, ningún porcentaje, ninguna nota.** Listas de `id` y dos totales. El
usuario ve qué líneas arreglar, no un número que no puede discutir.

### 5.9 Lo que el motor devuelve

```ts
export interface FlujoDeCaja {
  lineas: ProjectBudgetLine[];
  ingresos: Ingreso[];
  fuentes: Fuente[];
  saldoPropioInicialCop: number;
  toleranciaCop: number;
}

export interface Exposicion {
  desde: string;
  hasta: string;
  dias: number;
  montoMaximoCop: number;
}

export interface AnalisisDeFlujo {
  vista: 'comprometido' | 'aprobado' | 'completo';
  curva: { fecha: string; saldoCop: number }[];
  exposicion: Exposicion | null;          // la peor ventana de la vista
  porBolsa: Record<ID | 'propio', { saldoMinimoCop: number; fecha: string | null }>;
  hayBloqueoPorRestriccion: boolean;
  gastosNoElegibles: { lineaId: ID; categoria: string; fuenteId: ID }[];
  alertasAporteMinimo: { fuenteId: ID; faltanteCop: number; antesDe: string }[];
  claridad: ClaridadDelPresupuesto;
}

export function analizarFlujo(
  flujo: FlujoDeCaja,
  vista?: 'comprometido' | 'aprobado' | 'completo'   // default 'aprobado'
): AnalisisDeFlujo;

export function describirExposicion(analisis: AnalisisDeFlujo): string;
```

`describirExposicion` devuelve una frase en español, sin jerga, para mostrar directo
al usuario. Para el caso 80/20: *"Entre el 20 de junio y el 13 de agosto de 2026 vas
a tener que poner 4.000.000 de tu bolsillo durante 55 días."* Es la frase, no la
gráfica, la que hace entender el problema.

### 5.10 Errores, no correcciones silenciosas

Lanzan `Error` nombrando el `id` y el campo: monto negativo, fecha con formato
inválido, `latenciaDias` negativa, `toleranciaCop` negativa, `fuenteId` de un ingreso
que no existe en `fuentes`, y `aporteMinimoInicioCop` declarado sin
`fechaInicioEjecucion`. **Nada se corrige en silencio.**

Una línea o un ingreso **sin fecha no es un error**: es un dato incompleto que se
reporta en `claridad`. La diferencia importa — un error detiene el cálculo, un dato
incompleto es justamente lo que la herramienta existe para señalar.

## 6. Interfaces y contratos que hay que respetar

- `ProjectBudgetLine` **no se modifica.** Ni un campo. Es el contrato con
  `ProjectToolsPanel`, `projectConsistencyEngine` y `financialAuthorityEngine`.
- `totalDeLinea` en `core/budgetMath.ts` debe producir **exactamente** el mismo número
  que las dos funciones inline que reemplaza, para toda entrada. Los tests existentes
  de `financialAuthorityV24` son la prueba: si pasan sin tocarlos, la extracción es
  fiel.
- `analizarFlujo` es **pura**: no lee el grafo, no lee la fecha de hoy, no tiene
  efectos. Todo lo que necesita entra por parámetro. Es lo que la hace testeable y
  auditable.
- El motor **no escribe nada** en el grafo. Devuelve un análisis; quién lo guarda y
  dónde es problema de la entrega de interfaz.
- `BudgetLineStatus` y su orden semántico (`proposed` < `approved` < `committed` <
  `paid`) se consumen tal como están. No se agrega ningún estado.

## 7. Tests que van a romperse a propósito

**Ninguno.**

La extracción de `totalDeLinea` (5.2) es aritmética idéntica, así que
`tests/financialAuthorityV24.test.ts` y los demás deben seguir verdes **sin
modificarlos**. Eso no es un efecto colateral afortunado: es el criterio que demuestra
que la extracción no cambió ninguna cifra de plata. Si uno de esos tests se rompe, la
extracción está mal y no se arregla el test.

## 8. Criterio de aceptación verificable

1. `npm run typecheck` — sin errores.
2. `npm test` — todos los tests existentes **sin modificar**, más `cashFlow`.
3. `grep -n "subtotal" engines/projectConsistencyEngine.ts engines/financialAuthorityEngine.ts`
   → la fórmula **no** aparece inline en ninguno de los dos; ambos importan de
   `core/budgetMath`.
4. `grep -rn "LATENCIAS_SUGERIDAS" .` (sin `node_modules`) → **sin resultados.**
5. `tests/cashFlow.test.ts` cubre, como mínimo, estos casos:

   **a) El caso por defecto, sin ninguna fuente.** Tres líneas de presupuesto con
   `estimatedDate`, dos ingresos con `fuenteId: null`. Debe producir curva y
   `claridad`, y `porBolsa` debe tener solo la llave `propio`. **Este es el caso más
   importante del test**: es el proyecto que no tiene convocatoria, y es la mayoría.

   **b) El 80/20.** Egresos por 20.000.000 entre marzo y junio de 2026; ingreso
   `anticipo` de 16.000.000 con disparador `2026-03-01` y latencia `15`; ingreso
   `contra_ejecucion_total` de 4.000.000 con disparador `2026-06-30` y latencia `45`.
   Exposición: del `2026-06-20` al `2026-08-13`, `55` días, `4.000.000`.

   **c) Bloqueo por restricción.** Fuente restringida a `['produccion']` con saldo, y
   un egreso de categoría `honorarios` pagado con ella. Agregado positivo,
   `porBolsa.propio` negativo, `hayBloqueoPorRestriccion === true`, y el egreso
   listado en `gastosNoElegibles`.

   **d) Aporte Mínimo de Inicio.** Fuente con `aporteMinimoInicioCop: 3.000.000` y
   `fechaInicioEjecucion: '2026-04-01'`, con solo 1.000.000 disponible antes de esa
   fecha → una alerta con `faltanteCop: 2.000.000`.

   **e) Las tres vistas.** El mismo presupuesto con una línea `proposed` grande:
   `comprometido` sin exposición, `completo` con exposición, `aprobado` en medio. Las
   tres corren sobre los mismos datos y dan resultados distintos.

   **f) Línea sin fecha.** Una línea con `estimatedDate` y `actualDate` vacíos → no
   aparece en la curva, sí aparece en `claridad.lineasSinFecha`, y **no lanza Error**.

   **g) `listoParaPresentar` con déficit.** Todas las líneas con fecha y valor, pero
   `diferenciaCop` negativo → `listoParaPresentar === true` y `estaFinanciado ===
   false`. Este aserto protege la decisión de 5.8 de que faltar plata no descalifica.

   **h) Mismo día.** Ingreso y egreso el mismo día por el mismo monto → sin
   exposición (5.7).

   **i) Zona horaria.** Un disparador el `2026-03-31` con latencia `1` debe dar
   `2026-04-01`. El auditor corre el test con `TZ=America/Bogota` y con `TZ=UTC`: el
   resultado debe ser idéntico.

6. `grep -rn "ProjectBudgetLine" types/project.ts` → la interfaz **no cambió**.
   Comparar el diff: `types/project.ts` solo **agrega** tipos.
7. Lectura del diff: `components/ProjectToolsPanel.tsx` **no aparece.**

## 9. Qué queda determinista y por qué

**Todo, y aquí no es una formalidad: es plata.**

`analizarFlujo` es una función pura. No lee la fecha de hoy — si la leyera, el mismo
proyecto daría análisis distintos según el día en que se abriera, y ninguna
advertencia sería reproducible ni discutible. No hay redondeo propio: los totales
salen de `totalDeLinea`, que es la única fórmula del sistema. No hay umbral oculto:
`toleranciaCop` la pone el usuario y el default es 0.

Las latencias las declara el usuario (5.6) y el motor **nunca** las inventa. Esa es
la decisión que vuelve auditable cada advertencia: si el motor dice que van a faltar
cuatro millones durante 55 días, cada número de esa frase se puede rastrear a un
dato que alguien escribió, no a una estimación del software.

La claridad del presupuesto (5.8) se reporta como listas de `id`, no como puntaje.
Un porcentaje de claridad sería un número que el usuario no puede discutir ni
accionar; una lista de seis líneas sin fecha se arregla.

Las tres vistas (5.3) corren el mismo código con distinto filtro. No hay dos caminos
de cálculo que puedan divergir.

Nada de esto pasa por un modelo de lenguaje, y no es solo una preferencia técnica:
una advertencia de exposición financiera que un modelo pudiera alterar no sería
defendible ante el usuario ni ante quien le exija cuentas.
