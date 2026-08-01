import {
  redirect,
} from 'next/navigation';

import {
  EcosystemActorsReview,
} from '../../components/reviews/EcosystemActorsReview';

import {
  createClient,
} from '../../lib/supabase/server';

export default async function ActorReviewPage() {
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
      '/login?redirect=/revision-actores'
    );
  }

  const database =
    supabase as any;

  const {
    data: profile,
  } = await database
    .from('profiles')
    .select('role')
    .eq(
      'id',
      user.id
    )
    .maybeSingle();

  const role =
    profile?.role ??
    'member';

  if (
    role !== 'ecosystem_admin' &&
    role !== 'super_admin'
  ) {
    redirect(
      '/acceso-denegado'
    );
  }

  return (
    <EcosystemActorsReview />
  );
}