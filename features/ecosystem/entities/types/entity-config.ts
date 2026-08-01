import type { EntityKey } from './entity-key';
export interface EntityPermissionConfig {
  create: boolean;
  update: boolean;
  delete: boolean;
}

export interface EntitySortConfig {
  column: string;
  ascending: boolean;
}

export interface EntityDashboardConfig {
  show: boolean;
  subtitle: string;
}

export interface EntityNavigationConfig {
  show: boolean;
  order: number;
}

export type EntityFieldType =
  | 'text'
  | 'textarea'
  | 'email'
  | 'number'
  | 'boolean'
  | 'date'
  | 'select'
  | 'relation';

export interface EntityFieldOption {
  label: string;
  value: string;
}

export interface EntityFieldRelation {
  /**
   * Entidad relacionada.
   */
  entity: EntityKey;

  /**
   * Campo mostrado al usuario.
   */
  displayField: string;

  /**
   * Campo almacenado como valor.
   * Por defecto será "id".
   */
  valueField?: string;
}

export interface EntityFieldConfig {
  key: string;

  label: string;

  type: EntityFieldType;

  required: boolean;

  editable: boolean;

  sortable: boolean;

  filterable: boolean;

  searchable: boolean;

  visibleInList: boolean;

  visibleInForm: boolean;

  placeholder?: string;

  helperText?: string;

  defaultValue?: unknown;

  options?: EntityFieldOption[];

  /**
   * Relación declarada directamente por el campo.
   * Ejemplo:
   * organization_id -> organizations
   */
  relation?: EntityFieldRelation;

  /**
   * Clave de la relación registrada en el Graph Engine.
   * Ejemplo:
   * people-organization
   */
  relationshipKey?: string;
}

export interface EntityConfig {
  entity: string;

  singular: string;

  plural: string;

  table: string;

  description: string;

  icon: string;

  color: string;

  route: string;

  searchableFields: string[];

  fields: EntityFieldConfig[];

  permissions: EntityPermissionConfig;

  defaultSort: EntitySortConfig;

  dashboard?: EntityDashboardConfig;

  navigation?: EntityNavigationConfig;
}