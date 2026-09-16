import { redirect } from 'next/navigation';

import { AdminSectionHeader } from '@/components/admin/AdminSectionHeader';
import { SpaceCaptureManager } from '@/components/admin/SpaceCaptureManager';
import { createClient } from '@/lib/supabase/server';
import { canAccessWorkspace } from '@/services/auth/workspace';

export default async function SpacesAdminPage() {
  const access = await canAccessWorkspace();

  if (!access.authenticated) {
    redirect('/login?redirect=/admin/espacios');
  }

  if (!access.capabilities?.canManageEcosystem) {
    redirect('/acceso-denegado');
  }

  const db = await createClient();

  const { data: spaces } = await db
    .from('spaces')
    .select('id, name, status')
    .order('name', { ascending: true });

  return (
    <main className="min-h-screen bg-superficie text-texto-largo">
      <AdminSectionHeader
        eyebrow="Espacios"
        title="Salones, inventario y galería"
        description="Crea salones dentro de un espacio del ecosistema, clasifica su inventario y sube las fotos y video que lo componen."
      />

      <section className="mx-auto max-w-7xl px-5 py-10 md:px-8">
        <SpaceCaptureManager initialSpaces={spaces ?? []} />
      </section>
    </main>
  );
}
