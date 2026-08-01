import type { EntityFieldConfig } from './entity-config';
import type { FieldDefinition } from './field-definition';

export interface ResolvedField {
  config: EntityFieldConfig;

  definition: FieldDefinition;
}