'use client';

interface PublicHeaderProps {
  hasUser: boolean;
  userName?: string;
  onEnter: () => void;
}

export function PublicHeader({
  hasUser,
  userName,
  onEnter,
}: PublicHeaderProps) {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#050505]/90 backdrop-blur-xl">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-8">

        <div className="flex items-center gap-12">

          <button className="text-2xl font-bold tracking-tight">
            Cultura Está
          </button>

          <nav className="hidden gap-8 text-sm text-[#B8B8B8] md:flex">

            <button className="transition hover:text-white">
              Historias
            </button>

            <button className="transition hover:text-white">
              Agenda
            </button>

            <button className="transition hover:text-white">
              Explorar
            </button>

            <button className="transition hover:text-white">
              Participa
            </button>

          </nav>

        </div>

        <div className="flex items-center gap-4">

          {hasUser && (
            <span className="hidden text-sm text-[#8A8A8A] md:block">
              Hola, {userName}
            </span>
          )}

          <button
            onClick={onEnter}
            className="rounded-full bg-[#D9FF00] px-6 py-3 font-semibold text-black transition hover:scale-105"
          >
            {hasUser ? 'Mi Ecosistema' : 'Entrar'}
          </button>

        </div>

      </div>
    </header>
  );
}