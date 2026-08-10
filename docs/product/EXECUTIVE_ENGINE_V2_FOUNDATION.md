# Executive Engine V2 Foundation

## Alcance

Esta migración añade Executive Engine V2.1 (Project Knowledge Model) y V2.2
(Interpretation + Confirmation) sin reemplazar Executive Engine V1. Los módulos,
parches, scores, stage, tareas, riesgos, decisiones, presupuesto, cronograma y
preguntas V1 continúan operando.

## Arquitectura implementada

Cada `ProjectGraph` puede contener `knowledge`, un estado serializable versionado
con entidades semánticas, solicitudes de confirmación y perfil de tipo/origen del
proyecto. El turno conversacional sigue creando parches V1 y, adicionalmente,
produce conocimiento V2 mediante `interpretProjectMessage`. `mergeProjectKnowledge`
deduplica entidades y conserva cambios como versiones superseded.

```text
message
  -> V1 parsers -> ProjectPatch -> modules/score/stage
  -> V2 interpretation -> entities + confirmations + warnings
  -> semantic merge -> ProjectGraph.knowledge
  -> current-turn summary -> ProducerChat
```

## Project Knowledge Model

`ProjectKnowledgeEntity` soporta hechos, hipótesis, inferencias, necesidades,
oportunidades, restricciones, recursos, decisiones, actividades, dependencias,
contradicciones, riesgos, datos financieros y temporales, actores,
responsabilidades, resultados y aprendizajes.

Cada entidad conserva:

- tipo, clave semántica, etiqueta, valor y valor normalizado;
- estado epistemológico y confianza de 0 a 1;
- procedencia y método de extracción;
- evidencia con la cita original;
- módulos y entidades relacionadas;
- timestamps, confirmación y supersesión.

Los estados disponibles son `detected`, `proposed`, `confirmed`, `validated`,
`contradicted`, `superseded`, `unknown` y `not_applicable`. Una confianza alta no
equivale a confirmación.

## Interpretation Engine

El motor es independiente de UI y acepta conversación, documentos, captura
manual, consultoría o sistema mediante `EvidenceSource`. En este sprint interpreta:

- costo, precio y diferencia preliminar;
- necesidades financieras y operativas;
- fechas con precisión y carácter tentativo;
- audiencia/asistencia, actores y responsabilidades;
- actividades, recursos disponibles y necesidades;
- trayectoria, resultados históricos, presupuesto y tamaño de equipo;
- señales de tipo, drivers y posible incompatibilidad con stage.

Una respuesta puede producir varias entidades. La diferencia entre precio y costo
se registra como inferencia `preliminary_unit_spread`, nunca como utilidad.

## Confirmation Model

`ConfirmationRequest` incluye entidades afectadas, política, intención cognitiva,
pregunta, razón, impacto y estado. Las políticas son captura segura,
proponer/confirmar y confirmación requerida. `resolveConfirmation` actualiza la
solicitud y el estado epistemológico sin borrar historia.

Las intenciones iniciales incluyen `clarify_cost_scope`,
`clarify_date_precision` y `clarify_responsibility`. La aclaración tiene prioridad;
si no existe, continúa `questionEngine` V1.

## Correcciones y deduplicación

La identidad semántica mínima combina tipo, clave y valor normalizado. Repetir el
mismo dato no crea otra entidad. Un valor o alcance distinto para la misma clave
marca la versión anterior como `superseded`, enlaza la nueva mediante `corrects`
y conserva ambas evidencias.

## Relación con V1

Project Knowledge no reemplaza módulos. El mismo turno produce entidades V2 y
parches V1. Los scores y stages actuales siguen siendo compatibles. El estado V2
es opcional y tiene fallback vacío para proyectos existentes.

## Frontera con Executive Memory

- **Project Knowledge:** qué se sabe, propone o infiere sobre el proyecto.
- **Executive Memory:** qué decisión, criterio, contradicción, recomendación o
  aprendizaje merece continuidad ejecutiva.

No se sincronizan automáticamente en este sprint para evitar duplicar autoridad.

## Frontera con Knowledge Engine

Project Knowledge contiene información privada y específica del proyecto.
Knowledge Engine contiene biblioteca, metodología y evidencia externa. La
interpretación puede sugerir una consulta, pero un resultado externo nunca se
convierte automáticamente en hecho del proyecto.

## Persistencia y migración

El conocimiento forma parte de `ProjectGraph`, por lo que usa los mecanismos ya
existentes:

- localStorage del workspace;
- `projects.graph` en Supabase;
- snapshots de recuperación del backend.

Los proyectos V1 sin la propiedad se normalizan con `knowledge` vacío tanto al
cargar almacenamiento local como al mapear proyectos cloud. No hay una segunda
fuente de verdad ni migración manual.

## Observabilidad

En desarrollo, `traceInterpretation` muestra una traza reducida de entidades,
confirmaciones y parches. No se ejecuta en producción. La cita original permanece
en el grafo y debe tratarse como dato potencialmente sensible.

## Limitaciones

- Los extractores son deterministas y todavía cubren una taxonomía lingüística
  limitada.
- No hay resolución completa de confirmaciones desde UI; existe el contrato y la
  función de dominio.
- No se implementan consistencia, dependencias, Review V2, matching, casos ni
  aprendizaje.
- El stage V1 no cambia por `possible_stage_mismatch`.
- No existe extracción documental avanzada; solo está preparado el provenance.
- El tipo detectado no modifica aún módulos, scores ni preguntas globales.

## Siguiente sprint sugerido

V2.3 debería consolidar confirmaciones en la conversación, ampliar correcciones
explícitas, introducir selectores basados en conocimiento para consultas y crear
las primeras reglas de consistencia cruzada sin sustituir todavía Executive Review.

## V2.3: confirmación y consistencia

V2.3 completa el ciclo estructurado de confirmación en `ProducerChat`. Confirmar,
rechazar, corregir o diferir actúan sobre `ProjectGraph` y no se reenvían como
mensajes naturales. Los selectores de conocimiento distinguen entidades activas,
confirmadas y propuestas, además de confirmaciones pendientes o diferidas.

`ProjectGraph.consistency` conserva issues versionados generados por un motor de
dominio independiente de React. Los issues no alteran score, stage, módulos ni
Executive Review V1. La especificación de reglas y ciclo de vida se encuentra en
`EXECUTIVE_ENGINE_V2_CONSISTENCY.md`.
