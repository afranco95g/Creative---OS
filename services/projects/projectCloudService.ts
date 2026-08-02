import { getProjectProgress } from '@/core/projectEngine';
import { supabase } from '@/lib/supabase/client';

import type {
  ConversationMessage,
  ProjectGraph,
} from '@/types/project';
import type {
  WorkspaceActorType,
  WorkspaceProject,
} from '@/types/workspace';

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
  actorType: WorkspaceActorType | null;
  title: string;
  description: string;
  category: string;
  stage: string;
  progress: number;
  workflowStatus: ProjectWorkflowStatus;
  eligibilityNote: string | null;
  editorialNote: string | null;
  eligibilityRequestedAt: string | null;
  eligibilityReviewedAt: string | null;
  submittedToMediaAt: string | null;
  editorialReviewedAt: string | null;
  publishedAt: string | null;
  clientUpdatedAt: string;
  remoteUpdatedAt: string;
  createdAt: string;
}

export interface CloudWorkspaceProject
  extends CloudProjectSummary {
  graph: ProjectGraph;
  messages: ConversationMessage[];
}

export interface ReviewProjectSummary
  extends CloudProjectSummary {
  ownerName: string;
  ownerEmail: string;
}

interface CloudProjectRow {
  id: string;
  owner_id: string;
  actor_id: string | null;
  actor_type: WorkspaceActorType | null;
  title: string;
  description: string;
  category: string;
  stage: string;
  progress: number;
  graph: ProjectGraph;
  messages: ConversationMessage[] | null;
  workflow_status: ProjectWorkflowStatus;
  eligibility_note: string | null;
  editorial_note: string | null;
  eligibility_requested_at: string | null;
  eligibility_reviewed_at: string | null;
  submitted_to_media_at: string | null;
  editorial_reviewed_at: string | null;
  published_at: string | null;
  client_updated_at: string;
  updated_at: string;
  created_at: string;
}

interface ExistingProjectRow {
  id: string;
  workflow_status: ProjectWorkflowStatus;
  client_updated_at: string;
}

interface EditorialReviewRow {
  project_id: string;
  owner_id: string;
  owner_name: string;
  owner_email: string;
  actor_id: string | null;
  actor_type: WorkspaceActorType | null;
  title: string;
  description: string;
  category: string;
  stage: string;
  progress: number;
  workflow_status: ProjectWorkflowStatus;
  eligibility_note: string | null;
  editorial_note: string | null;
  submitted_to_media_at: string | null;
  editorial_reviewed_at: string | null;
  published_at: string | null;
  updated_at: string;
  created_at: string;
}

interface ProjectSyncResult {
  projects: CloudWorkspaceProject[];
  uploadedCount: number;
  skippedNewerRemoteCount: number;
}

function getDatabaseClient() {
  return supabase as any;
}

export async function loadMyCloudProjects(
  actorId?: string | null,
  actorType?: WorkspaceActorType | null
): Promise<CloudWorkspaceProject[]> {
  const user = await getAuthenticatedUser();
  const database = getDatabaseClient();

  let query = database
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
        'graph',
        'messages',
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
    .eq('owner_id', user.id);

  if (actorId && actorType) {
    query = query
      .eq('actor_id', toDatabaseActorId(actorId))
      .eq('actor_type', actorType);
  }

  const { data, error } = await query.order(
    'updated_at',
    { ascending: false }
  );

  if (error) {
    throw new Error(
      error.message ||
        'No fue posible cargar los proyectos guardados en Supabase.'
    );
  }

  return ((data ?? []) as CloudProjectRow[]).map(
    mapCloudWorkspaceProject
  );
}

export async function syncLocalProjectsToCloud(
  projects: WorkspaceProject[],
  actorId: string,
  actorType: WorkspaceActorType
): Promise<ProjectSyncResult> {
  const user = await getAuthenticatedUser();
  const database = getDatabaseClient();
  const databaseActorId = toDatabaseActorId(actorId);

  const actorProjects = projects.filter(
    (project) =>
      project.actorId === actorId &&
      project.actorType === actorType
  );

  if (actorProjects.length === 0) {
    return {
      projects: await loadMyCloudProjects(
        actorId,
        actorType
      ),
      uploadedCount: 0,
      skippedNewerRemoteCount: 0,
    };
  }

  const projectIds = actorProjects.map(
    (project) => project.id
  );
  const { data: existingData, error: existingError } =
    await database
      .from('projects')
      .select('id, workflow_status, client_updated_at')
      .eq('owner_id', user.id)
      .in('id', projectIds);

  if (existingError) {
    throw new Error(
      existingError.message ||
        'No fue posible comprobar las versiones remotas.'
    );
  }

  const existingById = new Map<string, ExistingProjectRow>(
    ((existingData ?? []) as ExistingProjectRow[]).map(
      (project) => [project.id, project]
    )
  );

  const projectsToUpload = actorProjects.filter(
    (project) => {
      const remote = existingById.get(project.id);

      return (
        !remote ||
        Date.parse(project.updatedAt) >=
          Date.parse(remote.client_updated_at)
      );
    }
  );

  if (projectsToUpload.length > 0) {
    const payload = projectsToUpload.map((project) => ({
      id: project.id,
      owner_id: user.id,
      actor_id: databaseActorId,
      actor_type: actorType,
      title: project.title,
      description: project.description,
      category: project.category,
      stage: project.graph.stage,
      progress: getProjectProgress(project.graph),
      graph: project.graph,
      messages: project.messages,
      workflow_status:
        existingById.get(project.id)?.workflow_status ??
        'private',
      client_updated_at: project.updatedAt,
      created_at: project.createdAt,
    }));

    const { error } = await database
      .from('projects')
      .upsert(payload, { onConflict: 'id' });

    if (error) {
      throw new Error(
        error.message ||
          'No fue posible sincronizar los proyectos.'
      );
    }
  }

  return {
    projects: await loadMyCloudProjects(
      actorId,
      actorType
    ),
    uploadedCount: projectsToUpload.length,
    skippedNewerRemoteCount:
      actorProjects.length - projectsToUpload.length,
  };
}

export function cloudProjectToWorkspaceProject(
  project: CloudWorkspaceProject
): WorkspaceProject {
  return {
    id: project.id,
    contextId: 'personal',
    actorId:
      project.actorId && project.actorType
        ? toWorkspaceActorId(
            project.actorId,
            project.actorType
          )
        : null,
    actorType: project.actorType,
    title: project.title,
    description: project.description,
    category: isProjectCategory(project.category)
      ? project.category
      : 'other',
    graph: project.graph,
    messages: project.messages,
    createdAt: project.createdAt,
    updatedAt: project.clientUpdatedAt,
  };
}

export async function submitProjectToMedia(
  projectId: string
): Promise<void> {
  const user = await getAuthenticatedUser();
  const { error } = await getDatabaseClient()
    .from('projects')
    .update({ workflow_status: 'submitted_to_media' })
    .eq('id', projectId)
    .eq('owner_id', user.id)
    .in('workflow_status', [
      'eligible',
      'publication_rejected',
    ]);

  if (error) {
    throw new Error(
      error.message ||
        'No fue posible postular el proyecto al medio.'
    );
  }
}

export async function loadEditorialReviewQueue():
  Promise<ReviewProjectSummary[]> {
  await getAuthenticatedUser();
  const { data, error } = await getDatabaseClient().rpc(
    'list_editorial_project_reviews'
  );

  if (error) {
    throw new Error(
      error.message ||
        'No fue posible cargar la cola editorial.'
    );
  }

  return ((data ?? []) as EditorialReviewRow[]).map(
    mapEditorialReviewProject
  );
}

export async function markProjectInEditorialReview(
  projectId: string
): Promise<void> {
  const { error } = await getDatabaseClient().rpc(
    'start_editorial_project_review',
    { target_project_id: projectId }
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
  const { error } = await getDatabaseClient().rpc(
    'review_editorial_project',
    {
      target_project_id: projectId,
      publish_project: approved,
      review_note: note.trim(),
    }
  );

  if (error) {
    throw new Error(
      error.message ||
        'No fue posible registrar la decisión editorial.'
    );
  }
}

export function toDatabaseActorId(actorId: string): string {
  const separatorIndex = actorId.indexOf(':');

  return separatorIndex >= 0
    ? actorId.slice(separatorIndex + 1)
    : actorId;
}

function toWorkspaceActorId(
  actorId: string,
  actorType: WorkspaceActorType
): string {
  const prefix = actorType === 'funder' ? 'brand' : actorType;
  return `${prefix}:${actorId}`;
}

async function getAuthenticatedUser() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error(
      'Debes iniciar sesión para realizar esta acción.'
    );
  }

  return user;
}

function mapCloudWorkspaceProject(
  row: CloudProjectRow
): CloudWorkspaceProject {
  return {
    ...mapCloudProjectSummary(row),
    graph: row.graph,
    messages: row.messages ?? [],
  };
}

function mapCloudProjectSummary(
  row: CloudProjectRow
): CloudProjectSummary {
  return {
    id: row.id,
    ownerId: row.owner_id,
    actorId: row.actor_id,
    actorType: row.actor_type,
    title: row.title,
    description: row.description,
    category: row.category,
    stage: row.stage,
    progress: row.progress,
    workflowStatus: row.workflow_status,
    eligibilityNote: row.eligibility_note,
    editorialNote: row.editorial_note,
    eligibilityRequestedAt: row.eligibility_requested_at,
    eligibilityReviewedAt: row.eligibility_reviewed_at,
    submittedToMediaAt: row.submitted_to_media_at,
    editorialReviewedAt: row.editorial_reviewed_at,
    publishedAt: row.published_at,
    clientUpdatedAt: row.client_updated_at,
    remoteUpdatedAt: row.updated_at,
    createdAt: row.created_at,
  };
}

function mapEditorialReviewProject(
  row: EditorialReviewRow
): ReviewProjectSummary {
  return {
    id: row.project_id,
    ownerId: row.owner_id,
    ownerName: row.owner_name,
    ownerEmail: row.owner_email,
    actorId: row.actor_id,
    actorType: row.actor_type,
    title: row.title,
    description: row.description,
    category: row.category,
    stage: row.stage,
    progress: row.progress,
    workflowStatus: row.workflow_status,
    eligibilityNote: row.eligibility_note,
    editorialNote: row.editorial_note,
    eligibilityRequestedAt: null,
    eligibilityReviewedAt: null,
    submittedToMediaAt: row.submitted_to_media_at,
    editorialReviewedAt: row.editorial_reviewed_at,
    publishedAt: row.published_at,
    clientUpdatedAt: row.updated_at,
    remoteUpdatedAt: row.updated_at,
    createdAt: row.created_at,
  };
}

function isProjectCategory(
  category: string
): category is WorkspaceProject['category'] {
  return [
    'cultural',
    'product',
    'event',
    'social',
    'artistic',
    'business',
    'other',
  ].includes(category);
}
