import {
  createClient,
} from '../../lib/supabase/server';

export interface PublicProjectActor {
  actorType:
    | 'person'
    | 'space'
    | 'funder';

  actorId: string;
  name: string;
  subtitle: string;
  slug: string;
  imageUrl: string | null;
  relationshipLabel: string;
  sortOrder: number;
}

export interface PublicProjectSummary {
  id: string;
  title: string;
  description: string;
  category: string;
  stage: string;
  progress: number;

  slug: string;
  headline: string;
  summary: string;
  coverImageUrl: string | null;
  city: string | null;
  disciplines: string[];

  publishedAt: string | null;
  updatedAt: string;
}

export interface PublicProjectDetail
  extends PublicProjectSummary {
  body: string;
  credits: string;
  actors: PublicProjectActor[];
}

interface PublicProjectSummaryRow {
  id: string;
  title: string;
  description: string;
  category: string;
  stage: string;
  progress: number;

  slug: string;
  headline: string;
  summary: string;
  cover_image_url: string | null;
  city: string | null;
  disciplines: string[] | null;

  published_at: string | null;
  updated_at: string;
}

interface PublicProjectDetailRow
  extends PublicProjectSummaryRow {
  body: string;
  credits: string;
}

interface PublicProjectActorRow {
  actor_type:
    | 'person'
    | 'space'
    | 'funder';

  actor_id: string;
  name: string;
  subtitle: string | null;
  slug: string;
  image_url: string | null;
  relationship_label: string;
  sort_order: number;
}

export async function listPublishedProjects():
  Promise<PublicProjectSummary[]> {
  const supabase =
    await createClient();

  const database =
    supabase as any;

  const {
    data,
    error,
  } = await database.rpc(
    'list_published_projects'
  );

  if (error) {
    console.error(
      'Error loading published projects:',
      error
    );

    throw new Error(
      'No fue posible cargar los proyectos publicados.'
    );
  }

  const rows =
    (
      data ?? []
    ) as PublicProjectSummaryRow[];

  return rows.map(
    mapPublicProjectSummary
  );
}

export async function getPublishedProject(
  reference: string
): Promise<PublicProjectDetail | null> {
  const cleanReference =
    reference.trim();

  if (!cleanReference) {
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
    'get_published_project_by_reference',
    {
      target_reference:
        cleanReference,
    }
  );

  if (error) {
    console.error(
      'Error loading published project:',
      error
    );

    throw new Error(
      'No fue posible cargar el proyecto publicado.'
    );
  }

  const rows =
    (
      data ?? []
    ) as PublicProjectDetailRow[];

  const projectRow =
    rows[0];

  if (!projectRow) {
    return null;
  }

  const project =
    mapPublicProjectSummary(
      projectRow
    );

  const {
    data: actorData,
    error: actorError,
  } = await database.rpc(
    'get_published_project_actors',
    {
      target_project_id:
        project.id,
    }
  );

  if (actorError) {
    console.error(
      'Error loading project actors:',
      actorError
    );
  }

  const actorRows =
    (
      actorData ?? []
    ) as PublicProjectActorRow[];

  return {
    ...project,

    body:
      projectRow.body ?? '',

    credits:
      projectRow.credits ?? '',

    actors:
      actorRows.map(
        (row) => ({
          actorType:
            row.actor_type,

          actorId:
            row.actor_id,

          name:
            row.name,

          subtitle:
            row.subtitle ?? '',

          slug:
            row.slug,

          imageUrl:
            row.image_url,

          relationshipLabel:
            row.relationship_label,

          sortOrder:
            row.sort_order,
        })
      ),
  };
}

function mapPublicProjectSummary(
  row: PublicProjectSummaryRow
): PublicProjectSummary {
  return {
    id:
      row.id,

    title:
      row.title,

    description:
      row.description,

    category:
      row.category,

    stage:
      row.stage,

    progress:
      row.progress,

    slug:
      row.slug,

    headline:
      row.headline?.trim() ||
      row.title,

    summary:
      row.summary?.trim() ||
      row.description,

    coverImageUrl:
      row.cover_image_url,

    city:
      row.city,

    disciplines:
      Array.isArray(
        row.disciplines
      )
        ? row.disciplines
        : [],

    publishedAt:
      row.published_at,

    updatedAt:
      row.updated_at,
  };
}