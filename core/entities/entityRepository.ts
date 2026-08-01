import type {
  DomainEvent,
  Entity,
  EntityMember,
  EntityVersion,
} from './entity.types';

export interface EntityRepository {
  saveEntity(entity: Entity): void;
  saveVersion(version: EntityVersion): void;
  saveMember(member: EntityMember): void;
  appendEvents(events: DomainEvent[]): void;
  getEntity(entityId: string): Entity | null;
  getVersion(versionId: string): EntityVersion | null;
  getMembers(entityId: string): EntityMember[];
  getEntitiesByOwner(userId: string): Entity[];
}
