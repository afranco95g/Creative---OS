'use client';
import { BookOpen, FileText, Gauge, MessageCircle, Target } from 'lucide-react';
import type { Section } from '@/lib/data';

const items = [
  { id: 'chat', icon: MessageCircle },
  { id: 'proyecto', icon: Target },
  { id: 'bitacora', icon: BookOpen },
  { id: 'documentos', icon: FileText },
  { id: 'ipp', icon: Gauge }
] as const;

export function MobileNav({ active, onChange }: { active: Section; onChange: (section: Section) => void }) {
  return (
    <div className="fixed bottom-4 left-4 right-4 z-40 flex items-center justify-between rounded-3xl border border-white/10 bg-black/85 p-2 backdrop-blur md:hidden">
      {items.map(({ id, icon: Icon }) => (
        <button key={id} onClick={() => onChange(id)} className={`rounded-2xl p-3 ${active === id ? 'bg-acid text-black' : 'text-white/70'}`}>
          <Icon size={20} />
        </button>
      ))}
    </div>
  );
}
