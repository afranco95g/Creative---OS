import type { ProjectGraph, ProjectModuleId } from '../types/project';
import { classifyProjectEvidence } from './semanticClassificationEngine';
export interface ReanalysisDifference { id:string; evidence:string; from:ProjectModuleId; to:ProjectModuleId|null; reason:string; confidence:number; }
export function reanalyzeProjectOrganization(graph:ProjectGraph):ReanalysisDifference[]{
 const out:ReanalysisDifference[]=[];
 for(const module of Object.values(graph.modules)) for(const evidence of module.evidence){
  const best=classifyProjectEvidence(evidence.quote).filter(x=>x.confidence>=.8).find(x=>x.targetModule!==module.id);
  if(best) out.push({id:`${module.id}-${evidence.id}`,evidence:evidence.quote,from:module.id,to:best.targetModule,reason:best.reason,confidence:best.confidence});
  else if(module.id==='budget'&&!/\d/.test(evidence.quote)&&/financiacion|presupuesto/i.test(evidence.quote)) out.push({id:`${module.id}-${evidence.id}`,evidence:evidence.quote,from:module.id,to:null,reason:'No contiene valores; debe conservarse como brecha pendiente, no como presupuesto sólido.',confidence:.9});
 }
 return out;
}
