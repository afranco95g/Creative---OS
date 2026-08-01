import { organizationsConfig } from './organizations';
import { peopleConfig } from './people';

export const entityConfigs = {
  people: peopleConfig,
  organizations: organizationsConfig,
} as const;

export type EntityKey = keyof typeof entityConfigs;

export function getEntityConfig(
  entity: EntityKey,
) {
  return entityConfigs[entity];
}

export function getAllEntityConfigs() {
  return Object.values(entityConfigs);
}

export function getEntityKeys() {
  return Object.keys(
    entityConfigs,
  ) as EntityKey[];
}