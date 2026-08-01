'use client';

import {
  useCallback,
  useMemo,
} from 'react';
import {
  buildExecutiveConversation,
} from '../engines/executiveConversationEngine';
import {
  ExecutiveConversationIntervention,
  ExecutiveConversationMode,
} from '../types/executiveConversation';
import {
  ExecutiveConversationState,
  ExecutiveCuriosityItem,
} from '../types/executiveCuriosity';
import {
  ExecutiveMemoryItem,
} from '../types/executiveMemory';
import {
  ConversationMessage,
  ProjectGraph,
} from '../types/project';

interface UseExecutiveConversationEngineInput {
  projectId: string | null;

  graph: ProjectGraph;

  messages: ConversationMessage[];

  memories: ExecutiveMemoryItem[];

  curiosities: ExecutiveCuriosityItem[];

  conversationState:
    ExecutiveConversationState | null;

  mode?: ExecutiveConversationMode;

  currentUserMessage?:
    ConversationMessage;

  currentStoredIntervention:
    ExecutiveConversationIntervention | null;

  onSetCurrentIntervention: (
    projectId: string,
    intervention:
      ExecutiveConversationIntervention | null
  ) => void;

  onQueueIntervention: (
    intervention:
      ExecutiveConversationIntervention
  ) => void;
}

export function useExecutiveConversationEngine({
  projectId,
  graph,
  messages,
  memories,
  curiosities,
  conversationState,
  mode,
  currentUserMessage,
  currentStoredIntervention,
  onSetCurrentIntervention,
  onQueueIntervention,
}: UseExecutiveConversationEngineInput) {
  const result = useMemo(() => {
    if (
      !projectId ||
      !conversationState
    ) {
      return null;
    }

    return buildExecutiveConversation({
      projectId,

      graph,

      messages,

      memories,

      curiosities,

      conversationState,

      mode,

      currentUserMessage,
    });
  }, [
    projectId,
    graph,
    messages,
    memories,
    curiosities,
    conversationState,
    mode,
    currentUserMessage,
  ]);

  const calculatedIntervention =
    result?.intervention || null;

  const synchronizeIntervention =
    useCallback(() => {
      if (!projectId) {
        return null;
      }

      if (!calculatedIntervention) {
        if (currentStoredIntervention) {
          onSetCurrentIntervention(
            projectId,
            null
          );
        }

        return null;
      }

      if (
        interventionsAreEquivalent(
          currentStoredIntervention,
          calculatedIntervention
        )
      ) {
        return currentStoredIntervention;
      }

      onSetCurrentIntervention(
        projectId,
        calculatedIntervention
      );

      if (
        calculatedIntervention.shouldDeliver &&
        calculatedIntervention.deliveryStatus ===
          'pending'
      ) {
        onQueueIntervention(
          calculatedIntervention
        );
      }

      return calculatedIntervention;
    }, [
      projectId,
      calculatedIntervention,
      currentStoredIntervention,
      onSetCurrentIntervention,
      onQueueIntervention,
    ]);

  return {
    result,

    context:
      result?.context || null,

    decision:
      result?.decision || null,

    calculatedIntervention,

    messageDraft:
      result?.messageDraft || null,

    shouldUpdateConversationState:
      result?.shouldUpdateConversationState ||
      false,

    shouldUpdateCuriosity:
      result?.shouldUpdateCuriosity ||
      false,

    shouldCreateMemoryCandidate:
      result?.shouldCreateMemoryCandidate ||
      false,

    synchronizeIntervention,
  };
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
    current.rationale === next.rationale &&
    current.shouldDeliver ===
      next.shouldDeliver &&
    current.relatedCuriosityId ===
      next.relatedCuriosityId
  );
}