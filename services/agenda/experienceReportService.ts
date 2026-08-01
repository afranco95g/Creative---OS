import {
  supabase,
} from '@/lib/supabase/client';

export type ExperienceReportStatus =
  | 'not_started'
  | 'draft'
  | 'submitted'
  | 'published'
  | 'rejected'
  | 'archived';

export interface ExperienceReportWorkspace {
  experienceId: string;
  experienceTitle: string;
  experienceSlug: string;
  experienceSummary: string;
  experienceStatus: string;
  startsAt: string;
  endsAt: string | null;
  capacity: number | null;

  reportId: string | null;
  reportStatus:
    ExperienceReportStatus;

  summary: string;
  outcomes: string;
  learnings: string;
  challenges: string;
  nextSteps: string;

  revenueCop: number;
  expensesCop: number;
  balanceCop: number;

  evidenceUrls: string[];
  reviewNote: string;
  publishedAt: string | null;

  activeRegistrations: number;
  reservedPlaces: number;
  attendedPlaces: number;
  cancelledRegistrations: number;
  attendanceRate: number;
  occupancyRate: number | null;

  isOwner: boolean;
  canReview: boolean;
}

export interface ExperienceReportInput {
  summary: string;
  outcomes: string;
  learnings: string;
  challenges: string;
  nextSteps: string;
  revenueCop: number;
  expensesCop: number;
  evidenceUrls: string[];
}

interface ExperienceReportWorkspaceRow {
  experience_id: string;
  experience_title: string;
  experience_slug: string;
  experience_summary: string;
  experience_status: string;
  starts_at: string;
  ends_at: string | null;
  capacity: number | null;

  report_id: string | null;
  report_status:
    ExperienceReportStatus;

  report_summary: string;
  outcomes: string;
  learnings: string;
  challenges: string;
  next_steps: string;

  revenue_cop: number | string;
  expenses_cop: number | string;
  balance_cop: number | string;

  evidence_urls: string[] | null;
  review_note: string;
  published_at: string | null;

  active_registrations: number;
  reserved_places: number;
  attended_places: number;
  cancelled_registrations: number;
  attendance_rate: number | string;
  occupancy_rate: number | string | null;

  is_owner: boolean;
  can_review: boolean;
}

function getDatabase() {
  return supabase as any;
}

export async function loadExperienceReportWorkspace(
  experienceId: string
): Promise<ExperienceReportWorkspace> {
  const database =
    getDatabase();

  const {
    data,
    error,
  } = await database.rpc(
    'get_experience_report_workspace',
    {
      target_experience_id:
        experienceId,
    }
  );

  if (error) {
    throw new Error(
      error.message ||
        'No fue posible cargar el reporte.'
    );
  }

  const rows =
    (
      data ?? []
    ) as ExperienceReportWorkspaceRow[];

  const row =
    rows[0];

  if (!row) {
    throw new Error(
      'No se encontró la experiencia solicitada.'
    );
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

    experienceStatus:
      row.experience_status,

    startsAt:
      row.starts_at,

    endsAt:
      row.ends_at,

    capacity:
      row.capacity,

    reportId:
      row.report_id,

    reportStatus:
      row.report_status,

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

    reviewNote:
      row.review_note,

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

    isOwner:
      Boolean(
        row.is_owner
      ),

    canReview:
      Boolean(
        row.can_review
      ),
  };
}

export async function saveExperienceReport(
  experienceId: string,
  input: ExperienceReportInput
): Promise<string> {
  const database =
    getDatabase();

  const {
    data,
    error,
  } = await database.rpc(
    'save_experience_report',
    {
      target_experience_id:
        experienceId,

      target_summary:
        input.summary,

      target_outcomes:
        input.outcomes,

      target_learnings:
        input.learnings,

      target_challenges:
        input.challenges,

      target_next_steps:
        input.nextSteps,

      target_revenue_cop:
        input.revenueCop,

      target_expenses_cop:
        input.expensesCop,

      target_evidence_urls:
        input.evidenceUrls,
    }
  );

  if (error) {
    throw new Error(
      error.message ||
        'No fue posible guardar el reporte.'
    );
  }

  if (
    typeof data !==
    'string'
  ) {
    throw new Error(
      'El reporte fue guardado, pero no devolvió un identificador válido.'
    );
  }

  return data;
}

export async function submitExperienceReport(
  experienceId: string
): Promise<void> {
  const database =
    getDatabase();

  const {
    error,
  } = await database.rpc(
    'submit_experience_report',
    {
      target_experience_id:
        experienceId,
    }
  );

  if (error) {
    throw new Error(
      error.message ||
        'No fue posible enviar el reporte a revisión.'
    );
  }
}

export async function reviewExperienceReport(
  experienceId: string,
  approved: boolean,
  note: string
): Promise<void> {
  const database =
    getDatabase();

  const {
    error,
  } = await database.rpc(
    'review_experience_report',
    {
      target_experience_id:
        experienceId,

      approve_report:
        approved,

      reviewer_note:
        note,
    }
  );

  if (error) {
    throw new Error(
      error.message ||
        'No fue posible revisar el reporte.'
    );
  }
}