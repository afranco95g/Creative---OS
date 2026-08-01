import { createSchema } from '../factories/create-schema';

import { relationships } from '../relationships';

import { peopleConfig } from './people';

export const peopleSchema =
  createSchema({
    entity: 'people',

    config: peopleConfig,

    relationships: relationships.filter(
      (relationship) =>
        relationship.sourceEntity ===
          'people' ||
        relationship.targetEntity ===
          'people'
    ),

    version: 1,
  });