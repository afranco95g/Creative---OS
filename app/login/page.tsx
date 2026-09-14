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

import { ThemeToggle } from '@/components/theme/ThemeToggle';

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

    const normalizedEmail = email.trim().toLowerCase();
    const destination =
      normalizedEmail === 'imaginecompanysas@gmail.com' && !requestedRedirect
        ? '/cursos/music-business'
        : safeRedirect;

    router.replace(
      destination
    );

    router.refresh();
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center bg-superficie px-6 py-16 text-texto-largo">
      <div className="absolute right-6 top-6">
        <ThemeToggle />
      </div>

      <section className="w-full max-w-md">
        <Link
          href="/"
          className="text-sm text-texto-largo transition hover:text-texto-principal"
        >
          ← Volver a El Culebreo
        </Link>

        <div className="mt-8 border border-borde bg-superficie-elevada p-8 shadow-stencil md:p-10">
          <p className="text-sm font-bold uppercase tracking-[0.3em] text-texto-principal">
            El Culebreo
          </p>

          <h1 className="stencil-heading mt-5 text-4xl font-bold leading-tight">
            Entrar al ecosistema
          </h1>

          <p className="mt-4 leading-relaxed text-texto-largo">
            Accede a tus proyectos, perfiles, espacios,
            organizaciones y conexiones dentro de El Culebreo.
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
                className="mb-2 block text-sm font-medium text-texto-largo"
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
                className="w-full border border-borde bg-superficie px-5 py-4 text-texto-largo outline-none transition placeholder:text-texto-largo/60 focus:border-acento"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-medium text-texto-largo"
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
                className="w-full border border-borde bg-superficie px-5 py-4 text-texto-largo outline-none transition placeholder:text-texto-largo/60 focus:border-acento"
              />
            </div>

            {errorMessage ? (
              <div className="border border-rojo-base bg-rojo-base px-4 py-3 text-sm leading-relaxed text-hueso">
                {errorMessage}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full border border-borde bg-rojo-base px-6 py-4 font-bold text-hueso transition hover:shadow-stencil disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading
                ? 'Ingresando...'
                : 'Ingresar'}
            </button>
          </form>

          <div className="mt-8 border-t border-borde pt-7 text-center">
            <p className="text-sm text-texto-largo">
              ¿Todavía no haces parte del ecosistema?
            </p>

            <Link
              href={`/registro?redirect=${encodeURIComponent(safeRedirect)}`}
              className="mt-3 inline-flex font-semibold transition hover:text-texto-principal"
            >
              Crear una cuenta →
            </Link>
          </div>

          <p className="mt-7 text-center text-xs leading-relaxed text-texto-largo">
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
