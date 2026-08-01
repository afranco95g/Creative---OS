import type { EntityRepository } from './entityRepository';
import { entityRegistry } from './entityRegistry';
import type {
  CapabilityState,
  CreateEntityInput,
  CreateEntityResult,
  DomainEvent,
  Entity,
  EntityMember,
  EntityValidationResult,
  EntityVersion,
  UpdateCapabilityInput,
} from './entity.types';

function createId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function now(): string {
  return new Date().toISOString();
}

function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function clampCompletion(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export class EntityEngine {
  constructor(private readonly repository: EntityRepository) {}

  createEntity(input: CreateEntityInput): CreateEntityResult {
    const definition = entityRegistry.get(input.type);
    const timestamp = now();
    const entityId = createId();
    const versionId = createId();

    const capabilities = definition.capabilities.reduce<
      Record<string, CapabilityState>
    >((result, capability) => {
      result[capability.id] = {
        capabilityId: capability.id,
        status: 'empty',
        completion: 0,
        data: {},
        validationErrors: [],
        updatedAt: timestamp,
      };

      return result;
    }, {});

    const entity: Entity = {
      id: entityId,
      type: input.type,
      status: 'draft',
      ownerUserId: input.ownerUserId,
      currentDraftVersionId: versionId,
      publishedVersionId: null,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    const version: EntityVersion = {
      id: versionId,
      entityId,
      number: 1,
      status: 'draft',
      name: input.name.trim(),
      slug: input.slug?.trim() || slugify(input.name),
      capabilities,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    const member: EntityMember = {
      entityId,
      userId: input.ownerUserId,
      role: 'owner',
      createdAt: timestamp,
    };

    const events: DomainEvent[] = [
      {
        id: createId(),
        name: 'entity.created',
        aggregateId: entityId,
        actorUserId: input.ownerUserId,
        payload: {
          entityType: input.type,
          versionId,
        },
        occurredAt: timestamp,
      },
    ];

    this.repository.saveEntity(entity);
    this.repository.saveVersion(version);
    this.repository.saveMember(member);
    this.repository.appendEvents(events);

    return { entity, version, member, events };
  }

  updateCapability(input: UpdateCapabilityInput): EntityVersion {
    const entity = this.requireEditableEntity(input.entityId, input.userId);
    const version = this.requireDraftVersion(entity);
    const definition = entityRegistry.get(entity.type);

    if (!definition.capabilities.some(({ id }) => id === input.capabilityId)) {
      throw new Error(
        `La capacidad "${input.capabilityId}" no pertenece a la entidad "${entity.type}".`
      );
    }

    const completion = clampCompletion(input.completion);
    const validationErrors = input.validationErrors ?? [];
    const timestamp = now();

    const updatedVersion: EntityVersion = {
      ...version,
      capabilities: {
        ...version.capabilities,
        [input.capabilityId]: {
          capabilityId: input.capabilityId,
          data: input.data,
          completion,
          validationErrors,
          status:
            validationErrors.length > 0
              ? 'needs_changes'
              : completion === 100
                ? 'complete'
                : completion > 0
                  ? 'in_progress'
                  : 'empty',
          updatedAt: timestamp,
        },
      },
      updatedAt: timestamp,
    };

    this.repository.saveVersion(updatedVersion);
    this.repository.saveEntity({ ...entity, updatedAt: timestamp });
    this.repository.appendEvents([
      {
        id: createId(),
        name: 'entity.capability.updated',
        aggregateId: entity.id,
        actorUserId: input.userId,
        payload: {
          versionId: version.id,
          capabilityId: input.capabilityId,
          completion,
        },
        occurredAt: timestamp,
      },
    ]);

    return updatedVersion;
  }

  validateEntity(entityId: string): EntityValidationResult {
    const entity = this.repository.getEntity(entityId);

    if (!entity) {
      throw new Error(`No se encontró la entidad "${entityId}".`);
    }

    const version = this.requireDraftVersion(entity);
    const definition = entityRegistry.get(entity.type);
    const totalWeight = definition.capabilities.reduce(
      (sum, capability) => sum + (capability.weight ?? 1),
      0
    );

    const weightedCompletion = definition.capabilities.reduce(
      (sum, capability) => {
        const state = version.capabilities[capability.id];
        return sum + (state?.completion ?? 0) * (capability.weight ?? 1);
      },
      0
    );

    const completion =
      totalWeight === 0 ? 0 : Math.round(weightedCompletion / totalWeight);

    const errors: string[] = [];

    definition.capabilities.forEach((capability) => {
      const state = version.capabilities[capability.id];
      const minimum = capability.minimumCompletion ?? (capability.required ? 100 : 0);

      if ((state?.completion ?? 0) < minimum) {
        errors.push(
          `${capability.label} debe alcanzar al menos ${minimum}% de completitud.`
        );
      }

      state?.validationErrors.forEach((error) => {
        errors.push(`${capability.label}: ${error}`);
      });
    });

    const minimumCompletion = definition.minimumCompletion ?? 70;

    if (completion < minimumCompletion) {
      errors.push(
        `La entidad debe alcanzar al menos ${minimumCompletion}% de completitud.`
      );
    }

    return {
      valid: errors.length === 0,
      completion,
      errors,
    };
  }

  private requireEditableEntity(entityId: string, userId: string): Entity {
    const entity = this.repository.getEntity(entityId);

    if (!entity) {
      throw new Error(`No se encontró la entidad "${entityId}".`);
    }

    const member = this.repository
      .getMembers(entityId)
      .find((candidate) => candidate.userId === userId);

    if (!member || !['owner', 'manager', 'editor'].includes(member.role)) {
      throw new Error('No tienes permisos para editar esta entidad.');
    }

    return entity;
  }

  private requireDraftVersion(entity: Entity): EntityVersion {
    if (!entity.currentDraftVersionId) {
      throw new Error('La entidad no tiene una versión editable.');
    }

    const version = this.repository.getVersion(entity.currentDraftVersionId);

    if (!version) {
      throw new Error('No se encontró la versión editable de la entidad.');
    }

    return version;
  }
}
