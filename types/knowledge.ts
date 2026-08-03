export type KnowledgeDocumentStatus = 'active' | 'processing' | 'error' | 'inactive';
export interface KnowledgeSource {
  id:string; title:string; author:string|null; institution:string; year:number|null; language:string;
  topic:string; subcategory:string[]; license:string; source:string; url:string; file:string; checksum:string;
  createdAt:string; updatedAt:string; status:KnowledgeDocumentStatus;
  publicationDate:string|null; jurisdiction:string; sourceType:string; canonicalUrl:string; retrievedAt:string; version:string; isActive:boolean;
}
export interface KnowledgeChunk {
  id:string; documentId:string; sourceId:string; section:string; heading:string; page:number|null; text:string; content:string;
  tokens:number; topics:string[]; topicTags:string[]; keywords:string[]; embedding:number[]|null;
  projectTypes:string[]; projectStages:string[]; jurisdictions:string[];
}
export interface KnowledgeIndex { version:number; generatedAt:string; documents:KnowledgeSource[]; chunks:KnowledgeChunk[]; failures:Array<{file:string;message:string;updatedAt:string}>; }
export interface KnowledgeSearchQuery { text:string; topics?:string[]; projectId?:string; purpose:string; limit?:number; embedding?:number[]; }
export interface KnowledgeSearchResult { chunk:KnowledgeChunk; source:KnowledgeSource; score:number; matchedBy:Array<'metadata'|'keywords'|'embedding'>; }
export interface KnowledgeRetrievalLog { query:string; topic:string; sourceIds:string[]; chunkIds:string[]; projectId:string|null; purpose:string; createdAt:string; }
export interface EmbeddingProvider { dimensions:number; embed(text:string):Promise<number[]>; }
export type KnowledgeEntityType='work'|'author'|'institution'|'topic';
export interface StructuredKnowledgeQuery { projectType:string; projectStage:string; knowledgeNeed:string; keywords:string[]; language:string; country:string; preferredYears:number[]; entityType?:KnowledgeEntityType; doi?:string; recent?:boolean; projectId?:string; purpose:string; }
export interface ProviderKnowledgeResult { id:string; provider:string; entityType:KnowledgeEntityType; title:string; summary:string; authors:string[]; institution:string|null; year:number|null; language:string; topics:string[]; doi:string|null; url:string; citedByCount:number; openAccess:boolean; relevance:number; retrievedAt:string; }
export interface ProviderHealth { provider:string; available:boolean; reason?:string; }
export interface EvidenceSummary { findings:string[]; successFactors:string[]; riskFactors:string[]; recommendedQuestions:string[]; suggestedIndicators:string[]; sources:Array<{provider:string;id:string;title:string}>; }
