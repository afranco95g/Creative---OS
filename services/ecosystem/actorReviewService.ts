import {
  supabase,
} from '../../lib/supabase/client';

export type EcosystemActorType =
  | 'person'
  | 'space'
  | 'funder';

export type EcosystemActorStatus =
  | 'draft'
  | 'review'
  | 'published'
  | 'archived';

export interface EcosystemActorReviewItem {
  actorType: EcosystemActorType;
  actorId: string;
  name: string;
  slug: string;
  headline: string;
  description: string;
  city: string | null;
  country: string | null;
  status: EcosystemActorStatus;
  verified: boolean;
  featured: boolean;
}

interface EcosystemActorReviewRow {
  actor_type: EcosystemActorType;
  actor_id: string;
  name: string;
  slug: string;
  headline: string;
  description: string;
  city: string | null;
  country: string | null;
  actor_status: EcosystemActorStatus;
  verified: boolean;
  featured: boolean;
}

function getDatabase() {
  return supabase as any;
}

export async function loadEcosystemActorsForReview():
  Promise<EcosystemActorReviewItem[]> {
  const database =
    getDatabase();

  const {
    data,
    error,
  } = await database.rpc(
    'list_ecosystem_actors_for_review'
  );

  if (error) {
    throw new Error(
      error.message ||
        'No fue posible cargar los actores del ecosistema.'
    );
  }

  const rows =
    (
      data ?? []
    ) as EcosystemActorReviewRow[];

  return rows.map(
    (row) => ({
      actorType:
        row.actor_type,

      actorId:
        row.actor_id,

      name:
        row.name,

      slug:
        row.slug,

      headline:
        row.headline,

      description:
        row.description,

      city:
        row.city,

      country:
        row.country,

      status:
        row.actor_status,

      verified:
        Boolean(
          row.verified
        ),

      featured:
        Boolean(
          row.featured
        ),
    })
  );
}

export async function updateEcosystemActorPublication(
  actor:
    EcosystemActorReviewItem,
  status:
    EcosystemActorStatus,
  verified:
    boolean,
  featured:
    boolean
): Promise<void> {
  const database =
    getDatabase();

  const {
    error,
  } = await database.rpc(
    'update_ecosystem_actor_publication',
    {
      target_actor_type:
        actor.actorType,

      target_actor_id:
        actor.actorId,

      target_status:
        status,

      target_verified:
        verified,

      target_featured:
        featured,
    }
  );

  if (error) {
    throw new Error(
      error.message ||
        'No fue posible actualizar el actor.'
    );
  }
}