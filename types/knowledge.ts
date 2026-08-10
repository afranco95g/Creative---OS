export type KnowledgeDocumentStatus = 'active' | 'processing' | 'error' | 'inactive' | 'missing';
export type KnowledgeProcessingStatus = 'discovered' | 'metadata_registered' | 'parsed' | 'chunked' | 'indexed' | 'failed' | 'skipped_duplicate';
export type KnowledgeReasoningMode =
  | 'exploratory' | 'diagnostic' | 'product' | 'production' | 'financial'
  | 'legal_compliance' | 'market_communication' | 'ecosystem' | 'impact'
  | 'crisis_blockage' | 'case_based_reasoning' | 'naturalistic_decision_making'
  | 'strategic_foresight' | 'experimentation' | 'organizational_learning';

export interface KnowledgeSource {
  id:string;
  collectionId:string;
  collectionIds:string[];
  filePath:string;
  fileName:string;
  fileSize:number;
  pageCount:number|null;
  title:string;
  author:string|null;
  institution:string;
  year:number|null;
  publicationYear:number|null;
  language:string;
  documentType:string;
  topic:string;
  topics:string[];
  subcategory:string[];
  license:string;
  source:string;
  sourceType:string;
  url:string;
  canonicalUrl:string;
  checksum:string;
  processingStatus:KnowledgeProcessingStatus;
  processingError:string|null;
  createdAt:string;
  updatedAt:string;
  indexedAt:string|null;
  retrievedAt:string;
  publicationDate:string|null;
  jurisdiction:string;
  version:string;
  status:KnowledgeDocumentStatus;
  isActive:boolean;
  metadata:Record<string,unknown>;
  /** Legacy alias retained for existing callers. */
  file:string;
}

export interface KnowledgeChunk {
  id:string;
  documentId:string;
  sourceId:string;
  collectionId:string;
  headingPath:string[];
  sectionTitle:string;
  section:string;
  heading:string;
  pageStart:number|null;
  pageEnd:number|null;
  page:number|null;
  text:string;
  content:string;
  tokenCount:number;
  tokens:number;
  topics:string[];
  topicTags:string[];
  keywords:string[];
  reasoningModes:KnowledgeReasoningMode[];
  projectTypes:string[];
  projectStages:string[];
  decisionContexts:string[];
  jurisdiction:string;
  jurisdictions:string[];
  language:string;
  checksum:string;
  caseData?:Record<string,unknown>;
  embedding:number[]|null;
}

export interface KnowledgeIngestionEvent {
  file:string;
  checksum:string;
  result:KnowledgeProcessingStatus;
  chunks:number;
  replacedChunks:number;
  pages:number;
  durationMs:number;
  message?:string;
  createdAt:string;
}

export interface KnowledgeIngestionReport {
  generatedAt:string;
  totalFiles:number;
  byFormat:Record<string,number>;
  processed:number;
  skipped:number;
  duplicates:number;
  failed:number;
  sourcesCreated:number;
  sourcesUpdated:number;
  chunksCreated:number;
  chunksReplaced:number;
  pagesProcessed:number;
  errors:Array<{file:string;message:string}>;
  metadataWarnings:string[];
  licenseWarnings:string[];
  events:KnowledgeIngestionEvent[];
}

export interface KnowledgeIndex {
  version:number;
  generatedAt:string;
  documents:KnowledgeSource[];
  chunks:KnowledgeChunk[];
  failures:Array<{file:string;message:string;updatedAt:string}>;
  ingestionReport?:KnowledgeIngestionReport;
}

export interface KnowledgeSearchQuery {
  text:string;
  topics?:string[];
  collectionIds?:string[];
  reasoningModes?:KnowledgeReasoningMode[];
  projectTypes?:string[];
  projectStages?:string[];
  decisionContexts?:string[];
  projectId?:string;
  purpose:string;
  limit?:number;
  embedding?:number[];
}
export interface KnowledgeSearchResult { chunk:KnowledgeChunk; source:KnowledgeSource; score:number; matchedBy:Array<'metadata'|'keywords'|'embedding'|'context'>; }
export interface KnowledgeRetrievalLog { query:string; topic:string; sourceIds:string[]; chunkIds:string[]; projectId:string|null; purpose:string; createdAt:string; }
export interface EmbeddingProvider { dimensions:number; embed(text:string):Promise<number[]>; }
export type KnowledgeEntityType='work'|'author'|'institution'|'topic';
export interface StructuredKnowledgeQuery { projectType:string; projectStage:string; knowledgeNeed:string; keywords:string[]; language:string; country:string; preferredYears:number[]; entityType?:KnowledgeEntityType; doi?:string; recent?:boolean; projectId?:string; purpose:string; collectionIds?:string[]; reasoningModes?:KnowledgeReasoningMode[]; decisionContexts?:string[]; }
export interface ProviderKnowledgeResult { id:string; provider:string; entityType:KnowledgeEntityType; title:string; summary:string; authors:string[]; institution:string|null; year:number|null; language:string; topics:string[]; doi:string|null; url:string; citedByCount:number; openAccess:boolean; relevance:number; retrievedAt:string; collectionId?:string; sourceId?:string; headingPath?:string[]; pageStart?:number|null; pageEnd?:number|null; reasoningModes?:KnowledgeReasoningMode[]; nonTransferWarnings?:string[]; }
export interface ProviderHealth { provider:string; available:boolean; reason?:string; }
export interface EvidenceSummary { findings:string[]; successFactors:string[]; riskFactors:string[]; recommendedQuestions:string[]; suggestedIndicators:string[]; sources:Array<{provider:string;id:string;title:string}>; }

export interface ExecutiveReasoningContextInput { projectType:string; projectStage:string; currentDecision:string; uncertaintyType:string; riskLevel:string; requestedOutcome:string; contextTags:string[]; }
export interface ExecutiveReasoningContext { methodology:ProviderKnowledgeResult[]; comparableCases:ProviderKnowledgeResult[]; externalEvidence:ProviderKnowledgeResult[]; openQuestions:string[]; nonTransferWarnings:string[]; sourceTrace:Array<{sourceId:string;chunkId:string;collectionId:string;headingPath:string[];pageStart:number|null;pageEnd:number|null}>; }
export interface QuestionStrategyContextInput { projectType:string; projectStage:string; activeArea:string; currentFacts:string[]; uncertainties:string[]; previousQuestions:string[]; skippedQuestions:string[]; }
export interface QuestionStrategyContext { reasoningModes:KnowledgeReasoningMode[]; recommendedQuestions:string[]; comparableCases:ProviderKnowledgeResult[]; risksToClarify:string[]; nonApplicableKnowledge:string[]; sourceTrace:ExecutiveReasoningContext['sourceTrace']; }
