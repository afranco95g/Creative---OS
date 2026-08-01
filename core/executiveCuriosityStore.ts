import {
  CreateExecutiveCuriosityInput,
  ExecutiveConversationState,
  ExecutiveCuriosityItem,
  ExecutiveCuriosityScore,
  ExecutiveCuriositySnapshot,
  ExecutiveCuriosityStatus,
  ExecutiveIntervention,
  ExecutiveInterventionType,
  UpdateExecutiveCuriosityInput,
} from '../types/executiveCuriosity';
import {
  executiveCuriosityRepository,
  ExecutiveCuriosityRepositoryState,
} from './repositories/executiveCuriosityRepository';
import {
  createId,
  now,
} from './projectEngine';

type ExecutiveCuriosityListener = (
  snapshot: ExecutiveCuriositySnapshot
) => void;

class ExecutiveCuriosityStore {
  private state: ExecutiveCuriosityRepositoryState;

  private activeProjectId: string | null = null;

  private listeners: ExecutiveCuriosityListener[] = [];

  constructor() {
    this.state =
      executiveCuriosityRepository.load();
  }

  getSnapshot(): ExecutiveCuriositySnapshot {
    if (!this.activeProjectId) {
      return createEmptySnapshot();
    }

    const conversationState =
      this.getOrCreateConversationState(
        this.activeProjectId
      );

    const curiosities =
      conversationState.curiosities;

    return {
      projectId: this.activeProjectId,

      curiosities,

      activeCuriosities:
        curiosities.filter(
          (curiosity) =>
            curiosity.status === 'active' ||
            curiosity.status ===
              'partially-resolved'
        ),

      urgentCuriosities:
        curiosities.filter(
          (curiosity) =>
            curiosity.status === 'urgent'
        ),

      resolvedCuriosities:
        curiosities.filter(
          (curiosity) =>
            curiosity.status === 'resolved'
        ),

      suspendedCuriosities:
        curiosities.filter(
          (curiosity) =>
            curiosity.status === 'suspended'
        ),

      nextBestIntervention:
        conversationState.understanding
          .nextBestIntervention || null,

      lastUpdatedAt:
        conversationState.updatedAt || null,
    };
  }

  subscribe(
    listener: ExecutiveCuriosityListener
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
      this.getOrCreateConversationState(
        projectId
      );
    }

    this.notifyListeners();
  }

  createCuriosity(
    input: CreateExecutiveCuriosityInput
  ): ExecutiveCuriosityItem {
    const timestamp = now();

    const curiosity:
      ExecutiveCuriosityItem = {
      id: createId(),

      projectId: input.projectId,

      type: input.type,

      topic: input.topic.trim(),

      reason: input.reason.trim(),

      status:
        input.status || 'latent',

      priority:
        normalizeScore(
          input.priority ?? 0.5
        ),

      confidence:
        normalizeScore(
          input.confidence ?? 0.5
        ),

      score:
        createDefaultScore(),

      evidence:
        input.evidence || [],

      possibleInterventions:
        input.possibleInterventions ||
        ['ask', 'deepen', 'confirm'],

      suggestedPrompt:
        input.suggestedPrompt?.trim(),

      askedCount: 0,

      createdAt: timestamp,

      updatedAt: timestamp,
    };

    const conversationState =
      this.getOrCreateConversationState(
        input.projectId
      );

    const updatedConversationState:
      ExecutiveConversationState = {
      ...conversationState,

      curiosities: [
        curiosity,
        ...conversationState.curiosities,
      ],

      updatedAt: timestamp,
    };

    this.saveConversationState(
      updatedConversationState
    );

    return curiosity;
  }

  updateCuriosity(
    curiosityId: string,
    updates: UpdateExecutiveCuriosityInput
  ): ExecutiveCuriosityItem | null {
    const projectId =
      this.findProjectIdByCuriosityId(
        curiosityId
      );

    if (!projectId) {
      return null;
    }

    const conversationState =
      this.getOrCreateConversationState(
        projectId
      );

    const existingCuriosity =
      conversationState.curiosities.find(
        (curiosity) =>
          curiosity.id === curiosityId
      );

    if (!existingCuriosity) {
      return null;
    }

    const updatedCuriosity:
      ExecutiveCuriosityItem = {
      ...existingCuriosity,
      ...updates,

      topic:
        updates.topic !== undefined
          ? updates.topic.trim()
          : existingCuriosity.topic,

      reason:
        updates.reason !== undefined
          ? updates.reason.trim()
          : existingCuriosity.reason,

      priority:
        updates.priority !== undefined
          ? normalizeScore(
              updates.priority
            )
          : existingCuriosity.priority,

      confidence:
        updates.confidence !== undefined
          ? normalizeScore(
              updates.confidence
            )
          : existingCuriosity.confidence,

      suggestedPrompt:
        updates.suggestedPrompt !==
        undefined
          ? updates.suggestedPrompt.trim()
          : existingCuriosity
              .suggestedPrompt,

      updatedAt: now(),
    };

    const updatedConversationState:
      ExecutiveConversationState = {
      ...conversationState,

      curiosities:
        conversationState.curiosities.map(
          (curiosity) =>
            curiosity.id === curiosityId
              ? updatedCuriosity
              : curiosity
        ),

      updatedAt: now(),
    };

    this.saveConversationState(
      updatedConversationState
    );

    return updatedCuriosity;
  }

  setCuriosityStatus(
    curiosityId: string,
    status: ExecutiveCuriosityStatus
  ) {
    const updates:
      UpdateExecutiveCuriosityInput = {
      status,
    };

    if (status === 'resolved') {
      updates.resolvedAt = now();
    }

    return this.updateCuriosity(
      curiosityId,
      updates
    );
  }

  markCuriosityAsked(
    curiosityId: string,
    interventionType:
      ExecutiveInterventionType = 'ask'
  ) {
    const projectId =
      this.findProjectIdByCuriosityId(
        curiosityId
      );

    if (!projectId) {
      return null;
    }

    const conversationState =
      this.getOrCreateConversationState(
        projectId
      );

    const curiosity =
      conversationState.curiosities.find(
        (item) =>
          item.id === curiosityId
      );

    if (!curiosity) {
      return null;
    }

    const timestamp = now();

    const intervention:
      ExecutiveIntervention = {
      id: createId(),

      projectId,

      type: interventionType,

      objective:
        `Comprender mejor: ${curiosity.topic}`,

      message:
        curiosity.suggestedPrompt,

      curiosityId,

      rationale:
        curiosity.reason,

      confidence:
        curiosity.confidence,

      createdAt: timestamp,

      deliveredAt: timestamp,

      outcome: 'unknown',
    };

    this.updateCuriosity(
      curiosityId,
      {
        currentIntervention:
          interventionType,

        lastAskedAt: timestamp,

        askedCount:
          curiosity.askedCount + 1,

        status:
          curiosity.status === 'latent'
            ? 'active'
            : curiosity.status,
      }
    );

    this.updateConversationUnderstanding(
      projectId,
      {
        lastIntervention:
          intervention,
      }
    );

    return intervention;
  }

  setNextBestIntervention(
  projectId: string,
  intervention:
    ExecutiveIntervention | null
) {
  const conversationState =
    this.getOrCreateConversationState(
      projectId
    );

  const currentIntervention =
    conversationState.understanding
      .nextBestIntervention;

  if (
    interventionsAreEquivalent(
      currentIntervention,
      intervention
    )
  ) {
    return;
  }

  this.updateConversationUnderstanding(
    projectId,
    {
      nextBestIntervention:
        intervention || undefined,
    }
  );
}

  updateConversationUnderstanding(
    projectId: string,
    updates: Partial<
      ExecutiveConversationState['understanding']
    >
  ) {
    const conversationState =
      this.getOrCreateConversationState(
        projectId
      );

    const updatedConversationState:
      ExecutiveConversationState = {
      ...conversationState,

      understanding: {
        ...conversationState.understanding,
        ...updates,
      },

      updatedAt: now(),
    };

    this.saveConversationState(
      updatedConversationState
    );
  }

  updateSessionState(
    projectId: string,
    updates: Pick<
      ExecutiveConversationState,
      | 'lastUserMessageAt'
      | 'lastSystemMessageAt'
      | 'sessionStartedAt'
      | 'sessionEndedAt'
    >
  ) {
    const conversationState =
      this.getOrCreateConversationState(
        projectId
      );

    const updatedConversationState:
      ExecutiveConversationState = {
      ...conversationState,
      ...updates,
      updatedAt: now(),
    };

    this.saveConversationState(
      updatedConversationState
    );
  }

  getConversationState(
    projectId: string
  ): ExecutiveConversationState {
    return this.getOrCreateConversationState(
      projectId
    );
  }

  getProjectCuriosities(
    projectId: string
  ): ExecutiveCuriosityItem[] {
    return this.getOrCreateConversationState(
      projectId
    ).curiosities;
  }

  clearProject(
    projectId: string
  ) {
    const conversations = {
      ...this.state.conversations,
    };

    delete conversations[projectId];

    this.state = {
      conversations,
    };

    executiveCuriosityRepository.save(
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
    executiveCuriosityRepository.clear();

    this.state = {
      conversations: {},
    };

    this.activeProjectId = null;

    this.notifyListeners();
  }

  private getOrCreateConversationState(
    projectId: string
  ): ExecutiveConversationState {
    const existingState =
      this.state.conversations[
        projectId
      ];

    if (existingState) {
      return existingState;
    }

    const newState =
      createConversationState(
        projectId
      );

    this.state = {
      ...this.state,

      conversations: {
        ...this.state.conversations,
        [projectId]: newState,
      },
    };

    executiveCuriosityRepository.save(
      this.state
    );

    return newState;
  }

  private saveConversationState(
    conversationState:
      ExecutiveConversationState
  ) {
    this.state = {
      ...this.state,

      conversations: {
        ...this.state.conversations,

        [conversationState.projectId]:
          conversationState,
      },
    };

    executiveCuriosityRepository.save(
      this.state
    );

    this.notifyListeners();
  }

  private findProjectIdByCuriosityId(
    curiosityId: string
  ): string | null {
    for (
      const [
        projectId,
        conversationState,
      ] of Object.entries(
        this.state.conversations
      )
    ) {
      const curiosityExists =
        conversationState.curiosities.some(
          (curiosity) =>
            curiosity.id ===
            curiosityId
        );

      if (curiosityExists) {
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

function createConversationState(
  projectId: string
): ExecutiveConversationState {
  const timestamp = now();

  return {
    projectId,

    understanding: {
      understoodTopics: [],

      partiallyUnderstoodTopics: [],

      unresolvedTopics: [],

      activeHypotheses: [],
    },

    curiosities: [],

    activeCuriosityIds: [],

    urgentCuriosityIds: [],

    resolvedCuriosityIds: [],

    suspendedCuriosityIds: [],

    updatedAt: timestamp,
  };
}

function createDefaultScore():
  ExecutiveCuriosityScore {
  return {
    impact: 0.5,
    urgency: 0.5,
    uncertaintyReduction: 0.5,
    unblockPotential: 0.5,
    cognitiveCost: 0.5,
    interruptionRisk: 0.5,
    total: 0.5,
  };
}

function normalizeScore(
  value: number
): number {
  return Math.max(
    0,
    Math.min(1, value)
  );
}

function createEmptySnapshot():
  ExecutiveCuriositySnapshot {
  return {
    projectId: null,

    curiosities: [],

    activeCuriosities: [],

    urgentCuriosities: [],

    resolvedCuriosities: [],

    suspendedCuriosities: [],

    nextBestIntervention: null,

    lastUpdatedAt: null,
  };
}

function interventionsAreEquivalent(
  current:
    ExecutiveIntervention | undefined,
  next:
    ExecutiveIntervention | null
): boolean {
  if (!current && !next) {
    return true;
  }

  if (!current || !next) {
    return false;
  }

  return (
    current.projectId === next.projectId &&
    current.type === next.type &&
    current.curiosityId ===
      next.curiosityId &&
    current.objective ===
      next.objective &&
    current.message === next.message &&
    current.rationale ===
      next.rationale
  );
}

export const executiveCuriosityStore =
  new ExecutiveCuriosityStore();