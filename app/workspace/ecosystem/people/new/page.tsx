import Link from 'next/link';

export default function NewEcosystemPersonPage() {
  return (
    <main className="min-h-screen bg-[#050505] px-6 py-12 text-white sm:px-8 lg:px-12">
      <div className="mx-auto max-w-5xl">
        <Link
          href="/workspace/ecosystem/people"
          className="text-sm text-[#777777] transition hover:text-white"
        >
          ← Volver a personas
        </Link>

        <p className="mt-10 text-xs font-bold uppercase tracking-[0.24em] text-[#D9FF00]">
          Ecosistema
        </p>

        <h1 className="mt-4 text-4xl font-bold tracking-[-0.04em] sm:text-6xl">
          Crear perfil de persona
        </h1>

        <p className="mt-5 max-w-3xl text-base leading-8 text-[#999999]">
          Esta ruta está preparada para incorporar el
          formulario completo de creación de actores.
        </p>

        <div className="mt-10 rounded-3xl border border-dashed border-white/15 bg-[#0A0A0A] p-8">
          <p className="text-sm leading-7 text-[#777777]">
            El formulario de personas será conectado en una
            siguiente etapa del ecosistema.
          </p>
        </div>
      </div>
    </main>
  );
}