'use client';

import type { ResolvedField } from '../../types/resolved-field';

interface FieldRendererProps {
  resolvedField: ResolvedField;

  value: unknown;

  disabled?: boolean;

  error?: string;

  onChange: (
    key: string,
    value: unknown
  ) => void;
}

export function FieldRenderer({
  resolvedField,
  value,
  disabled = false,
  error,
  onChange,
}: FieldRendererProps) {
  const {
    config,
    definition,
  } = resolvedField;

  const Component =
    definition.component;

  return (
    <Component
      {...definition.componentProps}
      field={config}
      value={value}
      disabled={disabled}
      error={error}
      onChange={(nextValue: unknown) => {
        onChange(
          config.key,
          nextValue
        );
      }}
    />
  );
}