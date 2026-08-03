export type ID = string;

export type ProjectStage =
  | 'idea'
  | 'exploration'
  | 'structuring'
  | 'validation'
  | 'human_review'
  | 'ready_to_present'
  | 'activation'
  | 'execution'
  | 'follow_up'
  | 'closed'
  | 'learning';

export type ModuleStatus = 'empty' | 'building' | 'solid';

export type ProjectModuleId =
  | 'identity'
  | 'purpose'
  | 'problem'
  | 'context'
  | 'community'
  | 'generalObjective'
  | 'specificObjectives'
  | 'activities'
  | 'timeline'
  | 'budget'
  | 'team'
  | 'allies'
  | 'risks'
  | 'sustainability'
  | 'impact'
  | 'kpis'
  | 'tasks'
  | 'decisions'
  | 'documents'
  | 'evidence'
  | 'opportunities';

export type PatchOperation = 'set' | 'append' | 'strengthen';

export type EvidenceSource =
  | 'conversation'
  | 'manual'
  | 'document'
  | 'consultant'
  | 'system';

export interface Evidence {
  id: ID;
  source: EvidenceSource;
  quote: string;
  createdAt: string;
}

export interface ProjectModule {
  id: ProjectModuleId;
  title: string;
  description: string;
  content: string;
  score: number;
  status: ModuleStatus;
  evidence: Evidence[];
  updatedAt: string;
}

export interface ProjectGraph {
  id: ID;
  title: string;
  stage: ProjectStage;
  modules: Record<ProjectModuleId, ProjectModule>;
  tasks: ProjectTask[];
  decisions: ProjectDecision[];
  risks: ProjectRisk[];
  team: TeamMember[];
  documents: CompiledDocument[];
  eventLog: ProjectEvent[];
  tools: ProjectTools;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectPatch {
  id: ID;
  moduleId: ProjectModuleId;
  operation: PatchOperation;
  value: string;
  evidenceQuote: string;
  scoreBoost: number;
  source: EvidenceSource;
  createdAt: string;
}

export interface ProjectEvent {
  id: ID;
  type:
    | 'module_updated'
    | 'question_answered'
    | 'task_created'
    | 'decision_recorded'
    | 'risk_detected'
    | 'document_compiled';
  title: string;
  description: string;
  moduleId?: ProjectModuleId;
  createdAt: string;
}

export interface ProjectTask {
  id: ID;
  title: string;
  description: string;
  moduleId: ProjectModuleId;
  urgency: 'low' | 'medium' | 'high';
  importance: 'low' | 'medium' | 'high';
  status: 'pending' | 'in_progress' | 'done';
  ownerId?: ID;
  dueDate?: string;
  createdAt: string;
}

export interface ProjectDecision {
  id: ID;
  title: string;
  context: string;
  decision: string;
  reason: string;
  alternatives?: string[];
  relatedModules: ProjectModuleId[];
  createdAt: string;
}

export interface ProjectRisk {
  id: ID;
  title: string;
  type:
    | 'financial'
    | 'team'
    | 'timeline'
    | 'legal'
    | 'operational'
    | 'communication'
    | 'sustainability';
  probability: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
  mitigationPlan: string;
  status: 'open' | 'mitigated' | 'closed';
  createdAt: string;
}

export interface TeamMember {
  id: ID;
  name: string;
  role: string;
  description: string;
  responsibilities: string[];
  email?: string;
  notificationPreferences?: {
    email: boolean;
    inApp: boolean;
  };
}

export interface DocumentDefinition {
  id: string;
  title: string;
  description: string;
  purpose: string;
  requiredModules: ProjectModuleId[];
  targetAudience:
    | 'internal'
    | 'grant'
    | 'sponsor'
    | 'client'
    | 'investor'
    | 'ally';
}

export interface CompiledDocument {
  id: ID;
  definitionId: string;
  title: string;
  content: string;
  readiness: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProducerResponse {
  understood: string;
  organized: string[];
  gaps: string[];
  nextQuestion: string;
  nextQuestionOptions?: string[];
  interpretation?: TurnInterpretation;
  sources?: Array<{ documentId:string; chunkId:string; title:string; topic:string[] }>;
}

export interface KnowledgeGuidance { snippets:string[]; topics:string[]; sources:Array<{documentId:string;chunkId:string;title:string;topic:string[]}>; }

export type InterpretationType = 'explicit_fact' | 'probable_inference' | 'suggestion' | 'contradiction' | 'unanswered' | 'not_applicable';
export interface ModuleClassification {
  targetModule: ProjectModuleId; extractedContent: string; evidenceQuote: string; confidence: number;
  interpretationType: InterpretationType; requiresConfirmation: boolean; rejectedModules: ProjectModuleId[]; reason: string;
}

export type FactConfidence = 'confirmed' | 'preliminary' | 'requires_confirmation';

export interface InterpretedFact {
  field: string;
  value: string | number | boolean;
  confidence: FactConfidence;
  source: 'user' | 'system_inference' | 'knowledge' | 'estimate';
}

export type FinancialSignalKind =
  | 'cost' | 'expense' | 'investment' | 'income' | 'price'
  | 'preliminary_margin' | 'tax' | 'financing' | 'in_kind';

export interface FinancialSignal {
  id: ID;
  kind: FinancialSignalKind;
  concept: string;
  amount: number | null;
  currency: 'COP';
  quantity: number;
  unit: string;
  status: 'declared' | 'estimated' | 'requires_breakdown' | 'requires_estimate';
  source: 'conversation' | 'document' | 'manual';
  requiresConfirmation: boolean;
}

export interface PendingQuestion {
  id: ID;
  area: ProjectModuleId;
  question: string;
  reason: string;
  createdAt: string;
  status: 'pending' | 'answered' | 'dismissed';
}

export interface TurnInterpretation {
  understoodSummary: string;
  explicitFacts: InterpretedFact[];
  inferredFacts: InterpretedFact[];
  updatedModules: ProjectModuleId[];
  proposedPatches: ProjectPatch[];
  financialSignals: FinancialSignal[];
  timelineSignals: string[];
  riskSignals: string[];
  contradictionSignals: string[];
  pendingQuestions: PendingQuestion[];
  nextQuestionCandidates: string[];
  recommendedNextQuestion: string;
  confidence: number;
  classifications: ModuleClassification[];
}

export interface ConversationMessage {
  id: ID;
  role: 'user' | 'producer';
  content: string;
  response?: ProducerResponse;
  createdAt: string;
}

export interface IPPDimension {
  id: string;
  title: string;
  score: number;
  explanation: string;
  recommendation: string;
}

export type BudgetLineStatus = 'proposed' | 'approved' | 'committed' | 'paid';

export interface ProjectBudgetLine {
  id: ID;
  category: string;
  concept: string;
  quantity: number;
  unit: string;
  unitValue: number;
  vatRate: number;
  withholdingRate: number;
  otherTaxes: number;
  status: BudgetLineStatus;
  responsible: string;
  provider: string;
  estimatedDate: string;
  actualDate: string;
  source: 'manual' | 'creative-os';
}

export type ScheduleItemStatus = 'planned' | 'in_progress' | 'done' | 'blocked';

export interface ProjectScheduleItem {
  id: ID;
  name: string;
  description: string;
  startsAt: string;
  endsAt: string;
  responsible: string;
  status: ScheduleItemStatus;
  budgetLineId: ID | null;
  documentIds: string[];
  tasks: string[];
  milestone: boolean;
}

export interface GrantWorkspace {
  opportunityId: string;
  opportunityName: string;
  objective: string;
  requirements: string[];
  requiredDocuments: string[];
  requiresBudget: boolean;
  requiresTimeline: boolean;
  attachments: string[];
  evaluationCriteria: string[];
  answers: Record<string, string>;
}

export interface ProjectTools {
  budgetLines: ProjectBudgetLine[];
  scheduleItems: ProjectScheduleItem[];
  grant: GrantWorkspace;
  pendingQuestions?: PendingQuestion[];
  proposedFinancialSignals?: FinancialSignal[];
  activeArea?: ProjectModuleId | null;
}
