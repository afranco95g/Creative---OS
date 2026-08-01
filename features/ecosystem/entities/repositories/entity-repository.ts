import type { EntityKey } from '../config';

export interface EntityRepository {
  list(entity: EntityKey): Promise<unknown[]>;

  count(entity: EntityKey): Promise<number>;

  get(
    entity: EntityKey,
    id: string,
  ): Promise<unknown | null>;

  create(
    entity: EntityKey,
    data: Record<string, unknown>,
  ): Promise<unknown>;

  update(
    entity: EntityKey,
    id: string,
    data: Record<string, unknown>,
  ): Promise<unknown>;

  delete(
    entity: EntityKey,
    id: string,
  ): Promise<void>;
}