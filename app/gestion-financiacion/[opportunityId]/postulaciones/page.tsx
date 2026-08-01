import {
  redirect,
} from 'next/navigation';

import {
  FundingApplicationsReview,
} from '../../../../components/funding/FundingApplicationsReview';

import {
  createClient,
} from '../../../../lib/supabase/server';

interface FundingApplicationsReviewPageProps {
  params: Promise<{
    opportunityId: string;
  }>;
}

export default async function FundingApplicationsReviewPage({
  params,
}: FundingApplicationsReviewPageProps) {
  const {
    opportunityId,
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
      `/login?redirect=/gestion-financiacion/${opportunityId}/postulaciones`
    );
  }

  return (
    <main className="min-h-screen bg-[#050505] px-6 py-10 text-white sm:px-8 lg:px-12">
      <div className="mx-auto max-w-7xl">
        <FundingApplicationsReview
          opportunityId={
            opportunityId
          }
        />
      </div>
    </main>
  );
}