import type {
  Metadata,
} from 'next';

import type {
  ReactNode,
} from 'react';

import {
  WorkspaceAuthBridge,
} from '../components/workspace/WorkspaceAuthBridge';

import './globals.css';

export const metadata: Metadata = {
  title: {
    default:
      'Cultura Esta',

    template:
      '%s | Cultura Esta',
  },

  description:
    'Medio cultural y ecosistema creativo conectado a Creative OS.',
};

interface RootLayoutProps {
  children: ReactNode;
}

export default function RootLayout({
  children,
}: RootLayoutProps) {
  return (
    <html lang="es">
      <body>
        <WorkspaceAuthBridge>
          {children}
        </WorkspaceAuthBridge>
      </body>
    </html>
  );
}