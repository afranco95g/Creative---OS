import { Card } from '@/components/primitives/card';

import {
  getEntityConfig,
  type EntityKey,
} from '../config';

import { entityService } from '../services';

import { EntityTable } from './EntityTable';

interface EntityListProps {
  entity: EntityKey;
}

export async function EntityList({
  entity,
}: EntityListProps) {
  const config = getEntityConfig(entity);

  const records = await entityService.list(entity);

  if (records.length === 0) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-medium text-white">
          No hay {config.plural.toLowerCase()}
        </h3>

        <p className="mt-2 text-sm text-neutral-500">
          Cuando existan registros aparecerán aquí automáticamente.
        </p>
      </Card>
    );
  }

  return (
    <EntityTable
      records={records}
      fields={config.fields}
    />
  );
}