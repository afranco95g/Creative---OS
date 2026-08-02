'use client';

import { Gift, Pause, Play, Plus, RotateCcw, ShoppingCart, Ticket } from 'lucide-react';
import { FormEvent, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase/client';

interface ExperienceOption { id: string; title: string; capacity: number | null }
interface ProductOption { id: string; name: string; wholesale_price: number | null }
interface TicketRow {
  id: string; experience_id: string; name: string; ticket_kind: string;
  capacity: number; available_units: number; base_activity_price: number;
  product_component: number; culture_margin: number; operating_cost: number;
  gateway_fee: number; estimated_taxes: number; discount: number; final_price: number;
  sales: number; refunds: number; complimentary: number; status: string;
}

const initial = { experienceId: '', name: 'General', kind: 'general', capacity: '', base: '', product: '', margin: '', operation: '', gateway: '', taxes: '', discount: '', productId: '', units: '1', exception: false, reason: '' };

export function TicketingManager({ initialExperiences, initialTickets, products, maximumProductShare }: { initialExperiences: ExperienceOption[]; initialTickets: TicketRow[]; products: ProductOption[]; maximumProductShare: number | null }) {
  const [tickets, setTickets] = useState(initialTickets);
  const [form, setForm] = useState(initial);
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const maximum = maximumProductShare === null ? null : Number(form.base || 0) * maximumProductShare;
  const exceeds = maximum !== null && Number(form.product || 0) > maximum;
  const totals = useMemo(() => tickets.reduce((sum, row) => ({ capacity: sum.capacity + row.capacity, sales: sum.sales + row.sales - row.refunds, gross: sum.gross + (row.sales - row.refunds) * row.final_price }), { capacity: 0, sales: 0, gross: 0 }), [tickets]);

  function field(key: string, value: string | boolean) { setForm((current) => ({ ...current, [key]: value })); }

  async function create(event: FormEvent) {
    event.preventDefault();
    if (exceeds && !form.exception) { setMessage('El componente de producto supera la política. Ajusta el valor o registra una excepción.'); return; }
    const capacity = Number(form.capacity);
    const payload = { experience_id: form.experienceId, name: form.name, ticket_kind: form.kind, capacity, available_units: capacity, base_activity_price: Number(form.base || 0), product_component: Number(form.product || 0), culture_margin: Number(form.margin || 0), operating_cost: Number(form.operation || 0), gateway_fee: Number(form.gateway || 0), estimated_taxes: Number(form.taxes || 0), discount: Number(form.discount || 0), policy_exception: form.exception, exception_reason: form.exception ? form.reason : null };
    const { data, error } = await supabase.from('ticket_types').insert(payload).select('*').single();
    if (error) { setMessage(error.message); return; }
    if (form.productId && data) {
      const product = products.find((item) => item.id === form.productId);
      const link = await supabase.from('ticket_type_products').insert({ ticket_type_id: data.id, product_id: form.productId, units_per_ticket: Number(form.units), unit_cost: Number(product?.wholesale_price || 0), unit_ticket_value: Number(form.product || 0) });
      if (link.error) setMessage(`Ticket creado, pero el producto no se asoció: ${link.error.message}`);
      else setMessage('Tipo de ticket y producto asociados.');
    } else setMessage('Tipo de ticket creado.');
    setTickets((current) => [data as TicketRow, ...current]); setForm(initial); setOpen(false);
  }

  async function toggle(ticket: TicketRow) {
    const status = ticket.status === 'active' ? 'paused' : 'active';
    const { data, error } = await supabase.from('ticket_types').update({ status }).eq('id', ticket.id).select('*').single();
    setMessage(error ? error.message : `Ticket ${status === 'active' ? 'activado' : 'pausado'}.`);
    if (data) setTickets((current) => current.map((item) => item.id === ticket.id ? data as TicketRow : item));
  }

  async function inventory(ticket: TicketRow, kind: 'sale' | 'refund' | 'complimentary') {
    const labels = { sale: 'venta', refund: 'devolución', complimentary: 'cortesía' };
    const raw = window.prompt(`Cantidad para ${labels[kind]}:`, '1');
    if (!raw) return;
    const quantity = Number(raw);
    if (!Number.isInteger(quantity) || quantity <= 0) { setMessage('La cantidad debe ser un entero mayor que cero.'); return; }
    const { error } = await supabase.rpc('adjust_ticket_inventory', { target_ticket_type_id: ticket.id, sales_delta: kind === 'sale' ? quantity : 0, refunds_delta: kind === 'refund' ? quantity : 0, complimentary_delta: kind === 'complimentary' ? quantity : 0 });
    setMessage(error ? error.message : 'Inventario actualizado y auditado.');
    if (!error) setTickets((current) => current.map((item) => item.id === ticket.id ? { ...item, sales: item.sales + (kind === 'sale' ? quantity : 0), refunds: item.refunds + (kind === 'refund' ? quantity : 0), complimentary: item.complimentary + (kind === 'complimentary' ? quantity : 0), available_units: item.available_units - (kind === 'sale' || kind === 'complimentary' ? quantity : 0) + (kind === 'refund' ? quantity : 0) } : item));
  }

  return <section>
    <div className="grid border-y border-white/10 sm:grid-cols-3">{[['Capacidad', totals.capacity], ['Ventas netas', totals.sales], ['Ingreso bruto confirmado', money(totals.gross)]].map(([label, value]) => <Metric key={label} label={String(label)} value={String(value)} />)}</div>
    <div className="flex justify-end py-6"><button onClick={() => setOpen(!open)} className="inline-flex items-center gap-2 bg-[#D9FF00] px-4 py-2 font-bold text-black"><Plus size={17} />Nuevo tipo</button></div>
    {message ? <p className="mb-6 border-l-2 border-[#D9FF00] pl-4 text-sm text-[#bbb]">{message}</p> : null}
    {open ? <form onSubmit={create} className="grid gap-4 border-y border-white/10 py-7 md:grid-cols-2 lg:grid-cols-4">
      <Select label="Experiencia" value={form.experienceId} onChange={(value) => { field('experienceId', value); const selected = initialExperiences.find((item) => item.id === value); if (selected?.capacity) field('capacity', String(selected.capacity)); }} options={initialExperiences.map((item) => [item.id, item.title])} required />
      <Input label="Nombre" value={form.name} onChange={(value) => field('name', value)} required /><Select label="Tipo" value={form.kind} onChange={(value) => field('kind', value)} options={['general', 'presale', 'student', 'community', 'sponsor', 'invitation', 'bundle', 'with_product', 'without_product'].map((value) => [value, value])} />
      <Input label="Capacidad" type="number" value={form.capacity} onChange={(value) => field('capacity', value)} required /><Input label="Precio base" type="number" value={form.base} onChange={(value) => field('base', value)} /><Input label="Componente producto" type="number" value={form.product} onChange={(value) => field('product', value)} /><Input label="Margen Cultura Esta" type="number" value={form.margin} onChange={(value) => field('margin', value)} /><Input label="Operación" type="number" value={form.operation} onChange={(value) => field('operation', value)} /><Input label="Pasarela" type="number" value={form.gateway} onChange={(value) => field('gateway', value)} /><Input label="Impuestos estimados" type="number" value={form.taxes} onChange={(value) => field('taxes', value)} /><Input label="Descuento" type="number" value={form.discount} onChange={(value) => field('discount', value)} />
      <Select label="Producto opcional" value={form.productId} onChange={(value) => field('productId', value)} options={[["", 'Sin producto'], ...products.map((item) => [item.id, item.name])]} />
      {form.productId ? <Input label="Unidades por ticket" type="number" value={form.units} onChange={(value) => field('units', value)} /> : null}
      <div className="lg:col-span-2"><p className={`text-sm ${exceeds ? 'text-amber-300' : 'text-[#888]'}`}>{maximum === null ? 'No existe una política global activa.' : `Máximo de producto según política: ${money(maximum)}.`}</p>{exceeds ? <><label className="mt-3 flex gap-2 text-sm"><input type="checkbox" checked={form.exception} onChange={(event) => field('exception', event.target.checked)} />Aprobar excepción</label><Input label="Justificación" value={form.reason} onChange={(value) => field('reason', value)} required={form.exception} /></> : null}</div>
      <button className="self-end bg-white px-4 py-3 font-bold text-black">Crear ticket</button>
    </form> : null}
    <div className="mt-8 overflow-x-auto"><table className="w-full min-w-[1100px] text-left"><thead><tr className="border-y border-white/10 text-xs uppercase text-[#777]"><th className="py-4">Ticket</th><th>Experiencia</th><th>Capacidad</th><th>Disponible</th><th>Desglose</th><th>Precio final</th><th>Movimientos</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>{tickets.map((ticket) => <tr key={ticket.id} className="border-b border-white/10 text-sm"><td className="py-5 pr-5"><strong>{ticket.name}</strong><p className="text-[#777]">{ticket.ticket_kind}</p></td><td className="pr-5">{initialExperiences.find((item) => item.id === ticket.experience_id)?.title || ticket.experience_id}</td><td>{ticket.capacity}</td><td>{ticket.available_units}</td><td className="pr-5 text-xs text-[#888]">Base {money(ticket.base_activity_price)} · Producto {money(ticket.product_component)} · Margen {money(ticket.culture_margin)} · Otros {money(ticket.operating_cost + ticket.gateway_fee + ticket.estimated_taxes - ticket.discount)}</td><td className="font-bold">{money(ticket.final_price)}</td><td className="text-xs">{ticket.sales} ventas · {ticket.refunds} devol. · {ticket.complimentary} cortesías</td><td>{ticket.status}</td><td><div className="flex gap-1"><Action title="Registrar venta" onClick={() => inventory(ticket, 'sale')}><ShoppingCart /></Action><Action title="Registrar devolución" onClick={() => inventory(ticket, 'refund')}><RotateCcw /></Action><Action title="Registrar cortesía" onClick={() => inventory(ticket, 'complimentary')}><Gift /></Action><Action title={ticket.status === 'active' ? 'Pausar' : 'Activar'} onClick={() => toggle(ticket)}>{ticket.status === 'active' ? <Pause /> : <Play />}</Action></div></td></tr>)}</tbody></table></div>
    {!tickets.length ? <div className="py-16 text-center text-[#777]"><Ticket className="mx-auto" /><p className="mt-3">No hay tipos de ticket.</p></div> : null}
    <p className="mt-8 text-xs text-amber-200">Estimación tributaria. Validar con contador o asesor tributario.</p>
  </section>;
}

function Action({ title, onClick, children }: { title: string; onClick: () => void; children: React.ReactNode }) { return <button title={title} aria-label={title} onClick={onClick} className="inline-flex size-9 items-center justify-center border border-white/20 [&_svg]:size-4">{children}</button>; }
function Metric({ label, value }: { label: string; value: string }) { return <div className="py-6 sm:border-r sm:border-white/10 sm:px-6 sm:first:pl-0"><strong className="text-3xl text-[#D9FF00]">{value}</strong><p className="mt-2 text-sm text-[#777]">{label}</p></div>; }
function Input({ label, value, onChange, type = 'text', required = false }: { label: string; value: string; onChange: (value: string) => void; type?: string; required?: boolean }) { return <label><span className="mb-2 block text-xs uppercase text-[#777]">{label}</span><input className="w-full border border-white/15 bg-[#0a0a0a] px-3 py-2" type={type} value={value} onChange={(event) => onChange(event.target.value)} required={required} /></label>; }
function Select({ label, value, onChange, options, required = false }: { label: string; value: string; onChange: (value: string) => void; options: string[][]; required?: boolean }) { return <label><span className="mb-2 block text-xs uppercase text-[#777]">{label}</span><select className="w-full border border-white/15 bg-[#0a0a0a] px-3 py-2" value={value} onChange={(event) => onChange(event.target.value)} required={required}>{required && value === '' ? <option value="">Selecciona</option> : null}{options.map(([valueOption, labelOption]) => <option key={valueOption} value={valueOption}>{labelOption}</option>)}</select></label>; }
function money(value: number) { return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(value || 0); }
