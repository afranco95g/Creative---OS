'use client';

import { FormEvent, useState } from 'react';
import { ConversationMessage, ProjectGraph } from '../types/project';
import { LivingWorkspace } from './LivingWorkspace';

interface ProducerChatProps {
  graph: ProjectGraph;
  messages: ConversationMessage[];
  progress: number;
  onSendMessage: (message: string) => void;
}

export function ProducerChat({
  graph,
  messages,
  progress,
  onSendMessage,
}: ProducerChatProps) {
  const [input, setInput] = useState('');

  function handleSubmit(event: FormEvent) {
    event.preventDefault();

    if (!input.trim()) return;

    onSendMessage(input.trim());
    setInput('');
  }

  return (
    <section className="mx-auto grid max-w-[1280px] grid-cols-[1fr_340px] gap-10">
      <div className="min-h-screen pb-40">
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
                <ProducerResponseCard key={message.id} message={message} />
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
              <p className="text-xs text-[#767676]">
                Una frase es suficiente para seguir avanzando.
              </p>

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
}: {
  message: ConversationMessage;
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
        </div>
      </div>
    </div>
  );
}