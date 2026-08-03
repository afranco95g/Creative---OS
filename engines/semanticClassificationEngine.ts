import type { ModuleClassification, ProjectModuleId } from '../types/project';
const norm=(v:string)=>v.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
const rules:{module:ProjectModuleId;test:RegExp;confidence:number;reason:string;reject:ProjectModuleId[]}[]=[
 {module:'community',test:/\b(publico|audiencia|asistentes|participantes|beneficiarios|jovenes|ninos|adultos|familias|comunidad)\b/i,confidence:.9,reason:'Describe personas destinatarias.',reject:['team']},
 {module:'team',test:/\b(productor|director|coordinador|disenador|tallerista|tecnico|responsable|equipo|rol|vacante)\b/i,confidence:.85,reason:'Menciona un rol o responsabilidad.',reject:['community']},
 {module:'timeline',test:/\b(\d+\s+(dias?|semanas?|meses?|anos?)|enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre|fase|hito|cronograma)\b/i,confidence:.88,reason:'Contiene duración, fase, fecha o hito.',reject:['documents']},
 {module:'activities',test:/\b(investigar|cotizar|disenar|buscar|crear|producir|validar|realizar|ejecutar|campana|piloto)\b/i,confidence:.82,reason:'Expresa una acción concreta.',reject:['purpose','generalObjective']},
 {module:'allies',test:/\b(aliad[oa]s?|fundacion|empresa|institucion|universidad|marca|restaurante|gastronomic[oa]s?|patrocinador|proveedor)\b/i,confidence:.65,reason:'Menciona un actor o colaboración potencial.',reject:['budget']},
 {module:'documents',test:/\b(archivo|documento|pdf|docx|pptx|xlsx|csv|contrato|licencia|guion|informe|entregable)\b/i,confidence:.84,reason:'Menciona un archivo o entregable documental.',reject:['timeline']},
 {module:'purpose',test:/\b(proposito|razon de ser|busca generar|para que|valor cultural|valor social|intencion)\b/i,confidence:.82,reason:'Expresa intención o razón de ser.',reject:['activities']},
 {module:'generalObjective',test:/\b(objetivo general|resultado principal|lograr|alcanzar)\b/i,confidence:.8,reason:'Expresa un resultado principal.',reject:['activities']},
 {module:'risks',test:/\b(derechos|permiso|licencia|legal|contenido protegido)\b/i,confidence:.9,reason:'Expone una condición o riesgo legal.',reject:[]},
];
export function classifyProjectEvidence(input:string):ModuleClassification[]{
 const units=input.split(/\n+|;|(?<=[.!?])\s+/).map(x=>x.trim()).filter(Boolean), out:ModuleClassification[]=[]; const seen=new Set<string>();
 for(const unit of units){const text=norm(unit); for(const r of rules){
  if(!r.test.test(text))continue; if(r.module==='team'&&/\b(publico|audiencia|beneficiarios|comunidad)\b/.test(text))continue;
  if(r.module==='documents'&&/\b(cronograma|\d+\s+(dias?|semanas?|meses?))\b/.test(text))continue;
  if((r.module==='purpose'||r.module==='generalObjective')&&/\b(investigar|cotizar|disenar|buscar|piloto)\b/.test(text))continue;
  const key=`${r.module}:${text}`; if(seen.has(key))continue; seen.add(key);
  out.push({targetModule:r.module,extractedContent:unit,evidenceQuote:unit,confidence:r.confidence,interpretationType:r.confidence>=.8?'explicit_fact':'probable_inference',requiresConfirmation:r.confidence<.8,rejectedModules:r.reject,reason:r.reason});
 }}
 const hasAmount=/(?:\$|cop\s*)?\d[\d.,]*(?:\s*(?:pesos|cop|millones?|mil))/i.test(input);
 if(hasAmount)out.push({targetModule:'budget',extractedContent:input,evidenceQuote:input,confidence:.9,interpretationType:'explicit_fact',requiresConfirmation:false,rejectedModules:['allies'],reason:'Contiene un valor económico explícito.'});
 else if(/presupuesto|financiacion|cotizacion/i.test(norm(input)))out.push({targetModule:'budget',extractedContent:'Presupuesto pendiente de construcción.',evidenceQuote:input,confidence:.65,interpretationType:'probable_inference',requiresConfirmation:true,rejectedModules:['allies','documents'],reason:'Menciona una brecha económica sin valores.'});
 return out;
}
