import type { SchemaDefinition } from '../types/schema-definition';
import type { ResolvedField } from '../types/resolved-field';

import { fieldRegistry } from './field-registry';

export class FieldResolver {
  resolve(
    schema: SchemaDefinition
  ): ResolvedField[] {
    return schema.config.fields.map(
      (config) => {
        const definition =
          fieldRegistry.get(config.type);

        if (!definition) {
          throw new Error(
            `No existe una definición registrada para el tipo de campo "${config.type}".`
          );
        }

        return {
          config,
          definition,
        };
      }
    );
  }
}

export const fieldResolver =
  new FieldResolver();