import type { ProjectModuleId } from './project';

export type ConsistencyIssueType = 'financial_total_mismatch'|'team_budget_mismatch'|'capacity_mismatch'|'possible_unbudgeted_activity'|'activity_without_responsible'|'temporal_mismatch'|'knowledge_contradiction';
export type ConsistencySeverity = 'info'|'warning'|'critical';
export type ConsistencyIssueStatus = 'open'|'acknowledged'|'resolved'|'dismissed';
export interface ConsistencyIssue { id:string; fingerprint:string; type:ConsistencyIssueType; severity:ConsistencySeverity; title:string; explanation:string; entityIds:string[]; relatedModules:ProjectModuleId[]; expected?:string|number; actual?:string|number; difference?:number; status:ConsistencyIssueStatus; confidence:number; suggestedAction?:string; createdAt:string; updatedAt:string; resolvedAt?:string; resolutionNote?:string; }
export interface ProjectConsistencyState { version:1; issues:ConsistencyIssue[]; evaluatedAt:string|null; }
export interface ConsistencyResult { issues:ConsistencyIssue[]; evaluatedAt:string; }
