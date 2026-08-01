import type { EntityConfig } from './entity-config';
import type { EntityKey } from './entity-key';
import type { RelationshipConfig } from './relationship-config';

export interface EntityPermissions {
  create?: boolean;

  read?: boolean;

  update?: boolean;

  delete?: boolean;
}

export type EntityActionScope =
  | 'collection'
  | 'record';

export type EntityActionVariant =
  | 'default'
  | 'primary'
  | 'destructive';

export interface EntityAction {
  id: string;

  label: string;

  scope: EntityActionScope;

  variant?: EntityActionVariant;

  requiresConfirmation?: boolean;

  permission?:
    | keyof EntityPermissions;
}

export interface SchemaDefinition {
  entity: EntityKey;

  config: EntityConfig;

  relationships?: RelationshipConfig[];

  permissions?: EntityPermissions;

  actions?: EntityAction[];

  version?: number;
}