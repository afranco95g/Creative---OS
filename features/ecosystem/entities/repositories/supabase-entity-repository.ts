import { createClient } from '@/lib/supabase/server';

import {
  getEntityConfig,
  type EntityKey,
} from '../config';

import type { EntityRepository } from './entity-repository';

export class SupabaseEntityRepository
  implements EntityRepository
{
  async list(entity: EntityKey): Promise<unknown[]> {
    const supabase = await createClient();
    const config = getEntityConfig(entity);

    const { data, error } = await supabase
      .from(config.table)
      .select('*')
      .order(config.defaultSort.column, {
        ascending: config.defaultSort.ascending,
      });

    if (error) {
      throw new Error(error.message);
    }

    return data ?? [];
  }

  async count(entity: EntityKey): Promise<number> {
    const supabase = await createClient();
    const config = getEntityConfig(entity);

    const { count, error } = await supabase
      .from(config.table)
      .select('*', {
        count: 'exact',
        head: true,
      });

    if (error) {
      throw new Error(error.message);
    }

    return count ?? 0;
  }

  async get(
    entity: EntityKey,
    id: string,
  ): Promise<unknown | null> {
    const supabase = await createClient();
    const config = getEntityConfig(entity);

    const { data, error } = await supabase
      .from(config.table)
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  async create(
    entity: EntityKey,
    payload: Record<string, unknown>,
  ): Promise<unknown> {
    const supabase = await createClient();
    const config = getEntityConfig(entity);

    const { data, error } = await supabase
      .from(config.table)
      .insert(payload)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  async update(
    entity: EntityKey,
    id: string,
    payload: Record<string, unknown>,
  ): Promise<unknown> {
    const supabase = await createClient();
    const config = getEntityConfig(entity);

    const { data, error } = await supabase
      .from(config.table)
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  async delete(
    entity: EntityKey,
    id: string,
  ): Promise<void> {
    const supabase = await createClient();
    const config = getEntityConfig(entity);

    const { error } = await supabase
      .from(config.table)
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(error.message);
    }
  }
}