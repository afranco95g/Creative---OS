import assert from 'node:assert/strict';
import { acceptFinancialProposal, calculateFundingGap, createProposal, detectFinancialDivergence, initialFinancialAuthorityState, materializeFinancialKnowledge, syncFinancialItemToKnowledge, updateFinancialItem } from '../engines/financialAuthorityEngine';
import { createInitialProjectGraph } from '../core/projectEngine';
import type { CanonicalFinancialItem, FinancialProposal } from '../types/financialAuthority';
import type { ProjectKnowledgeEntity } from '../types/projectKnowledge';

const timestamp=new Date().toISOString();
const entity=(id:string,amount:number,status:ProjectKnowledgeEntity['status']='confirmed'):ProjectKnowledgeEntity=>({id,type:'financial_fact',key:'artist_unit_cost',label:'Artistas',value:{kind:'financial',concept:'artist_fee',amount,currency:'COP',quantity:5,unit:'artista',scope:'cost',taxIncluded:'unknown'},status,confidence:.85,provenance:{source:'conversation',extractionMethod:'explicit'},evidence:[],relatedModules:['budget'],relatedEntities:[],createdAt:timestamp,updatedAt:timestamp});
const proposal=materializeFinancialKnowledge({projectId:'project-1',knowledgeEntity:entity('knowledge-1',500000)});
assert(proposal&&proposal.quantity===5&&proposal.calculatedTotal.amount===2500000&&proposal.status==='pending');
assert.equal(materializeFinancialKnowledge({projectId:'project-1',knowledgeEntity:entity('x',1,'proposed')}),null,'Un dato no confirmado no se materializa.');

let state=initialFinancialAuthorityState();const created=createProposal(state,proposal!);state=created.state;
const duplicateProposal=createProposal(state,{...proposal!,id:'retry'});assert.equal(duplicateProposal.created,false);assert.equal(duplicateProposal.state.proposals.length,1);
const accepted=acceptFinancialProposal(state,proposal!.id);state=accepted.state;assert.equal(state.items.length,1);assert.equal(accepted.item.status,'estimated','Confirmar interpretación no aprueba presupuesto.');
const retried=acceptFinancialProposal(state,proposal!.id);assert.equal(retried.created,false);assert.equal(retried.state.items.length,1,'Retry idempotente.');

const update=updateFinancialItem(state,{itemId:accepted.item.id,expectedVersion:1,unitPrice:{amount:650000,currency:'COP'}});assert('item' in update&&update.item?.total.amount===3250000);assert.equal(update.change?.difference.amount,750000);
const conflict=updateFinancialItem(update.state,{itemId:accepted.item.id,expectedVersion:1,unitPrice:{amount:550000,currency:'COP'}});assert('conflict' in conflict&&conflict.conflict?.kind==='version_conflict');

const graph=createInitialProjectGraph();const knowledge=syncFinancialItemToKnowledge(graph.knowledge!,accepted.item);const updatedKnowledge=syncFinancialItemToKnowledge(knowledge,(update as {item:CanonicalFinancialItem}).item);const linked=updatedKnowledge.entities.filter(e=>e.operationalRef?.entityId===accepted.item.id);assert.equal(linked.length,2);assert.equal(linked[0].status,'superseded');assert.equal((linked[1].value as {amount:number}).amount,650000);

graph.tools.budgetLines=[{id:'legacy',category:'Talento',concept:'Artistas',quantity:5,unit:'artista',unitValue:500000,vatRate:0,withholdingRate:0,otherTaxes:0,status:'proposed',responsible:'',provider:'',estimatedDate:'',actualDate:'',source:'manual'}];const report=detectFinancialDivergence(graph.id,graph.tools.budgetLines,[(update as {item:CanonicalFinancialItem}).item]);assert(report.hasConflicts&&report.autoMerged===false&&report.divergences.some(d=>d.kind==='value_mismatch'));
assert(detectFinancialDivergence(graph.id,[],[accepted.item]).divergences.some(d=>d.kind==='table_only'));
assert(detectFinancialDivergence(graph.id,graph.tools.budgetLines,[]).divergences.some(d=>d.kind==='graph_only'));

const income:CanonicalFinancialItem={...accepted.item,id:'funding',direction:'income',status:'approved',total:{amount:5000000,currency:'COP'}};const cost:CanonicalFinancialItem={...accepted.item,id:'cost',quantity:1,total:{amount:20000000,currency:'COP'}};assert.equal(calculateFundingGap([cost,income]).amount,15000000);

const kicks=materializeFinancialKnowledge({projectId:'kicks',knowledgeEntity:{...entity('kicks-cost',80000),key:'production_cost_unit',label:'Fabricación de calzado',value:{kind:'financial',concept:'production_cost',amount:80000,currency:'COP',quantity:1,unit:'par',scope:'unknown',taxIncluded:'unknown'}}});assert(kicks&&kicks.direction==='expense'&&kicks.unitPrice.amount===80000);const price=materializeFinancialKnowledge({projectId:'kicks',knowledgeEntity:{...entity('kicks-price',220000),key:'intended_sale_price',label:'Precio previsto',value:{kind:'financial',concept:'intended_sale_price',amount:220000,currency:'COP',quantity:1,unit:'par',scope:'sale_price',taxIncluded:'unknown'}}});assert(price&&price.direction==='income'&&price.reason.includes('aprobación'));const spread=price!.unitPrice.amount-kicks!.unitPrice.amount;assert.equal(spread,140000,'Es spread preliminar, no utilidad.');
console.log('Executive Engine V2.4 Financial Authority: OK');
