import type { HTMLInputTypeAttribute } from 'react';

import { InputField } from '../components/fields/InputField';

import type {
  EntityFieldConfig,
  EntityFieldType,
} from '../types/entity-config';

import type {
  CreateFieldDefinitionOptions,
} from './create-field-definition';

import { createFieldDefinition } from './create-field-definition';

interface CreateInputFieldDefinitionOptions {
  type: EntityFieldType;

  inputType: HTMLInputTypeAttribute;

  validate?: (
    value: unknown,
    field: EntityFieldConfig
  ) => string | undefined;

  serialize?: (
    value: unknown,
    field: EntityFieldConfig
  ) => unknown;

  deserialize?: (
    value: unknown,
    field: EntityFieldConfig
  ) => unknown;

  format?: (
    value: unknown,
    field: EntityFieldConfig
  ) => string;
}

export function createInputFieldDefinition({
  type,
  inputType,
  validate,
  serialize,
  deserialize,
  format,
}: CreateInputFieldDefinitionOptions) {
  const definition: CreateFieldDefinitionOptions = {
    type,

    component: InputField,

    componentProps: {
      inputType,
    },

    serialize,

    deserialize,

    format,

    validate,
  };

  return createFieldDefinition(definition);
}