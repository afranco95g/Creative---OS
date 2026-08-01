import {
  redirect,
} from 'next/navigation';

import {
  EditorialProjectReview,
} from '../../components/reviews/EditorialProjectReview';

import {
  createClient,
} from '../../lib/supabase/server';

export default async function EditorialReviewPage() {
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
      '/login?redirect=/revision-editorial'
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
    role !== 'media_admin' &&
    role !== 'super_admin'
  ) {
    redirect('/acceso-denegado');
  }

  return (
    <EditorialProjectReview />
  );
}