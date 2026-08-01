import type {
  ID,
  ProjectStage,
} from './project';

export type ProjectApplicationType =
  | 'creative_project'
  | 'experience'
  | 'product'
  | 'campaign'
  | 'activation'
  | 'call'
  | 'editorial_story'
  | 'other';

export type ProjectApplicationRoute =
  | 'ecosystem_connections'
  | 'cultural_calendar'
  | 'ticket_distribution'
  | 'brand_activation'
  | 'space_match'
  | 'funding_opportunity'
  | 'editorial_consideration'
  | 'other';

export type ProjectApplicationStatus =
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'changes_requested'
  | 'accepted'
  | 'rejected'
  | 'withdrawn'
  | 'archived';

export type ProjectApplicationDecision =
  | 'connections'
  | 'experience'
  | 'ticket_distribution'
  | 'brand_activation'
  | 'funding'
  | 'editorial_referral'
  | 'changes_required'
  | 'not_eligible';

export interface ProjectApplicationSnapshot {
  projectTitle: string;
  projectDescription: string;
  projectCategory: string;
  projectStage: ProjectStage;
  projectProgress: number;

  identity: string;
  purpose: string;
  problem: string;
  context: string;
  community: string;
  generalObjective: string;
  specificObjectives: string;
  activities: string;
  timeline: string;
  allies: string;
  sustainability: string;
  impact: string;
  kpis: string;
}

export interface ProductApplicationDetails {
  productName: string;
  productDescription: string;

  wholesalePrice: number | null;
  proposedTicketPrice: number | null;
  marginPerUnit: number | null;

  availableUnits: number | null;
  minimumOrderUnits: number | null;

  productionCapacity: string;
  deliveryConditions: string;
  legalRestrictions: string;
  storageRequirements: string;

  compatibleExperiences: string[];
}

export interface ExperienceApplicationDetails {
  experienceName: string;
  experienceType: string;

  expectedParticipants: number | null;
  estimatedTicketPrice: number | null;

  preferredCities: string[];
  spaceRequirements: string;
  technicalRequirements: string;

  proposedDates: string;
}

export interface CampaignApplicationDetails {
  campaignObjective: string;
  targetAudience: string;

  estimatedReach: number | null;
  availableBudget: number | null;

  requiredProfiles: string[];
  requiredSpaces: string[];
  expectedDeliverables: string[];
}

export interface ProjectApplicationInput {
  projectId: ID;

  actorId: ID;
  actorType:
    | 'person'
    | 'space'
    | 'funder';

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

  productDetails?:
    ProductApplicationDetails;

  experienceDetails?:
    ExperienceApplicationDetails;

  campaignDetails?:
    CampaignApplicationDetails;
}

export interface ProjectApplication
  extends ProjectApplicationInput {
  id: ID;

  applicantProfileId: ID;

  status:
    ProjectApplicationStatus;

  decision:
    ProjectApplicationDecision | null;

  reviewerProfileId:
    ID | null;

  reviewerNote:
    string | null;

  submittedAt:
    string | null;

  reviewedAt:
    string | null;

  createdAt:
    string;

  updatedAt:
    string;
}