import Link from 'next/link';

export default function PublicProjectNotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#050505] px-6 text-white">
      <section className="w-full max-w-2xl rounded-[32px] border border-white/10 bg-[#0A0A0A] p-8 md:p-10">
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#D9FF00]">
          Cultura Esta
        </p>

        <h1 className="mt-6 text-4xl font-bold tracking-[-0.04em]">
          Proyecto no disponible
        </h1>

        <p className="mt-5 text-base leading-8 text-[#999999]">
          El proyecto no existe, todavía no ha sido publicado o
          dejó de estar disponible públicamente.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/proyectos"
            className="rounded-full bg-[#D9FF00] px-6 py-3 text-sm font-bold text-black"
          >
            Ver proyectos
          </Link>

          <Link
            href="/"
            className="rounded-full border border-white/15 px-6 py-3 text-sm font-semibold"
          >
            Volver al medio
          </Link>
        </div>
      </section>
    </main>
  );
}