'use client';

import Link from 'next/link';
import {
  useRouter,
  useSearchParams,
} from 'next/navigation';

import {
  Suspense,
  type FormEvent,
  useMemo,
  useState,
} from 'react';

import {
  supabase,
} from '@/lib/supabase/client';

import { ThemeToggle } from '@/components/theme/ThemeToggle';

type OnboardingPath =
  | 'person'
  | 'space'
  | 'brand'
  | 'agency'
  | 'organization';

interface PathOption {
  id: OnboardingPath;
  eyebrow: string;
  title: string;
  description: string;
  examples: string;
  accountLabel: string;
  accountPlaceholder: string;
}

const PATH_OPTIONS: PathOption[] = [
  {
    id: 'person',
    eyebrow: 'Personas',
    title: 'Crear mi perfil creativo',
    description:
      'Para artistas, productores, gestores, periodistas, diseñadores, educadores, curadores y otros agentes creativos.',
    examples:
      'Podrás crear proyectos, colaborar, publicar tu trayectoria y conectarte con otros actores del ecosistema.',
    accountLabel:
      'Nombre completo',
    accountPlaceholder:
      'Nombre y apellido',
  },
  {
    id: 'space',
    eyebrow: 'Espacios',
    title: 'Registrar un espacio',
    description:
      'Para talleres, estudios, galerías, restaurantes, salas, laboratorios y otros lugares donde ocurren experiencias.',
    examples:
      'El espacio tendrá su propia plataforma para administrar perfil, programación, experiencias y solicitudes.',
    accountLabel:
      'Nombre del espacio',
    accountPlaceholder:
      'Ej. Taller 108',
  },
  {
    id: 'brand',
    eyebrow: 'Marcas',
    title: 'Registrar una marca',
    description:
      'Para marcas y empresas interesadas en crear campañas, activaciones, productos y alianzas dentro del ecosistema.',
    examples:
      'La marca podrá conectar con artistas, productores, espacios y experiencias compatibles.',
    accountLabel:
      'Nombre de la marca',
    accountPlaceholder:
      'Ej. OCB Colombia',
  },
  {
    id: 'agency',
    eyebrow: 'Agencias',
    title: 'Registrar una agencia',
    description:
      'Para agencias creativas, de publicidad, producción, comunicaciones o representación de marcas.',
    examples:
      'La agencia podrá desarrollar proyectos y posteriormente administrar campañas o marcas vinculadas.',
    accountLabel:
      'Nombre de la agencia',
    accountPlaceholder:
      'Ej. Agencia Creativa',
  },
  {
    id: 'organization',
    eyebrow: 'Organizaciones',
    title: 'Registrar una organización',
    description:
      'Para fundaciones, instituciones, universidades, colectivos formalizados y entidades que impulsan procesos culturales.',
    examples:
      'La organización podrá crear proyectos, oportunidades, experiencias y alianzas.',
    accountLabel:
      'Nombre de la organización',
    accountPlaceholder:
      'Ej. Fundación Cultural',
  },
];

function RegisterContent() {
  const router =
    useRouter();
  const searchParams = useSearchParams();
  const requestedRedirect = searchParams.get('redirect');
  const safeRedirect =
    requestedRedirect?.startsWith('/') &&
    !requestedRedirect.startsWith('//')
      ? requestedRedirect
      : '/mi-ecosistema';

  const [
    selectedPath,
    setSelectedPath,
  ] =
    useState<OnboardingPath>(
      'person'
    );

  const [
    accountName,
    setAccountName,
  ] =
    useState('');

  const [
    email,
    setEmail,
  ] =
    useState('');

  const [
    password,
    setPassword,
  ] =
    useState('');

  const [
    confirmPassword,
    setConfirmPassword,
  ] =
    useState('');

  const [
    errorMessage,
    setErrorMessage,
  ] =
    useState('');

  const [
    successMessage,
    setSuccessMessage,
  ] =
    useState('');

  const [
    isLoading,
    setIsLoading,
  ] =
    useState(false);

  const selectedOption =
    useMemo(
      () =>
        PATH_OPTIONS.find(
          (option) =>
            option.id ===
            selectedPath
        ) ??
        PATH_OPTIONS[0],
      [selectedPath]
    );

  async function handleRegister(
    event:
      FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setErrorMessage('');
    setSuccessMessage('');

    const cleanAccountName =
      accountName.trim();

    const cleanEmail =
      email
        .trim()
        .toLowerCase();

    if (!cleanAccountName) {
      setErrorMessage(
        `Escribe el ${selectedOption.accountLabel.toLowerCase()}.`
      );

      return;
    }

    if (!cleanEmail) {
      setErrorMessage(
        'Escribe un correo electrónico.'
      );

      return;
    }

    if (
      password.length < 8
    ) {
      setErrorMessage(
        'La contraseña debe tener al menos 8 caracteres.'
      );

      return;
    }

    if (
      password !==
      confirmPassword
    ) {
      setErrorMessage(
        'Las contraseñas no coinciden.'
      );

      return;
    }

    setIsLoading(true);

    const {
      data,
      error,
    } =
      await supabase.auth.signUp({
        email:
          cleanEmail,

        password,

        options: {
          data: {
            account_name:
              cleanAccountName,

            actor_name:
              cleanAccountName,

            full_name:
              cleanAccountName,

            onboarding_path:
              selectedPath,
          },
        },
      });

    if (error) {
      setErrorMessage(
        error.message ||
          'No fue posible crear la cuenta.'
      );

      setIsLoading(false);

      return;
    }

    if (data.session) {
      router.replace(
        safeRedirect
      );

      router.refresh();

      return;
    }

    setSuccessMessage(
      'La cuenta fue creada. Revisa tu correo para confirmar el acceso y después inicia sesión.'
    );

    setIsLoading(false);
  }

  if (successMessage) {
    return (
      <main className="relative flex min-h-screen items-center justify-center bg-superficie px-6 py-16 text-texto-largo">
        <div className="absolute right-6 top-6">
          <ThemeToggle />
        </div>

        <section className="w-full max-w-xl border border-borde bg-superficie-elevada p-8 shadow-stencil md:p-10">
          <p className="text-sm font-bold uppercase tracking-[0.3em] text-texto-principal">
            El Culebreo
          </p>

          <h1 className="stencil-heading mt-6 text-4xl font-bold leading-tight">
            Revisa tu correo
          </h1>

          <p className="mt-5 text-lg leading-8 text-texto-largo">
            {successMessage}
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href={`/login?redirect=${encodeURIComponent(safeRedirect)}`}
              className="border border-borde bg-rojo-base px-6 py-3 text-sm font-bold text-hueso transition hover:shadow-stencil"
            >
              Ir a iniciar sesión
            </Link>

            <Link
              href="/"
              className="border border-borde px-6 py-3 text-sm font-semibold transition hover:bg-superficie"
            >
              Volver al medio
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen bg-superficie px-6 py-12 text-texto-largo">
      <div className="absolute right-6 top-6">
        <ThemeToggle />
      </div>

      <div className="mx-auto max-w-7xl">
        <Link
          href="/"
          className="text-sm text-texto-largo transition hover:text-texto-principal"
        >
          ← Volver al medio
        </Link>

        <header className="mt-10 max-w-4xl">
          <p className="text-sm font-bold uppercase tracking-[0.3em] text-texto-principal">
            Únete al ecosistema
          </p>

          <h1 className="stencil-heading mt-6 text-5xl font-bold leading-[0.98] tracking-[-0.04em] md:text-7xl">
            ¿Qué quieres registrar?
          </h1>

          <p className="mt-6 max-w-3xl text-lg leading-8 text-texto-largo">
            Crea una cuenta para participar directamente como
            persona, espacio, marca, agencia u organización. Cada
            actor tendrá herramientas adaptadas a su función dentro
            del ecosistema.
          </p>
        </header>

        <form
          onSubmit={
            handleRegister
          }
          className="mt-12 space-y-10"
        >
          <section>
            <p className="mb-5 text-xs font-semibold uppercase tracking-[0.2em] text-texto-largo">
              1. Tipo de cuenta
            </p>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
              {PATH_OPTIONS.map(
                (option) => {
                  const isSelected =
                    option.id ===
                    selectedPath;

                  return (
                    <button
                      key={
                        option.id
                      }
                      type="button"
                      onClick={() => {
                        setSelectedPath(
                          option.id
                        );

                        setAccountName('');
                        setErrorMessage('');
                      }}
                      className={[
                        'min-h-[320px] border p-6 text-left transition',
                        isSelected
                          ? 'border-borde bg-rojo-base text-hueso'
                          : 'border-borde bg-superficie-elevada hover:shadow-stencil-sm',
                      ].join(' ')}
                    >
                      <p
                        className={[
                          'text-xs font-bold uppercase tracking-[0.2em]',
                          isSelected
                            ? 'text-hueso'
                            : 'text-texto-largo',
                        ].join(' ')}
                      >
                        {
                          option.eyebrow
                        }
                      </p>

                      <h2 className="mt-6 text-2xl font-bold">
                        {
                          option.title
                        }
                      </h2>

                      <p
                        className={[
                          'mt-4 text-sm leading-6',
                          isSelected
                            ? 'text-hueso'
                            : 'text-texto-largo',
                        ].join(' ')}
                      >
                        {
                          option.description
                        }
                      </p>

                      <p
                        className={[
                          'mt-6 text-xs leading-5',
                          isSelected
                            ? 'text-hueso'
                            : 'text-texto-largo',
                        ].join(' ')}
                      >
                        {
                          option.examples
                        }
                      </p>
                    </button>
                  );
                }
              )}
            </div>

            <div className="mt-4 border border-borde bg-superficie-elevada px-5 py-4">
              <p className="text-sm leading-6 text-texto-largo">
                <strong className="text-texto-principal">
                  Equipo editorial:
                </strong>{' '}
                periodistas y administradores del medio reciben sus
                permisos mediante invitación. Estos permisos no se
                seleccionan durante el registro público.
              </p>
            </div>
          </section>

          <section className="border border-borde bg-superficie-elevada p-7 md:p-9">
            <div className="flex flex-col gap-3">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-texto-largo">
                2. Datos de acceso
              </p>

              <h2 className="text-3xl font-bold">
                {selectedOption.title}
              </h2>

              <p className="max-w-3xl text-sm leading-7 text-texto-largo">
                La cuenta se creará inicialmente como borrador. Podrás
                completar su información y solicitar publicación desde
                Mi Ecosistema.
              </p>
            </div>

            <div className="mt-7 grid gap-6 md:grid-cols-2">
              <Field
                id="account-name"
                label={
                  selectedOption.accountLabel
                }
              >
                <input
                  id="account-name"
                  type="text"
                  value={
                    accountName
                  }
                  onChange={(
                    event
                  ) =>
                    setAccountName(
                      event.target.value
                    )
                  }
                  placeholder={
                    selectedOption.accountPlaceholder
                  }
                  required
                  className={
                    inputClassName
                  }
                />
              </Field>

              <Field
                id="register-email"
                label="Correo electrónico de acceso"
              >
                <input
                  id="register-email"
                  type="email"
                  value={email}
                  onChange={(
                    event
                  ) =>
                    setEmail(
                      event.target.value
                    )
                  }
                  placeholder="correo@ejemplo.com"
                  autoComplete="email"
                  required
                  className={
                    inputClassName
                  }
                />
              </Field>

              <Field
                id="register-password"
                label="Contraseña"
              >
                <input
                  id="register-password"
                  type="password"
                  value={password}
                  onChange={(
                    event
                  ) =>
                    setPassword(
                      event.target.value
                    )
                  }
                  placeholder="Mínimo 8 caracteres"
                  autoComplete="new-password"
                  required
                  className={
                    inputClassName
                  }
                />
              </Field>

              <Field
                id="confirm-password"
                label="Confirmar contraseña"
              >
                <input
                  id="confirm-password"
                  type="password"
                  value={
                    confirmPassword
                  }
                  onChange={(
                    event
                  ) =>
                    setConfirmPassword(
                      event.target.value
                    )
                  }
                  placeholder="Repite la contraseña"
                  autoComplete="new-password"
                  required
                  className={
                    inputClassName
                  }
                />
              </Field>
            </div>

            {errorMessage ? (
              <div className="mt-6 border border-rojo-base bg-rojo-base px-5 py-4 text-sm leading-6 text-hueso">
                {errorMessage}
              </div>
            ) : null}

            <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="max-w-xl text-xs leading-5 text-texto-largo">
                Después del registro podrás completar perfil,
                descripción, ubicación, imágenes, capacidades,
                intereses y demás información correspondiente al tipo
                de cuenta.
              </p>

              <button
                type="submit"
                disabled={
                  isLoading
                }
                className="border border-borde bg-rojo-base px-8 py-4 font-bold text-hueso transition hover:shadow-stencil disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isLoading
                  ? 'Creando cuenta...'
                  : 'Crear cuenta'}
              </button>
            </div>
          </section>
        </form>

        <p className="mt-8 text-center text-sm text-texto-largo">
          ¿Ya tienes una cuenta?{' '}
          <Link
            href={`/login?redirect=${encodeURIComponent(safeRedirect)}`}
            className="font-semibold transition hover:text-texto-principal"
          >
            Inicia sesión
          </Link>
        </p>
      </div>
    </main>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={null}>
      <RegisterContent />
    </Suspense>
  );
}

interface FieldProps {
  id: string;
  label: string;
  children:
    React.ReactNode;
}

function Field({
  id,
  label,
  children,
}: FieldProps) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-2 block text-sm font-medium text-texto-largo"
      >
        {label}
      </label>

      {children}
    </div>
  );
}

const inputClassName =
  'w-full border border-borde bg-superficie px-5 py-4 text-texto-largo outline-none transition placeholder:text-texto-largo/60 focus:border-acento';
