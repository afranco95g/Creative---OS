import { PageHeader } from '@/components/ui/PageHeader';

import { getEntityConfig } from '../config';

import { EntityList } from './EntityList';

import type { EntityPageProps } from '../types/entity-page';

export async function EntityPage({
  entity,
}: EntityPageProps) {
  const config = getEntityConfig(entity);

  return (
    <main className="space-y-8">
      <PageHeader
        eyebrow="Workspace"
        title={config.plural}
        description={config.description}
      />

      <EntityList entity={entity} />
    </main>
  );
}