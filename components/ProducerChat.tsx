'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { ConversationMessage, ProjectGraph } from '../types/project';
import { LivingWorkspace } from './LivingWorkspace';
import { persistenceCoordinator, type PersistenceStatus } from '../core/persistenceCoordinator';
import { getPendingConfirmations } from '../engines/projectKnowledgeEngine';
import { getTopConsistencyIssue } from '../engines/projectConsistencyEngine';
import type { ConfirmationRequest, ProjectKnowledgeEntity } from '../types/projectKnowledge';
import type { ConsistencyIssue } from '../types/projectConsistency';
import type { FinancialProposal } from '../types/financialAuthority';
import { isFinancialAuthorityV2Enabled } from '../lib/featureFlags';
import { FinancialProposalCard } from './FinancialProposalCard';

interface ProducerChatProps {
  graph: ProjectGraph;
  messages: ConversationMessage[];
  progress: number;
  onSendMessage: (message: string) => void | Promise<void>;
  onResolveConfirmation: (id:string,status:'accepted'|'rejected'|'dismissed')=>void;
  onCorrectConfirmation: (id:string,correction:string)=>void;
  onResolveConsistencyIssue: (id:string,status:'acknowledged'|'dismissed')=>void;
  onAcceptFinancialProposal: (proposal:FinancialProposal)=>void|Promise<void>;
}

export function ProducerChat({
  graph,
  messages,
  progress,
  onSendMessage,
  onResolveConfirmation,
  onCorrectConfirmation,
  onResolveConsistencyIssue,
  onAcceptFinancialProposal,
}: ProducerChatProps) {
  const [input, setInput] = useState('');
  const [sync, setSync] = useState<{ status: PersistenceStatus; message: string }>(persistenceCoordinator.getStatus());
  const pendingConfirmations=getPendingConfirmations(graph);
  const topIssue=getTopConsistencyIssue(graph);
  const financialProposal=isFinancialAuthorityV2Enabled()?graph.financialAuthority?.proposals.find(item=>item.status==='pending'||item.status==='edited'):undefined;
  useEffect(() => persistenceCoordinator.subscribe((status, message) => setSync({ status, message })), []);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();

    if (!input.trim()) return;

    void onSendMessage(input.trim());
    setInput('');
  }

  return (
    <section className="mx-auto grid max-w-[1280px] grid-cols-[1fr_340px] gap-10">
      <div className="min-h-screen pb-40">
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-borde/10 bg-superficie-elevada p-4">
          <p className="max-w-2xl text-sm leading-6 text-texto-largo">Aplicar solicita conexiones o acompañamiento con un snapshot autorizado. No detiene el desarrollo ni publica automáticamente el proyecto.</p>
          <Link href="/mi-ecosistema" className="rounded-full bg-rojo-base px-5 py-3 text-sm font-bold text-hueso">Aplicar al ecosistema</Link>
        </div>
        {messages.length === 0 ? (
          <div className="pt-24">
            <p className="mb-4 text-sm uppercase tracking-[0.25em] text-texto-principal">
              Productor Ejecutivo
            </p>

            <h1 className="max-w-4xl text-6xl font-semibold tracking-tight text-texto-largo">
              ¿Qué quieres construir hoy?
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-texto-largo">
              Cuéntame tu idea como la tienes en la cabeza. Creative OS la
              convertirá en un proyecto organizado, con objetivos, tareas,
              documentos, presupuesto, cronograma y próximos pasos.
            </p>
          </div>
        ) : (
          <div className="space-y-8 pt-8">
            {messages.map((message) =>
              message.role === 'user' ? (
                <div key={message.id} className="flex justify-end">
                  <div className="max-w-[720px] rounded-3xl bg-superficie px-6 py-5 text-lg leading-relaxed text-texto-largo">
                    {message.content}
                  </div>
                </div>
              ) : (
                <ProducerResponseCard key={message.id} message={message} onChoose={setInput} />
              )
            )}
          </div>
        )}

        {pendingConfirmations[0] ? <ConfirmationCard key={pendingConfirmations[0].id} request={pendingConfirmations[0]} entity={graph.knowledge?.entities.find(item=>pendingConfirmations[0].entityIds.includes(item.id))} pendingCount={pendingConfirmations.length} onResolve={onResolveConfirmation} onCorrect={onCorrectConfirmation}/> : null}
        {topIssue ? <ConsistencyCard key={topIssue.id} issue={topIssue} onResolve={onResolveConsistencyIssue}/> : null}
        {financialProposal ? <FinancialProposalCard proposal={financialProposal} onAccept={onAcceptFinancialProposal}/> : null}

        <form onSubmit={handleSubmit} className="sticky bottom-8 mt-10">
          <div className="rounded-3xl border border-borde bg-superficie-elevada/95 p-4 shadow-2xl backdrop-blur">
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Describe tu idea, responde la pregunta o agrega nueva información..."
              className="min-h-[96px] w-full resize-none bg-transparent p-3 text-base text-texto-largo outline-none placeholder:text-texto-largo"
            />

            <div className="flex items-center justify-between border-t border-borde pt-4">
              <div>
                <p className={`text-xs ${sync.status === 'error' ? 'text-rojo-base' : sync.status === 'offline' ? 'text-naranja' : 'text-texto-largo'}`}>{sync.message || 'Una frase es suficiente para seguir avanzando.'}</p>
                {sync.status === 'error' ? <button type="button" onClick={() => persistenceCoordinator.retry()} className="mt-1 text-xs text-texto-principal underline">Reintentar</button> : null}
              </div>

              <button className="rounded-full bg-rojo-base px-6 py-3 text-sm font-bold text-hueso transition hover:shadow-stencil">
                Continuar proyecto
              </button>
            </div>
          </div>
        </form>
      </div>

      <LivingWorkspace graph={graph} messages={messages} progress={progress} />
    </section>
  );
}

function ProducerResponseCard({
  message,
  onChoose,
}: {
  message: ConversationMessage;
  onChoose: (value: string) => void;
}) {
  const response = message.response;

  if (!response) return null;

  return (
    <div className="max-w-[780px] rounded-3xl border border-borde bg-superficie-elevada p-7">
      <div className="space-y-6">
        <div>
          <p className="mb-2 text-xs uppercase tracking-[0.2em] text-texto-largo">
            Lo que entendí
          </p>
          <p className="text-lg leading-relaxed text-texto-largo">
            {response.understood}
          </p>
        </div>

        <div>
          <p className="mb-3 text-xs uppercase tracking-[0.2em] text-texto-largo">
            Lo que ya quedó organizado
          </p>

          <div className="flex flex-wrap gap-2">
            {response.organized.map((item) => (
              <span
                key={item}
                className="rounded-full border border-borde bg-superficie-elevada px-3 py-1 text-sm text-emerald-700"
              >
                ✓ {item}
              </span>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-3 text-xs uppercase tracking-[0.2em] text-texto-largo">
            Lo que falta fortalecer
          </p>

          <div className="flex flex-wrap gap-2">
            {response.gaps.map((item) => (
              <span
                key={item}
                className="rounded-full border border-borde bg-superficie-elevada px-3 py-1 text-sm text-naranja"
              >
                {item}
              </span>
            ))}
          </div>
        </div>

        <div className="border-t border-borde pt-6">
          <p className="mb-2 text-xs uppercase tracking-[0.2em] text-texto-largo">
            Siguiente pregunta
          </p>

          <p className="text-2xl font-medium leading-snug text-texto-principal">
            {response.nextQuestion}
          </p>
          {response.nextQuestionOptions?.length ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {response.nextQuestionOptions.map((option) => <button key={option} type="button" onClick={() => onChoose(option)} className="rounded-full border border-borde/15 px-3 py-2 text-left text-xs text-texto-largo hover:border-acento">{option}</button>)}
            </div>
          ) : null}
          <div className="mt-4 flex flex-wrap gap-3 text-xs text-texto-largo">
            {['Cambiar pregunta', 'Ver un ejemplo', '¿Por qué me preguntas esto?', 'Dejar pendiente', 'Cambiar de área'].map((action) => <button key={action} type="button" onClick={() => onChoose(action)} className="hover:text-texto-largo">{action}</button>)}
          </div>
        </div>
        {response.interpretation?.financialSignals.length ? (
          <div className="border-t border-borde pt-6">
            <p className="text-xs uppercase tracking-[0.2em] text-texto-largo">Datos económicos detectados</p>
            <div className="mt-3 space-y-2">{response.interpretation.financialSignals.map((signal) => <p key={signal.id} className="text-sm text-texto-largo">{signal.concept}: {signal.amount === null ? 'pendiente' : `COP ${signal.amount.toLocaleString('es-CO')}`} · {signal.status}</p>)}</div>
            {response.interpretation.financialSignals.some((signal) => signal.requiresConfirmation) ? <p className="mt-4 text-sm text-texto-principal">Detecté datos económicos y necesidades futuras. Revísalos antes de incorporarlos definitivamente al presupuesto.</p> : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function ConfirmationCard({request,entity,pendingCount,onResolve,onCorrect}:{request:ConfirmationRequest;entity?:ProjectKnowledgeEntity;pendingCount:number;onResolve:(id:string,status:'accepted'|'rejected'|'dismissed')=>void;onCorrect:(id:string,correction:string)=>void}){
  const [editing,setEditing]=useState(false),[correction,setCorrection]=useState('');
  const understood=entity?describeKnowledge(entity):request.question;
  return <section className="mt-8 max-w-[780px] rounded-3xl border border-borde bg-superficie p-6">
    <div className="flex items-center justify-between gap-4"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-naranja">Quiero confirmar algo</p><span className="text-xs text-texto-largo">{pendingCount} {pendingCount===1?'cosa':'cosas'} por confirmar</span></div>
    <p className="mt-4 text-xs uppercase tracking-[0.16em] text-texto-largo">Entendí que</p><p className="mt-2 text-lg leading-7 text-texto-largo">{understood}</p><p className="mt-3 text-sm leading-6 text-texto-largo">{request.question}</p>
    {editing?<div className="mt-5"><textarea aria-label="Corrección de la interpretación" value={correction} onChange={event=>setCorrection(event.target.value)} placeholder="Escribe la información correcta…" className="min-h-24 w-full rounded-2xl border border-borde/10 bg-black/40 p-4 text-sm outline-none focus:border-naranja"/><div className="mt-3 flex gap-2"><button type="button" disabled={!correction.trim()} onClick={()=>{onCorrect(request.id,correction.trim());setEditing(false);setCorrection('');}} className="rounded-full bg-naranja px-4 py-2 text-sm font-bold text-hueso disabled:opacity-40">Guardar corrección</button><button type="button" onClick={()=>setEditing(false)} className="rounded-full border border-borde/15 px-4 py-2 text-sm">Cancelar</button></div></div>:<div className="mt-5 flex flex-wrap gap-2"><button type="button" onClick={()=>onResolve(request.id,'accepted')} className="rounded-full bg-rojo-base px-4 py-2 text-sm font-bold text-hueso">Confirmar</button><button type="button" onClick={()=>setEditing(true)} className="rounded-full border border-naranja/40 px-4 py-2 text-sm text-naranja">Corregir</button><button type="button" onClick={()=>onResolve(request.id,'rejected')} className="rounded-full border border-borde/15 px-4 py-2 text-sm">No es correcto</button><button type="button" onClick={()=>onResolve(request.id,'dismissed')} className="rounded-full px-4 py-2 text-sm text-texto-largo">Después</button></div>}
  </section>;
}

function ConsistencyCard({issue,onResolve}:{issue:ConsistencyIssue;onResolve:(id:string,status:'acknowledged'|'dismissed')=>void}){return <section className="mt-6 max-w-[780px] rounded-3xl border border-borde bg-superficie-elevada p-6"><p className={`text-xs font-semibold uppercase tracking-[0.2em] ${issue.severity==='critical'?'text-rojo-base':'text-naranja'}`}>Encontré algo para revisar</p><h3 className="mt-3 text-lg font-semibold">{issue.title}</h3><p className="mt-2 text-sm leading-6 text-texto-largo">{issue.explanation}</p><div className="mt-5 flex flex-wrap gap-2"><button type="button" onClick={()=>onResolve(issue.id,'acknowledged')} className="rounded-full bg-rojo-base px-4 py-2 text-sm font-bold text-hueso">Revisar ahora</button><button type="button" onClick={()=>onResolve(issue.id,'dismissed')} className="rounded-full border border-borde px-4 py-2 text-sm">Continuar de todas formas</button></div></section>}

function describeKnowledge(entity:ProjectKnowledgeEntity){if(typeof entity.value==='object'&&!Array.isArray(entity.value)){const value=entity.value as Record<string,unknown>;if(typeof value.amount==='number')return `${entity.label}: COP ${value.amount.toLocaleString('es-CO')}${value.unit?` por ${String(value.unit)}`:''}.`;if(value.actor&&value.responsibility)return `${String(value.actor)} será responsable de ${String(value.responsibility)}.`;}return `${entity.label}: ${String(entity.value)}.`;}
