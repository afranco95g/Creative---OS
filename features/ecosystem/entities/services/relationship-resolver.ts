import type { EntityKey } from '../types/entity-key';
import type {
  RelationshipConfig,
  RelationshipType,
} from '../types/relationship-config';

import { relationshipRegistry } from './relationship-registry';

export type RelationshipDirection =
  | 'outgoing'
  | 'incoming';

export interface ResolvedRelationship {
  key: string;

  label: string;

  sourceEntity: EntityKey;

  targetEntity: EntityKey;

  type: RelationshipType;

  sourceField: string;

  targetField: string;

  displayField: string;

  direction: RelationshipDirection;

  junctionTable?: string;

  junctionSourceField?: string;

  junctionTargetField?: string;

  visibleInDetail: boolean;

  visibleInForm: boolean;

  filterable: boolean;
}

class RelationshipResolver {
  resolveForEntity(
    entity: EntityKey
  ): ResolvedRelationship[] {
    const outgoing =
      relationshipRegistry
        .getBySourceEntity(entity)
        .map((relationship) =>
          this.resolveOutgoing(relationship)
        );

    const incoming =
      relationshipRegistry
        .getByTargetEntity(entity)
        .map((relationship) =>
          this.resolveIncoming(relationship)
        );

    return [
      ...outgoing,
      ...incoming,
    ];
  }

  resolveOutgoing(
    relationship: RelationshipConfig
  ): ResolvedRelationship {
    return {
      key: relationship.key,

      label: relationship.label,

      sourceEntity:
        relationship.sourceEntity,

      targetEntity:
        relationship.targetEntity,

      type: relationship.type,

      sourceField:
        relationship.sourceField,

      targetField:
        relationship.targetField,

      displayField:
        relationship.displayField,

      direction: 'outgoing',

      junctionTable:
        relationship.junctionTable,

      junctionSourceField:
        relationship.junctionSourceField,

      junctionTargetField:
        relationship.junctionTargetField,

      visibleInDetail:
        relationship.visibleInDetail ?? false,

      visibleInForm:
        relationship.visibleInForm ?? false,

      filterable:
        relationship.filterable ?? false,
    };
  }

  resolveIncoming(
    relationship: RelationshipConfig
  ): ResolvedRelationship {
    return {
      key: relationship.key,

      label: relationship.label,

      sourceEntity:
        relationship.targetEntity,

      targetEntity:
        relationship.sourceEntity,

      type: this.getInverseType(
        relationship.type
      ),

      sourceField:
        relationship.targetField,

      targetField:
        relationship.sourceField,

      displayField:
        relationship.displayField,

      direction: 'incoming',

      junctionTable:
        relationship.junctionTable,

      junctionSourceField:
        relationship.junctionTargetField,

      junctionTargetField:
        relationship.junctionSourceField,

      visibleInDetail:
        relationship.visibleInDetail ?? false,

      visibleInForm: false,

      filterable:
        relationship.filterable ?? false,
    };
  }

  getVisibleInDetail(
    entity: EntityKey
  ): ResolvedRelationship[] {
    return this.resolveForEntity(entity).filter(
      (relationship) =>
        relationship.visibleInDetail
    );
  }

  getVisibleInForm(
    entity: EntityKey
  ): ResolvedRelationship[] {
    return this.resolveForEntity(entity).filter(
      (relationship) =>
        relationship.visibleInForm
    );
  }

  getFilterable(
    entity: EntityKey
  ): ResolvedRelationship[] {
    return this.resolveForEntity(entity).filter(
      (relationship) =>
        relationship.filterable
    );
  }

  private getInverseType(
    type: RelationshipType
  ): RelationshipType {
    switch (type) {
      case 'belongsTo':
        return 'hasMany';

      case 'hasMany':
        return 'belongsTo';

      case 'hasOne':
        return 'belongsTo';

      case 'belongsToMany':
        return 'belongsToMany';

      default:
        return type;
    }
  }
}

export const relationshipResolver =
  new RelationshipResolver();