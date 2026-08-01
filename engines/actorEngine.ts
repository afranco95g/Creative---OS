import { actorDefinitions } from '../config/entities/actorDefinitions';
import { EntityEngine } from '../core/entities/entityEngine';
import { entityRegistry } from '../core/entities/entityRegistry';
import type {
  CreateEntityInput,
  UpdateCapabilityInput,
} from '../core/entities/entity.types';
import { localEntityRepository } from '../core/repositories/localEntityRepository';

actorDefinitions.forEach((definition) => {
  if (!entityRegistry.has(definition.type)) {
    entityRegistry.register(definition);
  }
});

const entityEngine = new EntityEngine(localEntityRepository);

export type ActorType = 'person' | 'space' | 'organization' | 'funder';

export interface CreateActorInput extends Omit<CreateEntityInput, 'type'> {
  actorType: ActorType;
}

export const actorEngine = {
  createActor(input: CreateActorInput) {
    return entityEngine.createEntity({
      type: input.actorType,
      ownerUserId: input.ownerUserId,
      name: input.name,
      slug: input.slug,
    });
  },

  updateCapability(input: UpdateCapabilityInput) {
    return entityEngine.updateCapability(input);
  },

  validateActor(actorId: string) {
    return entityEngine.validateEntity(actorId);
  },

  getActorsForUser(userId: string) {
    return localEntityRepository.getEntitiesByOwner(userId);
  },

  getActorRecordsForUser(userId: string) {
    return localEntityRepository.getEntitiesByOwner(userId).map((entity) => {
      const version = entity.currentDraftVersionId
        ? localEntityRepository.getVersion(entity.currentDraftVersionId)
        : entity.publishedVersionId
          ? localEntityRepository.getVersion(entity.publishedVersionId)
          : null;

      return {
        entity,
        version,
        validation: version
          ? entityEngine.validateEntity(entity.id)
          : { valid: false, completion: 0, errors: ['La entidad no tiene una versión disponible.'] },
      };
    });
  },
};
