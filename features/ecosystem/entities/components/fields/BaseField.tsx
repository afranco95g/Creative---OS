import type { ReactNode } from 'react';

import type { EntityFieldConfig } from '../../types/entity-config';

interface BaseFieldProps {
  field: EntityFieldConfig;

  children: ReactNode;

  error?: string;
}

export function BaseField({
  field,
  children,
  error,
}: BaseFieldProps) {
  const inputId = `field-${field.key}`;

  return (
    <div className="space-y-2">
      <label
        htmlFor={inputId}
        className="block text-sm font-medium"
      >
        {field.label}

        {field.required && (
          <span
            className="ml-1 text-red-500"
            aria-hidden="true"
          >
            *
          </span>
        )}
      </label>

      {children}

      {field.helperText && !error && (
        <p className="text-sm text-muted-foreground">
          {field.helperText}
        </p>
      )}

      {error && (
        <p
          role="alert"
          className="text-sm text-red-600"
        >
          {error}
        </p>
      )}
    </div>
  );
}