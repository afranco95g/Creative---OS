'use client';

import type {
  FormEvent,
} from 'react';

import {
  useEffect,
  useRef,
  useState,
} from 'react';

import Link from 'next/link';

import {
  useRouter,
} from 'next/navigation';

import {
  supabase,
} from '@/lib/supabase/client';

import { ThemeToggle } from '@/components/theme/ThemeToggle';

type RecoveryStatus =
  | 'loading'
  | 'ready'
  | 'error';

// Tiempo máximo de espera por el evento PASSWORD_RECOVERY antes de asumir
// que el enlace no es válido (marcador viejo, código PKCE ausente, o enlace
// vencido/ya usado con una sesión no relacionada ya activa en el navegador).
const RECOVERY_EVENT_TIMEOUT_MS = 4000;

export default function RestablecerPasswordPage() {
  const router = useRouter();

  const [
    status,
    setStatus,
  ] = useState<RecoveryStatus>('loading');

  const [
    password,
    setPassword,
  ] = useState('');

  const [
    confirmPassword,
    setConfirmPassword,
  ] = useState('');

  const [
    errorMessage,
    setErrorMessage,
  ] = useState('');

  const [
    isLoading,
    setIsLoading,
  ] = useState(false);

  const timeoutIdRef =
    useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function clearRecoveryTimeout() {
      if (timeoutIdRef.current !== null) {
        clearTimeout(timeoutIdRef.current);

        timeoutIdRef.current = null;
      }
    }

    // Si PASSWORD_RECOVERY no llega dentro de este plazo, asumimos que el
    // enlace no es válido (o que la sesión recuperada por INITIAL_SESSION no
    // tiene relación con una recuperación real) y mostramos el estado de
    // error. Usamos un update funcional para no pisar un 'ready' que ya haya
    // llegado por otra vía.
    timeoutIdRef.current = setTimeout(() => {
      setStatus((current) =>
        current === 'ready'
          ? current
          : 'error'
      );
    }, RECOVERY_EVENT_TIMEOUT_MS);

    const {
      data: {
        subscription,
      },
    } =
      supabase.auth.onAuthStateChange(
        (event, session) => {
          if (event === 'PASSWORD_RECOVERY') {
            clearRecoveryTimeout();

            setStatus('ready');

            return;
          }

          if (event === 'INITIAL_SESSION') {
            // Sin sesión: no hay nada que esperar, el enlace no era válido.
            // Con sesión: puede ser una sesión previa no relacionada con la
            // recuperación (o un enlace vencido que no disparó
            // PASSWORD_RECOVERY); seguimos esperando hasta que venza el
            // timeout de arriba o llegue PASSWORD_RECOVERY, lo que ocurra
            // primero.
            if (!session) {
              clearRecoveryTimeout();

              setStatus((current) =>
                current === 'ready'
                  ? current
                  : 'error'
              );
            }
          }
        }
      );

    return () => {
      clearRecoveryTimeout();

      subscription.unsubscribe();
    };
  }, []);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setErrorMessage('');

    if (password.length < 8) {
      setErrorMessage(
        'La contraseña debe tener al menos 8 caracteres.'
      );

      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage(
        'Las contraseñas no coinciden.'
      );

      return;
    }

    setIsLoading(true);

    const {
      error,
    } =
      await supabase.auth.updateUser({
        password,
      });

    if (error) {
      setErrorMessage(
        error.message ||
          'No fue posible actualizar la contraseña.'
      );

      setIsLoading(false);

      return;
    }

    await supabase.auth.signOut();

    router.replace('/login?reset=1');
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
            Restablecer contraseña
          </h1>

          {status === 'loading' ? (
            <p className="mt-4 leading-relaxed text-texto-largo">
              Verificando el enlace de recuperación...
            </p>
          ) : null}

          {status === 'error' ? (
            <>
              <p className="mt-4 leading-relaxed text-texto-largo">
                Este enlace de recuperación no es válido o ya expiró.
                Solicita uno nuevo para poder cambiar tu contraseña.
              </p>

              <Link
                href="/olvide-password"
                className="mt-8 inline-flex font-semibold transition hover:text-texto-principal"
              >
                Solicitar un enlace nuevo →
              </Link>
            </>
          ) : null}

          {status === 'ready' ? (
            <>
              <p className="mt-4 leading-relaxed text-texto-largo">
                Escribe tu contraseña nueva para terminar de recuperar el
                acceso a tu cuenta.
              </p>

              <form
                onSubmit={
                  handleSubmit
                }
                className="mt-10 space-y-6"
              >
                <div>
                  <label
                    htmlFor="new-password"
                    className="mb-2 block text-sm font-medium text-texto-largo"
                  >
                    Contraseña nueva
                  </label>

                  <input
                    id="new-password"
                    type="password"
                    value={password}
                    onChange={(event) =>
                      setPassword(
                        event.target.value
                      )
                    }
                    placeholder="Mínimo 8 caracteres"
                    autoComplete="new-password"
                    required
                    className="w-full border border-borde bg-superficie px-5 py-4 text-texto-largo outline-none transition placeholder:text-texto-largo/60 focus:border-acento"
                  />
                </div>

                <div>
                  <label
                    htmlFor="confirm-new-password"
                    className="mb-2 block text-sm font-medium text-texto-largo"
                  >
                    Confirmar contraseña nueva
                  </label>

                  <input
                    id="confirm-new-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(event) =>
                      setConfirmPassword(
                        event.target.value
                      )
                    }
                    placeholder="Repite la contraseña"
                    autoComplete="new-password"
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
                    ? 'Guardando...'
                    : 'Guardar contraseña nueva'}
                </button>
              </form>
            </>
          ) : null}
        </div>
      </section>
    </main>
  );
}
