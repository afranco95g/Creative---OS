import { redirect } from 'next/navigation';
import { AdminSectionHeader } from '@/components/admin/AdminSectionHeader';
import { MasterCalendar } from '@/components/admin/MasterCalendar';
import { canAccessWorkspace } from '@/services/auth/workspace';
import { createClient } from '@/lib/supabase/server';
export default async function CalendarPage(){const access=await canAccessWorkspace();if(!access.authenticated)redirect('/login?redirect=/admin/calendario');if(!access.capabilities?.canManageEcosystem)redirect('/acceso-denegado');const db=await createClient();const{data:projects}=await db.from('projects').select('id,title').order('updated_at',{ascending:false});return <main className="min-h-screen bg-[#050505] text-white"><AdminSectionHeader eyebrow="Programación" title="Calendario maestro" description="Experiencias, hitos compartidos y fechas editoriales en una sola vista operativa."/><section className="mx-auto max-w-7xl px-5 py-10 md:px-8"><MasterCalendar projects={projects??[]}/></section></main>}
