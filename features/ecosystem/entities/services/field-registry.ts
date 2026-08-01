import type {
  EntityFieldConfig,
  EntityFieldType,
} from '../types/entity-config';

import type {
  FieldDefinition,
} from '../types/field-definition';

class FieldRegistry {
  private readonly definitions = new Map<
    EntityFieldType,
    FieldDefinition
  >();

  register(
    definition: FieldDefinition
  ): void {
    this.definitions.set(
      definition.type,
      definition
    );
  }

  registerMany(
    definitions: FieldDefinition[]
  ): void {
    definitions.forEach(
      (definition) => {
        this.register(definition);
      }
    );
  }

  get(
    type: EntityFieldType
  ): FieldDefinition | undefined {
    return this.definitions.get(type);
  }

  has(
    type: EntityFieldType
  ): boolean {
    return this.definitions.has(type);
  }

  getAll(): FieldDefinition[] {
    return Array.from(
      this.definitions.values()
    );
  }

  format(
    type: EntityFieldType,
    value: unknown,
    field: EntityFieldConfig
  ): string {
    const definition =
      this.get(type);

    if (!definition) {
      if (
        value === null ||
        value === undefined
      ) {
        return '';
      }

      return String(value);
    }

    return definition.format(
      value,
      field
    );
  }

  serialize(
    type: EntityFieldType,
    value: unknown,
    field: EntityFieldConfig
  ): unknown {
    const definition =
      this.get(type);

    if (!definition) {
      return value;
    }

    return definition.serialize(
      value,
      field
    );
  }

  deserialize(
    type: EntityFieldType,
    value: unknown,
    field: EntityFieldConfig
  ): unknown {
    const definition =
      this.get(type);

    if (!definition) {
      return value;
    }

    return definition.deserialize(
      value,
      field
    );
  }

  validate(
    type: EntityFieldType,
    value: unknown,
    field: EntityFieldConfig
  ): string | undefined {
    const definition =
      this.get(type);

    if (!definition) {
      return undefined;
    }

    return definition.validate(
      value,
      field
    );
  }
}

export const fieldRegistry =
  new FieldRegistry();
  