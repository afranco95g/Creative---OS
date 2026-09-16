'use client';

import type {
  FormEvent,
} from 'react';

import {
  useState,
} from 'react';

import Link from 'next/link';

import {
  supabase,
} from '@/lib/supabase/client';

import { ThemeToggle } from '@/components/theme/ThemeToggle';

export default function OlvidePasswordPage() {
  const [
    email,
    setEmail,
  ] = useState('');

  const [
    errorMessage,
    setErrorMessage,
  ] = useState('');

  const [
    isSubmitted,
    setIsSubmitted,
  ] = useState(false);

  const [
    isLoading,
    setIsLoading,
  ] = useState(false);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setErrorMessage('');

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      setErrorMessage(
        'Escribe un correo electrónico.'
      );

      return;
    }

    setIsLoading(true);

    await supabase.auth.resetPasswordForEmail(
      cleanEmail,
      {
        redirectTo: `${window.location.origin}/restablecer-password`,
      }
    );

    setIsLoading(false);

    setIsSubmitted(true);
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
            Recuperar contraseña
          </h1>

          {isSubmitted ? (
            <>
              <p className="mt-4 leading-relaxed text-texto-largo">
                Si existe una cuenta asociada a ese correo, te enviamos un
                enlace para restablecer la contraseña. Revisa tu bandeja de
                entrada.
              </p>

              <Link
                href="/login"
                className="mt-8 inline-flex font-semibold transition hover:text-texto-principal"
              >
                ← Volver a iniciar sesión
              </Link>
            </>
          ) : (
            <>
              <p className="mt-4 leading-relaxed text-texto-largo">
                Escribe el correo con el que te registraste. Te enviaremos un
                enlace para establecer una contraseña nueva.
              </p>

              <form
                onSubmit={
                  handleSubmit
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
                    ? 'Enviando...'
                    : 'Enviar enlace de recuperación'}
                </button>
              </form>

              <div className="mt-8 border-t border-borde pt-7 text-center">
                <Link
                  href="/login"
                  className="text-sm font-semibold transition hover:text-texto-principal"
                >
                  ← Volver a iniciar sesión
                </Link>
              </div>
            </>
          )}
        </div>
      </section>
    </main>
  );
}
