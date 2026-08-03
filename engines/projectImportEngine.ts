import type { ModuleClassification, ProjectModuleId } from '../types/project';
import { classifyProjectEvidence } from './semanticClassificationEngine';

export type ImportFieldStatus = 'confirmed' | 'preliminary' | 'requires_confirmation' | 'not_found';
export interface ImportFinding { id:string; label:string; moduleId:ProjectModuleId; value:string; status:ImportFieldStatus; evidence:string; selected:boolean; comment:string; }
export interface ProjectImportAnalysis { title:string; description:string; stage:'idea'|'exploration'|'structuring'|'validation'|'execution'; findings:ImportFinding[]; missing:string[]; classifications:ModuleClassification[]; }
const labels:Partial<Record<ProjectModuleId,string>>={identity:'Nombre del proyecto',purpose:'Propuesta',community:'Público',activities:'Actividades',team:'Equipo',allies:'Aliados',budget:'Presupuesto',timeline:'Cronograma',risks:'Riesgos',evidence:'Evidencias',impact:'Resultados',opportunities:'Necesidades',documents:'Documentos'};
export function analyzeImportedProject(text:string,fileNames:string[]):ProjectImportAnalysis{
 const clean=text.replace(/\r/g,'').trim(); const classifications=classifyProjectEvidence(clean);
 const title=(clean.split('\n').map(x=>x.trim()).find(x=>x.length>=3&&x.length<=100)??fileNames[0]?.replace(/\.[^.]+$/,'')??'Proyecto importado');
 const description=clean.split(/\n\s*\n/).find(x=>x.length>80)?.slice(0,600)??clean.slice(0,600);
 const findings=classifications.map((c,i):ImportFinding=>({id:`finding-${i}`,label:labels[c.targetModule]??c.targetModule,moduleId:c.targetModule,value:c.extractedContent,status:c.confidence>=.8?'confirmed':'requires_confirmation',evidence:c.evidenceQuote,selected:c.confidence>=.8,comment:''}));
 if(fileNames.length)findings.push({id:'files',label:'Documentos',moduleId:'documents',value:fileNames.join(', '),status:'confirmed',evidence:'Archivos seleccionados por el usuario.',selected:true,comment:''});
 const present=new Set(findings.map(x=>x.moduleId)); const required:[ProjectModuleId,string][]=[['identity','nombre del proyecto'],['purpose','propuesta'],['community','público'],['activities','actividades'],['team','equipo'],['budget','presupuesto'],['timeline','cronograma'],['risks','riesgos'],['evidence','evidencias'],['opportunities','necesidades']];
 const stage=present.has('budget')&&present.has('timeline')?'validation':present.size>=5?'structuring':present.size>=2?'exploration':'idea';
 return {title,description,stage,findings,missing:required.filter(([id])=>!present.has(id)).map(([,label])=>label),classifications};
}
