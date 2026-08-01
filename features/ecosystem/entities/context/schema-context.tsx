'use client';

import {
  createContext,
  useContext,
} from 'react';

import type { ReactNode } from 'react';

import type { EntityKey } from '../types/entity-key';
import type { SchemaDefinition } from '../types/schema-definition';

import { schemaRegistry } from '../services/schema-registry';

interface SchemaContextValue {
  entity: EntityKey;

  schema: SchemaDefinition;
}

const SchemaContext =
  createContext<
    SchemaContextValue | undefined
  >(undefined);

interface SchemaProviderProps {
  entity: EntityKey;

  children: ReactNode;
}

export function SchemaProvider({
  entity,
  children,
}: SchemaProviderProps) {
  const schema =
    schemaRegistry.get(entity);

  if (!schema) {
    throw new Error(
      `No existe un Schema registrado para la entidad "${entity}".`
    );
  }

  return (
    <SchemaContext.Provider
      value={{
        entity,
        schema,
      }}
    >
      {children}
    </SchemaContext.Provider>
  );
}

export function useSchema():
  SchemaContextValue {
  const context =
    useContext(SchemaContext);

  if (!context) {
    throw new Error(
      'useSchema debe usarse dentro de un SchemaProvider.'
    );
  }

  return context;
}