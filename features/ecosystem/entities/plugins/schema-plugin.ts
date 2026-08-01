import type { KernelPlugin } from '../../../../core/kernel/plugin';

import { organizationsSchema } from '../config/organizations-schema';
import { peopleSchema } from '../config/people-schema';

import { schemaRegistry } from '../services/schema-registry';

export const schemaPlugin: KernelPlugin = {
  id: 'entity-schemas',

  name: 'Schemas de entidades',

  priority: 20,

  register() {
    schemaRegistry.registerMany([
      peopleSchema,
      organizationsSchema,
    ]);
  },
};