import {
  redirect,
} from 'next/navigation';

import {
  FundingOpportunityManager,
} from '../../components/funding/FundingOpportunityManager';

import {
  createClient,
} from '../../lib/supabase/server';
import { canAccessWorkspace } from '../../services/auth/workspace';

export default async function FundingManagementPage() {
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
      '/login?redirect=/gestion-financiacion'
    );
  }

  return (
    <FundingOpportunityManager />
  );
}
