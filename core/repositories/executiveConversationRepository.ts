import {
  ExecutiveConversationIntervention,
  ExecutiveConversationMode,
} from '../../types/executiveConversation';

const STORAGE_KEY =
  'creative-os-executive-conversation-v1';

export interface ExecutiveConversationProjectState {
  projectId: string;

  mode: ExecutiveConversationMode;

  currentIntervention:
    ExecutiveConversationIntervention | null;

  lastDeliveredIntervention:
    ExecutiveConversationIntervention | null;

  pendingInterventions:
    ExecutiveConversationIntervention[];

  interventionHistory:
    ExecutiveConversationIntervention[];

  updatedAt: string;
}

export interface ExecutiveConversationRepositoryState {
  projects: Record<
    string,
    ExecutiveConversationProjectState
  >;
}

export interface ExecutiveConversationRepository {
  load(): ExecutiveConversationRepositoryState;

  save(
    state: ExecutiveConversationRepositoryState
  ): void;

  clear(): void;
}

class LocalExecutiveConversationRepository
  implements ExecutiveConversationRepository
{
  load(): ExecutiveConversationRepositoryState {
    if (typeof window === 'undefined') {
      return this.createEmptyState();
    }

    try {
      const savedState =
        window.localStorage.getItem(
          STORAGE_KEY
        );

      if (!savedState) {
        return this.createEmptyState();
      }

      const parsedState =
        JSON.parse(
          savedState
        ) as Partial<ExecutiveConversationRepositoryState>;

      return {
        projects:
          parsedState.projects &&
          typeof parsedState.projects ===
            'object'
            ? parsedState.projects
            : {},
      };
    } catch (error) {
      console.error(
        'No fue posible recuperar Executive Conversation:',
        error
      );

      return this.createEmptyState();
    }
  }

  save(
    state: ExecutiveConversationRepositoryState
  ): void {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(state)
      );
    } catch (error) {
      console.error(
        'No fue posible guardar Executive Conversation:',
        error
      );
    }
  }

  clear(): void {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      window.localStorage.removeItem(
        STORAGE_KEY
      );
    } catch (error) {
      console.error(
        'No fue posible eliminar Executive Conversation:',
        error
      );
    }
  }

  private createEmptyState():
    ExecutiveConversationRepositoryState {
    return {
      projects: {},
    };
  }
}

export const executiveConversationRepository:
  ExecutiveConversationRepository =
    new LocalExecutiveConversationRepository();