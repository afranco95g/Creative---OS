import {
  ProjectDecision,
  ProjectEvent,
  ProjectGraph,
  ProjectModuleId,
  ProjectPatch,
  ProjectRisk,
  ProjectTask,
  TeamMember,
} from '../types/project';
import { applyPatch, createId, now } from './projectEngine';
import { compileDocument } from '../engines/documentEngine';

export type ProjectAction =
  | {
      type: 'update_module';
      moduleId: ProjectModuleId;
      value: string;
      evidenceQuote?: string;
      scoreBoost?: number;
    }
  | {
      type: 'create_task';
      title: string;
      description: string;
      moduleId: ProjectModuleId;
      urgency: ProjectTask['urgency'];
      importance: ProjectTask['importance'];
      ownerId?: string;
      dueDate?: string;
    }
  | {
      type: 'record_decision';
      title: string;
      context: string;
      decision: string;
      reason: string;
      relatedModules: ProjectModuleId[];
      alternatives?: string[];
    }
  | {
      type: 'detect_risk';
      title: string;
      riskType: ProjectRisk['type'];
      probability: ProjectRisk['probability'];
      impact: ProjectRisk['impact'];
      mitigationPlan: string;
    }
  | {
      type: 'add_team_member';
      name: string;
      role: string;
      description: string;
      responsibilities: string[];
      email?: string;
    }
  | {
      type: 'compile_document';
      definitionId: string;
    };

export function executeAction(graph: ProjectGraph, action: ProjectAction): ProjectGraph {
  switch (action.type) {
    case 'update_module':
      return updateModule(graph, action);

    case 'create_task':
      return createTask(graph, action);

    case 'record_decision':
      return recordDecision(graph, action);

    case 'detect_risk':
      return detectRisk(graph, action);

    case 'add_team_member':
      return addTeamMember(graph, action);

    case 'compile_document':
      return compileProjectDocument(graph, action.definitionId);

    default:
      return graph;
  }
}

export function executeActions(
  graph: ProjectGraph,
  actions: ProjectAction[]
): ProjectGraph {
  return actions.reduce((currentGraph, action) => {
    return executeAction(currentGraph, action);
  }, graph);
}

function updateModule(
  graph: ProjectGraph,
  action: Extract<ProjectAction, { type: 'update_module' }>
): ProjectGraph {
  const patch: ProjectPatch = {
    id: createId(),
    moduleId: action.moduleId,
    operation: 'strengthen',
    value: action.value,
    evidenceQuote: action.evidenceQuote || action.value,
    scoreBoost: action.scoreBoost || 20,
    source: 'system',
    createdAt: now(),
  };

  return applyPatch(graph, patch);
}

function createTask(
  graph: ProjectGraph,
  action: Extract<ProjectAction, { type: 'create_task' }>
): ProjectGraph {
  const task: ProjectTask = {
    id: createId(),
    title: action.title,
    description: action.description,
    moduleId: action.moduleId,
    urgency: action.urgency,
    importance: action.importance,
    status: 'pending',
    ownerId: action.ownerId,
    dueDate: action.dueDate,
    createdAt: now(),
  };

  const event = createEvent(
    'task_created',
    'Nueva tarea creada',
    `Se creó la tarea: ${task.title}`,
    action.moduleId
  );

  return {
    ...graph,
    tasks: [task, ...graph.tasks],
    eventLog: [event, ...graph.eventLog],
    updatedAt: now(),
  };
}

function recordDecision(
  graph: ProjectGraph,
  action: Extract<ProjectAction, { type: 'record_decision' }>
): ProjectGraph {
  const decision: ProjectDecision = {
    id: createId(),
    title: action.title,
    context: action.context,
    decision: action.decision,
    reason: action.reason,
    alternatives: action.alternatives,
    relatedModules: action.relatedModules,
    createdAt: now(),
  };

  const event = createEvent(
    'decision_recorded',
    'Nueva decisión registrada',
    `Se registró la decisión: ${decision.title}`,
    action.relatedModules[0]
  );

  return {
    ...graph,
    decisions: [decision, ...graph.decisions],
    eventLog: [event, ...graph.eventLog],
    updatedAt: now(),
  };
}

function detectRisk(
  graph: ProjectGraph,
  action: Extract<ProjectAction, { type: 'detect_risk' }>
): ProjectGraph {
  const risk: ProjectRisk = {
    id: createId(),
    title: action.title,
    type: action.riskType,
    probability: action.probability,
    impact: action.impact,
    mitigationPlan: action.mitigationPlan,
    status: 'open',
    createdAt: now(),
  };

  const event = createEvent(
    'risk_detected',
    'Nuevo riesgo detectado',
    `Se detectó el riesgo: ${risk.title}`,
    'risks'
  );

  return {
    ...graph,
    risks: [risk, ...graph.risks],
    eventLog: [event, ...graph.eventLog],
    updatedAt: now(),
  };
}

function addTeamMember(
  graph: ProjectGraph,
  action: Extract<ProjectAction, { type: 'add_team_member' }>
): ProjectGraph {
  const member: TeamMember = {
    id: createId(),
    name: action.name,
    role: action.role,
    description: action.description,
    responsibilities: action.responsibilities,
    email: action.email,
    notificationPreferences: {
      email: Boolean(action.email),
      inApp: true,
    },
  };

  const event = createEvent(
    'module_updated',
    'Nuevo miembro del equipo',
    `Se agregó al equipo: ${member.name} como ${member.role}.`,
    'team'
  );

  return {
    ...graph,
    team: [member, ...graph.team],
    eventLog: [event, ...graph.eventLog],
    updatedAt: now(),
  };
}

function compileProjectDocument(
  graph: ProjectGraph,
  definitionId: string
): ProjectGraph {
  const document = compileDocument(graph, definitionId);

  const event = createEvent(
    'document_compiled',
    'Documento compilado',
    `Se compiló el documento: ${document.title}.`,
    'documents'
  );

  return {
    ...graph,
    documents: [document, ...graph.documents],
    eventLog: [event, ...graph.eventLog],
    updatedAt: now(),
  };
}

function createEvent(
  type: ProjectEvent['type'],
  title: string,
  description: string,
  moduleId?: ProjectModuleId
): ProjectEvent {
  return {
    id: createId(),
    type,
    title,
    description,
    moduleId,
    createdAt: now(),
  };
}