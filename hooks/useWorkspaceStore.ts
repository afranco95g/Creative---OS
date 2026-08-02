'use client';

import { useCallback } from 'react';
import { workspaceStore } from '../core/workspaceStore';
import { useWorkspaceContext } from '../core/providers/WorkspaceProvider';
import {
  ConversationMessage,
  ProjectGraph,
} from '../types/project';
import { WorkspaceProject } from '../types/workspace';

export function useWorkspaceStore() {
  const { workspace } = useWorkspaceContext();

  return workspace;
}

export function useWorkspaceHydration() {
  const { isHydrated } = useWorkspaceContext();

  return isHydrated;
}

export function useWorkspaceActions() {
  const createUser = useCallback(
    (
      name: string,
      email: string,
      organization?: string,
      creativeFocus?: string
    ) => {
      workspaceStore.createUser(
        name,
        email,
        organization,
        creativeFocus
      );
    },
    []
  );

  const createProject = useCallback(
    (
      title: string,
      description: string,
      category: WorkspaceProject['category']
    ) => {
      return workspaceStore.createProject(
        title,
        description,
        category
      );
    },
    []
  );

  const selectProject = useCallback((projectId: string) => {
    workspaceStore.selectProject(projectId);
  }, []);

  const updateProjectState = useCallback(
    (
      projectId: string,
      graph: ProjectGraph,
      messages: ConversationMessage[]
    ) => {
      workspaceStore.updateProjectState(
        projectId,
        graph,
        messages
      );
    },
    []
  );

  const clearActiveProject = useCallback(() => {
    workspaceStore.clearActiveProject();
  }, []);

  const resetWorkspace = useCallback(() => {
    workspaceStore.resetWorkspace();
  }, []);

  const archiveProject = useCallback((projectId: string) => workspaceStore.archiveProject(projectId), []);
  const restoreProject = useCallback((projectId: string) => workspaceStore.restoreProject(projectId), []);
  const deleteProject = useCallback((projectId: string) => workspaceStore.deleteProject(projectId), []);

  return {
    createUser,
    createProject,
    selectProject,
    updateProjectState,
    clearActiveProject,
    resetWorkspace,
    archiveProject,
    restoreProject,
    deleteProject,
  };
}
