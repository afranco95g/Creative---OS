import {
  ConversationMessage,
  ProjectGraph,
} from './project';

export const WORKSPACE_CONTEXT_IDS = [
  'personal',
  'cultura-esta',
  'neon-sessions',
] as const;

export type WorkspaceContextId =
  (typeof WORKSPACE_CONTEXT_IDS)[number];

export type WorkspaceContextType =
  | 'identity'
  | 'media'
  | 'organization'
  | 'project';

export type WorkspaceModuleId =
  | 'projects'
  | 'agenda'
  | 'ecosystem'
  | 'content';

export type WorkspaceRole =
  | 'owner'
  | 'administrator'
  | 'editor'
  | 'journalist'
  | 'producer'
  | 'representative'
  | 'member'
  | 'volunteer'
  | 'viewer';

export type WorkspacePermission =
  | 'context:view'
  | 'projects:view'
  | 'projects:create'
  | 'projects:edit'
  | 'projects:delete'
  | 'agenda:view'
  | 'agenda:manage'
  | 'ecosystem:view'
  | 'ecosystem:manage'
  | 'content:view'
  | 'content:create'
  | 'content:edit'
  | 'content:publish';

export type WorkspaceActorType =
  | 'person'
  | 'space'
  | 'funder';

export type WorkspaceActorStatus =
  | 'draft'
  | 'review'
  | 'published'
  | 'archived';

export interface WorkspaceActor {
  /**
   * Identificador operativo usado en la interfaz:
   *
   * person:uuid
   * space:uuid
   * brand:uuid
   */
  id: string;

  type:
    WorkspaceActorType;

  name: string;
  slug: string;
  description?: string;

  role:
    WorkspaceRole;

  membershipStatus?: string;

  verified: boolean;
  featured: boolean;

  status:
    WorkspaceActorStatus;
}

export interface WorkspaceContext {
  id: WorkspaceContextId;
  name: string;
  description: string;
  type: WorkspaceContextType;
  isEnabled: boolean;
}

export interface ContextMembership {
  contextId: WorkspaceContextId;
  roles: WorkspaceRole[];
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  organization?: string;
  creativeFocus?: string;
  memberships: ContextMembership[];
}

export interface WorkspaceModuleDefinition {
  id: WorkspaceModuleId;
  name: string;
  description: string;
  requiredPermission:
    WorkspacePermission;
}

export interface WorkspaceProject {
  id: string;

  /**
   * Compatibilidad temporal con la arquitectura anterior.
   * Todavía no se elimina.
   */
  contextId:
    WorkspaceContextId;

  /**
   * Identidad propietaria del proyecto.
   *
   * Ejemplos:
   * person:uuid
   * space:uuid
   * brand:uuid
   *
   * Los proyectos antiguos pueden tener null hasta
   * que el repositorio los migre de forma controlada.
   */
  actorId:
    string | null;

  /**
   * Tipo real del actor propietario.
   */
  actorType:
    WorkspaceActorType | null;

  title: string;
  description: string;

  category:
    | 'cultural'
    | 'product'
    | 'event'
    | 'social'
    | 'artistic'
    | 'business'
    | 'other';

  graph:
    ProjectGraph;

  messages:
    ConversationMessage[];

  createdAt: string;
  updatedAt: string;
}

export interface WorkspaceState {
  user:
    UserProfile | null;

  /**
   * Identidades que esta cuenta puede administrar.
   */
  actors:
    WorkspaceActor[];

  /**
   * Identidad desde la que se está trabajando.
   */
  activeActorId:
    string | null;

  /**
   * Compatibilidad temporal con la arquitectura anterior.
   */
  contexts:
    WorkspaceContext[];

  projects:
    WorkspaceProject[];

  activeContextId:
    WorkspaceContextId | null;

  activeProjectId:
    string | null;

  hasOnboarded:
    boolean;
}
