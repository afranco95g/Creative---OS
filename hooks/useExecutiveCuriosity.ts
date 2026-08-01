'use client';

import {
  useCallback,
  useEffect,
  useState,
} from 'react';
import {
  executiveCuriosityStore,
} from '../core/executiveCuriosityStore';
import {
  CreateExecutiveCuriosityInput,
  ExecutiveConversationState,
  ExecutiveCuriositySnapshot,
  ExecutiveCuriosityStatus,
  ExecutiveIntervention,
  ExecutiveInterventionType,
  UpdateExecutiveCuriosityInput,
} from '../types/executiveCuriosity';

export function useExecutiveCuriosity():
  ExecutiveCuriositySnapshot {
  const [snapshot, setSnapshot] =
    useState<ExecutiveCuriositySnapshot>(() =>
      executiveCuriosityStore.getSnapshot()
    );

  useEffect(() => {
    return executiveCuriosityStore.subscribe(
      (nextSnapshot) => {
        setSnapshot(nextSnapshot);
      }
    );
  }, []);

  return snapshot;
}

export function useExecutiveCuriosityActions() {
  const setActiveProject = useCallback(
    (projectId: string | null) => {
      executiveCuriosityStore.setActiveProject(
        projectId
      );
    },
    []
  );

  const createCuriosity = useCallback(
    (
      input: CreateExecutiveCuriosityInput
    ) => {
      return executiveCuriosityStore.createCuriosity(
        input
      );
    },
    []
  );

  const updateCuriosity = useCallback(
    (
      curiosityId: string,
      updates: UpdateExecutiveCuriosityInput
    ) => {
      return executiveCuriosityStore.updateCuriosity(
        curiosityId,
        updates
      );
    },
    []
  );

  const setCuriosityStatus = useCallback(
    (
      curiosityId: string,
      status: ExecutiveCuriosityStatus
    ) => {
      return executiveCuriosityStore.setCuriosityStatus(
        curiosityId,
        status
      );
    },
    []
  );

  const markCuriosityAsked = useCallback(
    (
      curiosityId: string,
      interventionType:
        ExecutiveInterventionType = 'ask'
    ) => {
      return executiveCuriosityStore.markCuriosityAsked(
        curiosityId,
        interventionType
      );
    },
    []
  );

  const setNextBestIntervention = useCallback(
    (
      projectId: string,
      intervention:
        ExecutiveIntervention | null
    ) => {
      executiveCuriosityStore.setNextBestIntervention(
        projectId,
        intervention
      );
    },
    []
  );

  const updateConversationUnderstanding =
    useCallback(
      (
        projectId: string,
        updates: Partial<
          ExecutiveConversationState['understanding']
        >
      ) => {
        executiveCuriosityStore.updateConversationUnderstanding(
          projectId,
          updates
        );
      },
      []
    );

  const updateSessionState = useCallback(
    (
      projectId: string,
      updates: Pick<
        ExecutiveConversationState,
        | 'lastUserMessageAt'
        | 'lastSystemMessageAt'
        | 'sessionStartedAt'
        | 'sessionEndedAt'
      >
    ) => {
      executiveCuriosityStore.updateSessionState(
        projectId,
        updates
      );
    },
    []
  );

  const getConversationState = useCallback(
    (projectId: string) => {
      return executiveCuriosityStore.getConversationState(
        projectId
      );
    },
    []
  );

  const clearProject = useCallback(
    (projectId: string) => {
      executiveCuriosityStore.clearProject(
        projectId
      );
    },
    []
  );

  const clearAll = useCallback(() => {
    executiveCuriosityStore.clearAll();
  }, []);

  return {
    setActiveProject,
    createCuriosity,
    updateCuriosity,
    setCuriosityStatus,
    markCuriosityAsked,
    setNextBestIntervention,
    updateConversationUnderstanding,
    updateSessionState,
    getConversationState,
    clearProject,
    clearAll,
  };
}