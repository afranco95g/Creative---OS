import type { ReactNode } from 'react';

interface StudioLayoutProps {
  children: ReactNode;
}

export default function StudioLayout({
  children,
}: StudioLayoutProps) {
  return (
    <div className="min-h-screen bg-[#050505] text-white">
      {children}
    </div>
  );
}