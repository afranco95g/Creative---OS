import {
  CreateExecutiveMemoryInput,
  ExecutiveMemoryConflict,
  ExecutiveMemoryItem,
  ExecutiveMemoryQuery,
  ExecutiveMemorySnapshot,
  ExecutiveMemoryStatus,
  UpdateExecutiveMemoryInput,
} from '../types/executiveMemory';
import {
  executiveMemoryRepository,
  ExecutiveMemoryRepositoryState,
} from './repositories/executiveMemoryRepository';
import {
  createId,
  now,
} from './projectEngine';

type ExecutiveMemoryListener = (
  snapshot: ExecutiveMemorySnapshot
) => void;

class ExecutiveMemoryStore {
  private state: ExecutiveMemoryRepositoryState;
  private listeners: ExecutiveMemoryListener[] = [];

  constructor() {
    this.state =
      executiveMemoryRepository.load();
  }

  getSnapshot(): ExecutiveMemorySnapshot {
    return {
      memories: this.state.memories,

      activeMemories:
        this.state.memories.filter(
          (memory) =>
            memory.status === 'active' ||
            memory.status === 'confirmed'
        ),

      proposedMemories:
        this.state.memories.filter(
          (memory) =>
            memory.status === 'proposed'
        ),

      contradictedMemories:
        this.state.memories.filter(
          (memory) =>
            memory.status === 'contradicted'
        ),

      archivedMemories:
        this.state.memories.filter(
          (memory) =>
            memory.status === 'archived' ||
            memory.status === 'superseded' ||
            memory.status === 'rejected'
        ),

      lastUpdatedAt:
        getLastUpdatedAt(
          this.state.memories
        ),
    };
  }

  subscribe(
    listener: ExecutiveMemoryListener
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

  createMemory(
    input: CreateExecutiveMemoryInput
  ): ExecutiveMemoryItem {
    const timestamp = now();

    const memory: ExecutiveMemoryItem = {
      id: createId(),

      projectId: input.projectId,
      workspaceId: input.workspaceId,
      organizationId:
        input.organizationId,

      scope:
        input.scope ||
        inferScope(input),

      type: input.type,

      status: 'proposed',

      summary: input.summary.trim(),

      detail:
        input.detail?.trim(),

      reason:
        input.reason?.trim(),

      implications:
        cleanList(
          input.implications || []
        ),

      confidence:
        normalizeConfidence(
          input.confidence ?? 0.5
        ),

      source: input.source,

      validation: {
        isValidated: false,
      },

      tags:
        cleanList(
          input.tags || []
        ),

      relations:
        input.relatedMemories || [],

      createdAt: timestamp,
      updatedAt: timestamp,

      isSensitive:
        input.isSensitive || false,
    };

    this.state = {
      ...this.state,

      memories: [
        memory,
        ...this.state.memories,
      ],
    };

    this.emit();

    return memory;
  }

  updateMemory(
    memoryId: string,
    updates: UpdateExecutiveMemoryInput
  ): ExecutiveMemoryItem | null {
    const existingMemory =
      this.state.memories.find(
        (memory) =>
          memory.id === memoryId
      );

    if (!existingMemory) {
      return null;
    }

    const updatedMemory:
      ExecutiveMemoryItem = {
        ...existingMemory,
        ...updates,

        summary:
          updates.summary !== undefined
            ? updates.summary.trim()
            : existingMemory.summary,

        detail:
          updates.detail !== undefined
            ? updates.detail.trim()
            : existingMemory.detail,

        reason:
          updates.reason !== undefined
            ? updates.reason.trim()
            : existingMemory.reason,

        implications:
          updates.implications !== undefined
            ? cleanList(
                updates.implications
              )
            : existingMemory.implications,

        confidence:
          updates.confidence !== undefined
            ? normalizeConfidence(
                updates.confidence
              )
            : existingMemory.confidence,

        tags:
          updates.tags !== undefined
            ? cleanList(updates.tags)
            : existingMemory.tags,

        updatedAt: now(),
      };

    this.state = {
      ...this.state,

      memories:
        this.state.memories.map(
          (memory) =>
            memory.id === memoryId
              ? updatedMemory
              : memory
        ),
    };

    this.emit();

    return updatedMemory;
  }

  confirmMemory(
    memoryId: string,
    validatedBy?: string,
    validationNote?: string
  ) {
    return this.updateMemory(
      memoryId,
      {
        status: 'active',

        confidence: 1,

        validation: {
          isValidated: true,
          validatedBy,
          validatedAt: now(),
          validationNote:
            validationNote?.trim(),
        },
      }
    );
  }

  rejectMemory(
    memoryId: string,
    validationNote?: string
  ) {
    return this.updateMemory(
      memoryId,
      {
        status: 'rejected',

        validation: {
          isValidated: true,
          validatedAt: now(),
          validationNote:
            validationNote?.trim(),
        },
      }
    );
  }

  archiveMemory(
    memoryId: string
  ) {
    return this.setStatus(
      memoryId,
      'archived'
    );
  }

  setStatus(
    memoryId: string,
    status: ExecutiveMemoryStatus
  ) {
    return this.updateMemory(
      memoryId,
      { status }
    );
  }

  addConflict(
    conflict:
      Omit<
        ExecutiveMemoryConflict,
        'id' | 'detectedAt'
      >
  ): ExecutiveMemoryConflict {
    const newConflict:
      ExecutiveMemoryConflict = {
        ...conflict,
        id: createId(),
        detectedAt: now(),
      };

    this.state = {
      ...this.state,

      conflicts: [
        newConflict,
        ...this.state.conflicts,
      ],
    };

    this.emit();

    return newConflict;
  }

  getConflicts(
    projectId?: string
  ): ExecutiveMemoryConflict[] {
    if (!projectId) {
      return this.state.conflicts;
    }

    return this.state.conflicts.filter(
      (conflict) =>
        conflict.projectId ===
        projectId
    );
  }

  queryMemories(
    query: ExecutiveMemoryQuery = {}
  ): ExecutiveMemoryItem[] {
    return this.state.memories.filter(
      (memory) => {
        if (
          query.projectId &&
          memory.projectId !==
            query.projectId
        ) {
          return false;
        }

        if (
          query.scope &&
          memory.scope !== query.scope
        ) {
          return false;
        }

        if (
          query.types?.length &&
          !query.types.includes(
            memory.type
          )
        ) {
          return false;
        }

        if (
          query.statuses?.length &&
          !query.statuses.includes(
            memory.status
          )
        ) {
          return false;
        }

        if (
          query.tags?.length &&
          !query.tags.some((tag) =>
            memory.tags.includes(tag)
          )
        ) {
          return false;
        }

        if (
          !query.includeSensitive &&
          memory.isSensitive
        ) {
          return false;
        }

        if (query.search) {
          const search =
            query.search
              .trim()
              .toLowerCase();

          const searchableText = [
  memory.summary,
  memory.detail || '',
  memory.reason || '',
  ...(memory.implications || []),
  ...(memory.tags || []),
]
  .join(' ')
  .toLowerCase();

          if (
            !searchableText.includes(
              search
            )
          ) {
            return false;
          }
        }

        return true;
      }
    );
  }

  getProjectMemories(
    projectId: string
  ): ExecutiveMemoryItem[] {
    return this.queryMemories({
      projectId,
      statuses: [
        'proposed',
        'confirmed',
        'active',
        'contradicted',
      ],
      includeSensitive: false,
    });
  }

  clearAll() {
    executiveMemoryRepository.clear();

    this.state = {
      memories: [],
      conflicts: [],
    };

    this.notifyListeners();
  }

  private emit() {
    executiveMemoryRepository.save(
      this.state
    );

    this.notifyListeners();
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

function inferScope(
  input: CreateExecutiveMemoryInput
) {
  if (input.organizationId) {
    return 'organization' as const;
  }

  if (input.projectId) {
    return 'project' as const;
  }

  if (input.workspaceId) {
    return 'workspace' as const;
  }

  return 'ecosystem' as const;
}

function normalizeConfidence(
  value: number
): number {
  return Math.max(
    0,
    Math.min(1, value)
  );
}

function cleanList(
  items: string[]
): string[] {
  return Array.from(
    new Set(
      items
        .map((item) =>
          item.trim()
        )
        .filter(Boolean)
    )
  );
}

function getLastUpdatedAt(
  memories: ExecutiveMemoryItem[]
): string | null {
  if (memories.length === 0) {
    return null;
  }

  return [...memories]
    .sort(
      (a, b) =>
        new Date(
          b.updatedAt
        ).getTime() -
        new Date(
          a.updatedAt
        ).getTime()
    )[0].updatedAt;
}

export const executiveMemoryStore =
  new ExecutiveMemoryStore();