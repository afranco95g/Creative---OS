import Link from 'next/link';
export function EditorialCmsNav() {
  return <nav className="flex flex-wrap gap-2 border-b border-white/10 px-6 py-4 text-sm">
    {[['Resumen','/admin'],['Publicaciones','/admin/stories'],['Nueva','/admin/stories/new'],['Portada','/admin/homepage'],['Multimedia','/admin/media'],['Proyectos propuestos','/revision-editorial']].map(([label,href]) =>
      <Link key={href} href={href} className="rounded-md px-3 py-2 text-neutral-300 hover:bg-white/10 hover:text-white">{label}</Link>)}
  </nav>;
}
