import type { KernelPlugin } from '../../../../core/kernel/plugin';

import { textFieldDefinition } from '../components/fields/TextFieldDefinition';
import { fieldRegistry } from '../services/field-registry';

export const textFieldPlugin: KernelPlugin = {
  id: 'field-text',

  name: 'Campo de texto',

  priority: 10,

  register() {
    fieldRegistry.register(
      textFieldDefinition
    );
  },
};