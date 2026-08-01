import {
  redirect,
} from 'next/navigation';

import {
  FundingOpportunityManager,
} from '../../components/funding/FundingOpportunityManager';

import {
  createClient,
} from '../../lib/supabase/server';

export default async function FundingManagementPage() {
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