import {
  ContextMembership,
  WorkspaceActor,
  WorkspaceActorType,
  WorkspaceContextId,
  WorkspaceProject,
  WorkspaceState,
} from '../types/workspace';

import {
  ConversationMessage,
  ProjectGraph,
} from '../types/project';

import {
  createInitialProjectGraph,
  createId,
  now,
} from './projectEngine';

import {
  workspaceRepository,
} from './repositories/workspaceRepository';

type WorkspaceListener = (
  state: WorkspaceState
) => void;

interface AuthenticatedWorkspaceUser {
  id: string;
  name: string;
  email: string;
  organization?: string;
  creativeFocus?: string;
}

class WorkspaceStore {
  private state: WorkspaceState;

  private activeUserId:
    string | null = null;

  private listeners:
    WorkspaceListener[] = [];

  constructor() {
    this.state =
      workspaceRepository.load(
        null
      );
  }

  getSnapshot():
    WorkspaceState {
    return this.state;
  }

  subscribe(
    listener: WorkspaceListener
  ) {
    this.listeners.push(
      listener
    );

    return () => {
      this.listeners =
        this.listeners.filter(
          (current) =>
            current !== listener
        );
    };
  }

  connectAuthenticatedUser(
    user:
      AuthenticatedWorkspaceUser
  ) {
    if (
      this.activeUserId ===
        user.id &&
      this.state.user?.id ===
        user.id
    ) {
      return;
    }

    this.activeUserId =
      user.id;

    const loadedState =
      workspaceRepository.load(
        user.id
      );

    const memberships =
      loadedState.user
        ?.memberships ??
      [
        {
          contextId:
            'personal' as const,
          roles: ['owner'],
        },
      ];

    this.state = {
      ...loadedState,

      user: {
        id:
          user.id,

        name:
          user.name,

        email:
          user.email,

        organization:
          user.organization,

        creativeFocus:
          user.creativeFocus,

        memberships,
      },

      hasOnboarded:
        true,
    };

    this.emit();
  }

  disconnectAuthenticatedUser() {
    this.activeUserId =
      null;

    this.state =
      workspaceRepository.load(
        null
      );

    this.notifyListeners();
  }

  setAvailableActors(
    actors: WorkspaceActor[]
  ) {
    const normalizedActors =
      actors.map(
        normalizeWorkspaceActor
      );

    const currentActorStillExists =
      this.state.activeActorId
        ? normalizedActors.some(
            (actor) =>
              actor.id ===
              this.state
                .activeActorId
          )
        : false;

    const activeActorId =
      currentActorStillExists
        ? this.state.activeActorId
        : normalizedActors[0]
            ?.id ?? null;

    const projects =
      assignUnownedProjects(
        this.state.projects,
        normalizedActors
      );

    this.state = {
      ...this.state,

      actors:
        normalizedActors,

      activeActorId,

      projects,

      activeProjectId:
        this.state.activeProjectId &&
        projects.some(
          (project) =>
            project.id ===
            this.state
              .activeProjectId
        )
          ? this.state
              .activeProjectId
          : null,
    };

    this.emit();
  }

  selectActor(
    actorId: string
  ) {
    const actorExists =
      this.state.actors.some(
        (actor) =>
          actor.id ===
          actorId
      );

    if (!actorExists) {
      console.warn(
        'No se encontró la identidad seleccionada:',
        actorId
      );

      return;
    }

    this.state = {
      ...this.state,

      activeActorId:
        actorId,

      activeProjectId:
        null,
    };

    this.emit();
  }

  getActiveActor():
    WorkspaceActor | null {
    if (
      !this.state.activeActorId
    ) {
      return null;
    }

    return (
      this.state.actors.find(
        (actor) =>
          actor.id ===
          this.state
            .activeActorId
      ) ?? null
    );
  }

  getProjectsForActor(
    actorId: string
  ): WorkspaceProject[] {
    return this.state.projects.filter(
      (project) =>
        project.actorId ===
        actorId
    );
  }

  createUser(
    name: string,
    email: string,
    organization?: string,
    creativeFocus?: string
  ) {
    const userId =
      createId();

    const memberships:
      ContextMembership[] = [
        {
          contextId:
            'personal',
          roles: ['owner'],
        },
      ];

    this.activeUserId =
      userId;

    this.state = {
      ...workspaceRepository.load(
        userId
      ),

      user: {
        id:
          userId,

        name,

        email,

        organization,

        creativeFocus,

        memberships,
      },

      activeContextId:
        'personal',

      hasOnboarded:
        true,
    };

    this.emit();
  }

  updateUserMemberships(
    memberships:
      ContextMembership[]
  ) {
    if (!this.state.user) {
      return;
    }

    this.state = {
      ...this.state,

      user: {
        ...this.state.user,

        memberships,
      },
    };

    this.emit();
  }

  selectContext(
    contextId:
      WorkspaceContextId
  ) {
    const contextExists =
      this.state.contexts.some(
        (context) =>
          context.id ===
            contextId &&
          context.isEnabled
      );

    if (!contextExists) {
      return;
    }

    this.state = {
      ...this.state,

      activeContextId:
        contextId,

      activeProjectId:
        null,
    };

    this.emit();
  }

  createProject(
    title: string,
    description: string,
    category:
      WorkspaceProject['category'],
    contextId?:
      WorkspaceContextId
  ): WorkspaceProject {
    if (!this.activeUserId) {
      throw new Error(
        'Debes iniciar sesión antes de crear un proyecto.'
      );
    }

    const activeActor =
      this.getActiveActor();

    if (!activeActor) {
      throw new Error(
        'Selecciona una identidad antes de crear un proyecto.'
      );
    }

    const selectedContextId =
      contextId ??
      this.state
        .activeContextId ??
      'personal';

    const initialGraph =
      createInitialProjectGraph();

    const timestamp =
      now();

    const project:
      WorkspaceProject = {
      id:
        createId(),

      contextId:
        selectedContextId,

      actorId:
        activeActor.id,

      actorType:
        activeActor.type,

      title,

      description,

      category,

      graph: {
        ...initialGraph,

        title,
      },

      messages: [],

      createdAt:
        timestamp,

      updatedAt:
        timestamp,
    };

    this.state = {
      ...this.state,

      projects: [
        project,
        ...this.state.projects,
      ],

      activeContextId:
        selectedContextId,

      activeProjectId:
        project.id,
    };

    this.emit();

    return project;
  }

  selectProject(
    projectId: string
  ) {
    const project =
      this.state.projects.find(
        (currentProject) =>
          currentProject.id ===
          projectId
      );

    if (!project) {
      return;
    }

    if (
      project.actorId &&
      project.actorId !==
        this.state.activeActorId
    ) {
      const actorExists =
        this.state.actors.some(
          (actor) =>
            actor.id ===
            project.actorId
        );

      if (actorExists) {
        this.state = {
          ...this.state,

          activeActorId:
            project.actorId,
        };
      }
    }

    this.state = {
      ...this.state,

      activeContextId:
        project.contextId,

      activeProjectId:
        project.id,
    };

    this.emit();
  }

  updateProjectState(
    projectId: string,
    graph: ProjectGraph,
    messages:
      ConversationMessage[]
  ) {
    const projectExists =
      this.state.projects.some(
        (project) =>
          project.id ===
          projectId
      );

    if (!projectExists) {
      return;
    }

    this.state = {
      ...this.state,

      projects:
        this.state.projects.map(
          (project) =>
            project.id ===
            projectId
              ? {
                  ...project,

                  title:
                    graph.title,

                  graph,

                  messages,

                  updatedAt:
                    now(),
                }
              : project
        ),
    };

    this.emit();
  }

  deleteProject(
    projectId: string
  ) {
    const projectExists =
      this.state.projects.some(
        (project) =>
          project.id ===
          projectId
      );

    if (!projectExists) {
      return;
    }

    this.state = {
      ...this.state,

      projects:
        this.state.projects.filter(
          (project) =>
            project.id !==
            projectId
        ),

      activeProjectId:
        this.state
          .activeProjectId ===
        projectId
          ? null
          : this.state
              .activeProjectId,
    };

    this.emit();
  }

  clearActiveProject() {
    this.state = {
      ...this.state,

      activeProjectId:
        null,
    };

    this.emit();
  }

  resetWorkspace() {
    workspaceRepository.clear(
      this.activeUserId
    );

    this.state =
      workspaceRepository.load(
        this.activeUserId
      );

    this.notifyListeners();
  }

  hasLegacyWorkspace():
    boolean {
    return (
      workspaceRepository
        .hasLegacyWorkspace()
    );
  }

  private notifyListeners() {
    this.listeners.forEach(
      (listener) => {
        listener(
          this.state
        );
      }
    );
  }

  private emit() {
    workspaceRepository.save(
      this.activeUserId,
      this.state
    );

    this.notifyListeners();
  }
}

function normalizeWorkspaceActor(
  actor: WorkspaceActor
): WorkspaceActor {
  const prefix =
    actor.type === 'funder'
      ? 'brand'
      : actor.type;

  const normalizedId =
    actor.id.includes(':')
      ? actor.id
      : `${prefix}:${actor.id}`;

  return {
    ...actor,

    id:
      normalizedId,
  };
}

function assignUnownedProjects(
  projects:
    WorkspaceProject[],
  actors:
    WorkspaceActor[]
): WorkspaceProject[] {
  const personalActor =
    actors.find(
      (actor) =>
        actor.type ===
        'person'
    );

  if (!personalActor) {
    return projects;
  }

  return projects.map(
    (project) => {
      if (
        project.actorId &&
        project.actorType
      ) {
        return project;
      }

      return {
        ...project,

        actorId:
          personalActor.id,

        actorType:
          'person' as
            WorkspaceActorType,
      };
    }
  );
}

export const workspaceStore =
  new WorkspaceStore();