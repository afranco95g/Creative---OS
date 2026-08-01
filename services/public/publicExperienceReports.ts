import {
  createClient,
} from '@/lib/supabase/server';

export interface PublicExperienceReport {
  experienceId: string;
  experienceTitle: string;
  experienceSlug: string;
  experienceSummary: string;
  startsAt: string;
  endsAt: string | null;
  city: string | null;
  venueName: string | null;
  coverImageUrl: string | null;

  summary: string;
  outcomes: string;
  learnings: string;
  challenges: string;
  nextSteps: string;

  revenueCop: number;
  expensesCop: number;
  balanceCop: number;

  evidenceUrls: string[];
  publishedAt: string;

  activeRegistrations: number;
  reservedPlaces: number;
  attendedPlaces: number;
  cancelledRegistrations: number;
  attendanceRate: number;
  occupancyRate: number | null;

  projectSlug: string | null;
  projectHeadline: string | null;
}

interface PublicExperienceReportRow {
  experience_id: string;
  experience_title: string;
  experience_slug: string;
  experience_summary: string;
  starts_at: string;
  ends_at: string | null;
  city: string | null;
  venue_name: string | null;
  cover_image_url: string | null;

  report_summary: string;
  outcomes: string;
  learnings: string;
  challenges: string;
  next_steps: string;

  revenue_cop: number | string;
  expenses_cop: number | string;
  balance_cop: number | string;

  evidence_urls: string[] | null;
  published_at: string;

  active_registrations: number;
  reserved_places: number;
  attended_places: number;
  cancelled_registrations: number;
  attendance_rate: number | string;
  occupancy_rate: number | string | null;

  project_slug: string | null;
  project_headline: string | null;
}

export async function getPublishedExperienceReport(
  experienceSlug: string
): Promise<PublicExperienceReport | null> {
  const supabase =
    await createClient();

  const database =
    supabase as any;

  const {
    data,
    error,
  } = await database.rpc(
    'get_published_experience_report',
    {
      target_experience_slug:
        experienceSlug,
    }
  );

  if (error) {
    console.error(
      'Error loading public experience report:',
      error
    );

    throw new Error(
      'No fue posible cargar el reporte.'
    );
  }

  const rows =
    (
      data ?? []
    ) as PublicExperienceReportRow[];

  const row =
    rows[0];

  if (!row) {
    return null;
  }

  return {
    experienceId:
      row.experience_id,

    experienceTitle:
      row.experience_title,

    experienceSlug:
      row.experience_slug,

    experienceSummary:
      row.experience_summary,

    startsAt:
      row.starts_at,

    endsAt:
      row.ends_at,

    city:
      row.city,

    venueName:
      row.venue_name,

    coverImageUrl:
      row.cover_image_url,

    summary:
      row.report_summary,

    outcomes:
      row.outcomes,

    learnings:
      row.learnings,

    challenges:
      row.challenges,

    nextSteps:
      row.next_steps,

    revenueCop:
      Number(
        row.revenue_cop
      ),

    expensesCop:
      Number(
        row.expenses_cop
      ),

    balanceCop:
      Number(
        row.balance_cop
      ),

    evidenceUrls:
      Array.isArray(
        row.evidence_urls
      )
        ? row.evidence_urls
        : [],

    publishedAt:
      row.published_at,

    activeRegistrations:
      row.active_registrations,

    reservedPlaces:
      row.reserved_places,

    attendedPlaces:
      row.attended_places,

    cancelledRegistrations:
      row.cancelled_registrations,

    attendanceRate:
      Number(
        row.attendance_rate
      ),

    occupancyRate:
      row.occupancy_rate ===
      null
        ? null
        : Number(
            row.occupancy_rate
          ),

    projectSlug:
      row.project_slug,

    projectHeadline:
      row.project_headline,
  };
}