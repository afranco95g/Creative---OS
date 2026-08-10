import { createHash } from 'node:crypto';
import type { KnowledgeChunk,KnowledgeReasoningMode } from '../../types/knowledge';
import { categorize,keywords,normalize } from './knowledgeTaxonomy';
import type { ExtractedBlock,ExtractedPage } from './documentParsers';

const TARGET_TOKENS=650,MAX_TOKENS=900,OVERLAP_TOKENS=90;
export interface ChunkContext {collectionId:string;jurisdiction:string;language:string;sourceTopics:string[];sourceType:string;}

export function chunkDocument(documentId:string,pages:ExtractedPage[],context:ChunkContext):KnowledgeChunk[]{
  const chunks:KnowledgeChunk[]=[];
  for(const page of pages){
    const groups=groupBlocks(page.blocks);
    groups.forEach((blocks,index)=>{
      const text=blocks.map(block=>block.text).join('\n\n').trim();
      if(text.length<80)return;
      const topicTags=[...new Set([...context.sourceTopics,...categorize(`${page.headingPath.join(' ')} ${text}`)])];
      const reasoningModes=classifyReasoningModes(page.headingPath,text,topicTags);
      const checksum=createHash('sha256').update(text).digest('hex');
      const hex=createHash('sha256').update(`${documentId}:${page.page}:${page.headingPath.join('/')}:${index}:${checksum}`).digest('hex').slice(0,32);
      const id=`${hex.slice(0,8)}-${hex.slice(8,12)}-5${hex.slice(13,16)}-a${hex.slice(17,20)}-${hex.slice(20,32)}`;
      const tokenCount=estimateTokens(text);
      chunks.push({id,documentId,sourceId:documentId,collectionId:context.collectionId,headingPath:page.headingPath,sectionTitle:page.section,section:page.section,heading:page.section,pageStart:page.page,pageEnd:page.page,page:page.page,text,content:text,tokenCount,tokens:tokenCount,topics:topicTags,topicTags,keywords:keywords(text),reasoningModes,projectTypes:classifyProjectTypes(text),projectStages:classifyProjectStages(text),decisionContexts:classifyDecisionContexts(text),jurisdiction:context.jurisdiction,jurisdictions:[context.jurisdiction],language:context.language,checksum,caseData:extractCaseData(page.headingPath,text),embedding:null});
    });
  }
  return chunks;
}

function groupBlocks(blocks:ExtractedBlock[]):ExtractedBlock[][]{
  const groups:ExtractedBlock[][]=[];let current:ExtractedBlock[]=[];let tokens=0;
  for(const block of blocks){const blockTokens=estimateTokens(block.text);
    if(current.length&&tokens+blockTokens>MAX_TOKENS){groups.push(current);const overlap=tailForOverlap(current);current=[...overlap];tokens=overlap.reduce((sum,item)=>sum+estimateTokens(item.text),0);}
    current.push(block);tokens+=blockTokens;
    if(tokens>=TARGET_TOKENS){groups.push(current);const overlap=tailForOverlap(current);current=[...overlap];tokens=overlap.reduce((sum,item)=>sum+estimateTokens(item.text),0);}
  }
  if(current.length&&(!groups.length||current.map(x=>x.text).join('')!==groups.at(-1)?.map(x=>x.text).join('')))groups.push(current);
  return groups;
}
function tailForOverlap(blocks:ExtractedBlock[]){const tail:ExtractedBlock[]=[];let tokens=0;for(let i=blocks.length-1;i>=0;i--){const next=estimateTokens(blocks[i].text);if(tokens&&tokens+next>OVERLAP_TOKENS)break;tail.unshift(blocks[i]);tokens+=next;}return tail.length===blocks.length?[]:tail;}
function estimateTokens(text:string){return Math.max(1,Math.ceil(text.length/4));}

const MODE_EVIDENCE:Array<[KnowledgeReasoningMode,string[]]>= [
 ['naturalistic_decision_making',['recognition primed','naturalistic decision','pattern recognition','mental simulation','decisión naturalista','reconocimiento de patrones']],
 ['case_based_reasoning',['case based','case library','caso comparable','biblioteca de casos','transferable lesson','lección transferible']],
 ['strategic_foresight',['foresight','scenario','escenario','futuro','señales de cambio']],
 ['experimentation',['experiment','prototype','pilot','hipótesis','prototipo','piloto','ensayo']],
 ['organizational_learning',['learning loop','lesson learned','aprendizaje organizacional','qué funcionó','what worked','what failed']],
 ['diagnostic',['diagnos','causa','constraint','restricción','signal','señal']],
 ['financial',['budget','cost','revenue','presupuesto','costo','ingreso','margen']],
 ['legal_compliance',['legal','license','rights','licencia','derecho','cumplimiento']],
 ['market_communication',['market','audience','communication','mercado','público','comunicación']],
 ['ecosystem',['ecosystem','partnership','ecosistema','alianza']],
 ['impact',['impact','outcome','evaluation','impacto','resultado','evaluación']],
 ['production',['production','timeline','operation','producción','cronograma','operación']],
 ['product',['product','service','value proposition','producto','servicio','propuesta de valor']],
 ['crisis_blockage',['crisis','pressure','high-risk','bloqueo','presión','alto riesgo']],
 ['exploratory',['explore','discovery','uncertainty','explorar','descubrimiento','incertidumbre']],
];
function classifyReasoningModes(headings:string[],text:string,topics:string[]):KnowledgeReasoningMode[]{const value=normalize(`${headings.join(' ')} ${topics.join(' ')} ${text}`);return MODE_EVIDENCE.filter(([,signals])=>signals.some(signal=>value.includes(normalize(signal)))).map(([mode])=>mode);}
function classifyProjectTypes(text:string){const value=normalize(text);return [['event',['evento','festival']],['product',['producto','manufactur']],['service',['servicio']],['cultural_process',['proceso cultural']],['research',['investigacion']],['organization',['organizacion']],['creative_industry',['creative industr','industria creativa']]].filter(([,signals])=>(signals as string[]).some(signal=>value.includes(signal))).map(([type])=>type as string);}
function classifyProjectStages(text:string){const value=normalize(text);return [['exploration',['explor','discover','idea']],['structuring',['plan','design','estructur']],['validation',['pilot','prototype','experiment','valid']],['execution',['implement','execute','ejecucion']],['scale',['scale','scaling','escal']]].filter(([,signals])=>(signals as string[]).some(signal=>value.includes(signal))).map(([stage])=>stage as string);}
function classifyDecisionContexts(text:string){const value=normalize(text);return ['uncertainty','time_pressure','resource_constraints','stakeholder_conflict','legal_risk','market_validation','organizational_change'].filter(context=>context.split('_').some(term=>value.includes(normalize(term)))||({time_pressure:['pressure','presion'],resource_constraints:['resource','recurso','constraint'],stakeholder_conflict:['stakeholder','conflict','actor'],legal_risk:['legal','rights','derecho'],market_validation:['market','mercado','validation'],organizational_change:['organizational','organizacion','institutional']} as Record<string,string[]>)[context]?.some(term=>value.includes(normalize(term))));}
function extractCaseData(headings:string[],text:string){const value=normalize(`${headings.join(' ')} ${text.slice(0,500)}`);if(!/\b(case|caso|story|historia|example|ejemplo)\b/.test(value))return undefined;return{title:headings.at(-1),context:null,decisionProblem:null,selectedDecision:null,results:null,transferableLesson:null,nonTransferConditions:null,evidenceQuality:'unreviewed'};}
