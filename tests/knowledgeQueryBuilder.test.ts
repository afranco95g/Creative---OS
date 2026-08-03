import {buildKnowledgeQuery} from '../services/knowledge/KnowledgeQueryBuilder';
const cases:[string,string[]][]=[['Marca de zapatos',['pricing','unit costing','manufacturing']],['Festival cultural',['cultural festivals','participation','cultural management']],['Reserva ambiental',['ecotourism','conservation','community participation']],['Proyecto artístico',['audience engagement','creative practice','participatory art']]];
for(const [message,expected] of cases){const result=buildKnowledgeQuery({message,purpose:'test'});for(const keyword of expected)if(!result.keywords.includes(keyword))throw new Error(`${message}: falta ${keyword}`);}
console.log('Knowledge Query Builder: OK');
