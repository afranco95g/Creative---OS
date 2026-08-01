import { Card } from '@/components/primitives/card';
import { PageHeader } from '@/components/ui/PageHeader';

import { entityService } from '@/features/ecosystem/entities/services';

export const dynamic = 'force-dynamic';

type PersonRecord = Record<string, unknown>;

function getTextValue(
  person: PersonRecord,
  field: string,
): string | null {
  const value = person[field];

  return typeof value === 'string' && value.trim()
    ? value
    : null;
}

export default async function PeoplePage() {
  const people = await entityService.list('people');

  return (
    <main className="space-y-10">
      <PageHeader
        eyebrow="Ecosistema"
        title="Personas"
        description="Artistas, periodistas, gestores, colaboradores y demás integrantes del ecosistema cultural."
      />

      {people.length === 0 ? (
        <Card className="p-8">
          <h2 className="text-lg font-semibold text-white">
            Todavía no hay personas registradas
          </h2>

          <p className="mt-2 max-w-xl text-sm leading-relaxed text-neutral-400">
            Cuando se creen perfiles dentro del ecosistema,
            aparecerán en este espacio.
          </p>
        </Card>
      ) : (
        <section
          aria-label="Personas registradas"
          className="grid gap-4 md:grid-cols-2 xl:grid-cols-3"
        >
          {people.map((item, index) => {
            const person = item as PersonRecord;

            const id =
              getTextValue(person, 'id') ??
              `person-${index}`;

            const name =
              getTextValue(person, 'full_name') ??
              getTextValue(person, 'name') ??
              'Persona sin nombre';

            const slug =
              getTextValue(person, 'slug');

            const biography =
              getTextValue(person, 'biography');

            return (
              <Card
                key={id}
                interactive
                className="p-6"
              >
                <div className="flex items-start gap-4">
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-[#D9FF00] text-lg font-bold text-black">
                    {name.charAt(0).toUpperCase()}
                  </div>

                  <div className="min-w-0">
                    <h2 className="truncate text-lg font-semibold text-white">
                      {name}
                    </h2>

                    {slug ? (
                      <p className="mt-1 truncate text-sm text-neutral-500">
                        @{slug}
                      </p>
                    ) : null}
                  </div>
                </div>

                {biography ? (
                  <p className="mt-5 line-clamp-3 text-sm leading-relaxed text-neutral-400">
                    {biography}
                  </p>
                ) : (
                  <p className="mt-5 text-sm text-neutral-600">
                    Sin biografía registrada.
                  </p>
                )}
              </Card>
            );
          })}
        </section>
      )}
    </main>
  );
}