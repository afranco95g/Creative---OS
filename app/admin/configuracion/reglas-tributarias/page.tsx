import { redirect } from 'next/navigation';

import { AdminSectionHeader } from '@/components/admin/AdminSectionHeader';
import { TaxRulesManager } from '@/components/admin/TaxRulesManager';
import { createClient } from '@/lib/supabase/server';
import { canAccessWorkspace } from '@/services/auth/workspace';

export default async function TaxRulesPage() {
  const access = await canAccessWorkspace();
  if (!access.authenticated) redirect('/login?redirect=/admin/configuracion/reglas-tributarias');
  if (!access.capabilities?.canManageRoles) redirect('/acceso-denegado');
  const supabase = await createClient();
  const { data, error } = await supabase.from('tax_rules').select('*').order('created_at', { ascending: false });
  return <main className="min-h-screen bg-[#050505] text-white"><AdminSectionHeader eyebrow="Configuración financiera" title="Reglas tributarias" description="Catálogo versionado por jurisdicción, operación, vigencia y fuente oficial. La activación siempre requiere una decisión humana." /><section className="mx-auto max-w-7xl px-5 py-10 md:px-8">{error ? <p className="border-l-2 border-amber-400 pl-4 text-amber-200">Aplica la migración 027 para activar este módulo.</p> : <TaxRulesManager initialRules={data ?? []} />}</section></main>;
}
