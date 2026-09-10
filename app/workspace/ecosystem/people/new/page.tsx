import Link from 'next/link';

export default function NewEcosystemPersonPage() {
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
          Crear perfil de persona
        </h1>

        <p className="mt-5 max-w-3xl text-base leading-8 text-texto-largo">
          Esta ruta está preparada para incorporar el
          formulario completo de creación de actores.
        </p>

        <div className="mt-10 rounded-3xl border border-dashed border-borde/15 bg-superficie-elevada p-8">
          <p className="text-sm leading-7 text-texto-largo">
            El formulario de personas será conectado en una
            siguiente etapa del ecosistema.
          </p>
        </div>
      </div>
    </main>
  );
}