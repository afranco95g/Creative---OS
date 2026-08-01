'use client';

import {
  useCallback,
  useEffect,
  useState,
} from 'react';
import {
  executiveConversationStore,
} from '../core/executiveConversationStore';
import {
  ExecutiveConversationDeliveryStatus,
  ExecutiveConversationIntervention,
  ExecutiveConversationMode,
  ExecutiveConversationSnapshot,
} from '../types/executiveConversation';

export function useExecutiveConversation():
  ExecutiveConversationSnapshot {
  const [snapshot, setSnapshot] =
    useState<ExecutiveConversationSnapshot>(() =>
      executiveConversationStore.getSnapshot()
    );

  useEffect(() => {
    return executiveConversationStore.subscribe(
      (nextSnapshot) => {
        setSnapshot(nextSnapshot);
      }
    );
  }, []);

  return snapshot;
}

export function useExecutiveConversationActions() {
  const setActiveProject = useCallback(
    (projectId: string | null) => {
      executiveConversationStore.setActiveProject(
        projectId
      );
    },
    []
  );

  const setMode = useCallback(
    (
      projectId: string,
      mode: ExecutiveConversationMode
    ) => {
      executiveConversationStore.setMode(
        projectId,
        mode
      );
    },
    []
  );

  const setCurrentIntervention = useCallback(
    (
      projectId: string,
      intervention:
        ExecutiveConversationIntervention | null
    ) => {
      executiveConversationStore.setCurrentIntervention(
        projectId,
        intervention
      );
    },
    []
  );

  const queueIntervention = useCallback(
    (
      intervention:
        ExecutiveConversationIntervention
    ) => {
      executiveConversationStore.queueIntervention(
        intervention
      );
    },
    []
  );

  const deliverIntervention = useCallback(
    (interventionId: string) => {
      return executiveConversationStore.deliverIntervention(
        interventionId
      );
    },
    []
  );

  const updateInterventionStatus =
    useCallback(
      (
        interventionId: string,
        status:
          ExecutiveConversationDeliveryStatus,
        outcomeNote?: string
      ) => {
        return executiveConversationStore.updateInterventionStatus(
          interventionId,
          status,
          outcomeNote
        );
      },
      []
    );

  const suppressIntervention = useCallback(
    (
      interventionId: string,
      reason?: string
    ) => {
      return executiveConversationStore.suppressIntervention(
        interventionId,
        reason
      );
    },
    []
  );

  const markInterventionAnswered =
    useCallback(
      (
        interventionId: string,
        outcomeNote?: string
      ) => {
        return executiveConversationStore.markInterventionAnswered(
          interventionId,
          outcomeNote
        );
      },
      []
    );

  const markInterventionRedirected =
    useCallback(
      (
        interventionId: string,
        outcomeNote?: string
      ) => {
        return executiveConversationStore.markInterventionRedirected(
          interventionId,
          outcomeNote
        );
      },
      []
    );

  const getProjectState = useCallback(
    (projectId: string) => {
      return executiveConversationStore.getProjectState(
        projectId
      );
    },
    []
  );

  const clearProject = useCallback(
    (projectId: string) => {
      executiveConversationStore.clearProject(
        projectId
      );
    },
    []
  );

  const clearAll = useCallback(() => {
    executiveConversationStore.clearAll();
  }, []);

  return {
    setActiveProject,
    setMode,
    setCurrentIntervention,
    queueIntervention,
    deliverIntervention,
    updateInterventionStatus,
    suppressIntervention,
    markInterventionAnswered,
    markInterventionRedirected,
    getProjectState,
    clearProject,
    clearAll,
  };
}