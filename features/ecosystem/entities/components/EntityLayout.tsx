'use client';

import type { ReactNode } from 'react';

import type { EntityKey } from '../types/entity-key';

import { SchemaProvider } from '../context';

interface EntityLayoutProps {
  entity: EntityKey;

  children: ReactNode;
}

export function EntityLayout({
  entity,
  children,
}: EntityLayoutProps) {
  return (
    <SchemaProvider entity={entity}>
      {children}
    </SchemaProvider>
  );
}