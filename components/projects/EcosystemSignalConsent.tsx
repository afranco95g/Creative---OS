'use client';

import { Share2, Trash2 } from 'lucide-react';
import { FormEvent, useEffect, useState } from 'react';

import { supabase } from '@/lib/supabase/client';

interface SharedSignal { id: string; signal_type: string; topic: string; summary: string; consent_scope: string; revoked_at: string | null; }
const signalTypes = ['problem','question','doubt','need','opportunity','resource_gap','skill_gap','space_need','funding_need','production_need','distribution_need','community_interest','learning','collaboration_offer'];

export function EcosystemSignalConsent({ projectId }: { projectId: string }) {
  const [signals, setSignals] = useState<SharedSignal[]>([]);
  const [type, setType] = useState('need');
  const [category, setCategory] = useState('general');
  const [topic, setTopic] = useState('');
  const [summary, setSummary] = useState('');
  const [scope, setScope] = useState('aggregate');
  const [consent, setConsent] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    supabase.from('ecosystem_signals').select('id,signal_type,topic,summary,consent_scope,revoked_at').eq('source_project_id', projectId).is('revoked_at', null).then(({ data }) => setSignals((data ?? []) as SharedSignal[]));
  }, [projectId]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!consent) { setMessage('Debes confirmar el alcance antes de compartir.'); return; }
    const { data, error } = await supabase.rpc('share_ecosystem_signal', {
      target_project_id: projectId, requested_source_module: 'manual_consent',
      requested_signal_type: type, requested_category: category,
      requested_topic: topic, requested_summary: summary,
      requested_urgency: 1, requested_confidence: 1,
      requested_consent_scope: scope,
    });
    if (error) { setMessage(error.message); return; }
    setSignals((current) => [{ id: String(data), signal_type: type, topic, summary, consent_scope: scope, revoked_at: null }, ...current.filter((item) => item.id !== data)]);
    setTopic(''); setSummary(''); setConsent(false); setMessage('Resumen compartido. Puedes retirar el consentimiento en cualquier momento.');
  }

  async function revoke(id: string) {
    const { error } = await supabase.rpc('revoke_ecosystem_signal', { target_signal_id: id });
    setMessage(error ? error.message : 'Consentimiento retirado. La señal ya no participa en tendencias.');
    if (!error) setSignals((current) => current.filter((item) => item.id !== id));
  }

  return (
    <section className="border-t border-[#232323] pt-8">
      <div className="flex items-start gap-3"><Share2 className="mt-1 text-[#D9FF00]" size={20} /><div><h2 className="text-2xl font-semibold">Compartir una señal con el ecosistema</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-[#999]">Escribe un resumen nuevo. Creative OS no copiará la conversación, documentos, presupuesto, tareas ni riesgos privados.</p></div></div>
      <form onSubmit={submit} className="mt-7 grid gap-4 md:grid-cols-2">
        <Field label="Tipo"><select value={type} onChange={(e) => setType(e.target.value)} className="input-signal">{signalTypes.map((item) => <option key={item}>{item}</option>)}</select></Field>
        <Field label="Categoría"><input value={category} onChange={(e) => setCategory(e.target.value)} required className="input-signal" /></Field>
        <Field label="Tema"><input value={topic} onChange={(e) => setTopic(e.target.value)} required className="input-signal" /></Field>
        <Field label="Alcance"><select value={scope} onChange={(e) => setScope(e.target.value)} className="input-signal"><option value="aggregate">Solo agregado y anónimo</option><option value="identified">Puede identificarse con autorización</option></select></Field>
        <label className="md:col-span-2"><span className="mb-2 block text-xs uppercase tracking-[0.14em] text-[#777]">Resumen compartible</span><textarea value={summary} onChange={(e) => setSummary(e.target.value)} minLength={10} maxLength={500} required className="input-signal min-h-28" /></label>
        <label className="flex items-start gap-3 text-sm leading-6 text-[#aaa] md:col-span-2"><input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-1 h-4 w-4 accent-[#D9FF00]" />Confirmo que este resumen puede usarse con el alcance seleccionado y que no contiene información privada de terceros.</label>
        <button className="w-fit bg-[#D9FF00] px-5 py-3 font-bold text-black">Compartir resumen</button>
      </form>
      {message ? <p className="mt-5 text-sm text-[#D9FF00]" role="status">{message}</p> : null}
      {signals.length ? <div className="mt-8 border-t border-[#232323]">{signals.map((signal) => <div key={signal.id} className="flex items-start justify-between gap-5 border-b border-[#232323] py-5"><div><p className="font-semibold">{signal.topic}</p><p className="mt-1 text-sm leading-6 text-[#888]">{signal.summary}</p><p className="mt-2 text-xs uppercase text-[#666]">{signal.signal_type} · {signal.consent_scope}</p></div><button type="button" onClick={() => revoke(signal.id)} title="Retirar consentimiento" className="inline-flex h-9 w-9 shrink-0 items-center justify-center border border-white/15 text-[#aaa] hover:text-white"><Trash2 size={16} /></button></div>)}</div> : null}
      <style jsx>{`.input-signal{width:100%;border:1px solid #333;background:#0b0b0b;padding:.7rem .8rem;color:white}`}</style>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label><span className="mb-2 block text-xs uppercase tracking-[0.14em] text-[#777]">{label}</span>{children}</label>; }
