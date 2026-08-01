import type { EntityRepository } from '../entities/entityRepository';
import type {
  DomainEvent,
  Entity,
  EntityMember,
  EntityVersion,
} from '../entities/entity.types';

interface EntityDatabase {
  entities: Entity[];
  versions: EntityVersion[];
  members: EntityMember[];
  events: DomainEvent[];
}

const STORAGE_KEY = 'creative-os-entity-database-v1';

function emptyDatabase(): EntityDatabase {
  return {
    entities: [],
    versions: [],
    members: [],
    events: [],
  };
}

export class LocalEntityRepository implements EntityRepository {
  private database: EntityDatabase;

  constructor() {
    this.database = this.load();
  }

  saveEntity(entity: Entity): void {
    this.database.entities = this.upsert(this.database.entities, entity);
    this.persist();
  }

  saveVersion(version: EntityVersion): void {
    this.database.versions = this.upsert(this.database.versions, version);
    this.persist();
  }

  saveMember(member: EntityMember): void {
    const index = this.database.members.findIndex(
      (candidate) =>
        candidate.entityId === member.entityId && candidate.userId === member.userId
    );

    if (index >= 0) {
      this.database.members[index] = member;
    } else {
      this.database.members.push(member);
    }

    this.persist();
  }

  appendEvents(events: DomainEvent[]): void {
    this.database.events.push(...events);
    this.persist();
  }

  getEntity(entityId: string): Entity | null {
    return this.database.entities.find(({ id }) => id === entityId) ?? null;
  }

  getVersion(versionId: string): EntityVersion | null {
    return this.database.versions.find(({ id }) => id === versionId) ?? null;
  }

  getMembers(entityId: string): EntityMember[] {
    return this.database.members.filter((member) => member.entityId === entityId);
  }

  getEntitiesByOwner(userId: string): Entity[] {
    return this.database.entities.filter((entity) => entity.ownerUserId === userId);
  }

  private upsert<T extends { id: string }>(items: T[], item: T): T[] {
    const exists = items.some(({ id }) => id === item.id);
    return exists
      ? items.map((candidate) => (candidate.id === item.id ? item : candidate))
      : [...items, item];
  }

  private load(): EntityDatabase {
    if (typeof window === 'undefined') {
      return emptyDatabase();
    }

    const saved = window.localStorage.getItem(STORAGE_KEY);

    if (!saved) {
      return emptyDatabase();
    }

    try {
      return JSON.parse(saved) as EntityDatabase;
    } catch {
      return emptyDatabase();
    }
  }

  private persist(): void {
    if (typeof window === 'undefined') {
      return;
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(this.database));
  }
}

export const localEntityRepository = new LocalEntityRepository();
