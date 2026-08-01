import type { ComponentType } from 'react';

import type {
  EntityFieldConfig,
  EntityFieldType,
} from './entity-config';

export interface FieldRendererProps {
  field: EntityFieldConfig;

  value?: unknown;

  disabled?: boolean;

  error?: string;

  onChange?: (
    key: string,
    value: unknown
  ) => void;
}

export interface FieldDefinition {
  /**
   * Tipo de campo que registra la definición.
   */
  type: EntityFieldType;

  /**
   * Componente encargado de renderizar el campo.
   */
  component: ComponentType<FieldRendererProps>;

  /**
   * Propiedades adicionales que el registro
   * enviará automáticamente al componente.
   *
   * Ejemplo:
   *
   * {
   *   inputType: 'email'
   * }
   */
  componentProps?: Record<string, unknown>;

  /**
   * Convierte el valor del formulario
   * al formato utilizado para persistencia.
   */
  serialize(
    value: unknown,
    field: EntityFieldConfig
  ): unknown;

  /**
   * Convierte el valor persistido
   * al formato utilizado por el formulario.
   */
  deserialize(
    value: unknown,
    field: EntityFieldConfig
  ): unknown;

  /**
   * Genera una representación legible
   * para tablas y vistas de detalle.
   */
  format(
    value: unknown,
    field: EntityFieldConfig
  ): string;

  /**
   * Valida un valor.
   *
   * Devuelve un mensaje cuando existe
   * un error y undefined cuando es válido.
   */
  validate(
    value: unknown,
    field: EntityFieldConfig
  ): string | undefined;
}