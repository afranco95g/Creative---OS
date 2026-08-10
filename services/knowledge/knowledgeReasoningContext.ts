import 'server-only';
import type { ExecutiveReasoningContext,ExecutiveReasoningContextInput,KnowledgeReasoningMode,ProviderKnowledgeResult,QuestionStrategyContext,QuestionStrategyContextInput } from '../../types/knowledge';
import { COGNITIVE_COLLECTION_ID } from './knowledgeConfig';
import { knowledgeEngine } from './KnowledgeEngine';

export async function retrieveExecutiveReasoningContext(input:ExecutiveReasoningContextInput):Promise<ExecutiveReasoningContext>{
  const modes=inferModes(`${input.currentDecision} ${input.uncertaintyType} ${input.riskLevel} ${input.requestedOutcome} ${input.contextTags.join(' ')}`);
  const hits=await knowledgeEngine.search({text:[input.currentDecision,input.uncertaintyType,input.requestedOutcome,...input.contextTags].join(' '),collectionIds:[COGNITIVE_COLLECTION_ID],reasoningModes:modes,projectTypes:[input.projectType],projectStages:[input.projectStage],decisionContexts:[input.uncertaintyType,input.riskLevel],purpose:'executive_reasoning_context',limit:12});
  const mapped=hits.map(toProviderResult);
  const methodology=mapped.filter((_,index)=>hits[index].source.sourceType==='internal_research'&&!hits[index].chunk.caseData).slice(0,4);
  const comparableCases=mapped.filter((_,index)=>Boolean(hits[index].chunk.caseData)||hits[index].chunk.reasoningModes.includes('case_based_reasoning')).slice(0,4);
  const externalEvidence=mapped.filter((_,index)=>hits[index].source.sourceType!=='internal_research').slice(0,4);
  return{methodology,comparableCases,externalEvidence,openQuestions:buildOpenQuestions(input),nonTransferWarnings:comparableCases.length?['Los casos son analogías, no precedentes: comprobar territorio, etapa, recursos, actores y restricciones antes de transferir una solución.']:[],sourceTrace:hits.map(hit=>({sourceId:hit.source.id,chunkId:hit.chunk.id,collectionId:hit.chunk.collectionId,headingPath:hit.chunk.headingPath,pageStart:hit.chunk.pageStart,pageEnd:hit.chunk.pageEnd}))};
}

export async function retrieveQuestionStrategyContext(input:QuestionStrategyContextInput):Promise<QuestionStrategyContext>{
  const modes=inferModes(`${input.activeArea} ${input.uncertainties.join(' ')} ${input.currentFacts.join(' ')}`);
  const hits=await knowledgeEngine.search({text:[input.activeArea,...input.uncertainties,...input.currentFacts].join(' '),collectionIds:[COGNITIVE_COLLECTION_ID],reasoningModes:modes,projectTypes:[input.projectType],projectStages:[input.projectStage],purpose:'question_strategy_context',limit:10});
  const comparableCases=hits.filter(hit=>hit.chunk.caseData||hit.chunk.reasoningModes.includes('case_based_reasoning')).slice(0,3).map(toProviderResult);
  const candidates=hits.flatMap(hit=>extractQuestions(hit.chunk.text));
  const seen=new Set([...input.previousQuestions,...input.skippedQuestions].map(normalizeQuestion));
  const recommendedQuestions=[...new Set(candidates)].filter(question=>!seen.has(normalizeQuestion(question))).slice(0,5);
  return{reasoningModes:modes,recommendedQuestions,comparableCases,risksToClarify:input.uncertainties.filter(value=>/riesgo|permiso|costo|dependencia|derecho|incertidumbre/i.test(value)),nonApplicableKnowledge:hits.filter(hit=>hit.chunk.projectTypes.length>0&&!hit.chunk.projectTypes.includes(input.projectType)).map(hit=>`${hit.source.title}: caso o método de otro tipo de proyecto; requiere adaptación.`),sourceTrace:hits.map(hit=>({sourceId:hit.source.id,chunkId:hit.chunk.id,collectionId:hit.chunk.collectionId,headingPath:hit.chunk.headingPath,pageStart:hit.chunk.pageStart,pageEnd:hit.chunk.pageEnd}))};
}

function toProviderResult(hit:Awaited<ReturnType<typeof knowledgeEngine.search>>[number]):ProviderKnowledgeResult{return{id:hit.chunk.id,sourceId:hit.source.id,provider:'local_library',entityType:'work',title:hit.source.title,summary:hit.chunk.text.slice(0,1600),authors:hit.source.author?[hit.source.author]:[],institution:hit.source.institution,year:hit.source.year,language:hit.source.language,topics:hit.chunk.topics,doi:null,url:hit.source.canonicalUrl,citedByCount:0,openAccess:hit.source.sourceType!=='internal_research',relevance:hit.score,retrievedAt:new Date().toISOString(),collectionId:hit.chunk.collectionId,headingPath:hit.chunk.headingPath,pageStart:hit.chunk.pageStart,pageEnd:hit.chunk.pageEnd,reasoningModes:hit.chunk.reasoningModes,nonTransferWarnings:hit.chunk.caseData?['No copiar la decisión sin verificar las condiciones de transferencia.']:[]};}
function inferModes(text:string):KnowledgeReasoningMode[]{const value=text.toLowerCase();const modes=new Set<KnowledgeReasoningMode>();if(/inciert|explor|descubr/.test(value))modes.add('exploratory');if(/diagn|causa|señal/.test(value))modes.add('diagnostic');if(/riesgo|presión|crisis|bloqueo/.test(value))modes.add('crisis_blockage');if(/experiment|piloto|prototipo|hipótesis/.test(value))modes.add('experimentation');if(/caso|análogo|comparable/.test(value))modes.add('case_based_reasoning');if(/futuro|escenario|prospect/.test(value))modes.add('strategic_foresight');if(/aprend|resultado|funcionó|falló/.test(value))modes.add('organizational_learning');if(!modes.size)modes.add('diagnostic');return[...modes];}
function buildOpenQuestions(input:ExecutiveReasoningContextInput){return[`¿Qué evidencia reduciría primero la incertidumbre “${input.uncertaintyType}”?`,`¿Qué condición haría que la decisión “${input.currentDecision}” dejara de ser recomendable?`,`¿Qué consecuencia debe simularse antes de buscar “${input.requestedOutcome}”?`];}
function extractQuestions(text:string){return text.split(/(?<=[?])\s+|\n+/).map(value=>value.trim()).filter(value=>value.endsWith('?')&&value.length>15&&value.length<300);}
function normalizeQuestion(value:string){return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9 ]/g,'').trim();}
