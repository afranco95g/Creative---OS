import {
  supabase,
} from '../../lib/supabase/client';

export interface PublishedEditorialProject {
  id: string;
  title: string;
  description: string;
  category: string;
  progress: number;
  publishedAt: string | null;
  updatedAt: string;
}

interface PublishedEditorialProjectRow {
  id: string;
  title: string;
  description: string;
  category: string;
  progress: number;
  published_at: string | null;
  updated_at: string;
}

export async function loadPublishedEditorialProjects():
  Promise<PublishedEditorialProject[]> {
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
      'Debes iniciar sesión para consultar los proyectos publicados.'
    );
  }

  /*
   * La tabla projects todavía no está incluida
   * completamente en los tipos generados de Supabase.
   */
  const database =
    supabase as any;

  const {
    data,
    error,
  } = await database
    .from('projects')
    .select(
      'id, title, description, category, progress, published_at, updated_at'
    )
    .eq(
      'workflow_status',
      'published'
    )
    .order(
      'published_at',
      {
        ascending: false,
        nullsFirst: false,
      }
    );

  if (error) {
    throw new Error(
      error.message ||
        'No fue posible cargar los proyectos publicados.'
    );
  }

  const rows =
    (
      data ?? []
    ) as PublishedEditorialProjectRow[];

  return rows.map(
    (row) => ({
      id:
        row.id,

      title:
        row.title,

      description:
        row.description,

      category:
        row.category,

      progress:
        row.progress,

      publishedAt:
        row.published_at,

      updatedAt:
        row.updated_at,
    })
  );
}