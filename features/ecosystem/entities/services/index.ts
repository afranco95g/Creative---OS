import { EntityService } from './entity-service';

import { SupabaseEntityRepository } from '../repositories/supabase-entity-repository';

export const entityService =
  new EntityService(
    new SupabaseEntityRepository(),
  );

export { EntityService };