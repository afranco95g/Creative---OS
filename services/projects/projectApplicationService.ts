import {
  supabase,
} from '../../lib/supabase/client';

import type {
  CampaignApplicationDetails,
  ExperienceApplicationDetails,
  ProductApplicationDetails,
  ProjectApplication,
  ProjectApplicationDecision,
  ProjectApplicationInput,
  ProjectApplicationRoute,
  ProjectApplicationSnapshot,
  ProjectApplicationStatus,
  ProjectApplicationType,
} from '../../types/projectApplication';

export interface ProjectApplicationReviewItem {
  applicationId: string;
  projectId: string;

  applicantProfileId: string;
  applicantName: string;
  applicantEmail: string;

  actorType:
    | 'person'
    | 'space'
    | 'funder';

  actorId: string;
  actorName: string;

  applicationType:
    ProjectApplicationType;

  requestedRoutes:
    ProjectApplicationRoute[];

  publicSummary: string;
  ecosystemOffer: string;
  ecosystemNeeds: string;
  targetAudience: string;
  geographicScope: string;

  snapshot:
    ProjectApplicationSnapshot;

  productDetails:
    ProductApplicationDetails | null;

  experienceDetails:
    ExperienceApplicationDetails | null;

  campaignDetails:
    CampaignApplicationDetails | null;

  status:
    ProjectApplicationStatus;

  decision:
    ProjectApplicationDecision | null;

  reviewerNote:
    string | null;

  submittedAt:
    string | null;

  createdAt:
    string;
}

interface ProjectApplicationRow {
  id: string;
  project_id: string;
  applicant_profile_id: string;

  actor_type:
    | 'person'
    | 'space'
    | 'funder';

  actor_id: string;

  application_type:
    ProjectApplicationType;

  requested_routes:
    ProjectApplicationRoute[];

  public_summary: string;
  ecosystem_offer: string;
  ecosystem_needs: string;
  target_audience: string;
  geographic_scope: string;

  snapshot:
    ProjectApplicationSnapshot;

  product_details:
    ProductApplicationDetails | null;

  experience_details:
    ExperienceApplicationDetails | null;

  campaign_details:
    CampaignApplicationDetails | null;

  status:
    ProjectApplicationStatus;

  decision:
    ProjectApplicationDecision | null;

  reviewer_profile_id:
    string | null;

  reviewer_note:
    string | null;

  submitted_at:
    string | null;

  reviewed_at:
    string | null;

  created_at: string;
  updated_at: string;
}

interface ProjectApplicationReviewRow {
  application_id: string;
  project_id: string;

  applicant_profile_id: string;
  applicant_name: string;
  applicant_email: string;

  actor_type:
    | 'person'
    | 'space'
    | 'funder';

  actor_id: string;
  actor_name: string;

  application_type:
    ProjectApplicationType;

  requested_routes:
    ProjectApplicationRoute[];

  public_summary: string;
  ecosystem_offer: string;
  ecosystem_needs: string;
  target_audience: string;
  geographic_scope: string;

  snapshot:
    ProjectApplicationSnapshot;

  product_details:
    ProductApplicationDetails | null;

  experience_details:
    ExperienceApplicationDetails | null;

  campaign_details:
    CampaignApplicationDetails | null;

  application_status:
    ProjectApplicationStatus;

  application_decision:
    ProjectApplicationDecision | null;

  reviewer_note:
    string | null;

  submitted_at:
    string | null;

  created_at: string;
}

interface ProjectApplicationPayload {
  project_id: string;

  actor_type:
    | 'person'
    | 'space'
    | 'funder';

  actor_id: string;

  application_type:
    ProjectApplicationType;

  requested_routes:
    ProjectApplicationRoute[];

  public_summary: string;
  ecosystem_offer: string;
  ecosystem_needs: string;
  target_audience: string;
  geographic_scope: string;

  product_details:
    ProductApplicationDetails | null;

  experience_details:
    ExperienceApplicationDetails | null;

  campaign_details:
    CampaignApplicationDetails | null;
}

function getDatabase() {
  return supabase as any;
}

export async function createProjectApplicationDraft(
  input: ProjectApplicationInput
): Promise<ProjectApplication> {
  validateApplicationInput(input);

  const database =
    getDatabase();

  const payload =
    buildApplicationPayload(
      input
    );

  const {
    data,
    error,
  } = await database
    .from('project_applications')
    .insert(payload)
    .select(
      [
        'id',
        'project_id',
        'applicant_profile_id',
        'actor_type',
        'actor_id',
        'application_type',
        'requested_routes',
        'public_summary',
        'ecosystem_offer',
        'ecosystem_needs',
        'target_audience',
        'geographic_scope',
        'snapshot',
        'product_details',
        'experience_details',
        'campaign_details',
        'status',
        'decision',
        'reviewer_profile_id',
        'reviewer_note',
        'submitted_at',
        'reviewed_at',
        'created_at',
        'updated_at',
      ].join(', ')
    )
    .single();

  if (error) {
    throw new Error(
      error.message ||
        'No fue posible crear la aplicación.'
    );
  }

  return mapProjectApplication(
    data as ProjectApplicationRow
  );
}

export async function updateProjectApplicationDraft(
  applicationId: string,
  input: ProjectApplicationInput
): Promise<ProjectApplication> {
  validateApplicationInput(input);

  const database =
    getDatabase();

  const payload =
    buildApplicationPayload(
      input
    );

  const {
    data,
    error,
  } = await database
    .from('project_applications')
    .update(payload)
    .eq(
      'id',
      applicationId
    )
    .select(
      [
        'id',
        'project_id',
        'applicant_profile_id',
        'actor_type',
        'actor_id',
        'application_type',
        'requested_routes',
        'public_summary',
        'ecosystem_offer',
        'ecosystem_needs',
        'target_audience',
        'geographic_scope',
        'snapshot',
        'product_details',
        'experience_details',
        'campaign_details',
        'status',
        'decision',
        'reviewer_profile_id',
        'reviewer_note',
        'submitted_at',
        'reviewed_at',
        'created_at',
        'updated_at',
      ].join(', ')
    )
    .single();

  if (error) {
    throw new Error(
      error.message ||
        'No fue posible actualizar la aplicación.'
    );
  }

  return mapProjectApplication(
    data as ProjectApplicationRow
  );
}

export async function loadMyProjectApplications():
  Promise<ProjectApplication[]> {
  const database =
    getDatabase();

  const {
    data,
    error,
  } = await database
    .from('project_applications')
    .select(
      [
        'id',
        'project_id',
        'applicant_profile_id',
        'actor_type',
        'actor_id',
        'application_type',
        'requested_routes',
        'public_summary',
        'ecosystem_offer',
        'ecosystem_needs',
        'target_audience',
        'geographic_scope',
        'snapshot',
        'product_details',
        'experience_details',
        'campaign_details',
        'status',
        'decision',
        'reviewer_profile_id',
        'reviewer_note',
        'submitted_at',
        'reviewed_at',
        'created_at',
        'updated_at',
      ].join(', ')
    )
    .order(
      'updated_at',
      {
        ascending: false,
      }
    );

  if (error) {
    throw new Error(
      error.message ||
        'No fue posible cargar tus aplicaciones.'
    );
  }

  return (
    (
      data ?? []
    ) as ProjectApplicationRow[]
  ).map(
    mapProjectApplication
  );
}

export async function loadProjectApplicationByProjectId(
  projectId: string
): Promise<ProjectApplication | null> {
  const database =
    getDatabase();

  const {
    data,
    error,
  } = await database
    .from('project_applications')
    .select(
      [
        'id',
        'project_id',
        'applicant_profile_id',
        'actor_type',
        'actor_id',
        'application_type',
        'requested_routes',
        'public_summary',
        'ecosystem_offer',
        'ecosystem_needs',
        'target_audience',
        'geographic_scope',
        'snapshot',
        'product_details',
        'experience_details',
        'campaign_details',
        'status',
        'decision',
        'reviewer_profile_id',
        'reviewer_note',
        'submitted_at',
        'reviewed_at',
        'created_at',
        'updated_at',
      ].join(', ')
    )
    .eq(
      'project_id',
      projectId
    )
    .maybeSingle();

  if (error) {
    throw new Error(
      error.message ||
        'No fue posible cargar la aplicación del proyecto.'
    );
  }

  if (!data) {
    return null;
  }

  return mapProjectApplication(
    data as ProjectApplicationRow
  );
}

export async function submitProjectApplication(
  applicationId: string
): Promise<void> {
  const database =
    getDatabase();

  const {
    error,
  } = await database.rpc(
    'submit_project_application',
    {
      target_application_id:
        applicationId,
    }
  );

  if (error) {
    throw new Error(
      error.message ||
        'No fue posible enviar la aplicación al ecosistema.'
    );
  }
}

export async function deleteProjectApplicationDraft(
  applicationId: string
): Promise<void> {
  const database =
    getDatabase();

  const {
    error,
  } = await database
    .from('project_applications')
    .delete()
    .eq(
      'id',
      applicationId
    );

  if (error) {
    throw new Error(
      error.message ||
        'No fue posible eliminar la aplicación.'
    );
  }
}

export async function loadProjectApplicationsForReview():
  Promise<ProjectApplicationReviewItem[]> {
  const database =
    getDatabase();

  const {
    data,
    error,
  } = await database.rpc(
    'list_project_applications_for_review'
  );

  if (error) {
    throw new Error(
      error.message ||
        'No fue posible cargar la cola de aplicaciones.'
    );
  }

  return (
    (
      data ?? []
    ) as ProjectApplicationReviewRow[]
  ).map(
    mapProjectApplicationReviewItem
  );
}

export async function startProjectApplicationReview(
  applicationId: string
): Promise<void> {
  const database =
    getDatabase();

  const {
    error,
  } = await database.rpc(
    'start_project_application_review',
    {
      target_application_id:
        applicationId,
    }
  );

  if (error) {
    throw new Error(
      error.message ||
        'No fue posible iniciar la revisión.'
    );
  }
}

export async function reviewProjectApplication(
  applicationId: string,
  status:
    | 'accepted'
    | 'changes_requested'
    | 'rejected',
  decision:
    ProjectApplicationDecision,
  note: string
): Promise<void> {
  const database =
    getDatabase();

  const {
    error,
  } = await database.rpc(
    'review_project_application',
    {
      target_application_id:
        applicationId,

      requested_status:
        status,

      requested_decision:
        decision,

      requested_note:
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

function buildApplicationPayload(
  input: ProjectApplicationInput
): ProjectApplicationPayload {
  return {
    project_id:
      input.projectId,

    actor_type:
      input.actorType,

    actor_id:
      input.actorId,

    application_type:
      input.applicationType,

    requested_routes:
      input.requestedRoutes,

    public_summary:
      input.publicSummary.trim(),

    ecosystem_offer:
      input.ecosystemOffer.trim(),

    ecosystem_needs:
      input.ecosystemNeeds.trim(),

    target_audience:
      input.targetAudience.trim(),

    geographic_scope:
      input.geographicScope.trim(),

    product_details:
      input.productDetails ??
      null,

    experience_details:
      input.experienceDetails ??
      null,

    campaign_details:
      input.campaignDetails ??
      null,
  };
}

function validateApplicationInput(
  input: ProjectApplicationInput
) {
  if (!input.projectId) {
    throw new Error(
      'La aplicación necesita un proyecto.'
    );
  }

  if (
    !input.actorId ||
    !input.actorType
  ) {
    throw new Error(
      'Selecciona la identidad desde la que vas a aplicar.'
    );
  }

  if (
    input.requestedRoutes.length === 0
  ) {
    throw new Error(
      'Selecciona al menos una ruta dentro del ecosistema.'
    );
  }

  if (!input.publicSummary.trim()) {
    throw new Error(
      'Escribe un resumen para la evaluación.'
    );
  }

  if (!input.ecosystemOffer.trim()) {
    throw new Error(
      'Explica qué aporta el proyecto al ecosistema.'
    );
  }

  if (!input.ecosystemNeeds.trim()) {
    throw new Error(
      'Explica qué necesita el proyecto.'
    );
  }

  if (!input.targetAudience.trim()) {
    throw new Error(
      'Describe el público o la comunidad del proyecto.'
    );
  }

  if (
    input.applicationType ===
      'product' &&
    !input.productDetails
  ) {
    throw new Error(
      'Completa la información comercial del producto.'
    );
  }

  if (
    input.applicationType === 'product' &&
    input.productDetails &&
    input.productDetails.wholesalePrice !== null &&
    input.productDetails.proposedTicketPrice !== null &&
    input.productDetails.proposedTicketPrice <= input.productDetails.wholesalePrice
  ) {
    throw new Error(
      'El precio propuesto debe ser mayor que el precio mayorista.'
    );
  }

  if (
    input.applicationType ===
      'experience' &&
    !input.experienceDetails
  ) {
    throw new Error(
      'Completa la información de la experiencia.'
    );
  }

  if (
    (
      input.applicationType ===
        'campaign' ||
      input.applicationType ===
        'activation'
    ) &&
    !input.campaignDetails
  ) {
    throw new Error(
      'Completa la información de la campaña o activación.'
    );
  }
}

function mapProjectApplication(
  row: ProjectApplicationRow
): ProjectApplication {
  return {
    id:
      row.id,

    projectId:
      row.project_id,

    applicantProfileId:
      row.applicant_profile_id,

    actorType:
      row.actor_type,

    actorId:
      row.actor_id,

    applicationType:
      row.application_type,

    requestedRoutes:
      row.requested_routes ??
      [],

    publicSummary:
      row.public_summary,

    ecosystemOffer:
      row.ecosystem_offer,

    ecosystemNeeds:
      row.ecosystem_needs,

    targetAudience:
      row.target_audience,

    geographicScope:
      row.geographic_scope,

    snapshot:
      row.snapshot,

    productDetails:
      row.product_details ??
      undefined,

    experienceDetails:
      row.experience_details ??
      undefined,

    campaignDetails:
      row.campaign_details ??
      undefined,

    status:
      row.status,

    decision:
      row.decision,

    reviewerProfileId:
      row.reviewer_profile_id,

    reviewerNote:
      row.reviewer_note,

    submittedAt:
      row.submitted_at,

    reviewedAt:
      row.reviewed_at,

    createdAt:
      row.created_at,

    updatedAt:
      row.updated_at,
  };
}

function mapProjectApplicationReviewItem(
  row: ProjectApplicationReviewRow
): ProjectApplicationReviewItem {
  return {
    applicationId:
      row.application_id,

    projectId:
      row.project_id,

    applicantProfileId:
      row.applicant_profile_id,

    applicantName:
      row.applicant_name,

    applicantEmail:
      row.applicant_email,

    actorType:
      row.actor_type,

    actorId:
      row.actor_id,

    actorName:
      row.actor_name,

    applicationType:
      row.application_type,

    requestedRoutes:
      row.requested_routes ??
      [],

    publicSummary:
      row.public_summary,

    ecosystemOffer:
      row.ecosystem_offer,

    ecosystemNeeds:
      row.ecosystem_needs,

    targetAudience:
      row.target_audience,

    geographicScope:
      row.geographic_scope,

    snapshot:
      row.snapshot,

    productDetails:
      row.product_details,

    experienceDetails:
      row.experience_details,

    campaignDetails:
      row.campaign_details,

    status:
      row.application_status,

    decision:
      row.application_decision,

    reviewerNote:
      row.reviewer_note,

    submittedAt:
      row.submitted_at,

    createdAt:
      row.created_at,
  };
}
