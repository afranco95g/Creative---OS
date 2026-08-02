'use client';

import { Plus, Power } from 'lucide-react';
import { FormEvent, useState } from 'react';

import { supabase } from '@/lib/supabase/client';

interface TaxRule {
  id: string;
  rule_code: string;
  version: number;
  name: string;
  jurisdiction: string;
  operation_type: string;
  tax_name: string;
  rate: number | null;
  treatment: string;
  status: string;
  official_source: string;
  official_source_url: string;
  legal_reference: string;
  starts_on: string;
  requires_professional_review: boolean;
}

const blank = { ruleCode: '', name: '', jurisdiction: 'Colombia', operationType: '', taxName: '', rate: '', treatment: 'informational', source: '', sourceUrl: '', reference: '', interpretation: '', startsOn: '' };

export function TaxRulesManager({ initialRules }: { initialRules: TaxRule[] }) {
  const [rules, setRules] = useState(initialRules);
  const [form, setForm] = useState(blank);
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');

  function field<K extends keyof typeof blank>(key: K, value: (typeof blank)[K]) { setForm((current) => ({ ...current, [key]: value })); }

  async function createRule(event: FormEvent) {
    event.preventDefault();
    const versions = rules.filter((rule) => rule.rule_code === form.ruleCode).map((rule) => rule.version);
    const payload = { rule_code: form.ruleCode.trim(), version: Math.max(0, ...versions) + 1, name: form.name.trim(), jurisdiction: form.jurisdiction.trim(), operation_type: form.operationType.trim(), tax_name: form.taxName.trim(), rate: form.rate === '' ? null : Number(form.rate) / 100, treatment: form.treatment, starts_on: form.startsOn, official_source: form.source.trim(), official_source_url: form.sourceUrl.trim(), legal_reference: form.reference.trim(), interpretation: form.interpretation.trim(), source_checked_on: new Date().toISOString().slice(0, 10), status: 'draft', requires_professional_review: true };
    const { data, error } = await supabase.from('tax_rules').insert(payload).select('*').single();
    setMessage(error ? error.message : 'Regla creada como borrador; todavía no participa en cálculos.');
    if (!error && data) { setRules((current) => [data as TaxRule, ...current]); setForm(blank); setOpen(false); }
  }

  async function toggle(rule: TaxRule) {
    const status = rule.status === 'active' ? 'inactive' : 'active';
    const { data, error } = await supabase.from('tax_rules').update({ status, approved_at: status === 'active' ? new Date().toISOString() : null }).eq('id', rule.id).select('*').single();
    setMessage(error ? error.message : `Regla ${status === 'active' ? 'activada' : 'desactivada'} con registro de auditoría.`);
    if (!error && data) setRules((current) => current.map((item) => item.id === rule.id ? data as TaxRule : item));
  }

  return (
    <section>
      <div className="flex flex-wrap items-center justify-between gap-4"><p className="max-w-3xl text-sm leading-6 text-amber-200">Estimación tributaria. Validar con contador o asesor tributario. Ninguna regla nueva se activa automáticamente.</p><button type="button" onClick={() => setOpen((value) => !value)} className="inline-flex items-center gap-2 bg-[#D9FF00] px-4 py-2 text-sm font-bold text-black"><Plus size={17} />Nueva regla</button></div>
      {message ? <p className="mt-5 border-l-2 border-[#D9FF00] pl-4 text-sm text-[#bbb]" role="status">{message}</p> : null}
      {open ? <form onSubmit={createRule} className="mt-8 grid gap-4 border-y border-white/10 py-8 md:grid-cols-2 lg:grid-cols-3">
        <Input label="Código" value={form.ruleCode} onChange={(v) => field('ruleCode', v)} required /><Input label="Nombre" value={form.name} onChange={(v) => field('name', v)} required /><Input label="Jurisdicción" value={form.jurisdiction} onChange={(v) => field('jurisdiction', v)} required /><Input label="Tipo de operación" value={form.operationType} onChange={(v) => field('operationType', v)} required /><Input label="Impuesto o concepto" value={form.taxName} onChange={(v) => field('taxName', v)} required /><Input label="Tarifa porcentual opcional" value={form.rate} onChange={(v) => field('rate', v)} type="number" /><Input label="Vigente desde" value={form.startsOn} onChange={(v) => field('startsOn', v)} type="date" required /><Input label="Fuente oficial" value={form.source} onChange={(v) => field('source', v)} required /><Input label="URL oficial" value={form.sourceUrl} onChange={(v) => field('sourceUrl', v)} type="url" required /><Input label="Referencia legal" value={form.reference} onChange={(v) => field('reference', v)} required /><label className="lg:col-span-2"><span className="mb-2 block text-xs uppercase text-[#777]">Interpretación implementada</span><textarea value={form.interpretation} onChange={(e) => field('interpretation', e.target.value)} required className="min-h-24 w-full border border-white/15 bg-[#0b0b0b] px-3 py-2" /></label><button className="self-end bg-white px-5 py-3 font-bold text-black">Guardar borrador</button>
      </form> : null}
      <div className="mt-8 overflow-x-auto"><table className="w-full min-w-[800px] border-collapse text-left"><thead><tr className="border-y border-white/10 text-xs uppercase text-[#777]"><th className="py-4">Regla</th><th>Operación</th><th>Jurisdicción</th><th>Tratamiento</th><th>Estado</th><th>Fuente</th><th></th></tr></thead><tbody>{rules.map((rule) => <tr key={rule.id} className="border-b border-white/10 text-sm"><td className="py-5 pr-5"><strong>{rule.name}</strong><p className="mt-1 text-[#777]">{rule.rule_code} · v{rule.version}</p></td><td className="pr-5">{rule.operation_type}</td><td className="pr-5">{rule.jurisdiction}</td><td className="pr-5">{rule.treatment}{rule.rate !== null ? ` · ${(rule.rate * 100).toFixed(3)}%` : ''}</td><td className="pr-5">{rule.status}</td><td className="pr-5"><a href={rule.official_source_url} target="_blank" rel="noreferrer" className="text-[#D9FF00] underline">{rule.official_source}</a></td><td><button type="button" onClick={() => toggle(rule)} title={rule.status === 'active' ? 'Desactivar regla' : 'Activar regla'} className="inline-flex h-9 w-9 items-center justify-center border border-white/15"><Power size={16} /></button></td></tr>)}</tbody></table></div>
    </section>
  );
}

function Input({ label, value, onChange, type = 'text', required = false }: { label: string; value: string; onChange: (value: string) => void; type?: string; required?: boolean }) { return <label><span className="mb-2 block text-xs uppercase text-[#777]">{label}</span><input type={type} value={value} onChange={(event) => onChange(event.target.value)} required={required} className="w-full border border-white/15 bg-[#0b0b0b] px-3 py-2" /></label>; }
