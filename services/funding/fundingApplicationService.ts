import {
  supabase,
} from '../../lib/supabase/client';

export type FundingApplicationStatus =
  | 'draft'
  | 'submitted'
  | 'accepted'
  | 'rejected'
  | 'withdrawn';

export interface FundingProjectOption {
  projectId: string;
  title: string;
  description: string;
  category: string;
  workflowStatus: string;
  isEligible: boolean;
}

export interface FundingReportOption {
  reportId: string;
  experienceTitle: string;
  experienceSlug: string;
  summary: string;
  publishedAt: string;
}

export interface FundingApplicationInput {
  projectId: string;
  reportId: string;
  requestedAmount: string;
  proposalSummary: string;
  useOfFunds: string;
  expectedOutcomes: string;
}

export interface MyFundingApplication {
  applicationId: string;
  opportunityId: string;

  projectId: string;
  projectTitle: string;
  projectCategory: string;
  projectWorkflowStatus: string;

  reportId: string | null;
  reportExperienceTitle: string;
  reportExperienceSlug: string;

  requestedAmount: number;
  proposalSummary: string;
  useOfFunds: string;
  expectedOutcomes: string;

  status: FundingApplicationStatus;
  reviewNote: string;

  submittedAt: string | null;
  reviewedAt: string | null;
  createdAt: string;
}

export interface ManagedFundingApplication
  extends MyFundingApplication {
  opportunityTitle: string;

  applicantId: string;
  applicantName: string;
  applicantEmail: string;

  projectDescription: string;
}

interface FundingProjectOptionRow {
  project_id: string;
  project_title: string;
  project_description: string;
  project_category: string;
  workflow_status: string;
  is_eligible: boolean;
}

interface FundingReportOptionRow {
  report_id: string;
  experience_title: string;
  experience_slug: string;
  report_summary: string;
  published_at: string;
}

interface MyFundingApplicationRow {
  application_id: string;
  opportunity_id: string;

  project_id: string;
  project_title: string;
  project_category: string;
  project_workflow_status: string;

  report_id: string | null;
  report_experience_title: string | null;
  report_experience_slug: string | null;

  requested_amount:
    number | string;

  proposal_summary: string;
  use_of_funds: string;
  expected_outcomes: string;

  application_status:
    FundingApplicationStatus;

  review_note: string;

  submitted_at: string | null;
  reviewed_at: string | null;
  created_at: string;
}

interface ManagedFundingApplicationRow
  extends MyFundingApplicationRow {
  opportunity_title: string;

  applicant_id: string;
  applicant_name: string;
  applicant_email: string;

  project_description: string;
}

function getDatabase() {
  return supabase as any;
}

export async function loadFundingProjectOptions():
  Promise<FundingProjectOption[]> {
  const database =
    getDatabase();

  const {
    data,
    error,
  } = await database.rpc(
    'list_funding_project_options'
  );

  if (error) {
    throw new Error(
      error.message ||
        'No fue posible cargar tus proyectos.'
    );
  }

  const rows =
    (
      data ?? []
    ) as FundingProjectOptionRow[];

  return rows.map(
    (row) => ({
      projectId:
        row.project_id,

      title:
        row.project_title,

      description:
        row.project_description,

      category:
        row.project_category,

      workflowStatus:
        row.workflow_status,

      isEligible:
        Boolean(
          row.is_eligible
        ),
    })
  );
}

export async function loadFundingReportOptions(
  projectId: string
): Promise<FundingReportOption[]> {
  if (!projectId) {
    return [];
  }

  const database =
    getDatabase();

  const {
    data,
    error,
  } = await database.rpc(
    'list_project_funding_report_options',
    {
      target_project_id:
        projectId,
    }
  );

  if (error) {
    throw new Error(
      error.message ||
        'No fue posible cargar los reportes del proyecto.'
    );
  }

  const rows =
    (
      data ?? []
    ) as FundingReportOptionRow[];

  return rows.map(
    (row) => ({
      reportId:
        row.report_id,

      experienceTitle:
        row.experience_title,

      experienceSlug:
        row.experience_slug,

      summary:
        row.report_summary,

      publishedAt:
        row.published_at,
    })
  );
}

export async function loadMyFundingApplications(
  opportunityId: string
): Promise<MyFundingApplication[]> {
  const database =
    getDatabase();

  const {
    data,
    error,
  } = await database.rpc(
    'list_my_funding_applications',
    {
      target_opportunity_id:
        opportunityId,
    }
  );

  if (error) {
    throw new Error(
      error.message ||
        'No fue posible cargar tus postulaciones.'
    );
  }

  const rows =
    (
      data ?? []
    ) as MyFundingApplicationRow[];

  return rows.map(
    mapMyApplication
  );
}

export async function saveFundingApplication(
  applicationId: string | null,
  opportunityId: string,
  input: FundingApplicationInput
): Promise<string> {
  if (!input.projectId) {
    throw new Error(
      'Selecciona el proyecto que quieres postular.'
    );
  }

  const requestedAmount =
    Number(
      input.requestedAmount
    );

  if (
    Number.isNaN(
      requestedAmount
    ) ||
    requestedAmount < 0
  ) {
    throw new Error(
      'El monto solicitado no es válido.'
    );
  }

  const database =
    getDatabase();

  const {
    data,
    error,
  } = await database.rpc(
    'save_funding_application',
    {
      target_application_id:
        applicationId,

      target_opportunity_id:
        opportunityId,

      target_project_id:
        input.projectId,

      target_report_id:
        input.reportId ||
        null,

      target_requested_amount:
        requestedAmount,

      target_proposal_summary:
        input.proposalSummary,

      target_use_of_funds:
        input.useOfFunds,

      target_expected_outcomes:
        input.expectedOutcomes,
    }
  );

  if (error) {
    throw new Error(
      error.message ||
        'No fue posible guardar la postulación.'
    );
  }

  if (
    typeof data !==
    'string'
  ) {
    throw new Error(
      'La postulación fue guardada, pero no devolvió un identificador válido.'
    );
  }

  return data;
}

export async function submitFundingApplication(
  applicationId: string
): Promise<void> {
  const database =
    getDatabase();

  const {
    error,
  } = await database.rpc(
    'submit_funding_application',
    {
      target_application_id:
        applicationId,
    }
  );

  if (error) {
    throw new Error(
      error.message ||
        'No fue posible enviar la postulación.'
    );
  }
}

export async function loadFundingOpportunityApplications(
  opportunityId: string
): Promise<ManagedFundingApplication[]> {
  const database =
    getDatabase();

  const {
    data,
    error,
  } = await database.rpc(
    'list_funding_opportunity_applications',
    {
      target_opportunity_id:
        opportunityId,
    }
  );

  if (error) {
    throw new Error(
      error.message ||
        'No fue posible cargar las postulaciones.'
    );
  }

  const rows =
    (
      data ?? []
    ) as ManagedFundingApplicationRow[];

  return rows.map(
    (row) => ({
      ...mapMyApplication(
        row
      ),

      opportunityTitle:
        row.opportunity_title,

      applicantId:
        row.applicant_id,

      applicantName:
        row.applicant_name,

      applicantEmail:
        row.applicant_email,

      projectDescription:
        row.project_description,
    })
  );
}

export async function reviewFundingApplication(
  applicationId: string,
  accepted: boolean,
  note: string
): Promise<void> {
  const database =
    getDatabase();

  const {
    error,
  } = await database.rpc(
    'review_funding_application',
    {
      target_application_id:
        applicationId,

      accept_application:
        accepted,

      reviewer_note:
        note,
    }
  );

  if (error) {
    throw new Error(
      error.message ||
        'No fue posible registrar la decisión.'
    );
  }
}

function mapMyApplication(
  row:
    MyFundingApplicationRow
): MyFundingApplication {
  return {
    applicationId:
      row.application_id,

    opportunityId:
      row.opportunity_id,

    projectId:
      row.project_id,

    projectTitle:
      row.project_title,

    projectCategory:
      row.project_category,

    projectWorkflowStatus:
      row.project_workflow_status,

    reportId:
      row.report_id,

    reportExperienceTitle:
      row.report_experience_title ??
      '',

    reportExperienceSlug:
      row.report_experience_slug ??
      '',

    requestedAmount:
      Number(
        row.requested_amount
      ),

    proposalSummary:
      row.proposal_summary,

    useOfFunds:
      row.use_of_funds,

    expectedOutcomes:
      row.expected_outcomes,

    status:
      row.application_status,

    reviewNote:
      row.review_note,

    submittedAt:
      row.submitted_at,

    reviewedAt:
      row.reviewed_at,

    createdAt:
      row.created_at,
  };
}