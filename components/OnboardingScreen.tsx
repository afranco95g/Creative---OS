'use client';

import { FormEvent, useState } from 'react';

interface OnboardingScreenProps {
  onComplete: (
    name: string,
    email: string,
    organization?: string,
    creativeFocus?: string
  ) => void;
}

export function OnboardingScreen({
  onComplete,
}: OnboardingScreenProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [creativeFocus, setCreativeFocus] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [organization, setOrganization] = useState('');

  function handleCreativeFocusSubmit(event: FormEvent) {
    event.preventDefault();

    if (!creativeFocus.trim()) return;

    setStep(2);
  }

  function handleProfileSubmit(event: FormEvent) {
    event.preventDefault();

    if (!name.trim() || !email.trim()) return;

    onComplete(
      name.trim(),
      email.trim(),
      organization.trim() || undefined,
      creativeFocus.trim()
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-superficie px-6 py-12 text-texto-largo">
      <section className="w-full max-w-3xl">
        <p className="mb-5 text-sm font-bold uppercase tracking-[0.28em] text-texto-principal">
          Creative OS
        </p>

        {step === 1 ? (
          <form onSubmit={handleCreativeFocusSubmit}>
            <p className="text-sm uppercase tracking-[0.2em] text-texto-largo">
              Bienvenido a tu estudio
            </p>

            <h1 className="mt-5 text-6xl font-semibold tracking-tight">
              Antes de crear proyectos, quiero entender cómo piensas.
            </h1>

            <p className="mt-6 max-w-2xl text-xl leading-relaxed text-texto-largo">
              Cuéntame qué tipo de cosas disfrutas construir. No necesitas
              elegir una categoría ni escribir de forma técnica.
            </p>

            <textarea
              value={creativeFocus}
              onChange={(event) => setCreativeFocus(event.target.value)}
              placeholder="Por ejemplo: experiencias culturales, películas, marcas, productos, eventos, proyectos sociales..."
              className="mt-10 min-h-[180px] w-full resize-none rounded-3xl border border-borde bg-superficie-elevada p-6 text-lg leading-relaxed text-texto-largo outline-none transition placeholder:text-texto-largo focus:border-acento"
            />

            <div className="mt-6 flex justify-end">
              <button
                type="submit"
                disabled={!creativeFocus.trim()}
                className="rounded-full bg-rojo-base px-7 py-3 text-sm font-bold text-hueso transition hover:shadow-stencil disabled:cursor-not-allowed disabled:opacity-40"
              >
                Continuar
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleProfileSubmit}>
            <button
              type="button"
              onClick={() => setStep(1)}
              className="mb-8 text-sm text-texto-largo transition hover:text-texto-largo"
            >
              ← Volver
            </button>

            <p className="text-sm uppercase tracking-[0.2em] text-texto-largo">
              Configurar el estudio
            </p>

            <h1 className="mt-5 text-6xl font-semibold tracking-tight">
              Ahora sí, ¿cómo quieres que te llame?
            </h1>

            <p className="mt-6 max-w-2xl text-xl leading-relaxed text-texto-largo">
              Estos datos nos permiten crear tu espacio de producción.
            </p>

            <div className="mt-10 space-y-5">
              <Field
                label="Nombre"
                value={name}
                onChange={setName}
                placeholder="Andrés Franco"
                required
              />

              <Field
                label="Correo"
                value={email}
                onChange={setEmail}
                placeholder="andres@estudio.com"
                type="email"
                required
              />

              <Field
                label="Organización o estudio"
                value={organization}
                onChange={setOrganization}
                placeholder="Opcional"
              />
            </div>

            <div className="mt-8 flex justify-end">
              <button
                type="submit"
                disabled={!name.trim() || !email.trim()}
                className="rounded-full bg-rojo-base px-7 py-3 text-sm font-bold text-hueso transition hover:shadow-stencil disabled:cursor-not-allowed disabled:opacity-40"
              >
                Abrir mi estudio
              </button>
            </div>
          </form>
        )}
      </section>
    </main>
  );
}

interface FieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  type?: string;
  required?: boolean;
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  required = false,
}: FieldProps) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs uppercase tracking-[0.18em] text-texto-largo">
        {label}
      </span>

      <input
        type={type}
        required={required}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-borde bg-superficie-elevada px-5 py-4 text-base text-texto-largo outline-none transition placeholder:text-texto-largo focus:border-acento"
      />
    </label>
  );
}