import path from 'node:path';
import { readFile } from 'node:fs/promises';
import { COGNITIVE_COLLECTION_ID,KNOWLEDGE_LIBRARY_PATH } from './knowledgeConfig';
import { normalize } from './knowledgeTaxonomy';

export const DEFAULT_COLLECTION_ID='creative_os_general_library';
export interface CatalogRecord {id?:string;title:string;institution?:string;author?:string;year?:number|null;file?:string;url?:string;topics:string[];license?:string;language?:string;sourceType?:string;collectionId:string;documentType?:string;jurisdiction?:string;metadata:Record<string,unknown>;}
export interface CatalogBundle {records:CatalogRecord[];administrativeFiles:Set<string>;warnings:string[];}

export async function loadKnowledgeCatalogs():Promise<CatalogBundle>{
  const records:CatalogRecord[]=[];const administrativeFiles=new Set<string>();const warnings:string[]=[];
  administrativeFiles.add('README.md');
  administrativeFiles.add('INGESTION.md');
  administrativeFiles.add('05_catalogo/guia_uso_en_codex.md');
  await loadLegacyCatalog(records,administrativeFiles,warnings);
  await loadCognitiveCatalog(records,administrativeFiles,warnings);
  return{records,administrativeFiles,warnings};
}

export function findCatalogRecord(records:CatalogRecord[],relativePath:string){
  const fileName=path.basename(relativePath);
  const byFile=records.find(record=>record.file&&normalize(path.basename(record.file))===normalize(fileName));
  if(byFile)return byFile;
  const normalizedTitle=normalize(path.basename(fileName,path.extname(fileName)).replaceAll('_',' '));
  const exact=records.find(record=>normalize(record.title)===normalizedTitle);if(exact)return exact;
  const fileTokens=new Set(normalizedTitle.split(/[^a-z0-9]+/).filter(token=>token.length>3));
  return records.map(record=>({record,score:normalize(record.title).split(/[^a-z0-9]+/).filter(token=>token.length>3&&fileTokens.has(token)).length})).sort((a,b)=>b.score-a.score).find(candidate=>candidate.score>=2)?.record;
}

async function loadLegacyCatalog(records:CatalogRecord[],admin:Set<string>,warnings:string[]){
  const relative='05_catalogo/catalogo_recursos.csv';admin.add(relative);
  try{
    const rows=parseCsv(await readFile(path.join(KNOWLEDGE_LIBRARY_PATH,relative),'utf8'));
    records.push(...rows.map(row=>({title:row.titulo||row.title||'',institution:row.institucion||row.institution,year:toYear(row.anio||row.year),file:row.archivo||row.file,url:row.url,topics:splitTopics(row.tema||row.topics),license:row.licencia_o_condicion||row.license,language:normalizeLanguage(row.idioma||row.language),sourceType:row.tipo||'external_publication',collectionId:DEFAULT_COLLECTION_ID,metadata:{catalog:relative,includedInLibrary:normalize(row.incluido_en_zip||'')==='si'}})).filter(record=>record.title));
  }catch(error){warnings.push(`No se pudo leer ${relative}: ${message(error)}`);}
  admin.add('05_catalogo/manifest_ingestion.json');
}

async function loadCognitiveCatalog(records:CatalogRecord[],admin:Set<string>,warnings:string[]){
  const root='investigacion_cognitiva_y_casos';
  const csvPath=`${root}/catalog/catalogo_fuentes.csv`;const manifestPath=`${root}/catalog/manifest_investigacion.json`;const sumsPath=`${root}/catalog/SHA256SUMS.txt`;
  [csvPath,manifestPath,sumsPath,`${root}/README.md`].forEach(file=>admin.add(file));
  try{
    const rows=parseCsv(await readFile(path.join(KNOWLEDGE_LIBRARY_PATH,csvPath),'utf8'));
    records.push(...rows.map(row=>({id:row.id,title:row.title||'',institution:row.institution,year:toYear(row.year),file:isIncludedFile(row.file)?row.file:undefined,url:row.url,topics:splitTopics(row.topics),license:row.license,language:'en',sourceType:'institutional_publication',collectionId:COGNITIVE_COLLECTION_ID,documentType:row.file?.toLowerCase().endsWith('.pdf')?'pdf':'external_reference',jurisdiction:'global',metadata:{catalog:csvPath,externalReference:!isIncludedFile(row.file),catalogFileValue:row.file}})).filter(record=>record.title));
  }catch(error){warnings.push(`No se pudo leer ${csvPath}: ${message(error)}`);}
  try{
    const manifest=JSON.parse(await readFile(path.join(KNOWLEDGE_LIBRARY_PATH,manifestPath),'utf8')) as {version?:string;documents?:string[];ingestion_notes?:Record<string,unknown>};
    for(const file of manifest.documents??[]){
      records.push({title:path.basename(file,'.docx').replace(/^\d+_/,'').replaceAll('_',' '),institution:'Creative OS',author:undefined,year:2026,file,topics:internalTopics(file),license:'internal_authorized',language:'es',sourceType:'internal_research',collectionId:COGNITIVE_COLLECTION_ID,documentType:'docx',jurisdiction:'global',metadata:{manifest:manifestPath,manifestVersion:manifest.version,ingestionNotes:manifest.ingestion_notes}});
    }
  }catch(error){warnings.push(`No se pudo leer ${manifestPath}: ${message(error)}`);}
}

function parseCsv(text:string){const lines=text.replace(/^\uFEFF/,'').split(/\r?\n/).filter(Boolean).map(parseCsvLine);const header=lines.shift()?.map(value=>value.trim())??[];return lines.map(row=>Object.fromEntries(header.map((key,index)=>[key,row[index]?.trim()??''])));}
function parseCsvLine(line:string){const out:string[]=[];let value='',quoted=false;for(let index=0;index<line.length;index++){const char=line[index];if(char==='"'&&line[index+1]==='"'){value+='"';index++;}else if(char==='"')quoted=!quoted;else if(char===','&&!quoted){out.push(value);value='';}else value+=char;}out.push(value);return out;}
function splitTopics(value?:string){return(value??'').split(/[,;|]/).map(topic=>topic.trim()).filter(Boolean);}
function toYear(value?:string){const year=Number(value);return Number.isInteger(year)&&year>1800&&year<2200?year:null;}
function normalizeLanguage(value?:string){const language=normalize(value??'');return language.startsWith('ingl')||language==='en'?'en':'es';}
function isIncludedFile(file?:string){return Boolean(file&&/\.(pdf|docx|md|markdown|txt|html?)$/i.test(file));}
function internalTopics(file:string){const value=normalize(file);if(value.includes('modelo cognitivo'))return['executive_reasoning','naturalistic_decision_making','strategic_decision_making'];if(value.includes('casos'))return['case_based_reasoning','project_cases'];if(value.includes('executive review'))return['executive_review','project_diagnosis'];return['executive_reasoning','organizational_learning'];}
function message(error:unknown){return error instanceof Error?error.message:String(error);}
