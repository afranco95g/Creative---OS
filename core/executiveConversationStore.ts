import {
  ExecutiveConversationIntervention,
  ExecutiveConversationMode,
  ExecutiveConversationSnapshot,
  ExecutiveConversationDeliveryStatus,
} from '../types/executiveConversation';
import {
  executiveConversationRepository,
  ExecutiveConversationProjectState,
  ExecutiveConversationRepositoryState,
} from './repositories/executiveConversationRepository';
import {
  now,
} from './projectEngine';

type ExecutiveConversationListener = (
  snapshot: ExecutiveConversationSnapshot
) => void;

class ExecutiveConversationStore {
  private state: ExecutiveConversationRepositoryState;

  private activeProjectId: string | null = null;

  private listeners: ExecutiveConversationListener[] = [];

  constructor() {
    this.state =
      executiveConversationRepository.load();
  }

  getSnapshot(): ExecutiveConversationSnapshot {
    if (!this.activeProjectId) {
      return createEmptySnapshot();
    }

    const projectState =
      this.getOrCreateProjectState(
        this.activeProjectId
      );

    return {
      projectId: this.activeProjectId,

      mode: projectState.mode,

      currentIntervention:
        projectState.currentIntervention,

      lastDeliveredIntervention:
        projectState.lastDeliveredIntervention,

      pendingInterventions:
        projectState.pendingInterventions,

      interventionHistory:
        projectState.interventionHistory,

      lastUpdatedAt:
        projectState.updatedAt,
    };
  }

  subscribe(
    listener: ExecutiveConversationListener
  ) {
    this.listeners.push(listener);

    return () => {
      this.listeners =
        this.listeners.filter(
          (current) =>
            current !== listener
        );
    };
  }

  setActiveProject(
    projectId: string | null
  ) {
    this.activeProjectId = projectId;

    if (projectId) {
      this.getOrCreateProjectState(
        projectId
      );
    }

    this.notifyListeners();
  }

  setMode(
    projectId: string,
    mode: ExecutiveConversationMode
  ) {
    const projectState =
      this.getOrCreateProjectState(
        projectId
      );

    if (projectState.mode === mode) {
      return;
    }

    this.saveProjectState({
      ...projectState,
      mode,
      updatedAt: now(),
    });
  }

  setCurrentIntervention(
    projectId: string,
    intervention:
      ExecutiveConversationIntervention | null
  ) {
    const projectState =
      this.getOrCreateProjectState(
        projectId
      );

    if (
      interventionsAreEquivalent(
        projectState.currentIntervention,
        intervention
      )
    ) {
      return;
    }

    this.saveProjectState({
      ...projectState,

      currentIntervention:
        intervention,

      updatedAt: now(),
    });
  }

  queueIntervention(
    intervention:
      ExecutiveConversationIntervention
  ) {
    const projectState =
      this.getOrCreateProjectState(
        intervention.projectId
      );

    const alreadyQueued =
      projectState.pendingInterventions.some(
        (current) =>
          interventionsAreEquivalent(
            current,
            intervention
          )
      );

    if (alreadyQueued) {
      return;
    }

    this.saveProjectState({
      ...projectState,

      pendingInterventions: [
        ...projectState.pendingInterventions,
        intervention,
      ],

      updatedAt: now(),
    });
  }

  deliverIntervention(
    interventionId: string
  ): ExecutiveConversationIntervention | null {
    const projectId =
      this.findProjectIdByInterventionId(
        interventionId
      );

    if (!projectId) {
      return null;
    }

    const projectState =
      this.getOrCreateProjectState(
        projectId
      );

    const pendingIntervention =
      projectState.pendingInterventions.find(
        (intervention) =>
          intervention.id === interventionId
      ) ||
      (
        projectState.currentIntervention?.id ===
        interventionId
          ? projectState.currentIntervention
          : null
      );

    if (!pendingIntervention) {
      return null;
    }

    const deliveredIntervention:
      ExecutiveConversationIntervention = {
      ...pendingIntervention,

      deliveryStatus: 'delivered',

      deliveredAt: now(),
    };

    this.saveProjectState({
      ...projectState,

      currentIntervention:
        deliveredIntervention,

      lastDeliveredIntervention:
        deliveredIntervention,

      pendingInterventions:
        projectState.pendingInterventions.filter(
          (intervention) =>
            intervention.id !== interventionId
        ),

      interventionHistory: [
        deliveredIntervention,
        ...projectState.interventionHistory.filter(
          (intervention) =>
            intervention.id !== interventionId
        ),
      ],

      updatedAt: now(),
    });

    return deliveredIntervention;
  }

  updateInterventionStatus(
    interventionId: string,
    deliveryStatus:
      ExecutiveConversationDeliveryStatus,
    outcomeNote?: string
  ): ExecutiveConversationIntervention | null {
    const projectId =
      this.findProjectIdByInterventionId(
        interventionId
      );

    if (!projectId) {
      return null;
    }

    const projectState =
      this.getOrCreateProjectState(
        projectId
      );

    const existingIntervention =
      findIntervention(
        projectState,
        interventionId
      );

    if (!existingIntervention) {
      return null;
    }

    const updatedIntervention:
      ExecutiveConversationIntervention = {
      ...existingIntervention,

      deliveryStatus,

      outcomeNote:
        outcomeNote?.trim(),

      resolvedAt:
        isResolvedStatus(
          deliveryStatus
        )
          ? now()
          : existingIntervention.resolvedAt,
    };

    this.saveProjectState({
      ...projectState,

      currentIntervention:
        projectState.currentIntervention?.id ===
        interventionId
          ? updatedIntervention
          : projectState.currentIntervention,

      lastDeliveredIntervention:
        projectState.lastDeliveredIntervention?.id ===
        interventionId
          ? updatedIntervention
          : projectState.lastDeliveredIntervention,

      pendingInterventions:
        projectState.pendingInterventions.map(
          (intervention) =>
            intervention.id === interventionId
              ? updatedIntervention
              : intervention
        ),

      interventionHistory:
        upsertIntervention(
          projectState.interventionHistory,
          updatedIntervention
        ),

      updatedAt: now(),
    });

    return updatedIntervention;
  }

  suppressIntervention(
    interventionId: string,
    reason?: string
  ) {
    return this.updateInterventionStatus(
      interventionId,
      'suppressed',
      reason
    );
  }

  markInterventionAnswered(
    interventionId: string,
    outcomeNote?: string
  ) {
    return this.updateInterventionStatus(
      interventionId,
      'answered',
      outcomeNote
    );
  }

  markInterventionRedirected(
    interventionId: string,
    outcomeNote?: string
  ) {
    return this.updateInterventionStatus(
      interventionId,
      'redirected',
      outcomeNote
    );
  }

  getProjectState(
    projectId: string
  ): ExecutiveConversationProjectState {
    return this.getOrCreateProjectState(
      projectId
    );
  }

  clearProject(
    projectId: string
  ) {
    const projects = {
      ...this.state.projects,
    };

    delete projects[projectId];

    this.state = {
      projects,
    };

    executiveConversationRepository.save(
      this.state
    );

    if (
      this.activeProjectId === projectId
    ) {
      this.activeProjectId = null;
    }

    this.notifyListeners();
  }

  clearAll() {
    executiveConversationRepository.clear();

    this.state = {
      projects: {},
    };

    this.activeProjectId = null;

    this.notifyListeners();
  }

  private getOrCreateProjectState(
    projectId: string
  ): ExecutiveConversationProjectState {
    const existingState =
      this.state.projects[
        projectId
      ];

    if (existingState) {
      return existingState;
    }

    const newState =
      createProjectState(
        projectId
      );

    this.state = {
      ...this.state,

      projects: {
        ...this.state.projects,
        [projectId]: newState,
      },
    };

    executiveConversationRepository.save(
      this.state
    );

    return newState;
  }

  private saveProjectState(
    projectState:
      ExecutiveConversationProjectState
  ) {
    this.state = {
      ...this.state,

      projects: {
        ...this.state.projects,

        [projectState.projectId]:
          projectState,
      },
    };

    executiveConversationRepository.save(
      this.state
    );

    this.notifyListeners();
  }

  private findProjectIdByInterventionId(
    interventionId: string
  ): string | null {
    for (
      const [
        projectId,
        projectState,
      ] of Object.entries(
        this.state.projects
      )
    ) {
      if (
        findIntervention(
          projectState,
          interventionId
        )
      ) {
        return projectId;
      }
    }

    return null;
  }

  private notifyListeners() {
    const snapshot =
      this.getSnapshot();

    this.listeners.forEach(
      (listener) =>
        listener(snapshot)
    );
  }
}

function createProjectState(
  projectId: string
): ExecutiveConversationProjectState {
  return {
    projectId,

    mode: 'first-session',

    currentIntervention: null,

    lastDeliveredIntervention: null,

    pendingInterventions: [],

    interventionHistory: [],

    updatedAt: now(),
  };
}

function findIntervention(
  projectState:
    ExecutiveConversationProjectState,
  interventionId: string
): ExecutiveConversationIntervention | null {
  if (
    projectState.currentIntervention?.id ===
    interventionId
  ) {
    return projectState.currentIntervention;
  }

  if (
    projectState.lastDeliveredIntervention?.id ===
    interventionId
  ) {
    return projectState.lastDeliveredIntervention;
  }

  return (
    projectState.pendingInterventions.find(
      (intervention) =>
        intervention.id === interventionId
    ) ||
    projectState.interventionHistory.find(
      (intervention) =>
        intervention.id === interventionId
    ) ||
    null
  );
}

function upsertIntervention(
  interventions:
    ExecutiveConversationIntervention[],
  intervention:
    ExecutiveConversationIntervention
): ExecutiveConversationIntervention[] {
  const exists =
    interventions.some(
      (current) =>
        current.id === intervention.id
    );

  if (!exists) {
    return [
      intervention,
      ...interventions,
    ];
  }

  return interventions.map(
    (current) =>
      current.id === intervention.id
        ? intervention
        : current
  );
}

function isResolvedStatus(
  status:
    ExecutiveConversationDeliveryStatus
): boolean {
  return [
    'suppressed',
    'ignored',
    'answered',
    'redirected',
    'partially-resolved',
    'failed',
  ].includes(status);
}

function interventionsAreEquivalent(
  current:
    ExecutiveConversationIntervention | null,
  next:
    ExecutiveConversationIntervention | null
): boolean {
  if (!current && !next) {
    return true;
  }

  if (!current || !next) {
    return false;
  }

  return (
    current.projectId === next.projectId &&
    current.mode === next.mode &&
    current.action === next.action &&
    current.reason === next.reason &&
    current.objective === next.objective &&
    current.message === next.message &&
    current.relatedCuriosityId ===
      next.relatedCuriosityId &&
    current.rationale === next.rationale &&
    current.shouldDeliver ===
      next.shouldDeliver
  );
}

function createEmptySnapshot():
  ExecutiveConversationSnapshot {
  return {
    projectId: null,

    mode: null,

    currentIntervention: null,

    lastDeliveredIntervention: null,

    pendingInterventions: [],

    interventionHistory: [],

    lastUpdatedAt: null,
  };
}

export const executiveConversationStore =
  new ExecutiveConversationStore();