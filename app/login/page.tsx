'use client';

import type {
  FormEvent,
} from 'react';

import {
  Suspense,
  useState,
} from 'react';

import Link from 'next/link';

import {
  useRouter,
  useSearchParams,
} from 'next/navigation';

import {
  supabase,
} from '@/lib/supabase/client';

function LoginContent() {
  const router = useRouter();

  const searchParams =
    useSearchParams();

  const requestedRedirect = searchParams.get('redirect');
  const safeRedirect =
    requestedRedirect?.startsWith('/') &&
    !requestedRedirect.startsWith('//')
      ? requestedRedirect
      : '/studio';

  const [
    email,
    setEmail,
  ] = useState('');

  const [
    password,
    setPassword,
  ] = useState('');

  const [
    errorMessage,
    setErrorMessage,
  ] = useState('');

  const [
    isLoading,
    setIsLoading,
  ] = useState(false);

  async function handleLogin(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setErrorMessage('');

    setIsLoading(true);

    const {
      error,
    } =
      await supabase.auth.signInWithPassword({
        email:
          email.trim().toLowerCase(),

        password,
      });

    if (error) {
      setErrorMessage(
        'No fue posible iniciar sesión. Revisa el correo y la contraseña.'
      );

      setIsLoading(false);

      return;
    }

    router.replace(
      safeRedirect
    );

    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#050505] px-6 py-16 text-white">
      <section className="w-full max-w-md">
        <Link
          href="/"
          className="text-sm text-[#888888] transition hover:text-white"
        >
          ← Volver a Cultura Esta
        </Link>

        <div className="mt-8 rounded-[32px] border border-white/10 bg-[#0A0A0A] p-8 shadow-2xl md:p-10">
          <p className="text-sm font-bold uppercase tracking-[0.3em] text-[#D9FF00]">
            Cultura Esta
          </p>

          <h1 className="mt-5 text-4xl font-bold leading-tight">
            Entrar al ecosistema
          </h1>

          <p className="mt-4 leading-relaxed text-[#8A8A8A]">
            Accede a tus proyectos, perfiles, espacios,
            organizaciones y conexiones dentro de Cultura Esta.
          </p>

          <form
            onSubmit={
              handleLogin
            }
            className="mt-10 space-y-6"
          >
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-medium text-[#BDBDBD]"
              >
                Correo electrónico
              </label>

              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) =>
                  setEmail(
                    event.target.value
                  )
                }
                placeholder="correo@ejemplo.com"
                autoComplete="email"
                required
                className="w-full rounded-2xl border border-white/10 bg-[#111111] px-5 py-4 text-white outline-none transition placeholder:text-[#555555] focus:border-[#D9FF00]"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-medium text-[#BDBDBD]"
              >
                Contraseña
              </label>

              <input
                id="password"
                type="password"
                value={password}
                onChange={(event) =>
                  setPassword(
                    event.target.value
                  )
                }
                placeholder="Tu contraseña"
                autoComplete="current-password"
                required
                className="w-full rounded-2xl border border-white/10 bg-[#111111] px-5 py-4 text-white outline-none transition placeholder:text-[#555555] focus:border-[#D9FF00]"
              />
            </div>

            {errorMessage ? (
              <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm leading-relaxed text-red-300">
                {errorMessage}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-full bg-[#D9FF00] px-6 py-4 font-bold text-black transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading
                ? 'Ingresando...'
                : 'Ingresar'}
            </button>
          </form>

          <div className="mt-8 border-t border-white/10 pt-7 text-center">
            <p className="text-sm text-[#777777]">
              ¿Todavía no haces parte del ecosistema?
            </p>

            <Link
              href={`/registro?redirect=${encodeURIComponent(safeRedirect)}`}
              className="mt-3 inline-flex font-semibold text-white transition hover:text-[#D9FF00]"
            >
              Crear una cuenta →
            </Link>
          </div>

          <p className="mt-7 text-center text-xs leading-relaxed text-[#555555]">
            Los permisos editoriales y administrativos son asignados
            internamente. No pueden seleccionarse durante el registro.
          </p>
        </div>
      </section>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginContent />
    </Suspense>
  );
}
