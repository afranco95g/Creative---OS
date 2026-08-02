import Link from 'next/link';
import { redirect } from 'next/navigation';

import { AdminSectionHeader } from '@/components/admin/AdminSectionHeader';
import { ProfileAccessManager, type AdminProfile } from '@/components/admin/ProfileAccessManager';
import { createClient } from '@/lib/supabase/server';
import { canAccessWorkspace } from '@/services/auth/workspace';

export default async function ConfigurationPage() {
  const access = await canAccessWorkspace();
  if (!access.authenticated) redirect('/login?redirect=/admin/configuracion');
  if (!access.capabilities?.canManageRoles) redirect('/acceso-denegado');
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('list_admin_profiles');

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <AdminSectionHeader eyebrow="Configuración" title="Accesos y políticas" description="Los cambios de rol o estado exigen una justificación y quedan registrados en la auditoría inmutable." />
      <section className="mx-auto max-w-7xl px-5 py-10 md:px-8">
        <nav className="mb-10 flex flex-wrap gap-3 border-b border-white/10 pb-6"><span className="bg-[#D9FF00] px-4 py-2 text-sm font-bold text-black">Usuarios</span><Link href="/admin/configuracion/reglas-tributarias" className="border border-white/15 px-4 py-2 text-sm">Reglas tributarias</Link></nav>
        {error ? <p className="border-l-2 border-amber-400 pl-4 text-amber-200">Aplica la migración 026 para administrar accesos.</p> : <ProfileAccessManager initialProfiles={(data ?? []) as AdminProfile[]} />}
      </section>
    </main>
  );
}
