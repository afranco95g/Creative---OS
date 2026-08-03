import { createHash } from 'node:crypto';
import type { KnowledgeChunk } from '../../types/knowledge';
import { categorize,keywords } from './knowledgeTaxonomy';
import type { ExtractedPage } from './documentParsers';
const TARGET_WORDS=520,OVERLAP_WORDS=70;
export function chunkDocument(documentId:string,pages:ExtractedPage[],jurisdiction='CO'):KnowledgeChunk[]{const chunks:KnowledgeChunk[]=[];for(const page of pages){const words=page.text.split(/\s+/).filter(Boolean);for(let start=0;start<words.length;start+=TARGET_WORDS-OVERLAP_WORDS){const text=words.slice(start,start+TARGET_WORDS).join(' ').trim();if(text.length<80)continue;const id=createHash('sha256').update(`${documentId}:${page.page}:${start}:${text}`).digest('hex').slice(0,32);const topics=categorize(`${page.section} ${text}`);chunks.push({id,documentId,sourceId:documentId,section:page.section,heading:page.section,page:page.page,text,content:text,tokens:Math.ceil(text.length/4),topics,topicTags:topics,keywords:keywords(text),embedding:null,projectTypes:[],projectStages:[],jurisdictions:[jurisdiction]});}}return chunks;}
