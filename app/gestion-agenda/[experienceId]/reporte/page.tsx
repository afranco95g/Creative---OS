import {
  redirect,
} from 'next/navigation';

import {
  ExperienceReportManager,
} from '../../../../components/agenda/ExperienceReportManager';

import {
  createClient,
} from '../../../../lib/supabase/server';

interface ExperienceReportPageProps {
  params: Promise<{
    experienceId: string;
  }>;
}

export default async function ExperienceReportPage({
  params,
}: ExperienceReportPageProps) {
  const {
    experienceId,
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
      `/login?redirect=/gestion-agenda/${experienceId}/reporte`
    );
  }

  return (
    <main className="min-h-screen bg-[#050505] px-6 py-10 text-white sm:px-8 lg:px-12">
      <div className="mx-auto max-w-7xl">
        <ExperienceReportManager
          experienceId={experienceId}
        />
      </div>
    </main>
  );
}