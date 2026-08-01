import {
  supabase,
} from '../../lib/supabase/client';

export type EditorialProfileStatus =
  | 'draft'
  | 'ready'
  | 'published'
  | 'archived';

export interface ProjectEditorialProfile {
  id: string;
  projectId: string;
  projectTitle: string;
  projectDescription: string;
  workflowStatus: string;
  slug: string;
  headline: string;
  summary: string;
  body: string;
  coverImageUrl: string;
  city: string;
  disciplines: string[];
  credits: string;
  status: EditorialProfileStatus;
  updatedAt: string;
}

export interface SaveProjectEditorialProfileInput {
  projectId: string;
  slug: string;
  headline: string;
  summary: string;
  body: string;
  coverImageUrl: string;
  city: string;
  disciplines: string[];
  credits: string;
  status: 'draft' | 'ready';
}

interface ProjectRow {
  id: string;
  title: string;
  description: string;
  workflow_status: string;
}

interface EditorialProfileRow {
  id: string;
  project_id: string;
  slug: string;
  headline: string;
  summary: string;
  body: string;
  cover_image_url: string | null;
  city: string | null;
  disciplines: string[] | null;
  credits: string;
  status: EditorialProfileStatus;
  updated_at: string;
}

function getDatabase() {
  return supabase as any;
}

export async function loadProjectEditorialProfile(
  projectId: string
): Promise<ProjectEditorialProfile> {
  const user =
    await getAuthenticatedUser();

  const database =
    getDatabase();

  const {
    data: projectData,
    error: projectError,
  } = await database
    .from('projects')
    .select(
      'id, title, description, workflow_status'
    )
    .eq('id', projectId)
    .maybeSingle();

  if (
    projectError ||
    !projectData
  ) {
    throw new Error(
      projectError?.message ||
        'No fue posible cargar el proyecto.'
    );
  }

  const project =
    projectData as ProjectRow;

  const {
    data: profileData,
    error: profileError,
  } = await database
    .from(
      'project_editorial_profiles'
    )
    .select(
      'id, project_id, slug, headline, summary, body, cover_image_url, city, disciplines, credits, status, updated_at'
    )
    .eq(
      'project_id',
      projectId
    )
    .maybeSingle();

  if (profileError) {
    throw new Error(
      profileError.message ||
        'No fue posible cargar la ficha editorial.'
    );
  }

  let profile =
    profileData as
      | EditorialProfileRow
      | null;

  if (!profile) {
    const initialSlug =
      createEditorialSlug(
        project.title,
        project.id
      );

    const {
      data: createdData,
      error: createError,
    } = await database
      .from(
        'project_editorial_profiles'
      )
      .insert({
        project_id:
          project.id,

        slug:
          initialSlug,

        headline:
          project.title,

        summary:
          project.description,

        body: '',

        cover_image_url:
          null,

        city:
          null,

        disciplines: [],

        credits: '',

        status:
          'draft',

        created_by:
          user.id,

        updated_by:
          user.id,
      })
      .select(
        'id, project_id, slug, headline, summary, body, cover_image_url, city, disciplines, credits, status, updated_at'
      )
      .single();

    if (
      createError ||
      !createdData
    ) {
      throw new Error(
        createError?.message ||
          'No fue posible crear la ficha editorial.'
      );
    }

    profile =
      createdData as EditorialProfileRow;
  }

  return mapEditorialProfile(
    project,
    profile
  );
}

export async function saveProjectEditorialProfile(
  input:
    SaveProjectEditorialProfileInput
): Promise<ProjectEditorialProfile> {
  const user =
    await getAuthenticatedUser();

  const database =
    getDatabase();

  const cleanSlug =
    normalizeSlug(input.slug);

  if (!cleanSlug) {
    throw new Error(
      'La URL pública no puede quedar vacía.'
    );
  }

  if (!input.headline.trim()) {
    throw new Error(
      'El titular editorial no puede quedar vacío.'
    );
  }

  if (
    input.status === 'ready' &&
    !isEditorialProfileComplete(input)
  ) {
    throw new Error(
      'Para marcar la ficha como lista debes completar titular, resumen, relato editorial, ciudad y al menos una disciplina.'
    );
  }

  const {
    error,
  } = await database
    .from(
      'project_editorial_profiles'
    )
    .update({
      slug:
        cleanSlug,

      headline:
        input.headline.trim(),

      summary:
        input.summary.trim(),

      body:
        input.body.trim(),

      cover_image_url:
        input.coverImageUrl.trim() ||
        null,

      city:
        input.city.trim() ||
        null,

      disciplines:
        input.disciplines,

      credits:
        input.credits.trim(),

      status:
        input.status,

      updated_by:
        user.id,
    })
    .eq(
      'project_id',
      input.projectId
    );

  if (error) {
    if (
      String(
        error.message
      ).toLowerCase().includes(
        'duplicate'
      )
    ) {
      throw new Error(
        'La URL pública ya está siendo utilizada por otro proyecto.'
      );
    }

    throw new Error(
      error.message ||
        'No fue posible guardar la ficha editorial.'
    );
  }

  return loadProjectEditorialProfile(
    input.projectId
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
      'Debes iniciar sesión para editar la ficha editorial.'
    );
  }

  return user;
}

function mapEditorialProfile(
  project: ProjectRow,
  profile: EditorialProfileRow
): ProjectEditorialProfile {
  return {
    id:
      profile.id,

    projectId:
      profile.project_id,

    projectTitle:
      project.title,

    projectDescription:
      project.description,

    workflowStatus:
      project.workflow_status,

    slug:
      profile.slug,

    headline:
      profile.headline,

    summary:
      profile.summary,

    body:
      profile.body,

    coverImageUrl:
      profile.cover_image_url ??
      '',

    city:
      profile.city ??
      '',

    disciplines:
      Array.isArray(
        profile.disciplines
      )
        ? profile.disciplines
        : [],

    credits:
      profile.credits,

    status:
      profile.status,

    updatedAt:
      profile.updated_at,
  };
}

function isEditorialProfileComplete(
  input:
    SaveProjectEditorialProfileInput
): boolean {
  return Boolean(
    input.headline.trim() &&
      input.summary.trim() &&
      input.body.trim() &&
      input.city.trim() &&
      input.disciplines.length > 0
  );
}

function normalizeSlug(
  value: string
): string {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(
      /[\u0300-\u036f]/g,
      ''
    )
    .replace(
      /[^a-z0-9]+/g,
      '-'
    )
    .replace(
      /^-+|-+$/g,
      ''
    );
}

function createEditorialSlug(
  title: string,
  projectId: string
): string {
  const titleSlug =
    normalizeSlug(title) ||
    'proyecto';

  return `${titleSlug}-${projectId.slice(
    0,
    8
  )}`;
}