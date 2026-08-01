import { createSchema } from '../factories/create-schema';

import { relationships } from '../relationships';

import { organizationsConfig } from './organizations';

export const organizationsSchema =
  createSchema({
    entity: 'organizations',

    config: organizationsConfig,

    relationships: relationships.filter(
      (relationship) =>
        relationship.sourceEntity ===
          'organizations' ||
        relationship.targetEntity ===
          'organizations'
    ),

    version: 1,
  });