# Spec: motor de dependencias objetivo -> actividad -> presupuesto -> cronograma

## 1. Objetivo
Permitir vincular, de forma opcional y estructurada, actividades y
objetivos con lineas de presupuesto y elementos de cronograma, sin tocar
los modulos de texto libre specificObjectives/activities que existen hoy,
y sin tocar ProjectBudgetLine.

## 2. Por que ahora
La version original (tu Prompt 2) pedia una relacion tipo clave foranea
entre specificObjectives/activities y LivingBudget/ProjectCalendar. Esos
modulos son texto libre, no listas de entidades. Esta spec resuelve el
mismo problema con listas estructuradas nuevas y paralelas, opcionales.
Version corregida de esta misma spec: la primera version proponia agregar
activityId a ProjectBudgetLine, lo cual viola el contrato bloqueado en
specs/flujo-de-caja-con-condiciones.md seccion 6 ("ProjectBudgetLine no se
modifica, ni un campo"). Se corrige usando una tabla de enlace separada en
vez de tocar esa interfaz.

## 3. Archivos
- types/project.ts: nuevas interfaces ProjectObjective, ProjectActivity y
  ProjectActivityBudgetLink. Agregar activityId: ID | null a
  ProjectScheduleItem unicamente (ProjectBudgetLine NO se toca). Extender
  ProjectTools con objectives, activities y activityBudgetLinks.
- core/projectEngine.ts: inicializar objectives, activities y
  activityBudgetLinks como arreglos vacios por defecto.
- engines/projectDependencyEngine.ts (nuevo): funcion pura
  checkDependencyConsistency.
- components/ProjectToolsPanel.tsx: UI minima para crear objetivos y
  actividades, y para vincular una linea de presupuesto o un item de
  cronograma a una actividad.
- tests/projectDependencyEngine.test.ts (nuevo).

## 4. Fuera de alcance
- Modificar ProjectBudgetLine de cualquier forma — bloqueado por contrato
  previo (flujo-de-caja-con-condiciones.md seccion 6).
- Parsear specificObjectives/activities con regex o NLP.
- Vista Gantt, drag and drop, permisos por rol.
- Bloquear la creacion de una linea de presupuesto o item de cronograma
  sin vinculo — el vinculo siempre es opcional.

## 5. Decisiones ya tomadas

    export interface ProjectObjective {
      id: ID;
      title: string;
      description: string;
      createdAt: string;
    }

    export interface ProjectActivity {
      id: ID;
      objectiveId: ID | null;
      title: string;
      description: string;
      createdAt: string;
    }

    export interface ProjectActivityBudgetLink {
      id: ID;
      activityId: ID;
      budgetLineId: ID;
    }

    export interface DependencyFinding {
      id: ID;
      type: 'orphan_budget_link' | 'orphan_schedule_item' | 'activity_without_link';
      message: string;
      relatedId: ID;
    }

ProjectScheduleItem gana activityId: ID | null (nunca obligatorio). El
vinculo entre actividad y linea de presupuesto vive exclusivamente en
activityBudgetLinks, nunca dentro de ProjectBudgetLine.
checkDependencyConsistency solo informa, no bloquea nada:
- orphan_budget_link: una entrada de activityBudgetLinks cuyo activityId
  o budgetLineId no existe en tools.activities / tools.budgetLines.
- orphan_schedule_item: un ProjectScheduleItem con activityId que no
  existe en tools.activities.
- activity_without_link: una ProjectActivity que no aparece en ningun
  activityBudgetLinks ni en el activityId de ningun ProjectScheduleItem.

## 6. Interfaces y contratos
Los cuatro tipos de la seccion 5, mas:

    export function checkDependencyConsistency(
      tools: ProjectTools
    ): DependencyFinding[];

Determinista, sin IA, sin llamadas externas. ProjectBudgetLine se lee
tal cual esta hoy, sin ninguna modificacion a su forma.

## 7. Tests que van a romperse a proposito
Ninguno existente. Es aditivo. ProjectBudgetLine queda byte-identico.

## 8. Criterio de aceptacion verificable
1. npm run typecheck sin errores.
2. npm test todo verde, sin modificar ningun test existente.
3. Una entrada de activityBudgetLinks con budgetLineId inexistente
   produce exactamente un DependencyFinding tipo orphan_budget_link.
4. Un ProjectScheduleItem con activityId inexistente produce exactamente
   un DependencyFinding tipo orphan_schedule_item.
5. Una ProjectActivity sin ningun link ni schedule item que la referencie
   produce un DependencyFinding tipo activity_without_link.
6. Un proyecto con objectives, activities y activityBudgetLinks vacios no
   produce ningun finding.
7. grep en types/project.ts confirma que la interfaz ProjectBudgetLine no
   cambio ninguna linea respecto a la version anterior al ultimo commit.

## 9. Que queda deterministico y por que
Todo: comparacion de ids contra arreglos, cero inferencia. El vinculo via
tabla externa, en vez de campo directo, es lo que permite tocar esto sin
romper el contrato ya auditado de flujo de caja.
