import {
  ExecutiveConversationState,
} from '../../types/executiveCuriosity';

const STORAGE_KEY =
  'creative-os-executive-curiosity-v1';

export interface ExecutiveCuriosityRepositoryState {
  conversations: Record<
    string,
    ExecutiveConversationState
  >;
}

export interface ExecutiveCuriosityRepository {
  load(): ExecutiveCuriosityRepositoryState;

  save(
    state: ExecutiveCuriosityRepositoryState
  ): void;

  clear(): void;
}

class LocalExecutiveCuriosityRepository
  implements ExecutiveCuriosityRepository
{
  load(): ExecutiveCuriosityRepositoryState {
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
        ) as Partial<ExecutiveCuriosityRepositoryState>;

      return {
        conversations:
          parsedState.conversations &&
          typeof parsedState.conversations ===
            'object'
            ? parsedState.conversations
            : {},
      };
    } catch (error) {
      console.error(
        'No fue posible recuperar Executive Curiosity:',
        error
      );

      return this.createEmptyState();
    }
  }

  save(
    state: ExecutiveCuriosityRepositoryState
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
        'No fue posible guardar Executive Curiosity:',
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
        'No fue posible eliminar Executive Curiosity:',
        error
      );
    }
  }

  private createEmptyState():
    ExecutiveCuriosityRepositoryState {
    return {
      conversations: {},
    };
  }
}

export const executiveCuriosityRepository:
  ExecutiveCuriosityRepository =
    new LocalExecutiveCuriosityRepository();