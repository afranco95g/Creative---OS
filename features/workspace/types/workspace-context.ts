export interface WorkspaceContext {
  id: string;

  name: string;

  type: WorkspaceType;

  description?: string;

  icon?: string;

  capabilities: string[];

  modules: string[];
}

export type WorkspaceType =
  | 'personal'
  | 'organization'
  | 'project'
  | 'media'
  | 'space'
  | 'brand';