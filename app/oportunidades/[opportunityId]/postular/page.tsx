import { notFound, redirect } from 'next/navigation';

import { FundingApplicationManager } from '@/components/funding/FundingApplicationManager';
import { createClient } from '@/lib/supabase/server';
import { getPublishedFundingOpportunity } from '@/services/public/publicFunding';

interface FundingApplicationPageProps {
  params: Promise<{
    opportunityId: string;
  }>;
}

export const dynamic = 'force-dynamic';

export default async function FundingApplicationPage({
  params,
}: FundingApplicationPageProps) {
  const { opportunityId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(
      `/login?redirect=${encodeURIComponent(
        `/oportunidades/${opportunityId}/postular`
      )}`
    );
  }

  const opportunity =
    await getPublishedFundingOpportunity(opportunityId);

  if (!opportunity) {
    notFound();
  }

  return (
    <FundingApplicationManager
      opportunityId={opportunity.id}
      opportunityTitle={opportunity.title}
      currency={opportunity.currency}
    />
  );
}
