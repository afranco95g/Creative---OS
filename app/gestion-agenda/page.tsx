import {
  redirect,
} from 'next/navigation';

import {
  ExperienceManager,
} from '../../components/agenda/ExperienceManager';

import {
  createClient,
} from '../../lib/supabase/server';
import { canAccessWorkspace } from '../../services/auth/workspace';

export default async function AgendaManagementPage() {
  const access = await canAccessWorkspace();
  if (access.profile?.role === 'media_admin') {
    redirect('/admin');
  }

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
