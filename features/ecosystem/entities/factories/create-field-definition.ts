import type {
  FieldDefinition,
} from '../types/field-definition';

type FieldDefinitionDefaults =
  | 'serialize'
  | 'deserialize'
  | 'format'
  | 'validate'
  | 'componentProps';

export type CreateFieldDefinitionOptions =
  Omit<
    FieldDefinition,
    FieldDefinitionDefaults
  > &
  Partial<
    Pick<
      FieldDefinition,
      FieldDefinitionDefaults
    >
  >;

export function createFieldDefinition(
  definition: CreateFieldDefinitionOptions
): FieldDefinition {
  return {
    ...definition,

    componentProps:
      definition.componentProps ?? {},

    serialize:
      definition.serialize ??
      ((value) => value),

    deserialize:
      definition.deserialize ??
      ((value) => value),

    format:
      definition.format ??
      ((value) =>
        value === null ||
        value === undefined
          ? ''
          : String(value)
      ),

    validate:
      definition.validate ??
      (() => undefined),
  };
}