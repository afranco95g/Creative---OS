import path from 'node:path';
export const KNOWLEDGE_LIBRARY_PATH=path.join(process.cwd(),'biblioteca_creative_os');
export const KNOWLEDGE_CACHE_PATH=path.join(KNOWLEDGE_LIBRARY_PATH,'.knowledge-cache');
export const KNOWLEDGE_INDEX_PATH=path.join(KNOWLEDGE_CACHE_PATH,'index.json');
export const KNOWLEDGE_LOG_PATH=path.join(KNOWLEDGE_CACHE_PATH,'retrieval-log.ndjson');
export const SUPPORTED_EXTENSIONS=new Set(['.pdf','.md','.markdown','.txt','.docx','.html','.htm','.csv','.xlsx']);
export const PARSER_VERSION='knowledge-engine-1';
