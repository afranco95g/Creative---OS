import type { EntityKey } from '../types/entity-key';
import type { SchemaDefinition } from '../types/schema-definition';

import { organizationsSchema } from '../config/organizations-schema';
import { peopleSchema } from '../config/people-schema';

const schemas: Partial<
  Record<EntityKey, SchemaDefinition>
> = {
  people: peopleSchema,
  organizations: organizationsSchema,
};

export class SchemaResolver {
  resolve(
    entity: EntityKey
  ): SchemaDefinition | undefined {
    return schemas[entity];
  }

  has(
    entity: EntityKey
  ): boolean {
    return entity in schemas;
  }

  getAll(): SchemaDefinition[] {
    return Object.values(
      schemas
    ).filter(
      (
        schema
      ): schema is SchemaDefinition =>
        schema !== undefined
    );
  }
}

export const schemaResolver =
  new SchemaResolver();