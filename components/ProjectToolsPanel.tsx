'use client';

import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, ChevronDown, ChevronRight, Download, FileText, Plus, Presentation, Sparkles, Trash2, X } from 'lucide-react';

import { compileDocument, getAllDocumentReadiness } from '@/engines/documentEngine';
import { analizarFlujo, describirExposicion } from '@/engines/cashFlowEngine';
import type { AnalisisDeFlujo, FlujoDeCaja, VistaFlujo } from '@/engines/cashFlowEngine';
import { seedPreparednessChecklist, getPreparednessSummary } from '@/engines/preparednessEngine';
import { createId, now } from '@/core/projectEngine';
import { checkDependencyConsistency } from '@/engines/projectDependencyEngine';
import { SERVICE_CATEGORIES } from '@/services/ecosystem/serviceCategories';
import type { DependencyFinding, GrantWorkspace, Ingreso, PreparednessArea, PreparednessChecklistItem, PreparednessStatus, ProjectActivity, ProjectBudgetLine, ProjectGraph, ProjectObjective, ProjectScheduleItem } from '@/types/project';

type ToolId = 'documents' | 'budget' | 'schedule' | 'grant' | 'preparation' | 'dependencies' | 'needs';

export function ProjectToolsPanel({ graph, onChange }: { graph: ProjectGraph; onChange: (graph: ProjectGraph) => void }) {
  const [active, setActive] = useState<ToolId>('documents');
  const tabs: Array<[ToolId, string]> = [['documents', 'One Pager · Propuesta · Pitch'], ['budget', 'Presupuesto vivo'], ['schedule', 'Cronograma'], ['grant', 'Convocatorias'], ['preparation', 'Preparación'], ['dependencies', 'Objetivos y actividades'], ['needs', 'Necesidades']];
  return <section className="mx-auto max-w-7xl space-y-7">
    <header><p className="text-sm uppercase tracking-[.25em] text-texto-principal">Herramientas del proyecto</p><h1 className="mt-3 text-4xl font-semibold">Sistemas vivos, una sola fuente de verdad</h1><p className="mt-3 max-w-3xl text-texto-largo">Cada herramienta reutiliza el grafo del proyecto. Los cambios estructurados quedan disponibles para las demás vistas y solo se exportan cuando lo solicitas.</p></header>
    <nav className="flex flex-wrap gap-2">{tabs.map(([id, label]) => <button key={id} onClick={() => setActive(id)} className={`rounded-full px-4 py-2 text-sm ${active === id ? 'bg-rojo-base font-bold text-hueso' : 'border border-borde/15 text-texto-largo'}`}>{label}</button>)}</nav>
    {active === 'documents' ? <ExecutiveDocuments graph={graph} /> : null}
    {active === 'budget' ? <LivingBudget graph={graph} onChange={onChange} /> : null}
    {active === 'schedule' ? <ProjectCalendar graph={graph} onChange={onChange} /> : null}
    {active === 'grant' ? <GrantAssistant graph={graph} onChange={onChange} /> : null}
    {active === 'preparation' ? <PreparednessChecklist graph={graph} onChange={onChange} /> : null}
    {active === 'dependencies' ? <ObjectivesAndActivities graph={graph} onChange={onChange} /> : null}
    {active === 'needs' ? <ProjectNeeds graph={graph} onChange={onChange} /> : null}
  </section>;
}

function ProjectNeeds({ graph, onChange }: { graph: ProjectGraph; onChange: (g: ProjectGraph) => void }) {
  const needs = graph.tools.needs ?? [];
  const toggle = (key: string) => setTools(graph, onChange, { needs: needs.includes(key) ? needs.filter((value) => value !== key) : [...needs, key] });
  return <section className="space-y-3">
    <h2 className="text-xl font-semibold text-texto-principal">¿Qué necesita este proyecto?</h2>
    <p className="max-w-3xl text-sm leading-6 text-texto-largo">Selecciona todo lo que aplique — es el mismo vocabulario que usan los aliados del ecosistema para declarar lo que ofrecen.</p>
    <div className="flex flex-wrap gap-2">{SERVICE_CATEGORIES.map(([id, label]) => { const active = needs.includes(id); return <button key={id} type="button" onClick={() => toggle(id)} className={`rounded-full border px-4 py-2 text-sm ${active ? 'border-acento bg-rojo-base font-semibold text-hueso' : 'border-borde/15 text-texto-largo'}`}>{label}</button>; })}</div>
  </section>;
}

function ExecutiveDocuments({ graph }: { graph: ProjectGraph }) {
  const docs = getAllDocumentReadiness(graph);
  const [preview, setPreview] = useState<string | null>(null);
  const selected = preview ? docs.find((item) => item.definition.id === preview) ?? null : null;
  return <><div className="grid gap-5 lg:grid-cols-3">{docs.map((item) => <article key={item.definition.id} className="group rounded-3xl border border-borde/10 bg-superficie-elevada p-6 transition hover:-translate-y-1 hover:border-acento/50"><div className="flex items-start justify-between"><p className="text-xs uppercase tracking-[.16em] text-texto-largo">Documento ejecutivo</p><span className="rounded-full border border-acento/30 bg-acento/5 px-3 py-1 text-xs font-semibold text-texto-principal">{item.readiness}%</span></div><h2 className="mt-5 text-2xl font-semibold">{item.definition.title}</h2><p className="mt-3 min-h-16 text-sm leading-6 text-texto-largo">{item.definition.description}</p><div className="mt-7 flex gap-2"><button onClick={() => setPreview(item.definition.id)} className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-borde/15 px-4 py-2 text-sm transition hover:border-acento hover:text-texto-principal"><Presentation size={16}/> Presentar</button><button onClick={() => exportDoc(graph, item.definition.id)} title="Descargar DOC" className="rounded-full bg-rojo-base px-4 py-2 text-sm font-bold text-hueso"><Download size={15}/></button><button onClick={() => exportMarkdown(graph, item.definition.id)} title="Descargar Markdown" className="rounded-full border border-borde/15 px-4 py-2 text-sm font-bold text-texto-principal transition hover:border-acento"><FileText size={15}/></button></div></article>)}</div>{selected ? <ExecutivePreviewModal graph={graph} definitionId={selected.definition.id} readiness={selected.readiness} onClose={() => setPreview(null)}/> : null}</>;
}

function ExecutivePreviewModal({graph,definitionId,readiness,onClose}:{graph:ProjectGraph;definitionId:string;readiness:number;onClose:()=>void}){
  const document=useMemo(()=>compileDocument(graph,definitionId),[graph,definitionId]);
  useEffect(()=>{const previous=documentBodyOverflow();window.document.body.style.overflow='hidden';const close=(event:KeyboardEvent)=>{if(event.key==='Escape')onClose()};window.addEventListener('keydown',close);return()=>{window.document.body.style.overflow=previous;window.removeEventListener('keydown',close)}},[onClose]);
  return <div role="dialog" aria-modal="true" aria-label={`Vista previa de ${document.title}`} className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-3 backdrop-blur-md sm:p-6" onMouseDown={(event)=>{if(event.target===event.currentTarget)onClose()}}><section className="flex h-[94vh] w-full max-w-7xl flex-col overflow-hidden rounded-[28px] border border-borde/15 bg-superficie-elevada shadow-[0_40px_120px_rgba(0,0,0,.8)] sm:rounded-[36px]"><header className="flex shrink-0 items-center justify-between gap-4 border-b border-borde/10 px-5 py-4 sm:px-8"><div className="flex min-w-0 items-center gap-4"><div className="hidden h-10 w-10 items-center justify-center rounded-full bg-rojo-base text-hueso sm:flex"><Presentation size={19}/></div><div className="min-w-0"><p className="text-[10px] font-bold uppercase tracking-[.22em] text-texto-principal">Presentación ejecutiva</p><h2 className="truncate text-lg font-semibold sm:text-xl">{document.title}</h2></div></div><div className="flex items-center gap-2"><span className="hidden rounded-full border border-borde/10 px-4 py-2 text-xs text-texto-largo sm:block">Preparación {readiness}%</span><button onClick={()=>exportDoc(graph,definitionId)} className="inline-flex items-center gap-2 rounded-full bg-rojo-base px-4 py-2 text-sm font-bold text-hueso"><Download size={15}/><span className="hidden sm:inline">Descargar</span></button><button onClick={onClose} aria-label="Cerrar vista previa" className="flex h-10 w-10 items-center justify-center rounded-full border border-borde/15 text-texto-largo transition hover:border-borde hover:text-texto-largo"><X size={18}/></button></div></header><div className="min-h-0 flex-1 overflow-y-auto bg-superficie px-3 py-5 sm:px-8 sm:py-8"><article className="mx-auto min-h-full max-w-5xl overflow-hidden rounded-[24px] border border-borde/10 bg-superficie-elevada shadow-2xl sm:rounded-[32px]"><div className="relative overflow-hidden border-b border-borde/10 px-6 py-10 sm:px-12 sm:py-14"><div className="absolute right-0 top-0 h-40 w-40 translate-x-1/3 -translate-y-1/3 rounded-full bg-acento/15 blur-3xl"/><p className="relative text-xs font-bold uppercase tracking-[.28em] text-texto-principal">El Culebreo · Creative OS</p><h1 className="relative mt-5 max-w-4xl text-4xl font-semibold leading-[1.05] tracking-tight sm:text-6xl">{graph.title}</h1><div className="relative mt-8 flex flex-wrap items-center gap-3"><span className="rounded-full bg-rojo-base px-4 py-2 text-xs font-bold uppercase tracking-wider text-hueso">{document.title}</span><span className="text-xs uppercase tracking-wider text-texto-largo">Versión de trabajo · {new Date().toLocaleDateString('es-CO')}</span></div></div><div className="grid gap-10 px-6 py-10 sm:px-12 sm:py-14 lg:grid-cols-[180px_1fr]"><aside><p className="text-[10px] font-bold uppercase tracking-[.22em] text-texto-largo">Índice ejecutivo</p><div className="mt-4 h-px bg-rojo-base"/><p className="mt-4 text-sm leading-6 text-texto-largo">Información consolidada desde la fuente única del proyecto.</p></aside><ExecutiveContent content={document.content}/></div></article></div><footer className="flex shrink-0 items-center justify-between border-t border-borde/10 px-5 py-3 text-[10px] uppercase tracking-[.18em] text-texto-largo sm:px-8"><span>Creative OS</span><span>Esc para cerrar</span></footer></section></div>;
}

function ExecutiveContent({content}:{content:string}){return <div className="min-w-0 space-y-5">{content.split('\n').map((line,index)=>{const clean=line.trim();if(!clean||clean==='---')return clean==='---'?<div key={index} className="my-9 h-px bg-borde"/>:<div key={index} className="h-2"/>;if(clean.startsWith('# '))return null;if(clean.startsWith('## '))return <h2 key={index} className="mt-10 border-l-2 border-acento pl-5 text-2xl font-semibold tracking-tight text-texto-largo sm:text-3xl">{clean.slice(3)}</h2>;const pending=clean.toLowerCase().startsWith('pendiente por fortalecer');return pending?<div key={index} className="rounded-2xl border border-borde bg-superficie-elevada p-5 text-sm leading-7 text-naranja"><span className="mb-2 block text-[10px] font-bold uppercase tracking-[.2em]">Por desarrollar</span>{clean}</div>:<p key={index} className="text-base leading-8 text-texto-largo sm:text-lg sm:leading-9">{clean}</p>})}</div>}

function documentBodyOverflow(){return window.document.body.style.overflow}

const VISTAS_FLUJO: VistaFlujo[] = ['comprometido', 'aprobado', 'completo'];
const ETIQUETAS_VISTA_FLUJO: Record<VistaFlujo, string> = { comprometido: 'Comprometido', aprobado: 'Aprobado', completo: 'Completo' };

function LivingBudget({ graph, onChange }: { graph: ProjectGraph; onChange: (g: ProjectGraph) => void }) {
  const lines = graph.tools.budgetLines;
  const ingresos = graph.tools.ingresos ?? [];
  const fuentes = graph.tools.fuentes ?? [];
  const [filter, setFilter] = useState('all');
  const [collapsed, setCollapsed] = useState<string[]>([]);
  const suggestions = useMemo(() => inferBudgetSuggestions(graph, lines), [graph, lines]);
  const categories = [...new Set(lines.map((line) => line.category))].sort();
  // Limitación conocida y deliberada de esta entrega (ver specs/flujo-de-caja-en-presupuesto-vivo.md sección 4):
  // saldoPropioInicialCop y toleranciaCop todavía no son configurables desde la UI, así que se fijan en 0.
  // Esto asume que el proyecto no tiene saldo propio disponible al inicio; si lo tiene, la exposición de caja
  // que se muestra abajo sobreestima el hueco. El texto junto a describirExposicion() declara este supuesto.
  const flujo: FlujoDeCaja = useMemo(() => ({
    lineas: lines,
    ingresos,
    fuentes,
    saldoPropioInicialCop: 0,
    toleranciaCop: 0,
  }), [lines, ingresos, fuentes]);
  const analisisPorVista = useMemo(() => {
    const resultado = {} as Record<VistaFlujo, AnalisisDeFlujo>;
    for (const vista of VISTAS_FLUJO) resultado[vista] = analizarFlujo(flujo, vista);
    return resultado;
  }, [flujo]);
  const visible = filter === 'all' ? lines : lines.filter((line) => line.status === filter);
  const update = (id: string, patch: Partial<ProjectBudgetLine>) => setTools(graph, onChange, { budgetLines: lines.map((line) => line.id === id ? { ...line, ...patch } : line) });
  const add = (concept = 'Nueva línea', category = 'General', source: ProjectBudgetLine['source'] = 'manual') => setTools(graph, onChange, { budgetLines: [...lines, blankBudgetLine(concept, category, source)] });
  return <div className="space-y-5">
    {suggestions.length ? <section className="rounded-3xl border border-acento/30 bg-superficie p-5"><div className="flex items-center gap-2 text-texto-principal"><Sparkles size={18}/><strong>Creative OS detectó posibles gastos</strong></div><div className="mt-4 flex flex-wrap gap-2">{suggestions.map((s) => <button key={s.concept} onClick={() => add(s.concept, s.category, 'creative-os')} className="rounded-full border border-acento/30 px-4 py-2 text-sm">+ {s.concept}</button>)}</div></section> : null}
    <div className="flex flex-wrap items-center justify-between gap-3"><div className="flex gap-2"><button onClick={() => add()} className="inline-flex items-center gap-2 rounded-full bg-rojo-base px-4 py-2 font-bold text-hueso"><Plus size={16}/> Línea</button><select value={filter} onChange={(e) => setFilter(e.target.value)} className="rounded-full border border-borde/15 bg-superficie px-4 py-2 text-sm"><option value="all">Todos los estados</option><option value="proposed">Propuesto</option><option value="approved">Aprobado</option><option value="committed">Comprometido</option><option value="paid">Pagado</option></select></div><button onClick={() => exportBudgetCsv(graph)} className="inline-flex items-center gap-2 rounded-full border border-borde/15 px-4 py-2 text-sm"><Download size={16}/> CSV</button></div>
    <div className="overflow-x-auto rounded-2xl border border-borde/10"><table className="w-full min-w-[1050px] text-left text-sm"><thead className="bg-superficie text-xs uppercase text-texto-largo"><tr><th className="p-3">Concepto</th><th>Cantidad</th><th>Unidad</th><th>Valor unitario</th><th>Subtotal</th><th>IVA</th><th>Retenciones</th><th>Total</th><th>Estado</th><th>Responsable</th><th></th></tr></thead><tbody>{categories.map((category) => { const group = visible.filter((l) => l.category === category); if (!group.length) return null; const isCollapsed = collapsed.includes(category); return [<tr key={`${category}-head`} className="border-t border-borde/10 bg-superficie-elevada"><td colSpan={11} className="p-3"><button onClick={() => setCollapsed(isCollapsed ? collapsed.filter((c) => c !== category) : [...collapsed, category])} className="inline-flex items-center gap-2 font-semibold">{isCollapsed ? <ChevronRight size={16}/> : <ChevronDown size={16}/>} {category} · {money(group.reduce((n,l) => n + total(l),0))}</button></td></tr>, ...(!isCollapsed ? group.map((line) => <tr key={line.id} className="border-t border-borde/10"><td className="p-2"><input value={line.concept} onChange={(e) => update(line.id,{concept:e.target.value})} className="w-48 bg-transparent p-2"/></td><td><Num value={line.quantity} onChange={(quantity)=>update(line.id,{quantity})}/></td><td><input value={line.unit} onChange={(e)=>update(line.id,{unit:e.target.value})} className="w-24 bg-transparent p-2"/></td><td><Num value={line.unitValue} onChange={(unitValue)=>update(line.id,{unitValue})}/></td><td>{money(line.quantity*line.unitValue)}</td><td><Num value={line.vatRate} onChange={(vatRate)=>update(line.id,{vatRate})}/></td><td><Num value={line.withholdingRate} onChange={(withholdingRate)=>update(line.id,{withholdingRate})}/></td><td className="font-semibold text-texto-principal">{money(total(line))}</td><td><select value={line.status} onChange={(e)=>update(line.id,{status:e.target.value as ProjectBudgetLine['status']})} className="bg-superficie p-2"><option value="proposed">Propuesto</option><option value="approved">Aprobado</option><option value="committed">Comprometido</option><option value="paid">Pagado</option></select></td><td><input value={line.responsible} onChange={(e)=>update(line.id,{responsible:e.target.value})} placeholder="Sin asignar" className="w-32 bg-transparent p-2"/></td><td><button onClick={()=>setTools(graph,onChange,{budgetLines:lines.filter((l)=>l.id!==line.id)})}><Trash2 size={15}/></button></td></tr>) : [])]; })}</tbody></table></div>
    <CashFlowSummary ingresos={ingresos} analisisPorVista={analisisPorVista} saldoInicial={flujo.saldoPropioInicialCop} />
  </div>;
}

function CashFlowSummary({ ingresos, analisisPorVista, saldoInicial }: { ingresos: Ingreso[]; analisisPorVista: Record<VistaFlujo, AnalisisDeFlujo>; saldoInicial: number }) {
  if (!ingresos.length) {
    return <section className="rounded-3xl border border-dashed border-borde/15 p-10 text-texto-largo">
      Aún no hay ingresos con condición registrados. Agrega los ingresos del proyecto para ver el flujo de caja.
    </section>;
  }

  const analisis = analisisPorVista.aprobado;
  const claridad = analisis.claridad;
  const balanceDeVista = (vista: VistaFlujo) => { const curva = analisisPorVista[vista].curva; return curva.length ? curva[curva.length - 1].saldoCop : saldoInicial; };
  const avisosClaridad: string[] = [];
  if (claridad.lineasSinFecha.length) avisosClaridad.push(`${claridad.lineasSinFecha.length} línea(s) de presupuesto sin fecha.`);
  if (claridad.lineasSinValor.length) avisosClaridad.push(`${claridad.lineasSinValor.length} línea(s) de presupuesto sin valor.`);
  if (claridad.lineasSinResponsable.length) avisosClaridad.push(`${claridad.lineasSinResponsable.length} línea(s) de presupuesto sin responsable.`);
  if (claridad.ingresosSinFecha.length) avisosClaridad.push(`${claridad.ingresosSinFecha.length} ingreso(s) sin fecha.`);

  return <section className="space-y-5 rounded-3xl border border-borde/10 bg-superficie-elevada p-6">
    <h2 className="text-xl font-semibold text-texto-principal">Flujo de caja</h2>
    <div className="grid gap-4 sm:grid-cols-3">{VISTAS_FLUJO.map((vista) => <div key={vista} className="rounded-2xl border border-borde/10 bg-superficie p-4"><p className="text-xs uppercase tracking-[.16em] text-texto-largo">{ETIQUETAS_VISTA_FLUJO[vista]}</p><strong className="mt-2 block text-2xl text-texto-principal">{money(balanceDeVista(vista))}</strong></div>)}</div>
    <div className="rounded-2xl border border-borde/10 bg-superficie p-4">
      <p className="text-xs uppercase tracking-[.16em] text-texto-largo">Claridad del presupuesto</p>
      <div className="mt-3 grid gap-3 sm:grid-cols-3"><p className="text-sm text-texto-largo">Ingresos totales <strong className="block text-texto-principal">{money(claridad.totalIngresosCop)}</strong></p><p className="text-sm text-texto-largo">Egresos totales <strong className="block text-texto-principal">{money(claridad.totalEgresosCop)}</strong></p><p className="text-sm text-texto-largo">Diferencia <strong className={`block ${claridad.estaFinanciado ? 'text-texto-principal' : 'text-naranja'}`}>{money(claridad.diferenciaCop)}</strong></p></div>
      <p className={`mt-3 text-sm ${claridad.estaFinanciado ? 'text-texto-principal' : 'text-naranja'}`}>{claridad.estaFinanciado ? 'El presupuesto está financiado.' : 'El presupuesto todavía no está financiado.'}</p>
      {!claridad.listoParaPresentar ? <ul className="mt-3 space-y-1 text-sm text-naranja">{avisosClaridad.map((aviso) => <li key={aviso}>· {aviso}</li>)}</ul> : <p className="mt-3 text-sm text-texto-principal">Listo para presentar.</p>}
    </div>
    <div className="rounded-2xl border border-borde/10 bg-superficie p-4">
      <p className="text-xs uppercase tracking-[.16em] text-texto-largo">Exposición de caja</p>
      <p className="mt-2 text-sm leading-6 text-texto-largo">{describirExposicion(analisis)}</p>
      <p className="mt-2 text-xs italic leading-5 text-texto-largo">Calculado asumiendo que no tienes saldo propio disponible al inicio del proyecto.</p>
    </div>
    {analisis.hayBloqueoPorRestriccion ? <div className="rounded-2xl border border-borde bg-rojo-base p-4 text-hueso"><p className="text-xs uppercase tracking-[.16em]">Bloqueo por restricción de fuente</p><p className="mt-2 text-sm leading-6">El presupuesto se ve financiado en total, pero la plata propia se queda en negativo porque las fuentes restringidas no pueden cubrir esos gastos.</p></div> : null}
  </section>;
}

function ProjectCalendar({ graph, onChange }: { graph: ProjectGraph; onChange: (g: ProjectGraph) => void }) {
  const items = graph.tools.scheduleItems;
  const [view, setView] = useState<'day'|'week'|'month'|'quarter'>('month');
  const [cursor, setCursor] = useState(() => new Date());
  const range = getRange(cursor, view);
  const shown = items.filter((i) => new Date(i.endsAt) >= range.start && new Date(i.startsAt) <= range.end).sort((a,b)=>a.startsAt.localeCompare(b.startsAt));
  const update = (id:string, patch:Partial<ProjectScheduleItem>) => setTools(graph,onChange,{scheduleItems:items.map((i)=>i.id===id?{...i,...patch}:i)});
  const add = () => { const d = cursor.toISOString().slice(0,10); setTools(graph,onChange,{scheduleItems:[...items,{id:createId(),name:'Nueva actividad',description:'',startsAt:d,endsAt:d,responsible:'',status:'planned',budgetLineId:null,documentIds:[],tasks:[],milestone:false,activityId:null}]}); };
  return <div className="space-y-5"><div className="flex flex-wrap items-center justify-between gap-3"><div className="flex gap-2"><button onClick={()=>shift(cursor,setCursor,view,-1)} className="rounded-full border border-borde/15 px-4 py-2">←</button><button onClick={()=>setCursor(new Date())} className="rounded-full border border-borde/15 px-4 py-2">Hoy</button><button onClick={()=>shift(cursor,setCursor,view,1)} className="rounded-full border border-borde/15 px-4 py-2">→</button></div><strong>{range.label}</strong><div className="flex gap-1">{(['day','week','month','quarter'] as const).map((v)=><button key={v} onClick={()=>setView(v)} className={`rounded-full px-3 py-2 text-sm ${view===v?'bg-rojo-base text-hueso':'border border-borde/15'}`}>{({day:'Día',week:'Semana',month:'Mes',quarter:'Trimestre'} as const)[v]}</button>)}</div></div><div className="relative rounded-3xl border border-borde/10 bg-superficie-elevada p-6 before:absolute before:bottom-6 before:left-9 before:top-6 before:w-px before:bg-acento/30"><div className="space-y-4">{shown.map((item)=><article key={item.id} className="relative ml-8 grid gap-3 rounded-2xl border border-borde/10 bg-superficie-elevada p-4 md:grid-cols-[1fr_150px_150px_140px_30px] before:absolute before:-left-10 before:top-6 before:h-3 before:w-3 before:rounded-full before:bg-rojo-base"><input value={item.name} onChange={(e)=>update(item.id,{name:e.target.value})} className="bg-transparent font-semibold"/><input type="date" value={item.startsAt.slice(0,10)} onChange={(e)=>update(item.id,{startsAt:e.target.value})} className="bg-superficie p-2"/><input type="date" value={item.endsAt.slice(0,10)} onChange={(e)=>update(item.id,{endsAt:e.target.value})} className="bg-superficie p-2"/><select value={item.status} onChange={(e)=>update(item.id,{status:e.target.value as ProjectScheduleItem['status']})} className="bg-superficie p-2"><option value="planned">Planeada</option><option value="in_progress">En curso</option><option value="done">Terminada</option><option value="blocked">Bloqueada</option></select><button onClick={()=>setTools(graph,onChange,{scheduleItems:items.filter((i)=>i.id!==item.id)})}><Trash2 size={15}/></button></article>)}{!shown.length?<p className="ml-8 p-8 text-texto-largo">No hay actividades en este periodo.</p>:null}</div></div><div className="flex gap-2"><button onClick={add} className="inline-flex items-center gap-2 rounded-full bg-rojo-base px-4 py-2 font-bold text-hueso"><Plus size={16}/> Actividad</button><button onClick={()=>exportIcs(graph)} className="inline-flex items-center gap-2 rounded-full border border-borde/15 px-4 py-2"><CalendarDays size={16}/> Exportar .ics</button></div></div>;
}

const GRANTS = [{id:'pde',name:'Programa Distrital de Estímulos',objective:'Fortalecer prácticas artísticas y culturales de Bogotá.',requirements:['Descripción y justificación','Objetivos','Población beneficiaria','Plan de actividades'],documents:['Documento de identidad','Certificación de residencia'],criteria:['Solidez conceptual','Viabilidad técnica','Coherencia presupuestal']},{id:'cultura-local',name:'Es Cultura Local',objective:'Impulsar iniciativas culturales de impacto territorial.',requirements:['Enfoque territorial','Trayectoria','Impacto esperado'],documents:['Soportes de experiencia','Carta de compromiso'],criteria:['Pertinencia local','Impacto','Sostenibilidad']},{id:'custom',name:'Convocatoria personalizada',objective:'',requirements:[],documents:[],criteria:[]}];

function GrantAssistant({graph,onChange}:{graph:ProjectGraph;onChange:(g:ProjectGraph)=>void}) { const grant=graph.tools.grant; const selected=GRANTS.find((g)=>g.id===grant.opportunityId); const choose=(id:string)=>{const g=GRANTS.find((x)=>x.id===id)!; const next:GrantWorkspace={opportunityId:g.id,opportunityName:g.name,objective:g.objective,requirements:g.requirements,requiredDocuments:g.documents,requiresBudget:true,requiresTimeline:true,attachments:[],evaluationCriteria:g.criteria,answers:{}}; setTools(graph,onChange,{grant:next});}; const reused:{label:string,value:string}[]=[{label:'Objetivo general',value:graph.modules.generalObjective.content},{label:'Contexto',value:graph.modules.context.content},{label:'Actividades',value:graph.modules.activities.content},{label:'Impacto',value:graph.modules.impact.content}]; const missing=reused.filter((x)=>!x.value.trim()); return <div className="grid gap-6 lg:grid-cols-[320px_1fr]"><aside className="rounded-3xl border border-borde/10 bg-superficie-elevada p-5"><label className="text-xs uppercase text-texto-largo">Seleccionar convocatoria</label><select value={grant.opportunityId} onChange={(e)=>choose(e.target.value)} className="mt-3 w-full bg-superficie p-3"><option value="">Selecciona…</option>{GRANTS.map((g)=><option key={g.id} value={g.id}>{g.name}</option>)}</select>{selected?<><p className="mt-6 text-sm leading-6 text-texto-largo">{grant.objective}</p><p className="mt-6 text-xs uppercase text-texto-largo">Preparación automática</p><strong className="mt-2 block text-4xl text-texto-principal">{Math.round((reused.length-missing.length)/reused.length*100)}%</strong><p className="mt-2 text-sm text-texto-largo">{missing.length ? `${missing.length} bloques requieren información.` : 'La base del proyecto está completa.'}</p></>:null}</aside><section className="space-y-4">{!selected?<div className="rounded-3xl border border-dashed border-borde/15 p-10 text-texto-largo">Selecciona una convocatoria para analizar requisitos y reutilizar el contenido del proyecto.</div>:<>{reused.map((item)=><article key={item.label} className={`rounded-2xl border p-5 ${item.value?'border-borde bg-superficie-elevada':'border-borde bg-superficie-elevada'}`}><div className="flex items-center justify-between"><strong>{item.label}</strong><span className={`text-xs uppercase ${item.value?'text-texto-principal':'text-naranja'}`}>{item.value?'Reutilizado':'Falta completar'}</span></div><p className="mt-3 text-sm leading-6 text-texto-largo">{item.value||'Creative OS usará este contenido en cuanto lo desarrolles con el Productor Ejecutivo.'}</p></article>)}<article className="rounded-2xl border border-borde/10 bg-superficie-elevada p-5"><strong>Requisitos de la convocatoria</strong><ul className="mt-3 space-y-2 text-sm text-texto-largo">{grant.requirements.map((r)=><li key={r}>✓ {r}</li>)}</ul></article><button onClick={()=>exportGrantDoc(graph)} className="inline-flex items-center gap-2 rounded-full bg-rojo-base px-5 py-3 font-bold text-hueso"><FileText size={17}/> Exportar borrador DOC</button></>}</section></div>; }

const PREPAREDNESS_AREAS: Array<[PreparednessArea, string]> = [['legal', 'Legal'], ['mercadeo', 'Mercadeo']];
const PREPAREDNESS_STATUS_LABEL: Record<PreparednessStatus, string> = { pendiente: 'Pendiente', en_proceso: 'En proceso', listo: 'Listo' };

function PreparednessChecklist({ graph, onChange }: { graph: ProjectGraph; onChange: (g: ProjectGraph) => void }) {
  const items = graph.tools.preparedness;
  useEffect(() => { if (!items) setTools(graph, onChange, { preparedness: seedPreparednessChecklist() }); }, [items, graph, onChange]);
  if (!items) return null;
  const summary = getPreparednessSummary(items);
  const update = (id: string, patch: Partial<PreparednessChecklistItem>) => setTools(graph, onChange, { preparedness: items.map((item) => item.id === id ? { ...item, ...patch } : item) });
  return <div className="space-y-6">
    <div className="grid gap-4 sm:grid-cols-3">
      <div className="rounded-2xl border border-borde/10 bg-superficie-elevada p-5"><p className="text-xs uppercase tracking-[.16em] text-texto-largo">Preparación general</p><strong className="mt-2 block text-3xl text-texto-principal">{summary.overallReadiness}%</strong></div>
      <div className="rounded-2xl border border-borde/10 bg-superficie-elevada p-5"><p className="text-xs uppercase tracking-[.16em] text-texto-largo">Legal</p><strong className="mt-2 block text-3xl text-texto-principal">{summary.legalReadiness}%</strong></div>
      <div className="rounded-2xl border border-borde/10 bg-superficie-elevada p-5"><p className="text-xs uppercase tracking-[.16em] text-texto-largo">Mercadeo</p><strong className="mt-2 block text-3xl text-texto-principal">{summary.mercadeoReadiness}%</strong></div>
    </div>
    {PREPAREDNESS_AREAS.map(([area, label]) => <section key={area} className="space-y-3">
      <h2 className="text-xl font-semibold text-texto-principal">{label}</h2>
      <div className="space-y-3">{items.filter((item) => item.area === area).map((item) => <PreparednessItemCard key={item.id} item={item} onUpdate={(patch) => update(item.id, patch)} />)}</div>
    </section>)}
  </div>;
}

function PreparednessItemCard({ item, onUpdate }: { item: PreparednessChecklistItem; onUpdate: (patch: Partial<PreparednessChecklistItem>) => void }) {
  return <article className="rounded-2xl border border-borde/10 bg-superficie-elevada p-5">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div><strong>{item.title}</strong><p className="mt-1 text-sm leading-6 text-texto-largo">{item.description}</p></div>
      <select value={item.status} onChange={(e) => onUpdate({ status: e.target.value as PreparednessStatus })} className="bg-superficie p-2 text-sm">
        {(Object.keys(PREPAREDNESS_STATUS_LABEL) as PreparednessStatus[]).map((status) => <option key={status} value={status}>{PREPAREDNESS_STATUS_LABEL[status]}</option>)}
      </select>
    </div>
    <textarea value={item.note} onChange={(e) => onUpdate({ note: e.target.value })} placeholder="Nota (opcional)" rows={2} className="mt-3 w-full rounded-xl border border-borde/10 bg-superficie p-3 text-sm text-texto-largo"/>
  </article>;
}

// Motor de dependencias objetivo -> actividad -> presupuesto -> cronograma
// (specs/motor-de-dependencias-objetivo-actividad.md). UI mínima: crear
// objetivos y actividades, y vincular una línea de presupuesto o un ítem de
// cronograma existente a una actividad. El vínculo es siempre opcional.
function ObjectivesAndActivities({ graph, onChange }: { graph: ProjectGraph; onChange: (g: ProjectGraph) => void }) {
  const objectives = graph.tools.objectives ?? [];
  const activities = graph.tools.activities ?? [];
  const budgetLines = graph.tools.budgetLines;
  const scheduleItems = graph.tools.scheduleItems;
  const activityBudgetLinks = graph.tools.activityBudgetLinks ?? [];

  const addObjective = () => setTools(graph, onChange, { objectives: [...objectives, blankObjective()] });
  const updateObjective = (id: string, patch: Partial<ProjectObjective>) => setTools(graph, onChange, { objectives: objectives.map((objective) => objective.id === id ? { ...objective, ...patch } : objective) });
  const removeObjective = (id: string) => setTools(graph, onChange, {
    objectives: objectives.filter((objective) => objective.id !== id),
    activities: activities.map((activity) => activity.objectiveId === id ? { ...activity, objectiveId: null } : activity),
  });

  const addActivity = () => setTools(graph, onChange, { activities: [...activities, blankActivity()] });
  const updateActivity = (id: string, patch: Partial<ProjectActivity>) => setTools(graph, onChange, { activities: activities.map((activity) => activity.id === id ? { ...activity, ...patch } : activity) });
  const removeActivity = (id: string) => setTools(graph, onChange, {
    activities: activities.filter((activity) => activity.id !== id),
    activityBudgetLinks: activityBudgetLinks.filter((link) => link.activityId !== id),
    scheduleItems: scheduleItems.map((item) => item.activityId === id ? { ...item, activityId: null } : item),
  });

  const linkBudgetLine = (activityId: string, budgetLineId: string) => {
    if (!budgetLineId || activityBudgetLinks.some((link) => link.activityId === activityId && link.budgetLineId === budgetLineId)) return;
    setTools(graph, onChange, { activityBudgetLinks: [...activityBudgetLinks, { id: createId(), activityId, budgetLineId }] });
  };
  const unlinkBudgetLine = (linkId: string) => setTools(graph, onChange, { activityBudgetLinks: activityBudgetLinks.filter((link) => link.id !== linkId) });

  const linkScheduleItem = (activityId: string, scheduleItemId: string) => {
    if (!scheduleItemId) return;
    setTools(graph, onChange, { scheduleItems: scheduleItems.map((item) => item.id === scheduleItemId ? { ...item, activityId } : item) });
  };
  const unlinkScheduleItem = (scheduleItemId: string) => setTools(graph, onChange, { scheduleItems: scheduleItems.map((item) => item.id === scheduleItemId ? { ...item, activityId: null } : item) });

  const findings = useMemo(() => checkDependencyConsistency(graph.tools), [graph.tools]);

  return <div className="space-y-6">
    {findings.length ? <ConsistencyFindings findings={findings} onUnlinkBudgetLine={unlinkBudgetLine} onUnlinkScheduleItem={unlinkScheduleItem}/> : null}
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-texto-principal">Objetivos</h2>
        <button onClick={addObjective} className="inline-flex items-center gap-2 rounded-full bg-rojo-base px-4 py-2 text-sm font-bold text-hueso"><Plus size={16}/> Objetivo</button>
      </div>
      {!objectives.length ? <p className="rounded-2xl border border-dashed border-borde/15 p-6 text-texto-largo">Aún no hay objetivos estructurados.</p> : null}
      <div className="space-y-3">{objectives.map((objective) => <article key={objective.id} className="rounded-2xl border border-borde/10 bg-superficie-elevada p-5">
        <div className="flex items-start justify-between gap-3">
          <input value={objective.title} onChange={(e) => updateObjective(objective.id, { title: e.target.value })} placeholder="Título del objetivo" className="w-full bg-transparent text-lg font-semibold"/>
          <button onClick={() => removeObjective(objective.id)}><Trash2 size={15}/></button>
        </div>
        <textarea value={objective.description} onChange={(e) => updateObjective(objective.id, { description: e.target.value })} placeholder="Descripción (opcional)" rows={2} className="mt-3 w-full rounded-xl border border-borde/10 bg-superficie p-3 text-sm text-texto-largo"/>
      </article>)}</div>
    </section>

    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-texto-principal">Actividades</h2>
        <button onClick={addActivity} className="inline-flex items-center gap-2 rounded-full bg-rojo-base px-4 py-2 text-sm font-bold text-hueso"><Plus size={16}/> Actividad</button>
      </div>
      {!activities.length ? <p className="rounded-2xl border border-dashed border-borde/15 p-6 text-texto-largo">Aún no hay actividades estructuradas.</p> : null}
      <div className="space-y-3">{activities.map((activity) => {
        const links = activityBudgetLinks.filter((link) => link.activityId === activity.id);
        const linkedScheduleItems = scheduleItems.filter((item) => item.activityId === activity.id);
        return <article key={activity.id} className="space-y-4 rounded-2xl border border-borde/10 bg-superficie-elevada p-5">
          <div className="flex items-start justify-between gap-3">
            <input value={activity.title} onChange={(e) => updateActivity(activity.id, { title: e.target.value })} placeholder="Título de la actividad" className="w-full bg-transparent text-lg font-semibold"/>
            <button onClick={() => removeActivity(activity.id)}><Trash2 size={15}/></button>
          </div>
          <textarea value={activity.description} onChange={(e) => updateActivity(activity.id, { description: e.target.value })} placeholder="Descripción (opcional)" rows={2} className="w-full rounded-xl border border-borde/10 bg-superficie p-3 text-sm text-texto-largo"/>
          <label className="block text-xs uppercase tracking-[.16em] text-texto-largo">Objetivo
            <select value={activity.objectiveId ?? ''} onChange={(e) => updateActivity(activity.id, { objectiveId: e.target.value || null })} className="mt-2 w-full bg-superficie p-2 text-sm">
              <option value="">Sin objetivo</option>
              {objectives.map((objective) => <option key={objective.id} value={objective.id}>{objective.title || 'Objetivo sin título'}</option>)}
            </select>
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs uppercase tracking-[.16em] text-texto-largo">Líneas de presupuesto vinculadas</p>
              <ul className="mt-2 space-y-1">{links.map((link) => { const line = budgetLines.find((l) => l.id === link.budgetLineId); return <li key={link.id} className="flex items-center justify-between gap-2 text-sm text-texto-largo"><span>{line ? `${line.category} · ${line.concept}` : 'Línea eliminada'}</span><button onClick={() => unlinkBudgetLine(link.id)}><Trash2 size={13}/></button></li>; })}</ul>
              <select value="" onChange={(e) => linkBudgetLine(activity.id, e.target.value)} className="mt-2 w-full bg-superficie p-2 text-sm">
                <option value="">Vincular línea de presupuesto…</option>
                {budgetLines.filter((line) => !links.some((link) => link.budgetLineId === line.id)).map((line) => <option key={line.id} value={line.id}>{line.category} · {line.concept}</option>)}
              </select>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[.16em] text-texto-largo">Ítems de cronograma vinculados</p>
              <ul className="mt-2 space-y-1">{linkedScheduleItems.map((item) => <li key={item.id} className="flex items-center justify-between gap-2 text-sm text-texto-largo"><span>{item.name}</span><button onClick={() => unlinkScheduleItem(item.id)}><Trash2 size={13}/></button></li>)}</ul>
              <select value="" onChange={(e) => linkScheduleItem(activity.id, e.target.value)} className="mt-2 w-full bg-superficie p-2 text-sm">
                <option value="">Vincular ítem de cronograma…</option>
                {scheduleItems.filter((item) => item.activityId !== activity.id).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
              </select>
            </div>
          </div>
        </article>;
      })}</div>
    </section>
  </div>;
}
function ConsistencyFindings({ findings, onUnlinkBudgetLine, onUnlinkScheduleItem }: { findings: DependencyFinding[]; onUnlinkBudgetLine: (linkId: string) => void; onUnlinkScheduleItem: (scheduleItemId: string) => void }) {
  return <section className="space-y-3">
    <h2 className="text-xl font-semibold text-texto-principal">Consistencia</h2>
    <div className="space-y-3">{findings.map((finding) => <article key={finding.id} className="flex items-start justify-between gap-4 rounded-2xl border border-acento bg-superficie-elevada p-5">
      <p className="text-sm leading-6 text-texto-largo">{finding.message}</p>
      {finding.type === 'orphan_budget_link' ? <button onClick={() => onUnlinkBudgetLine(finding.relatedId)} className="shrink-0 rounded-full border border-borde/15 px-4 py-2 text-sm font-semibold text-texto-principal transition hover:border-acento">Quitar vínculo</button> : null}
      {finding.type === 'orphan_schedule_item' ? <button onClick={() => onUnlinkScheduleItem(finding.relatedId)} className="shrink-0 rounded-full border border-borde/15 px-4 py-2 text-sm font-semibold text-texto-principal transition hover:border-acento">Quitar vínculo</button> : null}
    </article>)}</div>
  </section>;
}
function blankObjective(): ProjectObjective { return { id: createId(), title: '', description: '', createdAt: now() }; }
function blankActivity(): ProjectActivity { return { id: createId(), objectiveId: null, title: '', description: '', createdAt: now() }; }

function setTools(graph:ProjectGraph,onChange:(g:ProjectGraph)=>void,patch:Partial<ProjectGraph['tools']>) { const tools={...graph.tools,...patch}; const budgetText=tools.budgetLines.length?`Presupuesto vivo: ${tools.budgetLines.length} líneas por ${money(tools.budgetLines.reduce((n,l)=>n+total(l),0))}.`:graph.modules.budget.content; const timelineText=tools.scheduleItems.length?tools.scheduleItems.map((i)=>`${i.name}: ${i.startsAt} a ${i.endsAt}`).join('\n'):graph.modules.timeline.content; onChange({...graph,tools,modules:{...graph.modules,budget:{...graph.modules.budget,content:budgetText,updatedAt:now()},timeline:{...graph.modules.timeline,content:timelineText,updatedAt:now()}},updatedAt:now()}); }
function blankBudgetLine(concept:string,category:string,source:ProjectBudgetLine['source']):ProjectBudgetLine{return{id:createId(),category,concept,quantity:1,unit:'unidad',unitValue:0,vatRate:0,withholdingRate:0,otherTaxes:0,status:'proposed',responsible:'',provider:'',estimatedDate:'',actualDate:'',source};}
function total(l:ProjectBudgetLine){const subtotal=l.quantity*l.unitValue;return subtotal+subtotal*l.vatRate/100-subtotal*l.withholdingRate/100+l.otherTaxes;}
function money(n:number){return new Intl.NumberFormat('es-CO',{style:'currency',currency:'COP',maximumFractionDigits:0}).format(n);}
function Num({value,onChange}:{value:number;onChange:(n:number)=>void}){return <input type="number" value={value} onChange={(e)=>onChange(Number(e.target.value)||0)} className="w-24 bg-transparent p-2"/>;}
function inferBudgetSuggestions(graph:ProjectGraph,lines:ProjectBudgetLine[]){const text=Object.values(graph.modules).map((m)=>m.content).join(' ').toLowerCase();const rules=[{terms:['teatro','espacio','salón'],concept:'Alquiler de espacio',category:'Infraestructura'},{terms:['viaje','transporte'],concept:'Transporte y logística',category:'Logística'},{terms:['diseño','publicidad','comunicación'],concept:'Diseño y comunicaciones',category:'Comunicaciones'},{terms:['artista','tallerista','equipo'],concept:'Honorarios profesionales',category:'Talento humano'}];return rules.filter((r)=>r.terms.some((t)=>text.includes(t))&&!lines.some((l)=>l.concept===r.concept));}
function getRange(cursor:Date,view:'day'|'week'|'month'|'quarter'){const start=new Date(cursor),end=new Date(cursor);if(view==='day'){}else if(view==='week'){start.setDate(start.getDate()-start.getDay()+1);end.setTime(start.getTime());end.setDate(end.getDate()+6);}else if(view==='month'){start.setDate(1);end.setMonth(end.getMonth()+1,0);}else{const q=Math.floor(start.getMonth()/3)*3;start.setMonth(q,1);end.setMonth(q+3,0);}return{start,end,label:`${start.toLocaleDateString('es-CO',{day:'numeric',month:'long',year:'numeric'})} — ${end.toLocaleDateString('es-CO',{day:'numeric',month:'long',year:'numeric'})}`};}
function shift(cursor:Date,set:(d:Date)=>void,view:string,n:number){const d=new Date(cursor);if(view==='day')d.setDate(d.getDate()+n);else if(view==='week')d.setDate(d.getDate()+7*n);else if(view==='month')d.setMonth(d.getMonth()+n);else d.setMonth(d.getMonth()+3*n);set(d);}
function download(name:string,content:string,type:string){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([content],{type}));a.download=name;a.click();URL.revokeObjectURL(a.href);}
function safe(s:string){return s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/gi,'-').replace(/^-|-$/g,'').toLowerCase();}
function exportDoc(graph:ProjectGraph,id:string){const d=compileDocument(graph,id);download(`${safe(graph.title)}-${id}.doc`,`<html><meta charset="utf-8"><body><pre style="white-space:pre-wrap;font-family:Arial">${d.content.replaceAll('&','&amp;').replaceAll('<','&lt;')}</pre></body></html>`,'application/msword');}
function exportMarkdown(graph:ProjectGraph,id:string){const d=compileDocument(graph,id);download(`${safe(graph.title)}-${id}.md`,d.content,'text/markdown;charset=utf-8');}
function exportBudgetCsv(graph:ProjectGraph){const h=['Categoría','Concepto','Cantidad','Unidad','Valor unitario','Subtotal','IVA %','Retención %','Otros impuestos','Costo total','Estado','Responsable','Proveedor','Fecha estimada','Fecha real'];const rows=graph.tools.budgetLines.map((l)=>[l.category,l.concept,l.quantity,l.unit,l.unitValue,l.quantity*l.unitValue,l.vatRate,l.withholdingRate,l.otherTaxes,total(l),l.status,l.responsible,l.provider,l.estimatedDate,l.actualDate]);download(`${safe(graph.title)}-presupuesto.csv`,'\ufeff'+[h,...rows].map((r)=>r.map((v)=>`"${String(v).replaceAll('"','""')}"`).join(',')).join('\r\n'),'text/csv;charset=utf-8');}
function exportIcs(graph:ProjectGraph){const date=(s:string)=>s.replaceAll('-','')+'T090000';const body=graph.tools.scheduleItems.map((i)=>`BEGIN:VEVENT\r\nUID:${i.id}@elculebreo\r\nDTSTART:${date(i.startsAt.slice(0,10))}\r\nDTEND:${date(i.endsAt.slice(0,10))}\r\nSUMMARY:${i.name}\r\nDESCRIPTION:${i.description}\r\nEND:VEVENT`).join('\r\n');download(`${safe(graph.title)}-cronograma.ics`,`BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//El Culebreo//Creative OS//ES\r\n${body}\r\nEND:VCALENDAR`,'text/calendar');}
function exportGrantDoc(graph:ProjectGraph){const g=graph.tools.grant;const content=`${g.opportunityName}\n\nObjetivo de la convocatoria\n${g.objective}\n\nProyecto\n${graph.title}\n\nObjetivo general\n${graph.modules.generalObjective.content||'[Pendiente]'}\n\nContexto\n${graph.modules.context.content||'[Pendiente]'}\n\nActividades\n${graph.modules.activities.content||'[Pendiente]'}\n\nImpacto\n${graph.modules.impact.content||'[Pendiente]'}\n\nPresupuesto total\n${money(graph.tools.budgetLines.reduce((n,l)=>n+total(l),0))}`;download(`${safe(graph.title)}-convocatoria.doc`,`<html><meta charset="utf-8"><body><pre style="white-space:pre-wrap;font-family:Arial">${content}</pre></body></html>`,'application/msword');}
