import type { EntityKey } from '../config';

import type { EntityRepository } from '../repositories/entity-repository';

import { workspaceRegistry } from './workspace-registry';

export interface EntitySummary {
  entity: EntityKey;
  singular: string;
  plural: string;
  description: string;
  subtitle?: string;
  icon: string;
  color: string;
  route: string;
  count: number;
}

export class EntityService {
  constructor(
    private readonly repository: EntityRepository,
  ) {}

  async getDashboardSummary(): Promise<EntitySummary[]> {
    const configs = workspaceRegistry.getDashboard();

    return Promise.all(
      configs.map(async (config) => ({
        entity: config.entity as EntityKey,
        singular: config.singular,
        plural: config.plural,
        description: config.description,
        subtitle: config.dashboard?.subtitle,
        icon: config.icon,
        color: config.color,
        route: config.route,
        count: await this.count(
          config.entity as EntityKey,
        ),
      })),
    );
  }

  async list(entity: EntityKey) {
    return this.repository.list(entity);
  }

  async count(entity: EntityKey) {
    try {
      return await this.repository.count(entity);
    } catch (error) {
      console.warn(
        `No fue posible obtener el conteo de "${entity}".`,
        error,
      );

      return 0;
    }
  }

  async get(
    entity: EntityKey,
    id: string,
  ) {
    return this.repository.get(entity, id);
  }

  async create(
    entity: EntityKey,
    payload: Record<string, unknown>,
  ) {
    return this.repository.create(
      entity,
      payload,
    );
  }

  async update(
    entity: EntityKey,
    id: string,
    payload: Record<string, unknown>,
  ) {
    return this.repository.update(
      entity,
      id,
      payload,
    );
  }

  async delete(
    entity: EntityKey,
    id: string,
  ) {
    return this.repository.delete(
      entity,
      id,
    );
  }
}