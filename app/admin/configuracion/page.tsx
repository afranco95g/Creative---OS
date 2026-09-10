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
    <main className="min-h-screen bg-superficie text-texto-largo">
      <AdminSectionHeader eyebrow="Configuración" title="Accesos y políticas" description="Los cambios de rol o estado exigen una justificación y quedan registrados en la auditoría inmutable." />
      <section className="mx-auto max-w-7xl px-5 py-10 md:px-8">
        <nav className="mb-10 flex flex-wrap gap-3 border-b border-borde/10 pb-6"><span className="bg-rojo-base px-4 py-2 text-sm font-bold text-hueso">Usuarios</span><Link href="/admin/configuracion/reglas-tributarias" className="border border-borde/15 px-4 py-2 text-sm">Reglas tributarias</Link></nav>
        {error ? <p className="border-l-2 border-naranja pl-4 text-naranja">Aplica la migración 026 para administrar accesos.</p> : <ProfileAccessManager initialProfiles={(data ?? []) as AdminProfile[]} />}
      </section>
    </main>
  );
}
