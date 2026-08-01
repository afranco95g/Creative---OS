import type { EntityKey } from './entity-key';

export type RelationshipType =
  | 'belongsTo'
  | 'hasOne'
  | 'hasMany'
  | 'belongsToMany';

export interface RelationshipConfig {
  /**
   * Identificador único de la relación.
   * Ejemplo: people-organization
   */
  key: string;

  /**
   * Nombre visible de la relación.
   * Ejemplo: Organización
   */
  label: string;

  /**
   * Entidad desde la que se declara la relación.
   */
  sourceEntity: EntityKey;

  /**
   * Entidad relacionada.
   */
  targetEntity: EntityKey;

  /**
   * Tipo de relación.
   */
  type: RelationshipType;

  /**
   * Campo de la entidad de origen utilizado en la relación.
   * Ejemplo: organization_id
   */
  sourceField: string;

  /**
   * Campo de la entidad relacionada.
   * Normalmente será id.
   */
  targetField: string;

  /**
   * Campo mostrado al usuario.
   * Ejemplo: name
   */
  displayField: string;

  /**
   * Nombre de la tabla intermedia.
   * Solo se utiliza en relaciones belongsToMany.
   */
  junctionTable?: string;

  /**
   * Campo de la tabla intermedia que apunta a la entidad de origen.
   */
  junctionSourceField?: string;

  /**
   * Campo de la tabla intermedia que apunta a la entidad relacionada.
   */
  junctionTargetField?: string;

  /**
   * Permite mostrar la relación dentro de la ficha de una entidad.
   */
  visibleInDetail?: boolean;

  /**
   * Permite mostrar la relación dentro de formularios.
   */
  visibleInForm?: boolean;

  /**
   * Permite utilizar la relación como filtro.
   */
  filterable?: boolean;
}