import type {
  Metadata,
} from 'next';

import type {
  ReactNode,
} from 'react';

import {
  WorkspaceAuthBridge,
} from '../components/workspace/WorkspaceAuthBridge';

import { themeInitScript } from '../lib/theme';

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
    <html lang="es" suppressHydrationWarning>
      <head>
        {/* Fija data-theme antes del primer paint: evita el flash de tema incorrecto. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(${themeInitScript.toString()})();`,
          }}
        />
      </head>
      <body>
        <WorkspaceAuthBridge>
          {children}
        </WorkspaceAuthBridge>
      </body>
    </html>
  );
}