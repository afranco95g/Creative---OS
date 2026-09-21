import { z } from 'zod';

import { HttpError, requireRole } from '@/lib/validation/adminWriteAuth';

export interface Policy { id: string; numeric_value: number; is_active: boolean; justification: string }

// El componente recibe `canConfigure` calculado en la página como
// access.profile?.role==='super_admin' — ese es el requisito real de la
// política comercial global, no canManageEcosystem (que sí basta para
// revisar productos individuales vía RPC, fuera de esta spec).
const PolicyInput = z.object({
  percent: z.number().min(0).max(100),
  justification: z.string().min(1).max(500),
});

export async function updateMaximumProductSharePolicy(raw: unknown) {
  const ctx = await requireRole('super_admin');
  const input = PolicyInput.parse(raw);

  const { data: current } = await ctx.supabase
    .from('commercial_policies')
    .select('id')
    .eq('policy_key', 'maximum_product_share_percent')
    .eq('scope_type', 'global')
    .eq('is_active', true);
  for (const row of current ?? []) {
    await ctx.supabase.from('commercial_policies').update({ is_active: false }).eq('id', row.id);
  }

  const { data, error } = await ctx.supabase
    .from('commercial_policies')
    .insert({
      policy_key: 'maximum_product_share_percent',
      scope_type: 'global',
      numeric_value: input.percent / 100,
      is_active: true,
      justification: input.justification,
    })
    .select('*')
    .single();
  if (error) throw new HttpError(400, error.message);
  return data as Policy;
}
