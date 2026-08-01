import {
  supabase,
} from '../../lib/supabase/client';

import {
  getProjectProgress,
} from '../../core/projectEngine';

import type {
  WorkspaceProject,
} from '../../types/workspace';

export type ProjectWorkflowStatus =
  | 'private'
  | 'eligibility_requested'
  | 'eligibility_rejected'
  | 'eligible'
  | 'submitted_to_media'
  | 'editorial_review'
  | 'publication_rejected'
  | 'published'
  | 'archived';

export interface CloudProjectSummary {
  id: string;

  ownerId: string;

  actorId: string | null;

  actorType:
    | 'person'
    | 'space'
    | 'funder'
    | null;

  title: string;

  description: string;

  category: string;

  stage: string;

  progress: number;

  workflowStatus:
    ProjectWorkflowStatus;

  eligibilityNote:
    string | null;

  editorialNote:
    string | null;

  eligibilityRequestedAt:
    string | null;

  eligibilityReviewedAt:
    string | null;

  submittedToMediaAt:
    string | null;

  editorialReviewedAt:
    string | null;

  publishedAt:
    string | null;

  clientUpdatedAt: string;

  remoteUpdatedAt: string;

  createdAt: string;
}

export interface ReviewProjectSummary
  extends CloudProjectSummary {
  ownerName: string;
  ownerEmail: string;
}

interface CloudProjectRow {
  id: string;
  owner_id: string;
  actor_id:
  string | null;

actor_type:
  | 'person'
  | 'space'
  | 'funder'
  | null;
  title: string;
  description: string;
  category: string;
  stage: string;
  progress: number;

  workflow_status:
    ProjectWorkflowStatus;

  eligibility_note:
    string | null;

  editorial_note:
    string | null;

  eligibility_requested_at:
    string | null;

  eligibility_reviewed_at:
    string | null;

  submitted_to_media_at:
    string | null;

  editorial_reviewed_at:
    string | null;

  published_at:
    string | null;

  client_updated_at:
    string;

  updated_at:
    string;

  created_at:
    string;
}

interface ProfileRow {
  id: string;
  full_name: string | null;
  email: string | null;
}

interface ExistingProjectRow {
  id: string;

  workflow_status:
    ProjectWorkflowStatus;
}

interface ProjectSyncResult {
  projects:
    CloudProjectSummary[];

  uploadedCount: number;
}

/*
 * Las tablas nuevas todavía no hacen parte de los
 * tipos generados de Supabase. Este cliente flexible
 * evita errores de TypeScript mientras regeneramos
 * esos tipos en una etapa posterior.
 */
function getDatabaseClient() {
  return supabase as any;
}

export async function loadMyCloudProjects():
  Promise<CloudProjectSummary[]> {
  const user =
    await getAuthenticatedUser();

  const database =
    getDatabaseClient();

  const {
    data,
    error,
  } = await database
    .from('projects')
    .select(
      [
        'id',
        'owner_id',
        'actor_id',
        'actor_type',
        'title',
        'description',
        'category',
        'stage',
        'progress',
        'workflow_status',
        'eligibility_note',
        'editorial_note',
        'eligibility_requested_at',
        'eligibility_reviewed_at',
        'submitted_to_media_at',
        'editorial_reviewed_at',
        'published_at',
        'client_updated_at',
        'updated_at',
        'created_at',
      ].join(', ')
    )
    .eq(
      'owner_id',
      user.id
    )
    .order(
      'updated_at',
      {
        ascending: false,
      }
    );

  if (error) {
    throw new Error(
      error.message ||
        'No fue posible cargar los proyectos guardados en Supabase.'
    );
  }

  const rows =
    (
      data ?? []
    ) as CloudProjectRow[];

  return rows.map(
    mapCloudProjectSummary
  );
}

export async function syncLocalProjectsToCloud(
  projects:
    WorkspaceProject[]
): Promise<ProjectSyncResult> {
  const user =
    await getAuthenticatedUser();

  if (
    projects.length === 0
  ) {
    return {
      projects:
        await loadMyCloudProjects(),

      uploadedCount: 0,
    };
  }

  const database =
    getDatabaseClient();

  const projectIds =
    projects.map(
      (project) =>
        project.id
    );

  /*
   * Recuperamos primero los estados existentes.
   * Esto evita que una sincronización posterior
   * devuelva accidentalmente un proyecto aprobado
   * al estado privado.
   */
  const {
    data:
      existingProjectData,

    error:
      existingProjectError,
  } = await database
    .from('projects')
    .select(
      'id, workflow_status'
    )
    .eq(
      'owner_id',
      user.id
    )
    .in(
      'id',
      projectIds
    );

  if (
    existingProjectError
  ) {
    throw new Error(
      existingProjectError.message ||
        'No fue posible comprobar el estado actual de los proyectos.'
    );
  }

  const existingProjects =
    (
      existingProjectData ??
      []
    ) as ExistingProjectRow[];

  const existingStatusById =
    new Map<
      string,
      ProjectWorkflowStatus
    >(
      existingProjects.map(
        (project) => [
          project.id,
          project.workflow_status,
        ]
      )
    );

  const payload =
    projects.map(
      (project) => ({
        id:
          project.id,

        owner_id:
          user.id,

        title:
          project.title,

        description:
          project.description,

        category:
          project.category,

        stage:
          project.graph.stage,

        progress:
          getProjectProgress(
            project.graph
          ),

        graph:
          project.graph,

        messages:
          project.messages,

        workflow_status:
          existingStatusById.get(
            project.id
          ) ?? 'private',

        client_updated_at:
          project.updatedAt,

        created_at:
          project.createdAt,
      })
    );

  const {
    error,
  } = await database
    .from('projects')
    .upsert(
      payload,
      {
        onConflict: 'id',
      }
    );

  if (error) {
    throw new Error(
      error.message ||
        'No fue posible vincular los proyectos con la cuenta.'
    );
  }

  return {
    projects:
      await loadMyCloudProjects(),

    uploadedCount:
      projects.length,
  };
}

export async function requestProjectEligibility(
  projectId: string
): Promise<void> {
  const user =
    await getAuthenticatedUser();

  const database =
    getDatabaseClient();

  const {
    error,
  } = await database
    .from('projects')
    .update({
      workflow_status:
        'eligibility_requested',
    })
    .eq('id', projectId)
    .eq(
      'owner_id',
      user.id
    );

  if (error) {
    throw new Error(
      error.message ||
        'No fue posible solicitar la revisión de elegibilidad.'
    );
  }
}

export async function submitProjectToMedia(
  projectId: string
): Promise<void> {
  const user =
    await getAuthenticatedUser();

  const database =
    getDatabaseClient();

  const {
    error,
  } = await database
    .from('projects')
    .update({
      workflow_status:
        'submitted_to_media',
    })
    .eq('id', projectId)
    .eq(
      'owner_id',
      user.id
    );

  if (error) {
    throw new Error(
      error.message ||
        'No fue posible postular el proyecto al medio.'
    );
  }
}

export async function loadEligibilityReviewQueue():
  Promise<ReviewProjectSummary[]> {
  return loadReviewProjects([
    'eligibility_requested',
  ]);
}

export async function reviewProjectEligibility(
  projectId: string,
  approved: boolean,
  note: string
): Promise<void> {
  const database =
    getDatabaseClient();

  const {
    error,
  } = await database
    .from('projects')
    .update({
      workflow_status:
        approved
          ? 'eligible'
          : 'eligibility_rejected',

      eligibility_note:
        note.trim() ||
        null,
    })
    .eq('id', projectId)
    .eq(
      'workflow_status',
      'eligibility_requested'
    );

  if (error) {
    throw new Error(
      error.message ||
        'No fue posible registrar la revisión de elegibilidad.'
    );
  }
}

export async function loadEditorialReviewQueue():
  Promise<ReviewProjectSummary[]> {
  return loadReviewProjects([
    'submitted_to_media',
    'editorial_review',
  ]);
}

export async function markProjectInEditorialReview(
  projectId: string
): Promise<void> {
  const database =
    getDatabaseClient();

  const {
    error,
  } = await database
    .from('projects')
    .update({
      workflow_status:
        'editorial_review',
    })
    .eq('id', projectId)
    .eq(
      'workflow_status',
      'submitted_to_media'
    );

  if (error) {
    throw new Error(
      error.message ||
        'No fue posible iniciar la revisión editorial.'
    );
  }
}

export async function reviewProjectPublication(
  projectId: string,
  approved: boolean,
  note: string
): Promise<void> {
  const database =
    getDatabaseClient();

  const {
    error,
  } = await database
    .from('projects')
    .update({
      workflow_status:
        approved
          ? 'published'
          : 'publication_rejected',

      editorial_note:
        note.trim() ||
        null,
    })
    .eq('id', projectId)
    .in(
      'workflow_status',
      [
        'submitted_to_media',
        'editorial_review',
      ]
    );

  if (error) {
    throw new Error(
      error.message ||
        'No fue posible registrar la decisión editorial.'
    );
  }
}

async function loadReviewProjects(
  statuses:
    ProjectWorkflowStatus[]
): Promise<ReviewProjectSummary[]> {
  await getAuthenticatedUser();

  const database =
    getDatabaseClient();

  const {
    data,
    error,
  } = await database
    .from('projects')
    .select(
      [
        'id',
        'owner_id',
        'actor_id',
        'actor_type',
        'title',
        'description',
        'category',
        'stage',
        'progress',
        'workflow_status',
        'eligibility_note',
        'editorial_note',
        'eligibility_requested_at',
        'eligibility_reviewed_at',
        'submitted_to_media_at',
        'editorial_reviewed_at',
        'published_at',
        'client_updated_at',
        'updated_at',
        'created_at',
      ].join(', ')
    )
    .in(
      'workflow_status',
      statuses
    )
    .order(
      'updated_at',
      {
        ascending: true,
      }
    );

  if (error) {
    throw new Error(
      error.message ||
        'No fue posible cargar la cola de revisión.'
    );
  }

  const projectRows =
    (
      data ?? []
    ) as CloudProjectRow[];

  const ownerIds =
    Array.from(
      new Set(
        projectRows.map(
          (project) =>
            project.owner_id
        )
      )
    );

  let profileRows:
    ProfileRow[] = [];

  if (
    ownerIds.length > 0
  ) {
    const {
      data:
        profileData,

      error:
        profileError,
    } = await database
      .from('profiles')
      .select(
        'id, full_name, email'
      )
      .in(
        'id',
        ownerIds
      );

    if (profileError) {
      throw new Error(
        profileError.message ||
          'No fue posible cargar los propietarios de los proyectos.'
      );
    }

    profileRows =
      (
        profileData ?? []
      ) as ProfileRow[];
  }

  return projectRows.map(
    (row) => {
      const owner =
        profileRows.find(
          (profile) =>
            profile.id ===
            row.owner_id
        );

      return {
        ...mapCloudProjectSummary(
          row
        ),

        ownerName:
          owner?.full_name ||
          'Persona del ecosistema',

        ownerEmail:
          owner?.email ||
          '',
      };
    }
  );
}

async function getAuthenticatedUser() {
  const {
    data: {
      user,
    },

    error,
  } =
    await supabase.auth.getUser();

  if (
    error ||
    !user
  ) {
    throw new Error(
      'Debes iniciar sesión para realizar esta acción.'
    );
  }

  return user;
}

function mapCloudProjectSummary(
  row: CloudProjectRow
): CloudProjectSummary {
  return {
    id:
      row.id,

    ownerId:
      row.owner_id,

    actorId:
      row.actor_id,

    actorType:
      row.actor_type,

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

    workflowStatus:
      row.workflow_status,

    eligibilityNote:
      row.eligibility_note,

    editorialNote:
      row.editorial_note,

    eligibilityRequestedAt:
      row.eligibility_requested_at,

    eligibilityReviewedAt:
      row.eligibility_reviewed_at,

    submittedToMediaAt:
      row.submitted_to_media_at,

    editorialReviewedAt:
      row.editorial_reviewed_at,

    publishedAt:
      row.published_at,

    clientUpdatedAt:
      row.client_updated_at,

    remoteUpdatedAt:
      row.updated_at,

    createdAt:
      row.created_at,
  };
}
