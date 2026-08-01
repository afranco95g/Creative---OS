import {
  redirect,
} from 'next/navigation';

import {
  ProjectEditorialForm,
} from '../../../components/editorial/ProjectEditorialForm';

import {
  createClient,
} from '../../../lib/supabase/server';

interface EditorialProjectPageProps {
  params: Promise<{
    projectId: string;
  }>;
}

export default async function EditorialProjectPage({
  params,
}: EditorialProjectPageProps) {
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
      `/login?redirect=/revision-editorial/${projectId}`
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
    redirect('/acceso-denegado');
  }

  return (
    <ProjectEditorialForm
      projectId={projectId}
    />
  );
}