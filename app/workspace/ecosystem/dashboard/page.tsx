import Link from 'next/link';

import { Card } from '@/components/primitives/card';
import { PageHeader } from '@/components/ui/PageHeader';

import { entityService } from '@/features/ecosystem/entities/services';

export const dynamic = 'force-dynamic';

export default async function EcosystemDashboardPage() {
  const dashboardEntities =
    await entityService.getDashboardSummary();

  return (
    <main className="space-y-10">
      <PageHeader
        eyebrow="Workspace"
        title="Ecosistema"
        description="Administra las personas, organizaciones, proyectos, espacios y eventos conectados con Cultura Está."
      />

      <section
        aria-label="Resumen del ecosistema"
        className="grid gap-4 md:grid-cols-2 xl:grid-cols-3"
      >
        {dashboardEntities.map((entity) => (
          <Link
            key={entity.entity}
            href={entity.route}
            className="group"
          >
            <Card className="h-full p-6 transition-all duration-200 group-hover:border-neutral-600 group-hover:bg-neutral-900">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-neutral-500">
                    {entity.plural}
                  </p>

                  <p className="mt-3 text-4xl font-semibold text-white">
                    {entity.count}
                  </p>

                  <p className="mt-2 text-sm text-neutral-600">
                    {entity.subtitle}
                  </p>
                </div>

                <span className="text-neutral-600 transition-colors group-hover:text-white">
                  →
                </span>
              </div>
            </Card>
          </Link>
        ))}
      </section>

      <Card className="p-6">
        <h2 className="text-xl font-semibold text-white">
          Actividad reciente
        </h2>

        <p className="mt-3 text-sm leading-relaxed text-neutral-500">
          Aquí aparecerán los cambios más recientes realizados por el equipo dentro del ecosistema.
        </p>
      </Card>
    </main>
  );
}