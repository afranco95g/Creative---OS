import Link from 'next/link';

import {
  redirect,
} from 'next/navigation';

import {
  ProjectActorsEditor,
} from '../../../../components/editorial/ProjectActorsEditor';

import {
  createClient,
} from '../../../../lib/supabase/server';

interface ProjectActorsPageProps {
  params: Promise<{
    projectId: string;
  }>;
}

export default async function ProjectActorsPage({
  params,
}: ProjectActorsPageProps) {
  const {
    projectId,
  } = await params;

  const supabase =
    await createClient();

  const {
    data: {
      user,
    },
  } =
    await supabase.auth.getUser();

  if (!user) {
    redirect(
      `/login?redirect=/revision-editorial/${projectId}/actores`
    );
  }

  const database =
    supabase as any;

  const {
    data: profile,
  } = await database
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  const role =
    profile?.role ??
    'member';

  if (
    role !== 'journalist' &&
    role !== 'media_admin' &&
    role !== 'super_admin'
  ) {
    redirect(
      '/acceso-denegado'
    );
  }

  const {
    data: project,
  } = await database
    .rpc('get_editorial_project_summary', {
      target_project_id: projectId,
    })
    .maybeSingle();

  if (!project) {
    redirect(
      '/revision-editorial'
    );
  }

  return (
    <main className="min-h-screen bg-superficie px-6 py-10 text-texto-largo sm:px-8 lg:px-12">
      <div className="mx-auto max-w-6xl">
        <header>
          <Link
            href="/revision-editorial"
            className="text-sm text-texto-largo transition hover:text-texto-largo"
          >
            ← Volver a revisión editorial
          </Link>

          <p className="mt-8 text-xs font-bold uppercase tracking-[0.24em] text-texto-principal">
            El Culebreo · Ecosistema editorial
          </p>

          <h1 className="mt-3 max-w-4xl text-4xl font-bold tracking-[-0.04em] sm:text-6xl">
            Actores del proyecto
          </h1>

          <h2 className="mt-5 text-2xl font-semibold">
            {project.title}
          </h2>

          <p className="mt-3 max-w-3xl text-sm leading-7 text-texto-largo">
            Vincula personas, espacios, marcas y financiadores
            que participan en este proyecto. Solo serán visibles
            públicamente los actores publicados y marcados como
            públicos.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href={`/revision-editorial/${projectId}`}
              className="rounded-full border border-borde/15 px-5 py-3 text-sm font-semibold transition hover:border-borde"
            >
              Editar ficha editorial
            </Link>

            {project.workflow_status ===
            'published' ? (
              <Link
                href={`/proyectos/${projectId}`}
                className="rounded-full bg-rojo-base px-5 py-3 text-sm font-bold text-hueso transition hover:bg-rojo-base"
              >
                Ver proyecto público
              </Link>
            ) : null}
          </div>
        </header>

        <div className="mt-10">
          <ProjectActorsEditor
            projectId={projectId}
          />
        </div>
      </div>
    </main>
  );
}
