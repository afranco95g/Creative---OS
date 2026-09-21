import { z } from 'zod';

import { HttpError, requireRole } from '@/lib/validation/adminWriteAuth';

export interface TicketRow {
  id: string; experience_id: string; name: string; ticket_kind: string; capacity: number;
  available_units: number; base_activity_price: number; product_component: number;
  culture_margin: number; operating_cost: number; gateway_fee: number;
  estimated_taxes: number; discount: number; final_price: number; sales: number;
  refunds: number; complimentary: number; status: string;
}

// Gate: /admin/ticketing exige profile.role==='super_admin' explícito
// (no una capability), así lo replica esta ruta.
const CreateTicketInput = z.object({
  experience_id: z.string().uuid(),
  name: z.string().min(1).max(120),
  ticket_kind: z.enum(['general', 'presale', 'student', 'community', 'sponsor', 'invitation', 'bundle', 'with_product', 'without_product']),
  capacity: z.number().int().positive().max(1_000_000),
  base_activity_price: z.number().nonnegative(),
  product_component: z.number().nonnegative(),
  culture_margin: z.number().nonnegative(),
  operating_cost: z.number().nonnegative(),
  gateway_fee: z.number().nonnegative(),
  estimated_taxes: z.number().nonnegative(),
  discount: z.number().nonnegative(),
  policy_exception: z.boolean(),
  exception_reason: z.string().max(500).nullable(),
  product: z.object({
    product_id: z.string().uuid(),
    units_per_ticket: z.number().positive(),
    unit_cost: z.number().nonnegative(),
    unit_ticket_value: z.number().nonnegative(),
  }).nullable(),
});

export async function createTicketType(raw: unknown) {
  const ctx = await requireRole('super_admin');
  const input = CreateTicketInput.parse(raw);

  const { data, error } = await ctx.supabase
    .from('ticket_types')
    .insert({
      experience_id: input.experience_id,
      name: input.name,
      ticket_kind: input.ticket_kind,
      capacity: input.capacity,
      available_units: input.capacity,
      base_activity_price: input.base_activity_price,
      product_component: input.product_component,
      culture_margin: input.culture_margin,
      operating_cost: input.operating_cost,
      gateway_fee: input.gateway_fee,
      estimated_taxes: input.estimated_taxes,
      discount: input.discount,
      policy_exception: input.policy_exception,
      exception_reason: input.policy_exception ? input.exception_reason : null,
    })
    .select('*')
    .single();
  if (error) throw new HttpError(400, error.message);

  if (input.product) {
    const { error: linkError } = await ctx.supabase.from('ticket_type_products').insert({
      ticket_type_id: data.id,
      product_id: input.product.product_id,
      units_per_ticket: input.product.units_per_ticket,
      unit_cost: input.product.unit_cost,
      unit_ticket_value: input.product.unit_ticket_value,
    });
    if (linkError) return { ticket: data as TicketRow, productLinkError: linkError.message };
  }
  return { ticket: data as TicketRow, productLinkError: null };
}

const ToggleTicketInput = z.object({ id: z.string().uuid(), status: z.enum(['active', 'paused']) });

export async function toggleTicketType(raw: unknown) {
  const ctx = await requireRole('super_admin');
  const input = ToggleTicketInput.parse(raw);
  const { data, error } = await ctx.supabase
    .from('ticket_types')
    .update({ status: input.status })
    .eq('id', input.id)
    .select('*')
    .single();
  if (error) throw new HttpError(400, error.message);
  return data as TicketRow;
}
