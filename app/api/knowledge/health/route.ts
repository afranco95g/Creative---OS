import { NextResponse } from 'next/server';
import { knowledgeEngine } from '../../../../services/knowledge/KnowledgeEngine';
import {knowledgeRetriever} from '../../../../services/knowledge/KnowledgeRetriever';
export const runtime='nodejs';
export async function GET(){await knowledgeEngine.initialize();const stats=knowledgeEngine.getStats();return NextResponse.json({status:stats.failures?'degraded':'ready',documents:stats.documents,chunks:stats.chunks,collections:stats.collections,failures:stats.failures,generatedAt:stats.generatedAt,providers:await knowledgeRetriever.health()});}
