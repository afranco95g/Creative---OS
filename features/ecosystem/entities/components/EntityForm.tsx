'use client';

import {
  useEffect,
  useState,
} from 'react';

import { useSchema } from '../context';

import { fieldResolver } from '../services/field-resolver';

import type { ResolvedField } from '../types/resolved-field';

import { FieldRenderer } from './fields/FieldRenderer';

interface EntityFormProps {
  initialValues?: Record<
    string,
    unknown
  >;

  onSubmit?: (
    values: Record<string, unknown>
  ) => void;
}

export function EntityForm({
  initialValues = {},
  onSubmit,
}: EntityFormProps) {
  const { schema } = useSchema();

  const fields =
    fieldResolver.resolve(schema);

  const [values, setValues] =
    useState<Record<string, unknown>>(
      initialValues
    );

  useEffect(() => {
    setValues(initialValues);
  }, [
    initialValues,
    schema.entity,
  ]);

  function handleChange(
    key: string,
    value: unknown
  ) {
    setValues((previous) => ({
      ...previous,
      [key]: value,
    }));
  }

  function handleSubmit(
    event:
      React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    onSubmit?.(values);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6"
    >
      {fields.map(
  (
    field: ResolvedField
  ) => (
    <FieldRenderer
      key={field.config.key}
      resolvedField={field}
      value={
        values[
          field.config.key
        ]
      }
      onChange={handleChange}
    />
  )
)}

      <button
        type="submit"
        className={[
          'rounded-md',
          'bg-primary',
          'px-4',
          'py-2',
          'text-primary-foreground',
        ].join(' ')}
      >
        Guardar
      </button>
    </form>
  );
}