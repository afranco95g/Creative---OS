import type { EntityKey } from '../types/entity-key';
import type { SchemaDefinition } from '../types/schema-definition';

class SchemaRegistry {
  private readonly schemas = new Map<
    EntityKey,
    SchemaDefinition
  >();

  register(
    schema: SchemaDefinition
  ): void {
    this.schemas.set(
      schema.entity,
      schema
    );
  }

  registerMany(
    schemas: SchemaDefinition[]
  ): void {
    schemas.forEach((schema) => {
      this.register(schema);
    });
  }

  get(
    entity: EntityKey
  ): SchemaDefinition | undefined {
    return this.schemas.get(entity);
  }

  has(
    entity: EntityKey
  ): boolean {
    return this.schemas.has(entity);
  }

  getAll(): SchemaDefinition[] {
    return Array.from(
      this.schemas.values()
    );
  }
}

export const schemaRegistry =
  new SchemaRegistry();