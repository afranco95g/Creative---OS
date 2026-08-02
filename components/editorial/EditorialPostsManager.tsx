'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { listEditorialPosts } from '@/services/editorial/editorialCmsService';
import type { EditorialPost } from '@/types/editorial';

export function EditorialPostsManager() {
  const [posts,setPosts]=useState<EditorialPost[]>([]); const [error,setError]=useState('');
  useEffect(()=>{void listEditorialPosts().then(setPosts).catch(e=>setError(e instanceof Error?e.message:'No fue posible cargar.'));},[]);
  const count=(status:string)=>posts.filter(p=>p.status===status).length;
  return <main className="min-h-screen bg-[#050505] text-white">
    <div className="mx-auto max-w-7xl px-6 py-12">
      <div className="flex flex-wrap items-end justify-between gap-6"><div><p className="text-xs font-bold uppercase text-[#D9FF00]">CMS editorial</p><h1 className="mt-3 text-4xl font-bold">Publicaciones</h1></div><Link href="/admin/stories/new" className="rounded-md bg-[#D9FF00] px-5 py-3 font-bold text-black">Nueva publicación</Link></div>
      <div className="mt-8 grid gap-3 sm:grid-cols-4">{[['Borradores',count('draft')],['En revisión',count('in_review')],['Programados',count('scheduled')],['Publicados',count('published')]].map(([l,v])=><div key={l} className="border border-white/10 bg-[#0A0A0A] p-4"><strong className="text-2xl text-[#D9FF00]">{v}</strong><p className="mt-1 text-xs text-neutral-500">{l}</p></div>)}</div>
      {error?<p className="mt-6 bg-red-500/10 p-4 text-red-200">{error}</p>:null}
      <div className="mt-8 divide-y divide-white/10 border border-white/10">{posts.map(post=><article key={post.id} className="grid gap-4 p-5 md:grid-cols-[1fr_140px_150px] md:items-center"><div><p className="text-xs uppercase text-neutral-500">{post.category||post.postType}</p><h2 className="mt-1 text-xl font-semibold">{post.title||'Sin título'}</h2><p className="mt-2 line-clamp-1 text-sm text-neutral-500">{post.excerpt}</p></div><span className="text-sm capitalize text-neutral-400">{post.status.replace('_',' ')}</span><div className="flex gap-3"><Link href={`/admin/stories/${post.id}`} className="font-semibold text-[#D9FF00]">Editar</Link>{post.status==='published'?<Link href={`/medio/${post.slug}`} className="text-neutral-300">Ver</Link>:<Link href={`/admin/stories/${post.id}/preview`} className="text-neutral-300">Preview</Link>}</div></article>)}</div>
    </div>
  </main>;
}
