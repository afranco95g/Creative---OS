import {
  createClient,
} from '../../lib/supabase/server';

export interface PublicExperience {
  id: string;
  title: string;
  slug: string;
  summary: string;
  description: string;
  experienceType: string;
  city: string | null;
  venueName: string | null;
  address: string | null;
  startsAt: string;
  endsAt: string | null;
  capacity: number | null;
  ticketUrl: string | null;
  coverImageUrl: string | null;
  projectId: string | null;
  hostSpaceId: string | null;
}

export interface PublicExperienceProject {
  id: string;
  slug: string;
  headline: string;
  summary: string;
}

export interface PublicExperienceSpace {
  id: string;
  slug: string;
  name: string;
  description: string;
}

export interface PublicExperienceDetail
  extends PublicExperience {
  project:
    PublicExperienceProject | null;

  hostSpace:
    PublicExperienceSpace | null;
}

interface PublicExperienceRow {
  id: string;
  title: string;
  slug: string;
  summary: string;
  description: string;
  experience_type: string;
  city: string | null;
  venue_name: string | null;
  address: string | null;
  starts_at: string;
  ends_at: string | null;
  capacity: number | null;
  ticket_url: string | null;
  cover_image_url: string | null;
  project_id: string | null;
  host_space_id: string | null;
}

interface PublicExperienceDetailRow
  extends PublicExperienceRow {
  project_slug: string | null;
  project_headline: string | null;
  project_summary: string | null;

  host_space_slug: string | null;
  host_space_name: string | null;
  host_space_description: string | null;
}

export async function listPublishedExperiences(
  limit = 50
): Promise<PublicExperience[]> {
  const supabase =
    await createClient();

  const database =
    supabase as any;

  const {
    data,
    error,
  } = await database.rpc(
    'list_published_experiences',
    {
      result_limit:
        limit,
    }
  );

  if (error) {
    console.error(
      'Error loading public agenda:',
      error
    );

    throw new Error(
      'No fue posible cargar la agenda cultural.'
    );
  }

  const rows =
    (
      data ?? []
    ) as PublicExperienceRow[];

  return rows.map(
    mapPublicExperience
  );
}

export async function getPublishedExperience(
  reference: string
): Promise<PublicExperienceDetail | null> {
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
    'get_published_experience_by_reference',
    {
      target_reference:
        cleanReference,
    }
  );

  if (error) {
    console.error(
      'Error loading public experience:',
      error
    );

    throw new Error(
      'No fue posible cargar la actividad publicada.'
    );
  }

  const rows =
    (
      data ?? []
    ) as PublicExperienceDetailRow[];

  const row =
    rows[0];

  if (!row) {
    return null;
  }

  return {
    ...mapPublicExperience(
      row
    ),

    project:
      row.project_id &&
      row.project_slug &&
      row.project_headline
        ? {
            id:
              row.project_id,

            slug:
              row.project_slug,

            headline:
              row.project_headline,

            summary:
              row.project_summary ?? '',
          }
        : null,

    hostSpace:
      row.host_space_id &&
      row.host_space_slug &&
      row.host_space_name
        ? {
            id:
              row.host_space_id,

            slug:
              row.host_space_slug,

            name:
              row.host_space_name,

            description:
              row.host_space_description ?? '',
          }
        : null,
  };
}

function mapPublicExperience(
  row:
    PublicExperienceRow
): PublicExperience {
  return {
    id:
      row.id,

    title:
      row.title,

    slug:
      row.slug,

    summary:
      row.summary,

    description:
      row.description,

    experienceType:
      row.experience_type,

    city:
      row.city,

    venueName:
      row.venue_name,

    address:
      row.address,

    startsAt:
      row.starts_at,

    endsAt:
      row.ends_at,

    capacity:
      row.capacity,

    ticketUrl:
      row.ticket_url,

    coverImageUrl:
      row.cover_image_url,

    projectId:
      row.project_id,

    hostSpaceId:
      row.host_space_id,
  };
}