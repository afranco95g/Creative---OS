import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export function AdminSectionHeader({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return (
    <header className="border-b border-borde/10">
      <div className="mx-auto max-w-7xl px-5 py-8 md:px-8">
        <Link href="/admin" className="inline-flex items-center gap-2 text-sm text-texto-largo hover:text-texto-largo"><ArrowLeft size={16} />Panel principal</Link>
        <p className="mt-8 text-xs font-bold uppercase tracking-[0.24em] text-texto-principal">{eyebrow}</p>
        <h1 className="mt-4 text-4xl font-bold md:text-5xl">{title}</h1>
        <p className="mt-4 max-w-3xl leading-7 text-texto-largo">{description}</p>
      </div>
    </header>
  );
}
