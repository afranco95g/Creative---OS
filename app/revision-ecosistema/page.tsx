import {
  redirect,
} from 'next/navigation';

import {
  EcosystemEligibilityReview,
} from '../../components/reviews/EcosystemEligibilityReview';

import {
  createClient,
} from '../../lib/supabase/server';

export default async function EcosystemReviewPage() {
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
      '/login?redirect=/revision-ecosistema'
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
    role !== 'ecosystem_admin' &&
    role !== 'super_admin'
  ) {
    redirect('/acceso-denegado');
  }

  return (
    <EcosystemEligibilityReview />
  );
}