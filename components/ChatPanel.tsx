'use client';
import { ArrowUpRight, Paperclip, Send } from 'lucide-react';
import { useState } from 'react';

const initialMessages = [
  { role: 'user', text: 'Quiero abrir Charlie Gelato, una heladería artesanal que también sea un espacio cultural en Bogotá.' },
  { role: 'assistant', text: 'Me encanta. Vamos a construir Charlie Gelato juntos. Para empezar, cuéntame más sobre la visión del proyecto y a quién quieres llegar.' }
];

const chips = ['¿Cuál es el propósito?', '¿A quién quieres impactar?', '¿Qué problema resuelve?', '¿Qué experiencia quieres crear?'];

export function ChatPanel() {
  const [messages, setMessages] = useState(initialMessages);
  const [value, setValue] = useState('');

  function sendMessage(text = value) {
    if (!text.trim()) return;
    setMessages((prev) => [
      ...prev,
      { role: 'user', text },
      { role: 'assistant', text: 'Perfecto. Lo voy a registrar en la Bitácora Viva y usarlo para actualizar objetivo, contexto, comunidad y próximos pasos del proyecto.' }
    ]);
    setValue('');
  }

  return (
    <section className="mx-auto flex min-h-screen max-w-5xl flex-col px-5 py-10 md:px-10">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <p className="mb-2 text-xs font-black uppercase tracking-[.3em] text-acid">Productor Ejecutivo IA</p>
          <h1 className="text-4xl font-black tracking-tight md:text-6xl">¿Qué quieres construir hoy?</h1>
          <p className="mt-4 max-w-2xl text-white/70">Cuéntame tu idea, proyecto o lo que tienes en mente. Yo te ayudo a ordenarlo, estructurarlo y hacerlo realidad.</p>
        </div>
        <button className="hidden rounded-2xl border border-white/10 px-4 py-3 text-xs font-bold uppercase text-white/70 md:block">Ver tutorial <ArrowUpRight className="inline" size={14} /></button>
      </div>

      <div className="flex-1 space-y-5">
        {messages.map((message, index) => (
          <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-xl rounded-3xl p-5 text-sm leading-relaxed ${message.role === 'user' ? 'bg-white/10 text-white' : 'bg-chalk text-black'}`}>
              {message.text}
              <div className="mt-2 text-right text-[10px] opacity-50">11:23 AM</div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8">
        <p className="mb-3 text-xs text-white/50">Algunas preguntas que podemos explorar juntos:</p>
        <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-4">
          {chips.map((chip) => (
            <button key={chip} onClick={() => sendMessage(chip)} className="rounded-2xl border border-white/10 bg-white/[.03] p-3 text-xs text-white/75 hover:border-acid/60">
              {chip}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3 rounded-3xl border border-white/10 bg-white/[.04] p-3">
          <button className="rounded-2xl p-3 text-white/50"><Paperclip size={18} /></button>
          <input value={value} onChange={(e) => setValue(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && sendMessage()} placeholder="Escribe tu respuesta aquí..." className="flex-1 bg-transparent text-sm outline-none placeholder:text-white/35" />
          <button onClick={() => sendMessage()} className="acid-button grid h-12 w-12 place-items-center"><Send size={18} /></button>
        </div>
      </div>
    </section>
  );
}
