'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { ConversationMessage, ProjectGraph } from '../types/project';
import { LivingWorkspace } from './LivingWorkspace';
import { persistenceCoordinator, type PersistenceStatus } from '../core/persistenceCoordinator';

interface ProducerChatProps {
  graph: ProjectGraph;
  messages: ConversationMessage[];
  progress: number;
  onSendMessage: (message: string) => void | Promise<void>;
}

export function ProducerChat({
  graph,
  messages,
  progress,
  onSendMessage,
}: ProducerChatProps) {
  const [input, setInput] = useState('');
  const [sync, setSync] = useState<{ status: PersistenceStatus; message: string }>(persistenceCoordinator.getStatus());
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
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-[#0b0b0b] p-4">
          <p className="max-w-2xl text-sm leading-6 text-[#999]">Aplicar solicita conexiones o acompañamiento con un snapshot autorizado. No detiene el desarrollo ni publica automáticamente el proyecto.</p>
          <Link href="/mi-ecosistema" className="rounded-full bg-[#D9FF00] px-5 py-3 text-sm font-bold text-black">Aplicar al ecosistema</Link>
        </div>
        {messages.length === 0 ? (
          <div className="pt-24">
            <p className="mb-4 text-sm uppercase tracking-[0.25em] text-[#D9FF00]">
              Productor Ejecutivo
            </p>

            <h1 className="max-w-4xl text-6xl font-semibold tracking-tight text-white">
              ¿Qué quieres construir hoy?
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-[#B5B5B5]">
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
                  <div className="max-w-[720px] rounded-3xl bg-[#151515] px-6 py-5 text-lg leading-relaxed text-white">
                    {message.content}
                  </div>
                </div>
              ) : (
                <ProducerResponseCard key={message.id} message={message} onChoose={setInput} />
              )
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="sticky bottom-8 mt-10">
          <div className="rounded-3xl border border-[#232323] bg-[#101010]/95 p-4 shadow-2xl backdrop-blur">
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Describe tu idea, responde la pregunta o agrega nueva información..."
              className="min-h-[96px] w-full resize-none bg-transparent p-3 text-base text-white outline-none placeholder:text-[#666666]"
            />

            <div className="flex items-center justify-between border-t border-[#232323] pt-4">
              <div>
                <p className={`text-xs ${sync.status === 'error' ? 'text-red-300' : sync.status === 'offline' ? 'text-amber-300' : 'text-[#767676]'}`}>{sync.message || 'Una frase es suficiente para seguir avanzando.'}</p>
                {sync.status === 'error' ? <button type="button" onClick={() => persistenceCoordinator.retry()} className="mt-1 text-xs text-[#D9FF00] underline">Reintentar</button> : null}
              </div>

              <button className="rounded-full bg-[#D9FF00] px-6 py-3 text-sm font-bold text-black transition hover:bg-white">
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
    <div className="max-w-[780px] rounded-3xl border border-[#232323] bg-[#101010] p-7">
      <div className="space-y-6">
        <div>
          <p className="mb-2 text-xs uppercase tracking-[0.2em] text-[#767676]">
            Lo que entendí
          </p>
          <p className="text-lg leading-relaxed text-white">
            {response.understood}
          </p>
        </div>

        <div>
          <p className="mb-3 text-xs uppercase tracking-[0.2em] text-[#767676]">
            Lo que ya quedó organizado
          </p>

          <div className="flex flex-wrap gap-2">
            {response.organized.map((item) => (
              <span
                key={item}
                className="rounded-full border border-[#284221] bg-[#102010] px-3 py-1 text-sm text-[#6EEB83]"
              >
                ✓ {item}
              </span>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-3 text-xs uppercase tracking-[0.2em] text-[#767676]">
            Lo que falta fortalecer
          </p>

          <div className="flex flex-wrap gap-2">
            {response.gaps.map((item) => (
              <span
                key={item}
                className="rounded-full border border-[#4A3D16] bg-[#201A08] px-3 py-1 text-sm text-[#FFC857]"
              >
                {item}
              </span>
            ))}
          </div>
        </div>

        <div className="border-t border-[#232323] pt-6">
          <p className="mb-2 text-xs uppercase tracking-[0.2em] text-[#767676]">
            Siguiente pregunta
          </p>

          <p className="text-2xl font-medium leading-snug text-[#D9FF00]">
            {response.nextQuestion}
          </p>
          {response.nextQuestionOptions?.length ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {response.nextQuestionOptions.map((option) => <button key={option} type="button" onClick={() => onChoose(option)} className="rounded-full border border-white/15 px-3 py-2 text-left text-xs text-[#cfcfcf] hover:border-[#D9FF00]">{option}</button>)}
            </div>
          ) : null}
          <div className="mt-4 flex flex-wrap gap-3 text-xs text-[#888]">
            {['Cambiar pregunta', 'Ver un ejemplo', '¿Por qué me preguntas esto?', 'Dejar pendiente', 'Cambiar de área'].map((action) => <button key={action} type="button" onClick={() => onChoose(action)} className="hover:text-white">{action}</button>)}
          </div>
        </div>
        {response.interpretation?.financialSignals.length ? (
          <div className="border-t border-[#232323] pt-6">
            <p className="text-xs uppercase tracking-[0.2em] text-[#767676]">Datos económicos detectados</p>
            <div className="mt-3 space-y-2">{response.interpretation.financialSignals.map((signal) => <p key={signal.id} className="text-sm text-[#bbb]">{signal.concept}: {signal.amount === null ? 'pendiente' : `COP ${signal.amount.toLocaleString('es-CO')}`} · {signal.status}</p>)}</div>
            {response.interpretation.financialSignals.some((signal) => signal.requiresConfirmation) ? <p className="mt-4 text-sm text-[#D9FF00]">Detecté datos económicos y necesidades futuras. Revísalos antes de incorporarlos definitivamente al presupuesto.</p> : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
