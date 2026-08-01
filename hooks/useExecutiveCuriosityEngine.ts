'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from 'react';
import {
  buildExecutiveCuriosities,
  selectNextBestIntervention,
} from '../engines/executiveCuriosityEngine';
import {
  ExecutiveCuriosityItem,
} from '../types/executiveCuriosity';
import {
  ExecutiveMemoryItem,
} from '../types/executiveMemory';
import {
  ConversationMessage,
  ProjectGraph,
} from '../types/project';

interface UseExecutiveCuriosityEngineInput {
  projectId: string | null;

  graph: ProjectGraph;

  messages: ConversationMessage[];

  memories: ExecutiveMemoryItem[];

  existingCuriosities: ExecutiveCuriosityItem[];

  onCreateCuriosity: (
    input: {
      projectId: string;
      type: ExecutiveCuriosityItem['type'];
      topic: string;
      reason: string;
      status: ExecutiveCuriosityItem['status'];
      priority: number;
      confidence: number;
      evidence: ExecutiveCuriosityItem['evidence'];
      possibleInterventions:
        ExecutiveCuriosityItem['possibleInterventions'];
      suggestedPrompt?: string;
    }
  ) => ExecutiveCuriosityItem;

  onSetNextBestIntervention: (
    projectId: string,
    intervention: ReturnType<
      typeof selectNextBestIntervention
    >
  ) => void;
}

export function useExecutiveCuriosityEngine({
  projectId,
  graph,
  messages,
  memories,
  existingCuriosities,
  onCreateCuriosity,
  onSetNextBestIntervention,
}: UseExecutiveCuriosityEngineInput) {
  const synchronizedKeysRef =
    useRef<Set<string>>(new Set());

  const generatedCuriosities = useMemo(() => {
    if (!projectId) {
      return [];
    }

    return buildExecutiveCuriosities({
      projectId,
      graph,
      messages,
      memories,
      existingCuriosities,
    });
  }, [
    projectId,
    graph,
    messages,
    memories,
    existingCuriosities,
  ]);

  const synchronizeCuriosities =
    useCallback(() => {
      if (!projectId) {
        return [];
      }

      const createdCuriosities:
        ExecutiveCuriosityItem[] = [];

      generatedCuriosities.forEach(
        (curiosity) => {
          const key =
            createCuriosityKey(
              curiosity
            );

          if (
            synchronizedKeysRef.current.has(
              key
            )
          ) {
            return;
          }

          const created =
            onCreateCuriosity({
              projectId,
              type: curiosity.type,
              topic: curiosity.topic,
              reason: curiosity.reason,
              status: curiosity.status,
              priority:
                curiosity.priority,
              confidence:
                curiosity.confidence,
              evidence:
                curiosity.evidence,
              possibleInterventions:
                curiosity.possibleInterventions,
              suggestedPrompt:
                curiosity.suggestedPrompt,
            });

          synchronizedKeysRef.current.add(
            key
          );

          createdCuriosities.push(
            created
          );
        }
      );

      return createdCuriosities;
    }, [
      projectId,
      generatedCuriosities,
      onCreateCuriosity,
    ]);

  useEffect(() => {
    if (!projectId) {
      synchronizedKeysRef.current =
        new Set();

      return;
    }

    existingCuriosities.forEach(
      (curiosity) => {
        synchronizedKeysRef.current.add(
          createCuriosityKey(
            curiosity
          )
        );
      }
    );
  }, [
    projectId,
    existingCuriosities,
  ]);

  const nextBestIntervention =
    useMemo(() => {
      if (!projectId) {
        return null;
      }

      const combinedCuriosities = [
        ...existingCuriosities,
        ...generatedCuriosities,
      ];

      return selectNextBestIntervention(
        projectId,
        removeDuplicateCuriosities(
          combinedCuriosities
        )
      );
    }, [
      projectId,
      existingCuriosities,
      generatedCuriosities,
    ]);

  const synchronizeNextIntervention =
    useCallback(() => {
      if (!projectId) {
        return;
      }

      onSetNextBestIntervention(
        projectId,
        nextBestIntervention
      );
    }, [
      projectId,
      nextBestIntervention,
      onSetNextBestIntervention,
    ]);

  return {
    generatedCuriosities,

    generatedCount:
      generatedCuriosities.length,

    hasGeneratedCuriosities:
      generatedCuriosities.length > 0,

    nextBestIntervention,

    synchronizeCuriosities,

    synchronizeNextIntervention,
  };
}

function createCuriosityKey(
  curiosity: Pick<
    ExecutiveCuriosityItem,
    'projectId' | 'type' | 'topic'
  >
): string {
  return [
    curiosity.projectId,
    curiosity.type,
    normalizeText(
      curiosity.topic
    ),
  ].join(':');
}

function removeDuplicateCuriosities(
  curiosities: ExecutiveCuriosityItem[]
): ExecutiveCuriosityItem[] {
  const seen = new Set<string>();

  return curiosities.filter(
    (curiosity) => {
      const key =
        createCuriosityKey(
          curiosity
        );

      if (seen.has(key)) {
        return false;
      }

      seen.add(key);

      return true;
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