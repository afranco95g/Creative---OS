import type { SchemaDefinition } from '../types/schema-definition';

export function createSchema(
  schema: SchemaDefinition
): SchemaDefinition {
  return {
    ...schema,

    version:
      schema.version ?? 1,

    relationships:
      schema.relationships ?? [],

    permissions: {
      create: true,
      read: true,
      update: true,
      delete: true,

      ...schema.permissions,
    },

    actions:
      schema.actions ?? [],
  };
}