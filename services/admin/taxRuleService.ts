import { z } from 'zod';

import { HttpError, requireRole } from '@/lib/validation/adminWriteAuth';

export interface TaxRule {
  id: string; rule_code: string; version: number; name: string; jurisdiction: string;
  operation_type: string; tax_name: string; rate: number | null; treatment: string;
  status: string; official_source: string; official_source_url: string;
  legal_reference: string; starts_on: string; requires_professional_review: boolean;
}

// Gate: /admin/configuracion/reglas-tributarias exige canManageRoles
// (equivalente a role==='super_admin').
const CreateRuleInput = z.object({
  rule_code: z.string().trim().min(1).max(80),
  name: z.string().trim().min(1).max(200),
  jurisdiction: z.string().trim().min(1).max(80),
  operation_type: z.string().trim().min(1).max(80),
  tax_name: z.string().trim().min(1).max(120),
  rate: z.number().min(0).max(100).nullable(),
  treatment: z.string().min(1).max(40),
  starts_on: z.string().date(),
  official_source: z.string().trim().min(1).max(200),
  official_source_url: z.string().trim().url(),
  legal_reference: z.string().trim().min(1).max(300),
  interpretation: z.string().trim().min(1).max(4000),
});

export async function createTaxRule(raw: unknown) {
  const ctx = await requireRole('super_admin');
  const input = CreateRuleInput.parse(raw);

  const { data: existingVersions, error: versionError } = await ctx.supabase
    .from('tax_rules')
    .select('version')
    .eq('rule_code', input.rule_code);
  if (versionError) throw new HttpError(400, versionError.message);
  const nextVersion = Math.max(0, ...(existingVersions ?? []).map((row) => row.version)) + 1;

  const { data, error } = await ctx.supabase
    .from('tax_rules')
    .insert({
      rule_code: input.rule_code,
      version: nextVersion,
      name: input.name,
      jurisdiction: input.jurisdiction,
      operation_type: input.operation_type,
      tax_name: input.tax_name,
      rate: input.rate === null ? null : input.rate / 100,
      treatment: input.treatment,
      starts_on: input.starts_on,
      official_source: input.official_source,
      official_source_url: input.official_source_url,
      legal_reference: input.legal_reference,
      interpretation: input.interpretation,
      source_checked_on: new Date().toISOString().slice(0, 10),
      status: 'draft',
      requires_professional_review: true,
    })
    .select('*')
    .single();
  if (error) throw new HttpError(400, error.message);
  return data as TaxRule;
}

const ToggleRuleInput = z.object({ id: z.string().uuid(), status: z.enum(['active', 'inactive']) });

export async function toggleTaxRule(raw: unknown) {
  const ctx = await requireRole('super_admin');
  const input = ToggleRuleInput.parse(raw);
  const { data, error } = await ctx.supabase
    .from('tax_rules')
    .update({ status: input.status, approved_at: input.status === 'active' ? new Date().toISOString() : null })
    .eq('id', input.id)
    .select('*')
    .single();
  if (error) throw new HttpError(400, error.message);
  return data as TaxRule;
}
