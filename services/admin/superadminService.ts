import { createClient } from '@/lib/supabase/server';

export interface SuperadminOverview {
  activeProfiles: number;
  pendingApplications: number;
  activeProjects: number;
  upcomingExperiences: number;
  pendingEditorial: number;
  newSignals: number;
  generatedAt: string;
}

export interface EcosystemTrend {
  signal_type: string;
  category: string;
  normalized_topic: string;
  signal_count: number;
  project_count: number;
  latest_at: string;
}

export interface AuditEntry {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  reason: string | null;
  result: 'success' | 'denied' | 'failed';
  created_at: string;
  actor_profile_id: string | null;
}

const emptyOverview: SuperadminOverview = {
  activeProfiles: 0,
  pendingApplications: 0,
  activeProjects: 0,
  upcomingExperiences: 0,
  pendingEditorial: 0,
  newSignals: 0,
  generatedAt: new Date(0).toISOString(),
};

export async function loadSuperadminOverview() {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('get_superadmin_overview');
  return {
    data: error ? emptyOverview : (data as unknown as SuperadminOverview),
    error: error?.message ?? null,
  };
}

export async function loadEcosystemTrends() {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('get_ecosystem_signal_trends', {
    requested_min_group: 3,
  });
  return {
    data: (data ?? []) as EcosystemTrend[],
    error: error?.message ?? null,
  };
}

export async function loadAuditLog(limit = 100) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('admin_audit_log')
    .select('id,action,entity_type,entity_id,reason,result,created_at,actor_profile_id')
    .order('created_at', { ascending: false })
    .limit(limit);
  return {
    data: (data ?? []) as AuditEntry[],
    error: error?.message ?? null,
  };
}
