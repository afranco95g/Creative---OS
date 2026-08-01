'use client';

import {
  useCallback,
  useEffect,
  useState,
} from 'react';
import {
  executiveMemoryStore,
} from '../core/executiveMemoryStore';
import {
  CreateExecutiveMemoryInput,
  ExecutiveMemorySnapshot,
  ExecutiveMemoryStatus,
  UpdateExecutiveMemoryInput,
} from '../types/executiveMemory';

export function useExecutiveMemory():
  ExecutiveMemorySnapshot {
  const [snapshot, setSnapshot] =
    useState<ExecutiveMemorySnapshot>(() =>
      executiveMemoryStore.getSnapshot()
    );

  useEffect(() => {
    return executiveMemoryStore.subscribe(
      (nextSnapshot) => {
        setSnapshot(nextSnapshot);
      }
    );
  }, []);

  return snapshot;
}

export function useExecutiveMemoryActions() {
  const createMemory = useCallback(
    (
      input: CreateExecutiveMemoryInput
    ) => {
      return executiveMemoryStore.createMemory(
        input
      );
    },
    []
  );

  const updateMemory = useCallback(
    (
      memoryId: string,
      updates: UpdateExecutiveMemoryInput
    ) => {
      return executiveMemoryStore.updateMemory(
        memoryId,
        updates
      );
    },
    []
  );

  const confirmMemory = useCallback(
    (
      memoryId: string,
      validatedBy?: string,
      validationNote?: string
    ) => {
      return executiveMemoryStore.confirmMemory(
        memoryId,
        validatedBy,
        validationNote
      );
    },
    []
  );

  const rejectMemory = useCallback(
    (
      memoryId: string,
      validationNote?: string
    ) => {
      return executiveMemoryStore.rejectMemory(
        memoryId,
        validationNote
      );
    },
    []
  );

  const archiveMemory = useCallback(
    (memoryId: string) => {
      return executiveMemoryStore.archiveMemory(
        memoryId
      );
    },
    []
  );

  const setStatus = useCallback(
    (
      memoryId: string,
      status: ExecutiveMemoryStatus
    ) => {
      return executiveMemoryStore.setStatus(
        memoryId,
        status
      );
    },
    []
  );

  const clearAllMemories = useCallback(
    () => {
      executiveMemoryStore.clearAll();
    },
    []
  );

  return {
    createMemory,
    updateMemory,
    confirmMemory,
    rejectMemory,
    archiveMemory,
    setStatus,
    clearAllMemories,
  };
}