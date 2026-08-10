# Creative OS — Project Tools Audit

> Auditoría de producto y arquitectura basada en el repositorio real. Documento de diagnóstico y propuesta; no implica cambios de código, navegación, componentes ni base de datos.

## 1 Executive Summary

Creative OS ya tiene las piezas de un sistema operativo de proyectos, pero hoy funcionan como tres capas parcialmente superpuestas: módulos narrativos V1, objetos operativos dentro de `ProjectGraph` y tablas operativas de Supabase. Executive Engine V2.1–V2.3 añadió una cuarta capa —Project Knowledge, interpretación, confirmación y consistencia— sin convertirla todavía en autoridad de las herramientas.

El hallazgo principal no es la ausencia de funcionalidades, sino la ausencia de una política explícita de autoridad y sincronización. Presupuesto y calendario tienen dos implementaciones persistentes distintas; documentos y convocatorias compilan módulos V1; tareas, equipo, decisiones y riesgos están tipados pero carecen de superficies operativas completas; métricas de proyecto no existen como producto y el IPP visible usa datos estáticos.

La recomendación es un **Tool System V2** donde:

- Project Knowledge sea la memoria semántica y trazable del proyecto;
- cada herramienta tenga un modelo operativo canónico, no texto compilado;
- los módulos V1 pasen a ser proyecciones narrativas de compatibilidad;
- todo cambio produzca un evento de dominio, actualice/sustituya conocimiento relacionado y ejecute consistencia;
- documentos, Project Home, Executive Review y Producer Chat sean consumidores de esas autoridades;
- la complejidad se revele por etapa, sin crear versiones paralelas de una herramienta.

Prioridad: resolver autoridad y sincronización antes de sofisticar UI. El primer vertical recomendado es Budget V2 porque concentra el mayor riesgo de datos, ya posee modelos ricos y permite validar el patrón bidireccional completo.

## 2 Scope and Method

Se inspeccionaron rutas, componentes, motores, tipos, repositorios locales, coordinación de persistencia y migraciones SQL relacionadas con presupuesto, finanzas, calendario, cronograma, tareas, equipo, necesidades, recursos, documentos, convocatorias, decisiones, riesgos, impacto, métricas, Executive Review, Producer Chat, ProjectGraph, Project Knowledge y consistencia.

La auditoría distingue:

- **CURRENT:** comportamiento comprobado en código.
- **PROBLEM:** riesgo o brecha observada.
- **PROPOSED:** arquitectura o experiencia recomendada.
- **WHY:** valor y motivo.
- **DATA SOURCE:** autoridad actual y propuesta.
- **EXECUTIVE ENGINE RELATION:** vínculo actual y esperado con V2.

No se evaluó calidad visual mediante ejecución del producto ni se modificó implementación alguna.

## 3 Current Navigation and Surface Map

La navegación del proyecto expone Productor Ejecutivo, Proyecto, Herramientas, Executive Review, Bitácora Viva y un acceso separado a Memoria y continuidad. “Herramientas” contiene cuatro pestañas: documentos, presupuesto vivo, cronograma y convocatorias.

| Superficie | CURRENT | PROBLEM | PROPOSED |
|---|---|---|---|
| Productor Ejecutivo | Chat + workspace lateral | Las vistas laterales siguen módulos V1 | Centro conversacional sobre herramientas canónicas |
| Proyecto | Dashboard por áreas derivadas de módulos | No es un Project Home operacional | Home de estado, prioridades y alertas |
| Herramientas | Contenedor mixto de 4 pestañas | Oculta herramientas esenciales y mezcla artefactos con operaciones | Hub agrupado por Planificar, Ejecutar, Financiar, Comunicar y Aprender |
| Executive Review | Resumen de progreso, tareas y riesgos | Reglas y puntuaciones principalmente V1 | Síntesis ejecutiva derivada de datos canónicos y consistencia |
| Bitácora Viva | `graph.eventLog` en la ruta real; existe además un componente demo con datos estáticos | Taxonomía limitada y riesgo de confundir demo con producto | Timeline auditable de eventos de dominio |
| Memoria y continuidad | Memoria ejecutiva, contexto y handoff separados | Otra memoria paralela | Proyección/servicio sobre conocimiento y eventos del proyecto |

## 4 Current Tools Inventory

| Herramienta | UI actual | Fuente de datos | Editable | Persistencia | Relación con Chat | Relación con Project Knowledge | Problemas |
|---|---|---|---|---|---|---|---|
| Documentos | One Pager, Propuesta, Pitch | `ProjectModule.content` | Compilar/exportar; no edición estructurada | Documento compilado en graph | Chat alimenta módulos | Ninguna directa | Oculta 3 definiciones; snapshot, deriva y trazabilidad débiles |
| Presupuesto del participante | Tabla agrupada, filtros, CSV | `graph.tools.budgetLines` | Sí | ProjectGraph local + snapshot Supabase | Sugerencias heurísticas desde texto | Consistency solo lo lee | Modelo limitado; no escribe Knowledge |
| Presupuesto operativo/admin | Gestor financiero | `project_budget_lines` | Sí | Tabla Supabase | Una sugerencia manual desde módulo budget | Ninguna | Segundo SSOT incompatible |
| Cronograma del participante | Lista/timeline con selector day/week/month/quarter, ICS | `graph.tools.scheduleItems` | Sí, parcialmente | ProjectGraph local + Supabase | Resumen del módulo | Ninguna | No es calendario real; campos estructurados ocultos |
| Calendario maestro | Operación transversal | `project_calendar_entries` | Sí en área operativa | Tabla Supabase | Ninguna | Ninguna | Segundo SSOT de fechas |
| Tareas | Resumen en workspace/Executive Review | `graph.tasks` | Sin gestor completo | ProjectGraph | Pueden ser creadas por motores V1 | Ninguna directa | Sin subtareas, dependencias, comentarios ni flujo robusto |
| Equipo | Principalmente módulo narrativo y tipo `graph.team` | Módulo + `TeamMember[]` + perfiles | No hay herramienta completa | ProjectGraph / perfiles separados | Chat puede alimentar módulo | Actors/responsibilities pueden existir en Knowledge | Identidad, acceso, rol y responsabilidad no están reconciliados |
| Necesidades/recursos | Módulo opportunities, señales de ecosistema y Knowledge | Tres fuentes distintas | Parcial/indirecta | Graph + `ecosystem_signals` | Chat sí detecta entidades | Sí, como entidades | No hay vista operativa ni ciclo necesidad→recurso→resolución |
| Convocatorias | Selector de 3 opciones hardcoded y borrador DOC | `graph.tools.grant` + 4 módulos | Parcial | ProjectGraph | Reutiliza texto del chat vía módulos | Ninguna | No usa oportunidades reales ni hace gap analysis completo |
| Aplicaciones | Diálogos/flujo de aplicación | `project_applications.snapshot` | Sí durante aplicación | Tablas Supabase | Snapshot de módulos V1 | Ninguna | Snapshot excluye herramientas y Knowledge |
| Decisiones | Tipo y lista contextual | `graph.decisions` | Sin registro robusto | ProjectGraph | Puede originarse en conversación | Entidad decision también puede existir | Duplicación semántica; sin supersession/aprobación |
| Riesgos | Resumen/lista | `graph.risks` + módulo risks + issues | Limitada | ProjectGraph | Detección V1 | Knowledge/Consistency pueden expresar riesgos | Tres conceptos sin reconciliación ni owner/due date |
| Métricas/KPIs | Módulo KPI; reportes admin/experiencias; IPP demo | Módulos, tablas operativas y datos estáticos | Fragmentada | Varias | Narrativa | Outcomes/learnings pueden existir | No hay registro canónico de indicadores de proyecto |
| Project Home | Áreas y puntuaciones | Módulos V1 | Indirecta | Derivado | Sí, vía módulos | No sustancial | No presenta trabajo, dinero, tiempo ni decisiones reales |
| Executive Review | Cards y plan de acción | Módulos, tasks, risks | Lectura | Derivado | Cercana conceptualmente | Consistency V2 solo parcialmente visible | Reglas hardcoded y falta de evidencia operacional |
| Bitácora | Eventos del graph | `eventLog` | Mayormente automática | ProjectGraph | Sí | No como ledger integral | Tipos de evento insuficientes |

## 5 Data and Persistence Architecture

**CURRENT:** `workspaceRepository` conserva proyectos completos en localStorage; `workspaceStore` gestiona el estado cliente; `persistenceCoordinator` sincroniza graph y mensajes con `projects` en Supabase y crea snapshots. A la vez existen tablas normalizadas para presupuesto, calendario, aplicaciones, oportunidades, financiación, señales e impacto.

**PROBLEM:** almacenar el mismo concepto dentro de JSON y tablas normalizadas permite divergencia silenciosa. La sincronización del graph no reconcilia `project_budget_lines` ni `project_calendar_entries`. Los documentos y application snapshots capturan una fotografía parcial basada en módulos.

**PROPOSED:** separar claramente:

1. **Semantic record:** Project Knowledge.
2. **Operational records:** modelos canónicos por herramienta.
3. **Event ledger:** cambios inmutables y relaciones de supersession.
4. **Narrative projections:** módulos, documentos y resúmenes reconstruibles.
5. **Snapshots:** artefactos versionados, nunca autoridades editables.

**DATA SOURCE:** hoy, múltiples; V2, una autoridad operacional por agregado y Knowledge como memoria semántica relacionada.

**EXECUTIVE ENGINE RELATION:** el motor debe consumir eventos y autoridades, no inferir el estado actual a partir de texto desactualizado.

## 6 Single Source of Truth Assessment

| Concepto | Autoridades actuales | Autoridad V2 propuesta |
|---|---|---|
| Hecho/hipótesis/necesidad | módulo, chat, Knowledge | Project Knowledge entity + evidencias/versiones |
| Línea financiera | `budgetLines`, módulo budget, `project_budget_lines`, financial facts | `ProjectFinancialItem` canónico; Knowledge referencia su ID |
| Fecha/actividad | schedule item, timeline module, task dueDate, calendar entry, timeline fact | `ProjectWorkItem`/`ProjectCalendarEntry` canónico con relaciones |
| Tarea | `graph.tasks`, schedule item tasks, calendar task | `ProjectWorkItem` tipo task |
| Actor/responsable | módulo team, `graph.team`, profiles, actor entities | Party/Profile canónico + ProjectMembership + Responsibility |
| Decisión | módulo, `graph.decisions`, Knowledge decision | Decision record canónico + entidad semántica enlazada |
| Riesgo | módulo, `graph.risks`, Knowledge risk, consistency issue | Risk record; consistency issue es señal, no riesgo duplicado |
| KPI | módulo kpis, outcomes, reports | MetricDefinition + MetricObservation |
| Documento | texto compilado, snapshot, exportación | DocumentDefinition + version inmutable + source references |

Regla: la autoridad no debe ser “ProjectGraph” como contenedor genérico, sino el registro canónico del dominio. ProjectGraph puede seguir siendo una vista agregada/cache durante transición.

## 7 Bidirectional Sync Audit

**CURRENT:** Chat puede modificar módulos y generar entidades de Knowledge. La herramienta de presupuesto modifica `graph.tools.budgetLines`; la de calendario modifica `scheduleItems`. `setTools` convierte ambos en resúmenes de texto en los módulos budget/timeline. No crea entidades, evidencia, confirmaciones ni eventos semánticos V2. BudgetSuggestion escribe en la tabla financiera sin actualizar graph. Admin Budget y calendario maestro tampoco retroalimentan al Productor.

**PROBLEM:** los flujos son unidireccionales:

- Chat → módulos/Knowledge, pero no materialización fiable hacia tools.
- Tool → módulo V1, pero no Knowledge → Producer.
- Tabla Supabase → admin/reportes, pero no ProjectGraph/Knowledge.
- Documento/snapshot ← módulos, sin vínculo vivo con autoridades.

**PROPOSED:** comando → validación → escritura canónica → evento de dominio → proyección Knowledge → supersession → consistency run → invalidación de documentos/resúmenes → notificación semántica al Producer.

**WHY:** evita loops, conserva intención y permite explicar quién cambió qué y por qué.

## 8 Budget Current-State Audit

El modelo en `ProjectGraph` soporta categoría, concepto, cantidad, unidad, valor unitario, IVA, retención, otros impuestos, estado, responsable, proveedor, fechas y fuente. La UI muestra solo parte y usa estados `proposed`, `approved`, `committed`, `paid`.

La tabla `project_budget_lines` es más rica: ingreso/egreso, subcategoría, descripción, tercero, descuento, IVA, retención, ICA, otros impuestos, total calculado, ingreso relacionado, fuente de financiación, fechas, responsable, soportes, factura, centro de costo, notas y estados `estimated`, `quoted`, `approved`, `committed`, `invoiced`, `paid`, `cancelled`, `executed`.

| CURRENT | PROBLEM | PROPOSED | WHY | DATA SOURCE | EXECUTIVE ENGINE RELATION |
|---|---|---|---|---|---|
| Dos modelos financieros | Totales/estados/campos incompatibles | Un agregado financiero canónico | Evitar balances contradictorios | Tabla normalizada evolucionada o servicio equivalente | Financial entities referencian líneas |
| Total calculado en ambos | Fórmulas no idénticas; graph no contempla descuento/ICA | Política de cálculo versionada | Auditoría y exactitud | Motor financiero | Consistency valida cifras y cobertura |
| Estados parciales en UI | No distingue estimado, cotizado, facturado, ejecutado | Máquina de estados explícita | Reflejar madurez y ejecución | Financial item + status history | Cambios relevantes requieren confirmación |
| Solo COP en señales V1 | Herramienta graph no declara moneda | Money `{amount,currency}` | Preparar convocatorias y alianzas | Línea financiera | Knowledge conserva moneda y confianza |

Faltan en la experiencia del participante: ingresos, aportes/contrapartida, saldo por financiar, original vs vigente, documentos de soporte, desviación, periodización y flujo de caja.

## 9 Budget + Executive Engine V2

Para “Necesito contratar 5 artistas y creo que cada uno puede costar $500.000” ya existen piezas de interpretación, confianza, confirmación, financial signals y consistencia equipo-presupuesto. Falta el materializador que convierta una entidad confirmada en una propuesta financiera relacionada y evite duplicados.

Flujo propuesto:

`utterance → interpretation(quantity=5, unitCost=500000, confidence=medium) → Knowledge entity proposed → confirmation → FinancialItem created → entity.sourceRef = financialItemId → consistency evaluation → Producer acknowledgement`.

La confirmación debe mostrar concepto, cantidad, unidad, valor, total, moneda y efecto presupuestal. “Confirmar interpretación” y “aprobar gasto” son actos distintos.

## 10 Reverse Budget Flow

Al editar COP 500.000 → COP 650.000:

1. La UI emite `UpdateFinancialItem` con versión esperada y motivo opcional.
2. El registro canónico guarda la nueva versión y su evento.
3. La entidad semántica anterior se marca `superseded`, no se reescribe sin historia.
4. Se crea/actualiza la entidad vigente con origen `tool`, evidencia y actor.
5. Consistency reevalúa presupuesto, equipo, financiación y documentos afectados.
6. Producer recibe un cambio semántico: “El costo unitario de artistas subió 30%; el total cambia en COP 750.000”.

Se necesita idempotencia, versionado optimista, `sourceRef`, `supersedesId`, actor, timestamp y un outbox/event dispatcher. El módulo budget solo se regenera como proyección.

## 11 Budget V2 Concept

Vista inicial:

- Resumen: Ingresos, Costos, Por financiar, Comprometido, Ejecutado y Pagado.
- Tabla: Concepto, Cantidad, Valor unitario, Total, Estado.
- Acciones primarias: añadir, confirmar propuesta, filtrar, exportar.

Modelo extensible: dirección, categoría/subcategoría, unidad, cantidad, precio unitario, descuento, impuestos/retenciones, total, moneda, fuente, proveedor, actividad, responsable, fechas, periodo, estado, evidencia, notas, centro de costo, contrapartida, original/current/actual, desviación y adjuntos.

No debe ser contabilidad ni presentar estimaciones tributarias como verdad legal. Debe declarar calidad del dato y permitir revisión profesional.

## 12 Budget Progressive Complexity

Una sola herramienta y un solo modelo:

| Nivel | Etapa/uso | Campos visibles por defecto |
|---|---|---|
| Level 1 — Idea | Idea, exploración | Concepto, cantidad, valor estimado, total |
| Level 2 — Project | Estructuración, validación | + categoría, proveedor, responsable, actividad, fecha, financiación |
| Level 3 — Professional | Activación, ejecución, cierre | + impuestos, retenciones, ejecución, contrapartida, cotización, factura, desviación, centro de costo, cash flow |

La elección puede sugerirse por etapa, pero el usuario conserva control. Campos avanzados existentes nunca deben ocultar errores o datos ya diligenciados.

## 13 Living Budget and Variance

Creative OS debe distinguir:

- **Original:** baseline aprobada e inmutable/versionada.
- **Current:** última previsión autorizada.
- **Committed:** obligaciones asumidas.
- **Executed:** bien/servicio efectivamente recibido o causado, según política declarada.
- **Paid:** salida de caja.
- **Variance:** current−original y actual−current, con explicación.

En idea basta “estimado”. En estructuración se introduce current y funding gap. En validación puede congelarse original. En ejecución son indispensables committed/executed/paid. En cierre se conserva baseline, desviación y aprendizaje.

## 14 Schedule and Calendar Current-State Audit

`ProjectScheduleItem` estructura nombre, descripción, inicio/fin, responsable, estado, budget line, documentos, tareas y milestone; la UI solo edita nombre, fechas y estado. Sus vistas day/week/month/quarter cambian el rango de una lista vertical: no existe cuadrícula mensual/semanal.

`ProjectTask` tiene responsable y due date, pero no relación canónica con schedule. `ProjectEvent` es bitácora, no evento de calendario. Timeline facts viven en Knowledge. La tabla `project_calendar_entries` agrega tipos, timestamps, visibilidad, responsable, estado y relación financiera, pero es independiente del calendario del participante.

**PROBLEM:** una misma fecha puede existir cinco veces y cambiar sin propagación. Estados (`in_progress/done/blocked` vs `confirmed/completed/overdue`) y granularidad (`date` vs `timestamptz`) difieren.

## 15 Calendar V2 Concept

Vistas iniciales reales:

- **Mes:** cuadrícula de 7 columnas, celdas por fecha, overflow accesible y eventos multiday.
- **Semana:** columnas por día y eje horario cuando aplique.
- **Agenda:** lista cronológica compacta y adecuada para móvil.
- Navegación persistente: anterior, Hoy, siguiente; rango y zona horaria visibles.

Timeline/Gantt se añade cuando existan dependencias y planificación suficiente, no como cambio cosmético. Los items deben incluir tipo, rango, all-day/time, responsable, estado, milestone, dependencias, actividad, presupuesto y evidencia.

## 16 Tasks, Activities, Dependencies and Milestones

**CURRENT:** tareas y schedule items son colecciones separadas; `scheduleItems.tasks` anida tareas potencialmente duplicadas; dependencias existen como conceptos de Knowledge pero no como grafo operacional.

**PROPOSED:** un `ProjectWorkItem` canónico con `type: activity|task|milestone|deadline`, parent, assignees, start/due/end, status, priority, dependencies y relaciones a budget/documents. Calendario, lista y Gantt son vistas del mismo agregado.

**WHY:** una tarea con fecha aparece automáticamente en agenda; una actividad no necesita duplicarse para mostrarse en timeline.

**EXECUTIVE ENGINE RELATION:** actividades y dependencias interpretadas se proponen como work items; cambios desde la herramienta actualizan Knowledge y consistencia temporal.

## 17 Needs and Resources Audit

**CURRENT:** necesidades y recursos pueden existir como entidades V2; el módulo opportunities concentra texto; `ecosystem_signals` recibe señales manuales con consentimiento y deliberadamente no copia conversación, presupuesto, tareas ni riesgos.

**PROBLEM:** no hay una herramienta que permita clasificar, priorizar, asignar owner, vincular un recurso, registrar estado o medir resolución. Publicar una señal y resolver una necesidad son flujos separados.

**PROPOSED:** vista “Necesidades y recursos” sobre Knowledge, con estado `identified|validated|seeking|matched|resolved|dismissed`, prioridad, fecha, owner, restricciones, recursos relacionados y consentimiento explícito para compartir al ecosistema.

**DATA SOURCE:** Knowledge es autoridad semántica; la publicación en `ecosystem_signals` es una proyección consentida, revocable y minimizada.

## 18 Team and Responsibilities Audit

**CURRENT:** hay módulo team, `TeamMember[]`, perfiles/actores del ecosistema y entidades actor/responsibility en Knowledge. `ownerId`/`responsible` aparecen en tareas, calendario y presupuesto con tipos distintos.

**PROBLEM:** una persona escrita en narrativa no equivale a una identidad con acceso; no existe matriz RACI, invitación, disponibilidad ni reconciliación de nombres. El responsable puede quedar como string, graph ID o profile UUID.

**PROPOSED:** separar `Party` (persona/organización), `ProjectMembership` (acceso/rol) y `ResponsibilityAssignment` (responsabilidad sobre objeto). Permitir integrantes no invitados y vincularlos después sin perder historia.

**EXECUTIVE ENGINE RELATION:** el motor propone actores/responsabilidades; la confirmación crea o enlaza registros. Consistency detecta actividades críticas sin owner y carga incompatible.

## 19 Decisions and Risks Audit

### Decisiones

**CURRENT:** `ProjectDecision` conserva contexto, decisión, razón, alternativas y módulos; Knowledge también soporta decisiones.

**PROBLEM:** no hay interfaz de decision log madura, estado, responsable, fecha efectiva, aprobación, impacto ni supersession.

**PROPOSED:** Decision Record canónico con `proposed|confirmed|reversed|superseded`, alternativas, rationale, evidence, approvers, effectiveAt y objetos afectados.

### Riesgos

**CURRENT:** `ProjectRisk` tiene tipo, probabilidad, impacto, mitigación y estado; además existen módulo risks, entidades Knowledge e issues de consistencia.

**PROBLEM:** no hay owner, due date, triggers, residual risk ni vínculo con mitigación/tarea. Un consistency issue no debe convertirse automáticamente en riesgo.

**PROPOSED:** Risk Register canónico; una inconsistencia puede **proponer** un riesgo o actualizar evidencia tras confirmación. Score y severidad deben ser explicables, no solo etiquetas low/medium/high.

## 20 Documents, One Pager, Proposal and Pitch

**CURRENT:** `documentEngine` define One Pager, Propuesta, Aplicación a convocatoria, Cronograma, Presupuesto y Pitch, pero la UI solo muestra tres. Compila `ProjectModule.content` y calcula readiness según módulos con score ≥55.

**PROBLEM:** readiness de módulo no garantiza requisitos del documento; el documento no sabe qué dato canónico originó cada párrafo; presupuesto y cronograma pueden quedar obsoletos; no hay versionado de plantilla, audiencia, revisión ni invalidación dirigida.

**PROPOSED:** cada documento es una vista versionada con template, audience, field requirements, source references, generatedAt, stale reasons, human edits y approval. Texto libre puede ser override explícito; cifras y fechas se insertan desde autoridades.

**EXECUTIVE ENGINE RELATION:** Producer ayuda a resolver gaps; Consistency bloquea o advierte contradicciones antes de exportar.

## 21 Grants and Applications Audit

**CURRENT:** GrantAssistant contiene tres convocatorias hardcoded, evalúa cuatro módulos y exporta DOC. En paralelo existen tablas y flujos reales de funding opportunities/applications. Los application snapshots se forman con módulos V1 y omiten budget lines, schedule, tasks, team records, decisions, risks, Knowledge y consistency.

**PROBLEM:** la herramienta visible no usa el catálogo real; “preparación automática” es solo 4/4 campos; una aplicación puede congelar datos distintos de las herramientas.

**PROPOSED:** Grant Workspace conectado a oportunidad real, esquema de requisitos versionado, mapping requisito→fuentes, gap analysis, elegibilidad, checklist de adjuntos, snapshot transaccional y diff contra proyecto vivo. Una aplicación enviada permanece inmutable; cambios posteriores se muestran como diferencias, no se sobreescriben.

## 22 Metrics, Impact and Learning Audit

**CURRENT:** existen módulos impact/kpis, entidades outcomes/learnings, reportes estructurados de experiencias, métricas admin y un `IppPanel` basado en `lib/data` estático. No hay herramienta de métricas de proyecto dentro del workspace.

**PROBLEM:** objetivo, indicador, observación y reporte se mezclan como texto. Las métricas operativas de experiencias no retroalimentan automáticamente el proyecto. IPP puede parecer una medición real sin provenance dinámica.

**PROPOSED:**

- `MetricDefinition`: nombre, objetivo relacionado, fórmula/unidad, baseline, target, frecuencia, owner, fuente.
- `MetricObservation`: periodo, valor, calidad, evidencia y capturador.
- `Outcome` y `Learning`: conclusiones enlazadas, no sustitutos de medición.

Executive Review debe declarar confirmado/estimado/faltante y nunca sintetizar precisión no respaldada.

## 23 Project Home and Executive Review

**CURRENT:** Project Dashboard agrega scores de módulos en siete áreas. Executive Review combina construcción, etapa, tareas, riesgos, módulos fuertes/débiles y un plan de acción con reglas simples.

**PROBLEM:** la salud narrativa domina sobre salud operativa. Un proyecto puede puntuar alto con presupuesto divergente, tareas vencidas o financiación incompleta.

**PROPOSED:** Project Home por capas:

1. Ahora: siguiente decisión/acción y alertas críticas.
2. Estado: tiempo, dinero, equipo, riesgos, financiación y requisitos.
3. Progreso: outcomes, documentos y readiness explicable.
4. Actividad: cambios recientes y confirmaciones pendientes.

Executive Review debe ser una lectura ejecutiva del mismo modelo: qué cambió, qué requiere decisión, qué amenaza objetivos, escenarios y evidencia. No una segunda base de datos.

## 24 Tool System V2 Architecture

```text
Producer Chat / Tool UI / Imports / Admin Operations
                    ↓ commands
            Domain Application Layer
                    ↓
  Knowledge | Finance | Work | Team | Decisions | Risks | Metrics
                    ↓ domain events
          Projection & Consistency Pipeline
         ↙          ↓             ↘
 Project Knowledge  Modules V1   Search/Executive Memory
         ↓          ↓             ↓
 Home / Review / Documents / Grants / Notifications / Ecosystem
```

Principios:

- autoridades por dominio y referencias estables;
- eventos idempotentes y versionados;
- Knowledge conserva significado, evidencia, confianza y supersession;
- herramientas conservan estado operacional y reglas;
- proyecciones son reconstruibles;
- confirmación se aplica según impacto, no a cada edición;
- consistencia es un servicio transversal y explicable;
- compatibilidad V1 mediante proyecciones durante migración.

## 25 Responsive and Accessibility Strategy

Desktop debe favorecer comparación, edición en tabla y paneles contextuales. Tablet usa columnas colapsables. Móvil prioriza resumen y agenda, con cada fila como tarjeta editable; las tablas anchas no deben depender solo de scroll horizontal.

Requisitos transversales:

- navegación por teclado, foco visible y targets táctiles;
- labels y errores asociados; no depender del color;
- money/dates localizados, moneda y zona horaria explícitas;
- acciones destructivas confirmadas y undo cuando proceda;
- estados offline/sync/conflict visibles;
- densidad seleccionable y columnas configurables en niveles avanzados;
- formularios por pasos en móvil, con resumen antes de confirmar.

## 26 Prioritized Roadmap (P0–P3)

### P0 — Authority and safety

- Decidir el registro canónico de budget y calendar; congelar nuevas duplicaciones.
- Definir IDs, source references, versioning, supersession y domain events.
- Crear matriz de migración graph↔tables y reconciliación/detección de conflictos.
- Definir status taxonomies financieras y de trabajo.
- Instrumentar contratos de sincronización Chat↔Tool↔Knowledge↔Producer.

### P1 — Core operational verticals

- Budget V2 vertical completo con progressive disclosure.
- Work/Calendar V2 con mes, semana y agenda reales.
- Tasks unificadas con actividades/milestones/dependencies.
- Project Home operativo y consistency notifications.

### P2 — Coordination and external readiness

- Team/responsibilities, Decision Log y Risk Register.
- Needs/resources y publicación consentida al ecosistema.
- Document pipeline con provenance/versioning.
- Grant Workspace conectado a oportunidades y snapshots completos.

### P3 — Measurement and professional depth

- Metrics/outcomes/learnings y conexión con experiencias.
- Gantt, cash flow, escenarios, variance y centros de costo.
- Integraciones externas y automatizaciones solo después del SSOT.
- Deprecación final de escrituras V1 y eliminación de modelos paralelos.

Dependencias: contrato de identidad/roles, estrategia offline, políticas RLS, migración de datos, observabilidad y definición contable/productiva. Riesgos: pérdida de datos en reconciliación, loops de sync, cambios semánticos de estados, falsas confirmaciones, snapshots legales alterados y aumento prematuro de complejidad.

## 27 Recommended First Implementation Sprint

Objetivo del primer sprint: **probar el patrón de autoridad bidireccional con Budget V2 sin rediseñar todo el producto**.

Entregables recomendados:

1. Architecture Decision Record: autoridad financiera, límites de ProjectGraph y política de compatibilidad.
2. Esquema de mapeo campo-a-campo entre `BudgetLine` y `project_budget_lines`, incluyendo estados y fórmula.
3. Detector read-only de divergencias por proyecto y reporte de migración; no auto-merge.
4. Contratos `Create/UpdateFinancialItem`, domain event y vínculo `KnowledgeEntity.sourceRef`.
5. Reglas de supersession y reejecución de consistency para cambios de cantidad/valor/estado.
6. Prototipo de interacción Level 1/2/3 y especificación responsive/accesible.
7. Casos de aceptación end-to-end:
   - chat propone 5 × COP 500.000;
   - usuario confirma y aparece una sola línea;
   - edición a COP 650.000 sustituye el hecho anterior;
   - consistency recalcula y Producer explica el cambio;
   - documento/presupuesto marcado stale se regenera desde la autoridad;
   - reintento no duplica líneas;
   - conflicto concurrente se muestra y no pierde datos.
8. Plan reversible de migración y feature flag antes de escritura dual.

No incluir todavía contabilidad avanzada, Gantt, integraciones externas ni rediseño total de navegación. El criterio de salida es demostrar una única cifra financiera vigente, trazable desde conversación y herramienta, conocida por Executive Engine y reproducible en documentos.

