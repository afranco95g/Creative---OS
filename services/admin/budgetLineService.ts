import { z } from 'zod';

import { HttpError, requireAuthenticatedUser } from '@/lib/validation/adminWriteAuth';

export interface Line {
  id: string; project_id: string; direction: 'expense' | 'income'; category: string;
  concept: string; quantity: number; unit: string; unit_value: number; discount: number;
  vat: number; withholding: number; ica: number; other_taxes: number; total: number;
  funding_source: string | null; status: string; estimated_date: string | null;
  provider_name: string | null; notes: string;
}

export interface Scenario {
  id: string; project_id: string; experience_id: string | null; name: string;
  capacity: number; expected_occupancy: number; average_price: number;
  complimentary: number; expected_refunds: number; fixed_costs: number;
  variable_cost_per_attendee: number; estimated_taxes: number;
}

/**
 * Dos flujos legítimos escriben aquí, con reglas de autorización distintas:
 *  - components/admin/BudgetManager.tsx: un finance_admin/super_admin
 *    gestionando cualquier proyecto (gate de página: canManageFinance).
 *  - components/projects/BudgetSuggestion.tsx: el dueño del proyecto
 *    confirmando una línea sugerida sobre SU propio proyecto (gate hoy:
 *    la política RLS "Project owners manage budget").
 * No es un único rol: es "finance_admin/super_admin, o dueño de este
 * project_id concreto" — replicar solo canManageFinance rompería el
 * flujo de BudgetSuggestion para cualquier owner normal.
 */
async function assertProjectBudgetAccess(ctx: Awaited<ReturnType<typeof requireAuthenticatedUser>>, projectId: string) {
  if (ctx.capabilities?.canManageFinance) return;
  const { data: project, error } = await ctx.supabase
    .from('projects')
    .select('id, owner_id')
    .eq('id', projectId)
    .maybeSingle();
  if (error) throw new HttpError(400, error.message);
  if (!project || project.owner_id !== ctx.profile?.id) {
    throw new HttpError(403, 'No tienes permiso para escribir el presupuesto de este proyecto.');
  }
}

// El status en creación NUNCA lo decide el formulario: los estados de
// workflow (approved/committed/invoiced/paid/cancelled/executed) los
// mueve la revisión existente, no un insert directo.
const CreateLineInput = z.object({
  project_id: z.string().uuid(),
  direction: z.enum(['expense', 'income']),
  category: z.string().min(1).max(80),
  concept: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  quantity: z.number().positive().max(100000),
  unit: z.string().min(1).max(40),
  unit_value: z.number().nonnegative().max(1_000_000_000),
  status: z.enum(['estimated', 'quoted']).default('estimated'),
  estimated_date: z.string().date().nullable().optional(),
  provider_name: z.string().max(200).nullable().optional(),
  funding_source: z.string().max(200).nullable().optional(),
  source_suggestion: z.enum(['manual', 'creative_os']).default('manual'),
});

// El PATCH desde la tabla de BudgetManager solo mueve estimated→quoted.
// Cualquier otra transición (p. ej. a 'paid'/'approved') la rechaza el
// schema — eso sigue siendo trabajo del workflow de revisión, no de este
// formulario.
const UpdateLineInput = z.object({
  id: z.string().uuid(),
  status: z.literal('quoted'),
});

export async function createBudgetLine(raw: unknown) {
  const ctx = await requireAuthenticatedUser();
  const input = CreateLineInput.parse(raw);
  await assertProjectBudgetAccess(ctx, input.project_id);

  const { data, error } = await ctx.supabase
    .from('project_budget_lines')
    .insert({
      ...input,
      suggestion_confirmed_by: input.source_suggestion === 'creative_os' ? ctx.profile?.id : null,
    })
    .select('*')
    .single();
  if (error) throw new HttpError(400, error.message);
  return data as Line;
}

export async function updateBudgetLineStatus(raw: unknown) {
  const ctx = await requireAuthenticatedUser();
  const input = UpdateLineInput.parse(raw);

  const { data: existing, error: fetchError } = await ctx.supabase
    .from('project_budget_lines')
    .select('id, project_id, status')
    .eq('id', input.id)
    .maybeSingle();
  if (fetchError) throw new HttpError(400, fetchError.message);
  if (!existing) throw new HttpError(404, 'Línea de presupuesto no encontrada.');
  if (existing.status !== 'estimated') {
    throw new HttpError(400, 'Solo se puede pasar de estimado a cotizado desde este formulario.');
  }
  await assertProjectBudgetAccess(ctx, existing.project_id);

  const { data, error } = await ctx.supabase
    .from('project_budget_lines')
    .update({ status: input.status })
    .eq('id', input.id)
    .select('*')
    .single();
  if (error) throw new HttpError(400, error.message);
  return data as Line;
}

const CreateScenarioInput = z.object({
  project_id: z.string().uuid(),
  experience_id: z.string().uuid().nullable(),
  name: z.string().min(1).max(60),
});

export async function upsertFinancialScenario(raw: unknown) {
  const ctx = await requireAuthenticatedUser();
  const input = CreateScenarioInput.parse(raw);
  await assertProjectBudgetAccess(ctx, input.project_id);

  const { data, error } = await ctx.supabase
    .from('financial_scenarios')
    .upsert(
      {
        project_id: input.project_id,
        experience_id: input.experience_id,
        name: input.name,
        capacity: 100,
        expected_occupancy: 0.6,
        average_price: 0,
        complimentary: 0,
        expected_refunds: 0,
        fixed_costs: 0,
        variable_cost_per_attendee: 0,
        estimated_taxes: 0,
      },
      { onConflict: 'project_id,experience_id,name' }
    )
    .select('*')
    .single();
  if (error) throw new HttpError(400, error.message);
  return data as Scenario;
}
