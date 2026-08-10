'use client';

import { useEffect, useState } from 'react';
import {
  projectStore,
  ProjectStoreSnapshot,
} from '../core/projectStore';
import {
  ConversationMessage,
  ProjectGraph,
} from '../types/project';

export function useProjectStore(): ProjectStoreSnapshot {
  const [snapshot, setSnapshot] = useState<ProjectStoreSnapshot>(() =>
    projectStore.getSnapshot()
  );

  useEffect(() => {
    return projectStore.subscribe((nextSnapshot) => {
      setSnapshot(nextSnapshot);
    });
  }, []);

  return snapshot;
}

export function useProjectActions() {
  return {
    sendMessage: (message: string) =>
      projectStore.sendMessage(message),

    startProject: (
      title: string,
      initialDescription: string
    ) =>
      projectStore.startProject(
        title,
        initialDescription
      ),

    loadProject: (
      graph: ProjectGraph,
      messages: ConversationMessage[] = []
    ) =>
      projectStore.loadProject(
        graph,
        messages
      ),

    resetProject: () =>
      projectStore.resetProject(),
    resolveKnowledgeConfirmation: (id: string, status: 'accepted'|'rejected'|'dismissed') =>
      projectStore.resolveKnowledgeConfirmation(id, status),
    correctKnowledgeConfirmation: (id: string, correction: string) =>
      projectStore.correctKnowledgeConfirmation(id, correction),
    resolveConsistencyIssue: (id: string, status: 'acknowledged'|'resolved'|'dismissed', note?: string) =>
      projectStore.resolveConsistencyIssue(id, status, note),
  };
}
