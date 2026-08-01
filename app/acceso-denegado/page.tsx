import Link from 'next/link';

export default function AccessDeniedPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#050505] px-6 py-16 text-white">
      <section className="w-full max-w-xl text-center">
        <p className="text-sm font-bold uppercase tracking-[0.3em] text-[#D9FF00]">
          Cultura Está
        </p>

        <div className="mt-8 rounded-[32px] border border-white/10 bg-[#0A0A0A] p-8 md:p-12">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-[#D9FF00]/30 bg-[#D9FF00]/10 text-2xl">
            !
          </div>

          <h1 className="mt-8 text-4xl font-bold leading-tight md:text-5xl">
            No tienes acceso a este espacio.
          </h1>

          <p className="mx-auto mt-5 max-w-md leading-relaxed text-[#8A8A8A]">
            Tu cuenta está activa, pero todavía no tiene los permisos
            necesarios para ingresar al Workspace editorial y administrativo
            de Cultura Está.
          </p>

          <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
            <Link
              href="/"
              className="rounded-full bg-[#D9FF00] px-7 py-4 font-bold text-black transition hover:scale-[1.02]"
            >
              Volver a la portada
            </Link>

            <Link
              href="/login"
              className="rounded-full border border-white/15 px-7 py-4 font-semibold text-white transition hover:border-white/40"
            >
              Usar otra cuenta
            </Link>
          </div>
        </div>

        <p className="mt-6 text-sm leading-relaxed text-[#666666]">
          Los permisos son asignados por el equipo administrador de Cultura
          Está.
        </p>
      </section>
    </main>
  );
}