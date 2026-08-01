import type { HTMLInputTypeAttribute } from 'react';

import type { EntityFieldConfig } from '../../types/entity-config';

import { BaseField } from './BaseField';

interface InputFieldProps {
  field: EntityFieldConfig;

  inputType?: HTMLInputTypeAttribute;

  value?: unknown;

  disabled?: boolean;

  error?: string;

  onChange?: (
    key: string,
    value: unknown
  ) => void;
}

export function InputField({
  field,
  inputType = 'text',
  value,
  disabled,
  error,
  onChange,
}: InputFieldProps) {
  const inputId = `field-${field.key}`;
  const errorId = `${inputId}-error`;
  const helperTextId = `${inputId}-helper`;

  const describedBy = error
    ? errorId
    : field.helperText
      ? helperTextId
      : undefined;

  return (
    <BaseField
      field={field}
      error={error}
    >
      <input
        id={inputId}
        type={inputType}
        name={field.key}
        value={String(value ?? '')}
        disabled={disabled}
        required={field.required}
        placeholder={field.placeholder}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy}
        onChange={(event) =>
          onChange?.(
            field.key,
            event.target.value
          )
        }
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:cursor-not-allowed disabled:opacity-50"
      />
    </BaseField>
  );
}