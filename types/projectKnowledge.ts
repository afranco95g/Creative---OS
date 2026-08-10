import type { Evidence, EvidenceSource, ProjectModuleId, ProjectPatch } from './project';

export type ProjectKnowledgeType = 'fact'|'hypothesis'|'inference'|'need'|'opportunity'|'constraint'|'resource'|'decision'|'activity'|'dependency'|'contradiction'|'risk'|'financial_fact'|'timeline_fact'|'actor'|'responsibility'|'outcome'|'learning';
export type ProjectKnowledgeStatus = 'detected'|'proposed'|'confirmed'|'validated'|'contradicted'|'superseded'|'unknown'|'not_applicable';
export type ProjectType = 'product'|'service'|'event'|'workshop'|'experience'|'artistic_project'|'community_initiative'|'business'|'campaign'|'btl_activation'|'research'|'program'|'other';
export type ProjectDriver = 'problem'|'need'|'opportunity'|'desire'|'exploration'|'research'|'commission'|'grant_or_call'|'community'|'commercial_opportunity'|'other';

export interface ProjectTypeProfile { primaryType?:ProjectType; secondaryTypes:ProjectType[]; drivers:ProjectDriver[]; confidence:number; updatedAt:string; }
export interface FinancialKnowledgeValue { kind:'financial'; amount:number; currency:string; quantity?:number; unit?:string; period?:string; concept:string; scope?:string; taxIncluded?:boolean|'unknown'; }
export interface TimelineKnowledgeValue { kind:'timeline'; value:string; temporalType:'date'|'deadline'|'start'|'end'|'duration'|'periodicity'; precision:'day'|'month'|'year'|'duration'|'unknown'; tentative:boolean; }
export type ProjectKnowledgeValue = string|number|boolean|string[]|Record<string,string|number|boolean|null>|FinancialKnowledgeValue|TimelineKnowledgeValue;
export interface ProjectKnowledgeRelation { entityId:string; type:'related_to'|'responsible_for'|'provides'|'owns'|'approves'|'supports'|'depends_on'|'derived_from'|'corrects'; }
export interface ProjectKnowledgeProvenance { source:EvidenceSource; messageId?:string; documentId?:string; actorId?:string; extractionMethod:'explicit'|'rule'|'calculation'|'manual'|'import'; }
export interface ProjectKnowledgeEntity { id:string; type:ProjectKnowledgeType; key?:string; label:string; value:ProjectKnowledgeValue; normalizedValue?:string; status:ProjectKnowledgeStatus; confidence:number; provenance:ProjectKnowledgeProvenance; evidence:Evidence[]; relatedModules:ProjectModuleId[]; relatedEntities:ProjectKnowledgeRelation[]; operationalRef?:{domain:'financial';entityId:string}; createdAt:string; updatedAt:string; confirmedAt?:string; supersededBy?:string; }
export type ConfirmationImpact='low'|'medium'|'high'|'critical';
export type ConfirmationPolicy='safe_auto_capture'|'propose_and_confirm'|'require_confirmation';
export type ConfirmationStatus='pending'|'accepted'|'rejected'|'edited'|'dismissed';
export interface ConfirmationRequest { id:string; entityIds:string[]; type:ConfirmationPolicy; intent:string; question:string; reason:string; impact:ConfirmationImpact; status:ConfirmationStatus; createdAt:string; resolvedAt?:string; resolutionNote?:string; }
export interface ProjectKnowledgeState { version:1; entities:ProjectKnowledgeEntity[]; confirmations:ConfirmationRequest[]; projectType:ProjectTypeProfile; updatedAt:string; }
export interface ProjectInterpretationResult { knowledgeEntities:ProjectKnowledgeEntity[]; modulePatches:ProjectPatch[]; confirmationRequests:ConfirmationRequest[]; warnings:string[]; interpretationSummary:string; organizedItems:string[]; clarificationIntent?:string; suggestedQuestion?:string; knowledgeLookupSuggested:boolean; projectTypeSignals:ProjectType[]; driverSignals:ProjectDriver[]; }
export interface InterpretProjectMessageInput { message:string; graph:import('./project').ProjectGraph; source?:EvidenceSource; sourceReferenceId?:string; }
