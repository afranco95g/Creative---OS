import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { canAccessWorkspace } from '@/services/auth/workspace';

export default async function StoriesLayout({ children }: { children: ReactNode }) {
  const access = await canAccessWorkspace();
  if (!access.authenticated) redirect('/login?redirect=/admin/stories');
  if (!access.authorized) redirect('/acceso-denegado');
  return children;
}
