import 'server-only';
import type { ProjectGraph } from '../../types/project';
import { knowledgeEngine } from './KnowledgeEngine';
import {buildKnowledgeQuery} from './KnowledgeQueryBuilder';
import {knowledgeRetriever} from './KnowledgeRetriever';
export type KnowledgePurpose='conversation'|'question_formulation'|'interpretation'|'risk_detection'|'executive_review'|'budget'|'funding'|'metrics'|'project_evaluation';
export async function retrieveExecutiveKnowledge(input:{message:string;projectId?:string;graph?:ProjectGraph;purpose:KnowledgePurpose}){const query=buildKnowledgeQuery(input);const retrieval=await knowledgeRetriever.retrieve(query);return{reasoningContext:retrieval.results.slice(0,4).map(r=>({text:r.summary,topic:r.topics,sourceTitle:r.title,section:r.provider,page:null})),evidenceSummary:retrieval.summary,trace:{providers:retrieval.providers,sourceIds:retrieval.results.map(r=>r.id),chunkIds:retrieval.results.filter(r=>r.provider==='local_library').map(r=>r.id)}};}
