import type { EntityKey } from '../types/entity-key';
import type {
  RelationshipConfig,
  RelationshipType,
} from '../types/relationship-config';

import { relationships } from '../relationships';

class RelationshipRegistry {
  private readonly relationships: RelationshipConfig[];

  constructor(items: RelationshipConfig[]) {
    this.relationships = items;
  }

  getAll(): RelationshipConfig[] {
    return this.relationships;
  }

  getByKey(key: string): RelationshipConfig | undefined {
    return this.relationships.find(
      (relationship) => relationship.key === key
    );
  }

  getBySourceEntity(
    entity: EntityKey
  ): RelationshipConfig[] {
    return this.relationships.filter(
      (relationship) =>
        relationship.sourceEntity === entity
    );
  }

  getByTargetEntity(
    entity: EntityKey
  ): RelationshipConfig[] {
    return this.relationships.filter(
      (relationship) =>
        relationship.targetEntity === entity
    );
  }

  getByEntity(
    entity: EntityKey
  ): RelationshipConfig[] {
    return this.relationships.filter(
      (relationship) =>
        relationship.sourceEntity === entity ||
        relationship.targetEntity === entity
    );
  }

  getByType(
    type: RelationshipType
  ): RelationshipConfig[] {
    return this.relationships.filter(
      (relationship) =>
        relationship.type === type
    );
  }

  hasRelationship(
    sourceEntity: EntityKey,
    targetEntity: EntityKey
  ): boolean {
    return this.relationships.some(
      (relationship) =>
        relationship.sourceEntity === sourceEntity &&
        relationship.targetEntity === targetEntity
    );
  }
    getInverseRelationships(
    entity: EntityKey
  ): RelationshipConfig[] {
    return this.relationships
      .filter(
        (relationship) =>
          relationship.targetEntity === entity
      )
      .map((relationship) => ({
        ...relationship,
        sourceEntity: relationship.targetEntity,
        targetEntity: relationship.sourceEntity,
        type:
          relationship.type === 'belongsTo'
            ? 'hasMany'
            : relationship.type === 'hasMany'
              ? 'belongsTo'
              : relationship.type === 'hasOne'
                ? 'belongsTo'
                : relationship.type === 'belongsToMany'
                  ? 'belongsToMany'
                  : relationship.type,
      }));
  }
}

export const relationshipRegistry =
  new RelationshipRegistry(relationships);