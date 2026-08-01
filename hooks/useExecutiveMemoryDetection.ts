'use client';

import { useCallback, useMemo } from 'react';
import { detectExecutiveMemoryCandidates } from '../engines/executiveMemoryDetectionEngine';
import {
  CreateExecutiveMemoryInput,
  ExecutiveMemoryItem,
} from '../types/executiveMemory';
import {
  ConversationMessage,
  ProjectGraph,
} from '../types/project';

interface UseExecutiveMemoryDetectionInput {
  projectId: string | null;
  graph: ProjectGraph;
  messages: ConversationMessage[];
  existingMemories: ExecutiveMemoryItem[];
  onCreateMemory: (
    input: CreateExecutiveMemoryInput
  ) => ExecutiveMemoryItem;
}

export function useExecutiveMemoryDetection({
  projectId,
  graph,
  messages,
  existingMemories,
  onCreateMemory,
}: UseExecutiveMemoryDetectionInput) {
  const candidates = useMemo(() => {
    if (!projectId) return [];

    const detectedCandidates =
      detectExecutiveMemoryCandidates({
        projectId,
        graph,
        messages,
      });

    return detectedCandidates.filter(
      (candidate) =>
        !memoryAlreadyExists(
          candidate,
          existingMemories
        )
    );
  }, [
    projectId,
    graph,
    messages,
    existingMemories,
  ]);

  const proposeCandidate = useCallback(
    (
      candidate:
        CreateExecutiveMemoryInput
    ) => {
      return onCreateMemory(candidate);
    },
    [onCreateMemory]
  );

  const proposeAllCandidates =
    useCallback(() => {
      return candidates.map(
        (candidate) =>
          onCreateMemory(candidate)
      );
    }, [
      candidates,
      onCreateMemory,
    ]);

  return {
    candidates,
    candidateCount: candidates.length,
    hasCandidates:
      candidates.length > 0,
    proposeCandidate,
    proposeAllCandidates,
  };
}

function memoryAlreadyExists(
  candidate: CreateExecutiveMemoryInput,
  existingMemories: ExecutiveMemoryItem[]
): boolean {
  const normalizedCandidateSummary =
    normalizeText(candidate.summary);

  return existingMemories.some(
    (memory) => {
      if (
        memory.projectId !==
        candidate.projectId
      ) {
        return false;
      }

      if (
        memory.type !== candidate.type
      ) {
        return false;
      }

      return (
        normalizeText(memory.summary) ===
        normalizedCandidateSummary
      );
    }
  );
}

function normalizeText(
  value: string
): string {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(
      /[\u0300-\u036f]/g,
      ''
    )
    .replace(/\s+/g, ' ');
}