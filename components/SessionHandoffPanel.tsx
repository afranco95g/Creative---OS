'use client';

import { FormEvent, useMemo, useState } from 'react';
import { ContextDestination } from '../types/contextBridge';

export interface SessionHandoffFormValue {
  objective: string;
  primaryQuestion: string;
  expectedOutput: string;
  destination: ContextDestination;
  constraints: string[];
  successCriteria: string[];
  nextSprint: string;
}

interface SessionHandoffPanelProps {
  canExport: boolean;
  onExportMarkdown: (
    value: SessionHandoffFormValue
  ) => void;
  onExportJson: (
    value: SessionHandoffFormValue
  ) => void;
}

const DESTINATIONS: {
  id: ContextDestination;
  label: string;
}[] = [
  {
    id: 'external-ai',
    label: 'Inteligencia externa',
  },
  {
    id: 'human',
    label: 'Otra persona',
  },
  {
    id: 'team',
    label: 'Equipo',
  },
  {
    id: 'workspace',
    label: 'Otro Workspace',
  },
  {
    id: 'review',
    label: 'Revisión externa',
  },
  {
    id: 'api',
    label: 'API o integración',
  },
  {
    id: 'other',
    label: 'Otro destino',
  },
];

export function SessionHandoffPanel({
  canExport,
  onExportMarkdown,
  onExportJson,
}: SessionHandoffPanelProps) {
  const [objective, setObjective] = useState('');
  const [primaryQuestion, setPrimaryQuestion] =
    useState('');
  const [expectedOutput, setExpectedOutput] =
    useState('');
  const [destination, setDestination] =
    useState<ContextDestination>('external-ai');
  const [constraints, setConstraints] = useState('');
  const [successCriteria, setSuccessCriteria] =
    useState('');
  const [nextSprint, setNextSprint] = useState('');

  const normalizedQuestion =
    primaryQuestion.trim().toLowerCase();

  const normalizedOutput =
    expectedOutput.trim().toLowerCase();

  const repeatedContent =
    Boolean(normalizedQuestion) &&
    normalizedQuestion === normalizedOutput;

  const formIsValid = useMemo(() => {
    return Boolean(
      canExport &&
        objective.trim() &&
        primaryQuestion.trim() &&
        expectedOutput.trim() &&
        !repeatedContent
    );
  }, [
    canExport,
    objective,
    primaryQuestion,
    expectedOutput,
    repeatedContent,
  ]);

  function buildValue(): SessionHandoffFormValue {
    return {
      objective: objective.trim(),
      primaryQuestion: primaryQuestion.trim(),
      expectedOutput: expectedOutput.trim(),
      destination,
      constraints: splitLines(constraints),
      successCriteria: splitLines(successCriteria),
      nextSprint: nextSprint.trim(),
    };
  }

  function handleMarkdownSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!formIsValid) return;

    onExportMarkdown(buildValue());
  }

  function handleJsonExport() {
    if (!formIsValid) return;

    onExportJson(buildValue());
  }

  return (
    <section className="rounded-3xl border border-[#232323] bg-[#101010] p-7">
      <p className="text-xs uppercase tracking-[0.2em] text-[#767676]">
        Session Handoff
      </p>

      <h2 className="mt-3 text-2xl font-semibold text-white">
        Preparar continuidad
      </h2>

      <p className="mt-3 max-w-3xl text-sm leading-relaxed text-[#A6A6A6]">
        Define qué debe entender la siguiente persona,
        equipo o inteligencia antes de continuar el
        proyecto.
      </p>

      <form
        onSubmit={handleMarkdownSubmit}
        className="mt-7 space-y-5"
      >
        <Field
          label="Objetivo de continuidad"
          value={objective}
          onChange={setObjective}
          placeholder="Ejemplo: definir la estructura inicial del magazine informativo."
          required
        />

        <Field
          label="Pregunta principal"
          value={primaryQuestion}
          onChange={setPrimaryQuestion}
          placeholder="Ejemplo: ¿qué necesita este proyecto para convertirse en un medio cultural viable?"
          required
        />

        <Field
          label="Resultado esperado"
          value={expectedOutput}
          onChange={setExpectedOutput}
          placeholder="Ejemplo: una primera propuesta editorial, operativa y económica."
          required
        />

        {repeatedContent && (
          <div className="rounded-2xl border border-[#5B321D] bg-[#21130D] px-5 py-4">
            <p className="text-sm font-semibold text-[#FFB68A]">
              La pregunta principal y el resultado esperado
              no pueden ser iguales.
            </p>

            <p className="mt-2 text-xs leading-relaxed text-[#C98D6C]">
              La pregunta explica qué necesitas resolver. El
              resultado esperado describe qué debe producir
              la siguiente sesión.
            </p>
          </div>
        )}

        <label className="block">
          <span className="mb-2 block text-xs uppercase tracking-[0.18em] text-[#767676]">
            Destino
          </span>

          <select
            value={destination}
            onChange={(event) =>
              setDestination(
                event.target.value as ContextDestination
              )
            }
            className="w-full rounded-2xl border border-[#232323] bg-[#151515] px-5 py-4 text-sm text-white outline-none transition focus:border-[#D9FF00]"
          >
            {DESTINATIONS.map((item) => (
              <option
                key={item.id}
                value={item.id}
              >
                {item.label}
              </option>
            ))}
          </select>
        </label>

        <TextAreaField
          label="Restricciones"
          value={constraints}
          onChange={setConstraints}
          placeholder={
            'Escribe una por línea.\nEjemplo: no asumir financiación confirmada.'
          }
        />

        <TextAreaField
          label="Criterios de éxito"
          value={successCriteria}
          onChange={setSuccessCriteria}
          placeholder={
            'Escribe uno por línea.\nEjemplo: identificar fuentes de ingreso.'
          }
        />

        <Field
          label="Siguiente sprint"
          value={nextSprint}
          onChange={setNextSprint}
          placeholder="Ejemplo: construir el primer modelo económico."
          required={false}
        />

        <div className="flex flex-wrap gap-3 pt-2">
          <button
            type="submit"
            disabled={!formIsValid}
            className="rounded-full bg-[#D9FF00] px-5 py-2.5 text-sm font-bold text-black transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            Exportar handoff en Markdown
          </button>

          <button
            type="button"
            onClick={handleJsonExport}
            disabled={!formIsValid}
            className="rounded-full border border-[#333333] bg-[#151515] px-5 py-2.5 text-sm font-semibold text-white transition hover:border-[#D9FF00] disabled:cursor-not-allowed disabled:opacity-40"
          >
            Exportar handoff en JSON
          </button>
        </div>

        {!formIsValid && !repeatedContent && (
          <p className="text-xs text-[#767676]">
            Completa los tres campos marcados como
            obligatorios para activar la exportación.
          </p>
        )}
      </form>
    </section>
  );
}

interface FieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  required?: boolean;
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  required = true,
}: FieldProps) {
  return (
    <label className="block">
      <span className="mb-2 flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-[#767676]">
        {label}

        <span className="normal-case tracking-normal text-[#555555]">
          {required ? 'Obligatorio' : 'Opcional'}
        </span>
      </span>

      <input
        value={value}
        required={required}
        onChange={(event) =>
          onChange(event.target.value)
        }
        placeholder={placeholder}
        className="w-full rounded-2xl border border-[#232323] bg-[#151515] px-5 py-4 text-sm text-white outline-none transition placeholder:text-[#5F5F5F] focus:border-[#D9FF00]"
      />
    </label>
  );
}

interface TextAreaFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}

function TextAreaField({
  label,
  value,
  onChange,
  placeholder,
}: TextAreaFieldProps) {
  return (
    <label className="block">
      <span className="mb-2 flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-[#767676]">
        {label}

        <span className="normal-case tracking-normal text-[#555555]">
          Opcional
        </span>
      </span>

      <textarea
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        placeholder={placeholder}
        className="min-h-[110px] w-full resize-none rounded-2xl border border-[#232323] bg-[#151515] px-5 py-4 text-sm leading-relaxed text-white outline-none transition placeholder:text-[#5F5F5F] focus:border-[#D9FF00]"
      />
    </label>
  );
}

function splitLines(value: string): string[] {
  return value
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean);
}