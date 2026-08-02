import {
  ContextMembership,
  UserProfile,
  WorkspaceActor,
  WorkspaceActorType,
  WorkspaceContext,
  WorkspaceContextId,
  WorkspaceProject,
  WorkspaceState,
  WORKSPACE_CONTEXT_IDS,
} from '../../types/workspace';

const LEGACY_STORAGE_KEY =
  'creative-os-workspace';

const USER_STORAGE_PREFIX =
  'creative-os-workspace:user:';

const defaultContexts:
  WorkspaceContext[] = [
  {
    id: 'personal',
    name: 'Personal',
    description:
      'Tu perfil, actividades y conexiones dentro del ecosistema.',
    type: 'identity',
    isEnabled: true,
  },
  {
    id: 'cultura-esta',
    name: 'Cultura Esta',
    description:
      'Gestión editorial, agenda cultural y contenidos del medio.',
    type: 'media',
    isEnabled: true,
  },
  {
    id: 'neon-sessions',
    name: 'Neon Sessions',
    description:
      'Producción, artistas, eventos, contenidos y aliados.',
    type: 'project',
    isEnabled: true,
  },
];

function createDefaultState():
  WorkspaceState {
  return {
    user: null,
    actors: [],
    activeActorId: null,
    contexts: defaultContexts,
    projects: [],
    activeContextId:
      'personal',
    activeProjectId: null,
    hasOnboarded: false,
  };
}

function getUserStorageKey(
  userId: string
): string {
  return `${USER_STORAGE_PREFIX}${userId}`;
}

function isContextId(
  value: unknown
): value is WorkspaceContextId {
  return (
    typeof value === 'string' &&
    WORKSPACE_CONTEXT_IDS.includes(
      value as WorkspaceContextId
    )
  );
}

function isActorType(
  value: unknown
): value is WorkspaceActorType {
  return (
    value === 'person' ||
    value === 'space' ||
    value === 'funder'
  );
}

function normalizeActorId(
  actorId: string,
  actorType:
    WorkspaceActorType
): string {
  if (actorId.includes(':')) {
    return actorId;
  }

  const prefix =
    actorType === 'funder'
      ? 'brand'
      : actorType;

  return `${prefix}:${actorId}`;
}

function migrateMemberships(
  memberships: unknown
): ContextMembership[] {
  if (!Array.isArray(memberships)) {
    return [
      {
        contextId:
          'personal',
        roles: ['owner'],
      },
    ];
  }

  return memberships.filter(
    (
      membership
    ): membership is ContextMembership => {
      if (
        !membership ||
        typeof membership !==
          'object'
      ) {
        return false;
      }

      const candidate =
        membership as Partial<ContextMembership>;

      return (
        isContextId(
          candidate.contextId
        ) &&
        Array.isArray(
          candidate.roles
        )
      );
    }
  );
}

function migrateUser(
  user: unknown
): UserProfile | null {
  if (
    !user ||
    typeof user !== 'object'
  ) {
    return null;
  }

  const candidate =
    user as Partial<UserProfile>;

  if (
    typeof candidate.id !==
      'string' ||
    typeof candidate.name !==
      'string' ||
    typeof candidate.email !==
      'string'
  ) {
    return null;
  }

  return {
    id: candidate.id,
    name: candidate.name,
    email: candidate.email,
    organization:
      candidate.organization,
    creativeFocus:
      candidate.creativeFocus,
    memberships:
      migrateMemberships(
        candidate.memberships
      ),
  };
}

function migrateActor(
  actor: unknown
): WorkspaceActor | null {
  if (
    !actor ||
    typeof actor !== 'object'
  ) {
    return null;
  }

  const candidate =
    actor as Partial<WorkspaceActor>;

  if (
    typeof candidate.id !==
      'string' ||
    typeof candidate.name !==
      'string' ||
    typeof candidate.slug !==
      'string' ||
    !isActorType(
      candidate.type
    )
  ) {
    return null;
  }

  return {
    id:
      normalizeActorId(
        candidate.id,
        candidate.type
      ),

    type:
      candidate.type,

    name:
      candidate.name,

    slug:
      candidate.slug,

    description:
      candidate.description,

    role:
      candidate.role ??
      'member',

    membershipStatus:
      candidate.membershipStatus,

    verified:
      Boolean(
        candidate.verified
      ),

    featured:
      Boolean(
        candidate.featured
      ),

    status:
      candidate.status ??
      'draft',
  };
}

function migrateProject(
  project: unknown
): WorkspaceProject | null {
  if (
    !project ||
    typeof project !== 'object'
  ) {
    return null;
  }

  const candidate =
    project as Partial<WorkspaceProject>;

  if (
    typeof candidate.id !==
      'string' ||
    typeof candidate.title !==
      'string' ||
    typeof candidate.description !==
      'string' ||
    !candidate.graph
  ) {
    return null;
  }

  const actorType =
    isActorType(
      candidate.actorType
    )
      ? candidate.actorType
      : null;

  const actorId =
    typeof candidate.actorId ===
      'string' &&
    candidate.actorId.trim()
      ? actorType
        ? normalizeActorId(
            candidate.actorId,
            actorType
          )
        : candidate.actorId
      : null;

  return {
    id:
      candidate.id,

    contextId:
      isContextId(
        candidate.contextId
      )
        ? candidate.contextId
        : 'personal',

    actorId,

    actorType,

    title:
      candidate.title,

    description:
      candidate.description,

    category:
      candidate.category ??
      'other',

    lifecycleStatus:
      candidate.lifecycleStatus === 'archived'
        ? 'archived'
        : 'active',

    archivedAt:
      typeof candidate.archivedAt === 'string'
        ? candidate.archivedAt
        : null,

    graph: {
      ...candidate.graph,
      tools: candidate.graph.tools ?? {
        budgetLines: [],
        scheduleItems: [],
        grant: {
          opportunityId: '', opportunityName: '', objective: '', requirements: [],
          requiredDocuments: [], requiresBudget: true, requiresTimeline: true,
          attachments: [], evaluationCriteria: [], answers: {},
        },
      },
    },

    messages:
      Array.isArray(
        candidate.messages
      )
        ? candidate.messages
        : [],

    createdAt:
      typeof candidate.createdAt ===
        'string'
        ? candidate.createdAt
        : new Date()
            .toISOString(),

    updatedAt:
      typeof candidate.updatedAt ===
        'string'
        ? candidate.updatedAt
        : new Date()
            .toISOString(),
  };
}

function assignLegacyProjectsToPerson(
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
          'person',
      };
    }
  );
}

function migrateState(
  value: unknown
): WorkspaceState {
  const defaultState =
    createDefaultState();

  if (
    !value ||
    typeof value !== 'object'
  ) {
    return defaultState;
  }

  const candidate =
    value as Partial<WorkspaceState>;

  const user =
    migrateUser(
      candidate.user
    );

  const actors =
    Array.isArray(
      candidate.actors
    )
      ? candidate.actors
          .map(
            migrateActor
          )
          .filter(
            (
              actor
            ): actor is WorkspaceActor =>
              actor !== null
          )
      : [];

  const rawProjects =
    Array.isArray(
      candidate.projects
    )
      ? candidate.projects
          .map(
            migrateProject
          )
          .filter(
            (
              project
            ): project is WorkspaceProject =>
              project !== null
          )
      : [];

  const projects =
    assignLegacyProjectsToPerson(
      rawProjects,
      actors
    );

  const activeActorId =
    typeof candidate.activeActorId ===
      'string' &&
    actors.some(
      (actor) =>
        actor.id ===
        candidate.activeActorId
    )
      ? candidate.activeActorId
      : actors[0]?.id ??
        null;

  const activeProjectId =
    typeof candidate.activeProjectId ===
      'string' &&
    projects.some(
      (project) =>
        project.id ===
        candidate.activeProjectId
    )
      ? candidate.activeProjectId
      : null;

  const activeProject =
    projects.find(
      (project) =>
        project.id ===
        activeProjectId
    );

  const activeContextId =
    isContextId(
      candidate.activeContextId
    )
      ? candidate.activeContextId
      : activeProject
          ?.contextId ??
        'personal';

  return {
    user,
    actors,
    activeActorId,
    contexts:
      defaultContexts,
    projects,
    activeContextId,
    activeProjectId,
    hasOnboarded:
      Boolean(
        candidate.hasOnboarded
      ) ||
      user !== null,
  };
}

function load(
  userId: string | null
): WorkspaceState {
  if (
    typeof window ===
      'undefined' ||
    !userId
  ) {
    return createDefaultState();
  }

  const storageKey =
    getUserStorageKey(
      userId
    );

  const savedState =
    window.localStorage.getItem(
      storageKey
    );

  if (!savedState) {
    return createDefaultState();
  }

  try {
    const parsedState:
      unknown =
      JSON.parse(
        savedState
      );

    const migratedState =
      migrateState(
        parsedState
      );

    window.localStorage.setItem(
      storageKey,
      JSON.stringify(
        migratedState
      )
    );

    return migratedState;
  } catch (error) {
    console.error(
      'No fue posible cargar el workspace del usuario:',
      error
    );

    return createDefaultState();
  }
}

function save(
  userId: string | null,
  state: WorkspaceState
) {
  if (
    typeof window ===
      'undefined' ||
    !userId
  ) {
    return;
  }

  try {
    window.localStorage.setItem(
      getUserStorageKey(
        userId
      ),
      JSON.stringify(
        state
      )
    );
  } catch (error) {
    console.error(
      'No fue posible guardar el workspace del usuario:',
      error
    );
  }
}

function clear(
  userId: string | null
) {
  if (
    typeof window ===
      'undefined' ||
    !userId
  ) {
    return;
  }

  window.localStorage.removeItem(
    getUserStorageKey(
      userId
    )
  );
}

function hasLegacyWorkspace():
  boolean {
  if (
    typeof window ===
    'undefined'
  ) {
    return false;
  }

  return (
    window.localStorage.getItem(
      LEGACY_STORAGE_KEY
    ) !== null
  );
}

export const workspaceRepository = {
  load,
  save,
  clear,
  hasLegacyWorkspace,
};
