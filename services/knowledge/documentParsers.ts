import path from 'node:path';
import { readFile } from 'node:fs/promises';
import { PDFParse } from 'pdf-parse';
import * as mammoth from 'mammoth';

export interface ExtractedBlock {
  type:'paragraph'|'list'|'table'|'question';
  text:string;
}
export interface ExtractedPage {
  page:number|null;
  text:string;
  section:string;
  headingPath:string[];
  blocks:ExtractedBlock[];
}
export interface ExtractedDocument {
  pages:ExtractedPage[];
  title?:string;
  author?:string;
  pageCount:number|null;
  warnings:string[];
}

export async function parseKnowledgeDocument(file:string):Promise<ExtractedDocument>{
  const ext=path.extname(file).toLowerCase();
  if(['.md','.markdown','.txt'].includes(ext)){
    const raw=await readFile(file,'utf8');
    const pages=splitStructuredText(raw,ext.startsWith('.md'));
    return{pages,title:pages[0]?.headingPath[0],pageCount:null,warnings:[]};
  }
  if(['.html','.htm'].includes(ext)){
    const raw=await readFile(file,'utf8');
    const pages=parseHtmlSections(raw);
    return{pages,title:pages[0]?.headingPath[0],pageCount:null,warnings:[]};
  }
  if(ext==='.docx'){
    const result=await mammoth.convertToHtml({path:file},{includeDefaultStyleMap:true});
    const pages=parseHtmlSections(result.value);
    return{pages,title:pages[0]?.headingPath[0],pageCount:null,warnings:result.messages.map(message=>message.message)};
  }
  if(ext==='.pdf'){
    const data=await readFile(file);
    const parser=new PDFParse({data:new Uint8Array(data)});
    try{
      const text=await parser.getText();
      const pages=text.pages.map(p=>{
        const body=p.text.trim();
        const section=detectHeading(body);
        return{page:p.num,text:body,section,headingPath:[section],blocks:plainBlocks(body)};
      });
      if(!pages.some(page=>page.text.length>80))throw new Error('El PDF no contiene texto extraíble; puede requerir OCR.');
      return{pages,pageCount:pages.length,warnings:[]};
    }finally{await parser.destroy();}
  }
  throw new Error(`Formato no soportado como documento narrativo: ${ext}`);
}

function splitStructuredText(text:string,markdown:boolean):ExtractedPage[]{
  const lines=text.replace(/\r/g,'').split('\n');
  const out:ExtractedPage[]=[];
  let headings:string[]=['Documento'];
  let blocks:ExtractedBlock[]=[];
  let paragraph:string[]=[];
  let list:string[]=[];
  const flushParagraph=()=>{const value=paragraph.join(' ').trim();if(value)blocks.push({type:isQuestion(value)?'question':'paragraph',text:value});paragraph=[];};
  const flushList=()=>{if(list.length)blocks.push({type:'list',text:list.join('\n')});list=[];};
  const flushSection=()=>{flushParagraph();flushList();if(!blocks.length)return;const section=headings.at(-1)??'Documento';out.push({page:null,section,headingPath:[...headings],blocks,text:blocks.map(block=>block.text).join('\n\n')});blocks=[];};
  for(const rawLine of lines){
    const line=rawLine.trim();
    const mdHeading=markdown?line.match(/^(#{1,6})\s+(.+)$/):null;
    const plainHeading=!markdown&&/^[A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑ\s\d.:_-]{5,100}$/.test(line)?line:null;
    if(mdHeading||plainHeading){flushSection();const level=mdHeading?mdHeading[1].length:1;const title=mdHeading?mdHeading[2].trim():plainHeading!;headings=[...headings.slice(0,Math.max(0,level-1)),title];continue;}
    if(/^([-*+]\s+|\d+[.)]\s+)/.test(line)){flushParagraph();list.push(line);continue;}
    if(!line){flushParagraph();flushList();continue;}
    paragraph.push(line);
  }
  flushSection();
  return out.length?out:[{page:null,section:'Documento',headingPath:['Documento'],text:text.trim(),blocks:plainBlocks(text)}];
}

function parseHtmlSections(html:string):ExtractedPage[]{
  const cleaned=html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi,'');
  const tokenPattern=/<h([1-6])[^>]*>([\s\S]*?)<\/h\1>|<(p|ul|ol|table)[^>]*>([\s\S]*?)<\/\3>/gi;
  const out:ExtractedPage[]=[];
  let headings:string[]=['Documento'];
  let blocks:ExtractedBlock[]=[];
  const flush=()=>{if(!blocks.length)return;const section=headings.at(-1)??'Documento';out.push({page:null,section,headingPath:[...headings],blocks,text:blocks.map(block=>block.text).join('\n\n')});blocks=[];};
  let match:RegExpExecArray|null;
  while((match=tokenPattern.exec(cleaned))){
    if(match[1]){flush();const level=Number(match[1]);const title=htmlText(match[2]);headings=[...headings.slice(0,Math.max(0,level-1)),title||'Sección'];continue;}
    const tag=match[3].toLowerCase();
    const body=match[4];
    if(tag==='table'){
      const rows=[...body.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)].map(row=>[...row[1].matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi)].map(cell=>htmlText(cell[1])).join(' | ')).filter(Boolean);
      if(rows.length)blocks.push({type:'table',text:rows.join('\n')});
    }else if(tag==='ul'||tag==='ol'){
      const items=[...body.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)].map((item,index)=>`${tag==='ol'?`${index+1}.`:'-'} ${htmlText(item[1])}`).filter(item=>item.length>2);
      if(items.length)blocks.push({type:'list',text:items.join('\n')});
    }else{
      const text=htmlText(body);if(text)blocks.push({type:isQuestion(text)?'question':'paragraph',text});
    }
  }
  flush();
  if(!out.length){const text=htmlText(cleaned);return[{page:null,section:'Documento',headingPath:['Documento'],text,blocks:plainBlocks(text)}];}
  return out;
}

function plainBlocks(text:string):ExtractedBlock[]{return text.split(/\n\s*\n/).map(value=>value.trim()).filter(Boolean).map(value=>({type:isQuestion(value)?'question':'paragraph',text:value}));}
function isQuestion(value:string){return /\?\s*$/.test(value)||/^(qué|cómo|cuál|cuándo|dónde|por qué|para qué)\b/i.test(value);}
function detectHeading(text:string){return text.split('\n').map(x=>x.trim()).find(x=>x.length>3&&x.length<120)??'Página';}
function htmlText(value:string){return decodeEntities(value.replace(/<br\s*\/?>/gi,'\n').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim());}
function decodeEntities(value:string){const entities:Record<string,string>={'&nbsp;':' ','&amp;':'&','&lt;':'<','&gt;':'>','&quot;':'"','&#39;':"'"};return value.replace(/&(nbsp|amp|lt|gt|quot|#39);/g,entity=>entities[entity]??entity);}
