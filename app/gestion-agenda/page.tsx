import {
  redirect,
} from 'next/navigation';

import {
  ExperienceManager,
} from '../../components/agenda/ExperienceManager';

import {
  createClient,
} from '../../lib/supabase/server';

export default async function AgendaManagementPage() {
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
      '/login?redirect=/gestion-agenda'
    );
  }

  return (
    <ExperienceManager />
  );
}