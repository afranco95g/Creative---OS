import { supabase } from '@/lib/supabase/client';
import type { AllyForMatching } from '@/engines/alliesMatchingEngine';

export async function listMatchableAllies(): Promise<AllyForMatching[]> {
  const [{ data: spaces, error: spacesError }, { data: funders, error: fundersError }] = await Promise.all([
    supabase.from('spaces').select('id, name, slug, service_categories').eq('status', 'published'),
    supabase.from('funders').select('id, name, slug, service_categories').eq('status', 'published'),
  ]);

  if (spacesError) throw new Error(spacesError.message);
  if (fundersError) throw new Error(fundersError.message);

  const fromSpaces: AllyForMatching[] = (spaces ?? []).map((row: any) => ({
    actorType: 'space' as const,
    actorId: row.id,
    name: row.name,
    slug: row.slug,
    serviceCategories: Array.isArray(row.service_categories) ? row.service_categories : [],
  }));

  const fromFunders: AllyForMatching[] = (funders ?? []).map((row: any) => ({
    actorType: 'funder' as const,
    actorId: row.id,
    name: row.name,
    slug: row.slug,
    serviceCategories: Array.isArray(row.service_categories) ? row.service_categories : [],
  }));

  return [...fromSpaces, ...fromFunders];
}
