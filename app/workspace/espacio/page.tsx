import { redirect } from 'next/navigation';

import { AdminSectionHeader } from '@/components/admin/AdminSectionHeader';
import { SpaceCaptureManager } from '@/components/spaces/SpaceCaptureManager';
import { createClient } from '@/lib/supabase/server';
import { canAccessSpaceTools } from '@/services/spaces/spaceAccessService';

const RENTABLE_SPACE_CATEGORIES = [
  'audiovisual_production_space',
  'events_space',
  'coworking_space',
  'equipment_rental',
];

export default async function SpaceWorkspacePage() {
  const access = await canAccessSpaceTools();

  if (!access.authenticated) {
    redirect('/login?redirect=/workspace/espacio');
  }

  if (!access.canAccess) {
    redirect('/acceso-denegado');
  }

  const db = await createClient();

  const { data: spaces } = await db
    .from('spaces')
    .select('id, name, status')
    .overlaps('service_categories', RENTABLE_SPACE_CATEGORIES)
    .order('name', { ascending: true });

  return (
    <main className="min-h-screen bg-superficie text-texto-largo">
      <AdminSectionHeader
        eyebrow="Mi espacio"
        title="Salones, inventario y galería"
        description="Crea salones dentro de tu espacio, clasifica su inventario y sube las fotos y video que lo componen."
      />

      <section className="mx-auto max-w-7xl px-5 py-10 md:px-8">
        <SpaceCaptureManager initialSpaces={spaces ?? []} />
      </section>
    </main>
  );
}
