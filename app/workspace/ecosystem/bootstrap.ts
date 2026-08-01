import { kernel } from '../../../core/kernel/kernel';

import { entityPlugins } from '../../../features/ecosystem/entities/plugins';

let booted = false;

export function bootstrapEcosystem(): void {
  if (booted) {
    return;
  }

  kernel.registerMany(entityPlugins);

  kernel.initialize();

  booted = true;
}