'use client';

import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react';

import {
  workspaceStore,
} from '../workspaceStore';

import type {
  WorkspaceState,
} from '../../types/workspace';

interface WorkspaceContextValue {
  workspace: WorkspaceState;
  isHydrated: boolean;
}

const EMPTY_WORKSPACE: WorkspaceState = {
  user: null,

  actors: [],
  activeActorId: null,

  contexts: [],
  projects: [],

  activeContextId: 'personal',
  activeProjectId: null,

  hasOnboarded: false,
};

const WorkspaceContext =
  createContext<WorkspaceContextValue | null>(
    null
  );

interface WorkspaceProviderProps {
  children: ReactNode;
}

export function WorkspaceProvider({
  children,
}: WorkspaceProviderProps) {
  const [
    workspace,
    setWorkspace,
  ] =
    useState<WorkspaceState>(
      EMPTY_WORKSPACE
    );

  const [
    isHydrated,
    setIsHydrated,
  ] =
    useState(false);

  useEffect(() => {
    setWorkspace(
      workspaceStore.getSnapshot()
    );

    setIsHydrated(true);

    return workspaceStore.subscribe(
      (nextWorkspace) => {
        setWorkspace(
          nextWorkspace
        );
      }
    );
  }, []);

  return (
    <WorkspaceContext.Provider
      value={{
        workspace,
        isHydrated,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspaceContext() {
  const context =
    useContext(
      WorkspaceContext
    );

  if (!context) {
    throw new Error(
      'useWorkspaceContext debe usarse dentro de WorkspaceProvider.'
    );
  }

  return context;
} 