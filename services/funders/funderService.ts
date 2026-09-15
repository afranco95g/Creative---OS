import { supabase } from '@/lib/supabase/client';

export interface FunderRecord {
  id: string;
  name: string;
  service_catalog: string[];
  funder_type: string;
}

export async function getAgencyFunder(activeActorId?: string | null): Promise<FunderRecord | null> {
  let query = supabase.from('funders').select('id, name, service_catalog, funder_type');

  if (activeActorId && activeActorId.startsWith('brand:')) {
    const rawId = activeActorId.replace('brand:', '');
    query = query.eq('id', rawId);
  }

  let { data } = await query.limit(1).maybeSingle();

  if (!data) {
    const fallback = await supabase
      .from('funders')
      .select('id, name, service_catalog, funder_type')
      .ilike('name', '%Imagine%')
      .limit(1)
      .maybeSingle();
    data = fallback.data;
  }

  return data as FunderRecord | null;
}

export async function updateFunderServiceCatalog(funderId: string, catalog: string[]): Promise<void> {
  const { error } = await supabase
    .from('funders')
    .update({ service_catalog: catalog })
    .eq('id', funderId);

  if (error) throw error;
}
