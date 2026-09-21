import { z } from 'zod';

import { HttpError, requireAuthenticatedUser } from '@/lib/validation/adminWriteAuth';

export interface Product {
  id: string; owner_actor_type: string; owner_actor_id: string; name: string;
  category: string; wholesale_price: number | null; commercial_price: number | null;
  available_quantity: number; validation_status: string; image_urls: string[];
}

/**
 * app/productos/gestionar/page.tsx ya arma `actors` server-side con esta
 * misma consulta (person.profile_id=user.id, memberships activas de
 * space/funder) y se la pasa al componente. La ruta API no puede confiar
 * en el owner_actor_type/owner_actor_id que manda el cliente — los
 * vuelve a verificar aquí contra la sesión real.
 */
async function assertOwnsActor(
  ctx: Awaited<ReturnType<typeof requireAuthenticatedUser>>,
  actorType: string,
  actorId: string
) {
  const userId = ctx.profile?.id;
  if (!userId) throw new HttpError(401, 'Sesión requerida.');

  if (actorType === 'person') {
    const { data } = await ctx.supabase.from('people').select('id').eq('id', actorId).eq('profile_id', userId).maybeSingle();
    if (data) return;
  } else if (actorType === 'space') {
    const { data } = await ctx.supabase.from('space_memberships').select('space_id').eq('space_id', actorId).eq('profile_id', userId).eq('status', 'active').maybeSingle();
    if (data) return;
  } else if (actorType === 'funder') {
    const { data } = await ctx.supabase.from('funder_memberships').select('funder_id').eq('funder_id', actorId).eq('profile_id', userId).eq('status', 'active').maybeSingle();
    if (data) return;
  }
  throw new HttpError(403, 'No tienes permiso para registrar productos a nombre de esta identidad.');
}

const CreateProductInput = z.object({
  owner_actor_type: z.enum(['person', 'space', 'funder']),
  owner_actor_id: z.string().uuid(),
  name: z.string().trim().min(1).max(200),
  description: z.string().max(2000).optional().default(''),
  category: z.string().trim().min(1).max(80),
  presentation: z.string().max(200).optional().default(''),
  commercial_price: z.number().nonnegative(),
  wholesale_price: z.number().nonnegative(),
  available_quantity: z.number().int().nonnegative(),
  minimum_order: z.number().int().positive(),
  production_capacity: z.number().int().positive().nullable(),
  lead_time_days: z.number().int().nonnegative().nullable(),
  city: z.string().max(120).nullable(),
  logistics_conditions: z.string().max(1000).optional().default(''),
  storage_requirements: z.string().max(1000).optional().default(''),
  legal_restrictions: z.string().max(1000).optional().default(''),
  image_urls: z.array(z.string().url()).max(10),
  compatible_audiences: z.array(z.string().max(80)).max(20),
});

export async function createOwnedProduct(raw: unknown) {
  const ctx = await requireAuthenticatedUser();
  const input = CreateProductInput.parse(raw);
  await assertOwnsActor(ctx, input.owner_actor_type, input.owner_actor_id);

  const { data, error } = await ctx.supabase
    .from('products')
    .insert({ ...input, validation_status: 'draft' })
    .select('*')
    .single();
  if (error) throw new HttpError(400, error.message);
  return data as Product;
}

const ProposeProductInput = z.object({ id: z.string().uuid() });

export async function proposeOwnedProduct(raw: unknown) {
  const ctx = await requireAuthenticatedUser();
  const input = ProposeProductInput.parse(raw);

  const { data: existing, error: fetchError } = await ctx.supabase
    .from('products')
    .select('id, owner_actor_type, owner_actor_id, validation_status')
    .eq('id', input.id)
    .maybeSingle();
  if (fetchError) throw new HttpError(400, fetchError.message);
  if (!existing) throw new HttpError(404, 'Producto no encontrado.');
  await assertOwnsActor(ctx, existing.owner_actor_type, existing.owner_actor_id);
  if (!['draft', 'documentation_required', 'rejected'].includes(existing.validation_status)) {
    throw new HttpError(400, 'Este producto ya está en validación o aprobado.');
  }

  const { data, error } = await ctx.supabase
    .from('products')
    .update({ validation_status: 'proposed' })
    .eq('id', input.id)
    .select('*')
    .single();
  if (error) throw new HttpError(400, error.message);
  return data as Product;
}
