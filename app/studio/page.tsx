'use client';

import { useRouter } from 'next/navigation';

import {
  useEffect,
  useState,
  useSyncExternalStore,
} from 'react';

import {
  CreateProjectScreen,
} from '@/components/CreateProjectScreen';

import {
  WorkspaceHome,
} from '@/components/WorkspaceHome';

import {
  workspaceStore,
} from '@/core/workspaceStore';

import type {
  WorkspaceProject,
} from '@/types/workspace';

type StudioView =
  | 'workspace'
  | 'create-project';

export default function StudioPage() {
  const router = useRouter();

  const [
    activeView,
    setActiveView,
  ] = useState<StudioView>(
    'workspace'
  );

  const [creationError, setCreationError] = useState('');

  const workspaceState =
    useSyncExternalStore(
      (listener) =>
        workspaceStore.subscribe(
          () => listener()
        ),

      () =>
        workspaceStore.getSnapshot(),

      () => null
    );

  /*
   * Permite que una persona llegue desde el medio
   * directamente al formulario de creación usando:
   *
   * /studio?new=1
   */
  useEffect(() => {
    const searchParams =
      new URLSearchParams(
        window.location.search
      );

    if (
      searchParams.get('new') ===
      '1'
    ) {
      setActiveView(
        'create-project'
      );
    }
  }, []);

  function handleCloseCreateProject() {
    setActiveView('workspace');

    router.replace('/studio');
  }

  function handleCreateProject(
    title: string,
    description: string,
    category:
      WorkspaceProject['category']
  ) {
    setCreationError('');

    try {
      const project = workspaceStore.createProject(
        title,
        description,
        category
      );

      workspaceStore.selectProject(project.id);

      router.push(`/studio/projects/${project.id}`);
    } catch (error) {
      setCreationError(
        error instanceof Error
          ? error.message
          : 'No fue posible crear la Mesa de Producción.'
      );
    }
  }

  function handleOpenProject(
    projectId: string
  ) {
    workspaceStore.selectProject(
      projectId
    );

    router.push(
      `/studio/projects/${projectId}`
    );
  }

  if (!workspaceState) {
    return (
      <main className="min-h-screen bg-[#050505] px-8 py-12 text-white">
        <div className="mx-auto max-w-7xl">
          <div className="h-5 w-48 animate-pulse rounded bg-[#232323]" />

          <div className="mt-5 h-16 w-3/5 animate-pulse rounded bg-[#151515]" />

          <div className="mt-12 grid gap-6 lg:grid-cols-2">
            <div className="h-56 animate-pulse rounded-3xl bg-[#101010]" />

            <div className="h-56 animate-pulse rounded-3xl bg-[#101010]" />
          </div>
        </div>
      </main>
    );
  }

  if (
    activeView ===
    'create-project'
  ) {
    return (
      <CreateProjectScreen
        errorMessage={creationError}
        onCancel={
          handleCloseCreateProject
        }
        onCreate={
          handleCreateProject
        }
      />
    );
  }

  return (
    <WorkspaceHome
      workspace={
        workspaceState
      }
      onCreateProject={() => {
        setActiveView(
          'create-project'
        );

        router.replace(
          '/studio?new=1'
        );
      }}
      onOpenProject={
        handleOpenProject
      }
    />
  );
}
