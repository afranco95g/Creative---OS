import {
  ExecutiveMemoryConflict,
  ExecutiveMemoryItem,
} from '../../types/executiveMemory';

const STORAGE_KEY =
  'creative-os-executive-memory-v1';

export interface ExecutiveMemoryRepositoryState {
  memories: ExecutiveMemoryItem[];
  conflicts: ExecutiveMemoryConflict[];
}

export interface ExecutiveMemoryRepository {
  load(): ExecutiveMemoryRepositoryState;

  save(
    state: ExecutiveMemoryRepositoryState
  ): void;

  clear(): void;
}

const EMPTY_STATE: ExecutiveMemoryRepositoryState = {
  memories: [],
  conflicts: [],
};

class LocalExecutiveMemoryRepository
  implements ExecutiveMemoryRepository
{
  load(): ExecutiveMemoryRepositoryState {
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
        ) as Partial<ExecutiveMemoryRepositoryState>;

      return {
        memories: Array.isArray(
          parsedState.memories
        )
          ? parsedState.memories
          : [],

        conflicts: Array.isArray(
          parsedState.conflicts
        )
          ? parsedState.conflicts
          : [],
      };
    } catch (error) {
      console.error(
        'No fue posible recuperar Executive Memory:',
        error
      );

      return this.createEmptyState();
    }
  }

  save(
    state: ExecutiveMemoryRepositoryState
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
        'No fue posible guardar Executive Memory:',
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
        'No fue posible eliminar Executive Memory:',
        error
      );
    }
  }

  private createEmptyState():
    ExecutiveMemoryRepositoryState {
    return {
      memories: [],
      conflicts: [],
    };
  }
}

export const executiveMemoryRepository:
  ExecutiveMemoryRepository =
    new LocalExecutiveMemoryRepository();