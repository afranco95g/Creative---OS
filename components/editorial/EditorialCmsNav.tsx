import Link from 'next/link';
export function EditorialCmsNav() {
  return <nav className="flex flex-wrap gap-2 border-b border-borde/10 px-6 py-4 text-sm">
    {[['Resumen','/admin'],['Publicaciones','/admin/stories'],['Nueva','/admin/stories/new'],['Portada','/admin/homepage'],['Multimedia','/admin/media'],['Proyectos propuestos','/revision-editorial']].map(([label,href]) =>
      <Link key={href} href={href} className="rounded-md px-3 py-2 text-texto-largo hover:bg-borde/10 hover:text-texto-largo">{label}</Link>)}
  </nav>;
}
