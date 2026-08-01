import Link from 'next/link';

import {
  redirect,
} from 'next/navigation';

import {
  ExperienceAttendeesPanel,
} from '@/components/agenda/ExperienceAttendeesPanel';

import {
  createClient,
} from '@/lib/supabase/server';

interface ExperienceAttendeesPageProps {
  params: Promise<{
    experienceId: string;
  }>;
}

export default async function ExperienceAttendeesPage({
  params,
}: ExperienceAttendeesPageProps) {
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
      `/login?redirect=/gestion-agenda/${experienceId}/asistentes`
    );
  }

  const database =
    supabase as any;

  const {
    data: profile,
    error: profileError,
  } = await database
    .from('profiles')
    .select('role')
    .eq(
      'id',
      user.id
    )
    .maybeSingle();

  if (profileError) {
    redirect(
      '/acceso-denegado'
    );
  }

  const role =
    profile?.role ??
    'member';

  const canAdministrate =
    role === 'ecosystem_admin' ||
    role === 'media_admin' ||
    role === 'super_admin';

  const {
    data: experience,
    error: experienceError,
  } = await database
    .from('experiences')
    .select(
      `
        id,
        owner_id,
        title,
        slug,
        summary,
        status,
        starts_at,
        capacity
      `
    )
    .eq(
      'id',
      experienceId
    )
    .maybeSingle();

  if (
    experienceError ||
    !experience
  ) {
    redirect(
      '/gestion-agenda'
    );
  }

  const isOwner =
    experience.owner_id ===
    user.id;

  if (
    !isOwner &&
    !canAdministrate
  ) {
    redirect(
      '/acceso-denegado'
    );
  }

  const startsAt =
    new Date(
      experience.starts_at
    );

  return (
    <main className="min-h-screen bg-[#050505] px-6 py-10 text-white sm:px-8 lg:px-12">
      <div className="mx-auto max-w-7xl">
        <header>
          <Link
            href="/gestion-agenda"
            className="text-sm text-[#777777] transition hover:text-white"
          >
            ← Volver a gestión de agenda
          </Link>

          <p className="mt-8 text-xs font-bold uppercase tracking-[0.24em] text-[#D9FF00]">
            Gestión de asistentes
          </p>

          <h1 className="mt-4 max-w-5xl text-4xl font-bold tracking-[-0.04em] sm:text-6xl">
            {experience.title}
          </h1>

          <p className="mt-5 max-w-3xl text-base leading-7 text-[#999999]">
            {experience.summary ||
              'Consulta las inscripciones y registra la asistencia de las personas participantes.'}
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3 text-sm text-[#777777]">
            <span>
              {startsAt.toLocaleDateString(
                'es-CO',
                {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                }
              )}
            </span>

            {experience.capacity !==
            null ? (
              <>
                <span>·</span>

                <span>
                  Capacidad:{' '}
                  {experience.capacity}
                </span>
              </>
            ) : null}
          </div>

          <div className="mt-7 flex flex-wrap gap-3">
            {experience.status ===
              'published' &&
            experience.slug ? (
              <Link
                href={`/agenda/${experience.slug}`}
                className="rounded-full border border-white/15 px-5 py-3 text-sm font-semibold transition hover:border-white"
              >
                Ver actividad pública
              </Link>
            ) : null}

            <Link
              href="/gestion-agenda"
              className="rounded-full bg-[#D9FF00] px-5 py-3 text-sm font-bold text-black transition hover:bg-white"
            >
              Gestionar actividades
            </Link>
          </div>
        </header>

        <div className="mt-12">
          <ExperienceAttendeesPanel
            experienceId={
              experienceId
            }
          />
        </div>
      </div>
    </main>
  );
}