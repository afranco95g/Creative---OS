import {
  supabase,
} from '../../lib/supabase/client';

export type ExperienceType =
  | 'event'
  | 'workshop'
  | 'class'
  | 'laboratory'
  | 'exhibition'
  | 'concert'
  | 'meeting'
  | 'activation'
  | 'residency'
  | 'call'
  | 'other';

export type ExperienceStatus =
  | 'draft'
  | 'submitted'
  | 'published'
  | 'rejected'
  | 'cancelled'
  | 'archived';

export type ExperienceRelationType =
  | 'project'
  | 'space';

export interface ExperienceRelationOption {
  optionType:
    ExperienceRelationType;

  optionId:
    string;

  name:
    string;

  subtitle:
    string;
}

export interface ManagedExperience {
  id: string;
  ownerId: string;
  ownerName: string;
  title: string;
  slug: string;
  summary: string;
  description: string;
  experienceType:
    ExperienceType;
  city: string;
  venueName: string;
  address: string;
  startsAt: string;
  endsAt: string | null;
  capacity: number | null;
  ticketUrl: string;
  coverImageUrl: string;
  status:
    ExperienceStatus;
  reviewNote: string;
  projectId: string | null;
  hostSpaceId: string | null;
  publishedAt: string | null;
  isOwner: boolean;
  canReview: boolean;
}

export interface ExperienceFormInput {
  title: string;
  summary: string;
  description: string;

  experienceType:
    ExperienceType;

  city: string;
  venueName: string;
  address: string;
  startsAt: string;
  endsAt: string;
  capacity: string;
  ticketUrl: string;
  coverImageUrl: string;
  projectId: string;
  hostSpaceId: string;
}

interface ManagedExperienceRow {
  id: string;
  owner_id: string;
  owner_name: string;
  title: string;
  slug: string;
  summary: string;
  description: string;

  experience_type:
    ExperienceType;

  city: string | null;
  venue_name: string | null;
  address: string | null;
  starts_at: string;
  ends_at: string | null;
  capacity: number | null;
  ticket_url: string | null;
  cover_image_url: string | null;

  experience_status:
    ExperienceStatus;

  review_note: string | null;
  project_id: string | null;
  host_space_id: string | null;
  published_at: string | null;
  is_owner: boolean;
  can_review: boolean;
}

interface ExperienceRelationOptionRow {
  option_type:
    ExperienceRelationType;

  option_id:
    string;

  name:
    string;

  subtitle:
    string | null;
}

interface ExperiencePayload {
  title: string;
  summary: string;
  description: string;

  experience_type:
    ExperienceType;

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

function getDatabase() {
  return supabase as any;
}

export async function loadManageableExperiences():
  Promise<ManagedExperience[]> {
  const database =
    getDatabase();

  const {
    data,
    error,
  } = await database.rpc(
    'list_manageable_experiences'
  );

  if (error) {
    throw new Error(
      error.message ||
        'No fue posible cargar la agenda.'
    );
  }

  const rows =
    (
      data ?? []
    ) as ManagedExperienceRow[];

  return rows.map(
    mapManagedExperience
  );
}

export async function loadExperienceRelationOptions():
  Promise<ExperienceRelationOption[]> {
  const database =
    getDatabase();

  const {
    data,
    error,
  } = await database.rpc(
    'list_experience_relation_options'
  );

  if (error) {
    throw new Error(
      error.message ||
        'No fue posible cargar los proyectos y espacios disponibles.'
    );
  }

  const rows =
    (
      data ?? []
    ) as ExperienceRelationOptionRow[];

  return rows.map(
    (row) => ({
      optionType:
        row.option_type,

      optionId:
        row.option_id,

      name:
        row.name,

      subtitle:
        row.subtitle ?? '',
    })
  );
}

export async function createExperience(
  input:
    ExperienceFormInput
): Promise<void> {
  const {
    data: {
      user,
    },
    error: userError,
  } =
    await supabase.auth.getUser();

  if (
    userError ||
    !user
  ) {
    throw new Error(
      'Debes iniciar sesión para crear una experiencia.'
    );
  }

  const payload =
    buildExperiencePayload(
      input
    );

  const database =
    getDatabase();

  const {
    error,
  } = await database
    .from('experiences')
    .insert({
      owner_id:
        user.id,

      ...payload,

      status:
        'draft',
    });

  if (error) {
    throw new Error(
      error.message ||
        'No fue posible crear la experiencia.'
    );
  }
}

export async function updateExperience(
  experienceId: string,
  input:
    ExperienceFormInput
): Promise<void> {
  const payload =
    buildExperiencePayload(
      input
    );

  const database =
    getDatabase();

  const {
    data,
    error,
  } = await database
    .from('experiences')
    .update(payload)
    .eq(
      'id',
      experienceId
    )
    .select('id')
    .maybeSingle();

  if (error) {
    throw new Error(
      error.message ||
        'No fue posible guardar los cambios de la experiencia.'
    );
  }

  if (!data) {
    throw new Error(
      'No tienes permiso para editar esta experiencia o su estado ya no permite cambios.'
    );
  }
}

export async function submitExperienceForReview(
  experienceId: string
): Promise<void> {
  const database =
    getDatabase();

  const {
    error,
  } = await database.rpc(
    'submit_experience_for_review',
    {
      target_experience_id:
        experienceId,
    }
  );

  if (error) {
    throw new Error(
      error.message ||
        'No fue posible enviar la experiencia a revisión.'
    );
  }
}

export async function reviewExperience(
  experienceId: string,
  approved: boolean,
  note: string
): Promise<void> {
  const database =
    getDatabase();

  const {
    error,
  } = await database.rpc(
    'review_experience_publication',
    {
      target_experience_id:
        experienceId,

      approve_experience:
        approved,

      reviewer_note:
        note,
    }
  );

  if (error) {
    throw new Error(
      error.message ||
        'No fue posible revisar la experiencia.'
    );
  }
}

function buildExperiencePayload(
  input:
    ExperienceFormInput
): ExperiencePayload {
  if (!input.title.trim()) {
    throw new Error(
      'Escribe el nombre de la experiencia.'
    );
  }

  if (!input.startsAt) {
    throw new Error(
      'Selecciona la fecha y hora de inicio.'
    );
  }

  const startsAt =
    new Date(
      input.startsAt
    );

  const endsAt =
    input.endsAt
      ? new Date(
          input.endsAt
        )
      : null;

  if (
    Number.isNaN(
      startsAt.getTime()
    )
  ) {
    throw new Error(
      'La fecha de inicio no es válida.'
    );
  }

  if (
    endsAt &&
    Number.isNaN(
      endsAt.getTime()
    )
  ) {
    throw new Error(
      'La fecha de finalización no es válida.'
    );
  }

  if (
    endsAt &&
    endsAt <= startsAt
  ) {
    throw new Error(
      'La fecha de finalización debe ser posterior al inicio.'
    );
  }

  const capacity =
    input.capacity.trim()
      ? Number(
          input.capacity
        )
      : null;

  if (
    capacity !== null &&
    (
      Number.isNaN(capacity) ||
      capacity < 0
    )
  ) {
    throw new Error(
      'La capacidad debe ser un número válido.'
    );
  }

  return {
    title:
      input.title.trim(),

    summary:
      input.summary.trim(),

    description:
      input.description.trim(),

    experience_type:
      input.experienceType,

    city:
      input.city.trim() ||
      null,

    venue_name:
      input.venueName.trim() ||
      null,

    address:
      input.address.trim() ||
      null,

    starts_at:
      startsAt.toISOString(),

    ends_at:
      endsAt
        ? endsAt.toISOString()
        : null,

    capacity,

    ticket_url:
      input.ticketUrl.trim() ||
      null,

    cover_image_url:
      input.coverImageUrl.trim() ||
      null,

    project_id:
      input.projectId ||
      null,

    host_space_id:
      input.hostSpaceId ||
      null,
  };
}

function mapManagedExperience(
  row:
    ManagedExperienceRow
): ManagedExperience {
  return {
    id:
      row.id,

    ownerId:
      row.owner_id,

    ownerName:
      row.owner_name,

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
      row.city ?? '',

    venueName:
      row.venue_name ?? '',

    address:
      row.address ?? '',

    startsAt:
      row.starts_at,

    endsAt:
      row.ends_at,

    capacity:
      row.capacity,

    ticketUrl:
      row.ticket_url ?? '',

    coverImageUrl:
      row.cover_image_url ?? '',

    status:
      row.experience_status,

    reviewNote:
      row.review_note ?? '',

    projectId:
      row.project_id,

    hostSpaceId:
      row.host_space_id,

    publishedAt:
      row.published_at,

    isOwner:
      Boolean(
        row.is_owner
      ),

    canReview:
      Boolean(
        row.can_review
      ),
  };
}