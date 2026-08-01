import {
  createClient,
} from '../../lib/supabase/server';

export type PublicActorType =
  | 'person'
  | 'space'
  | 'funder';

export interface PublicEcosystemActor {
  actorType: PublicActorType;
  actorId: string;
  name: string;
  slug: string;
  headline: string;
  description: string;
  imageUrl: string | null;
  city: string | null;
  department: string | null;
  country: string | null;
  labels: string[];
  offers: string[];
  interests: string[];
  verified: boolean;
  featured: boolean;
}

export interface PublicActorProject {
  projectId: string;
  slug: string;
  headline: string;
  summary: string;
  coverImageUrl: string | null;
  city: string | null;
  category: string;
  relationshipLabel: string;
  publishedAt: string | null;
}

interface PublicEcosystemActorRow {
  actor_type: PublicActorType;
  actor_id: string;
  name: string;
  slug: string;
  headline: string;
  description: string;
  image_url: string | null;
  city: string | null;
  department: string | null;
  country: string | null;
  labels: string[] | null;
  offers: string[] | null;
  interests: string[] | null;
  verified: boolean | null;
  featured: boolean | null;
}

interface PublicActorProjectRow {
  project_id: string;
  slug: string;
  headline: string;
  summary: string;
  cover_image_url: string | null;
  city: string | null;
  category: string;
  relationship_label: string;
  published_at: string | null;
}

export async function listPublishedEcosystemActors():
  Promise<PublicEcosystemActor[]> {
  const supabase =
    await createClient();

  const database =
    supabase as any;

  const {
    data,
    error,
  } = await database.rpc(
    'list_published_ecosystem_actors'
  );

  if (error) {
    console.error(
      'Error loading public ecosystem:',
      error
    );

    throw new Error(
      'No fue posible cargar el ecosistema público.'
    );
  }

  const rows =
    (
      data ?? []
    ) as PublicEcosystemActorRow[];

  return rows.map(
    mapPublicActor
  );
}

export async function getPublishedEcosystemActor(
  actorType: PublicActorType,
  slug: string
): Promise<PublicEcosystemActor | null> {
  const cleanSlug =
    slug.trim();

  if (!cleanSlug) {
    return null;
  }

  const supabase =
    await createClient();

  const database =
    supabase as any;

  const {
    data,
    error,
  } = await database.rpc(
    'get_published_ecosystem_actor',
    {
      target_actor_type:
        actorType,

      target_slug:
        cleanSlug,
    }
  );

  if (error) {
    console.error(
      'Error loading public actor:',
      error
    );

    throw new Error(
      'No fue posible cargar el perfil público.'
    );
  }

  const rows =
    (
      data ?? []
    ) as PublicEcosystemActorRow[];

  return rows[0]
    ? mapPublicActor(rows[0])
    : null;
}

export async function getPublishedActorProjects(
  actorType: PublicActorType,
  actorId: string
): Promise<PublicActorProject[]> {
  const supabase =
    await createClient();

  const database =
    supabase as any;

  const {
    data,
    error,
  } = await database.rpc(
    'get_published_actor_projects',
    {
      target_actor_type:
        actorType,

      target_actor_id:
        actorId,
    }
  );

  if (error) {
    console.error(
      'Error loading actor projects:',
      error
    );

    throw new Error(
      'No fue posible cargar los proyectos relacionados.'
    );
  }

  const rows =
    (
      data ?? []
    ) as PublicActorProjectRow[];

  return rows.map(
    (row) => ({
      projectId:
        row.project_id,

      slug:
        row.slug,

      headline:
        row.headline,

      summary:
        row.summary,

      coverImageUrl:
        row.cover_image_url,

      city:
        row.city,

      category:
        row.category,

      relationshipLabel:
        row.relationship_label,

      publishedAt:
        row.published_at,
    })
  );
}

export function getPublicActorHref(
  actor:
    Pick<
      PublicEcosystemActor,
      'actorType' | 'slug'
    >
): string {
  const pathByType:
    Record<
      PublicActorType,
      string
    > = {
      person:
        'personas',

      space:
        'espacios',

      funder:
        'financiadores',
    };

  return `/ecosistema/${
    pathByType[
      actor.actorType
    ]
  }/${actor.slug}`;
}

function mapPublicActor(
  row: PublicEcosystemActorRow
): PublicEcosystemActor {
  return {
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

    imageUrl:
      row.image_url,

    city:
      row.city,

    department:
      row.department,

    country:
      row.country,

    labels:
      Array.isArray(
        row.labels
      )
        ? row.labels
        : [],

    offers:
      Array.isArray(
        row.offers
      )
        ? row.offers
        : [],

    interests:
      Array.isArray(
        row.interests
      )
        ? row.interests
        : [],

    verified:
      Boolean(
        row.verified
      ),

    featured:
      Boolean(
        row.featured
      ),
  };
}