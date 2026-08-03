export interface KnowledgeSource {
  id: string; title: string; institution: string; author: string | null;
  publicationDate: string | null; language: string; topic: string;
  jurisdiction: string; sourceType: string; license: string;
  canonicalUrl: string; retrievedAt: string; version: string; isActive: boolean;
}

export interface KnowledgeChunk {
  id: string; sourceId: string; heading: string; content: string;
  topicTags: string[]; projectTypes: string[]; projectStages: string[]; jurisdictions: string[];
}

export interface KnowledgeRetrievalLog {
  query: string; sourceIds: string[]; chunkIds: string[];
  projectId: string; purpose: string; createdAt: string;
}
