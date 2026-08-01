import type { EntityFieldConfig } from '../../types/entity-config';

import { InputField } from './InputField';

interface TextFieldProps {
  field: EntityFieldConfig;

  value?: unknown;

  disabled?: boolean;

  onChange?: (
    key: string,
    value: unknown
  ) => void;
}

export function TextField({
  field,
  value,
  disabled,
  onChange,
}: TextFieldProps) {
  return (
    <InputField
      field={field}
      inputType="text"
      value={value}
      disabled={disabled}
      onChange={onChange}
    />
  );
}