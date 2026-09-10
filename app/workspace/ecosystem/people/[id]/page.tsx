import Link from 'next/link';

interface EcosystemPersonPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EcosystemPersonPage({
  params,
}: EcosystemPersonPageProps) {
  const {
    id,
  } = await params;

  return (
    <main className="min-h-screen bg-superficie px-6 py-12 text-texto-largo sm:px-8 lg:px-12">
      <div className="mx-auto max-w-5xl">
        <Link
          href="/workspace/ecosystem/people"
          className="text-sm text-texto-largo transition hover:text-texto-largo"
        >
          ← Volver a personas
        </Link>

        <p className="mt-10 text-xs font-bold uppercase tracking-[0.24em] text-texto-principal">
          Ecosistema
        </p>

        <h1 className="mt-4 text-4xl font-bold tracking-[-0.04em] sm:text-6xl">
          Perfil de persona
        </h1>

        <p className="mt-5 max-w-3xl text-base leading-8 text-texto-largo">
          Esta ruta está preparada para conectar el editor
          completo del actor del ecosistema.
        </p>

        <div className="mt-10 rounded-3xl border border-borde/10 bg-superficie-elevada p-7">
          <p className="text-xs uppercase tracking-[0.18em] text-texto-largo">
            Identificador
          </p>

          <p className="mt-3 break-all font-mono text-sm text-texto-principal">
            {id}
          </p>
        </div>
      </div>
    </main>
  );
}