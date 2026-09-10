import type { EditorialBodyBlock, EditorialPost } from '@/types/editorial';
import { SiteHeader } from './SiteHeader';
import { ShareButtons } from './ShareButtons';

export function EditorialArticle({ post, canonicalUrl }: { post: EditorialPost; canonicalUrl: string }) {
  return <main className="min-h-screen bg-superficie text-texto-largo">
    <SiteHeader backHref="/" backLabel="El Culebreo" />
    <article>
    <header className="mx-auto max-w-5xl px-6 pb-12 pt-10">
      <p className="mt-12 text-xs font-bold uppercase tracking-[0.2em] text-texto-principal">{post.category || post.postType}</p>
      {post.isSponsored ? <p className="mt-4 inline-flex border border-borde px-3 py-1 text-xs">{post.sponsorLabel || 'Contenido patrocinado'}</p> : null}
      <h1 className="stencil-heading mt-5 text-5xl font-bold leading-[0.98] sm:text-7xl">{post.title}</h1>
      <p className="mt-7 max-w-3xl text-xl leading-8 text-texto-largo">{post.excerpt}</p>
      <div className="mt-8 flex flex-wrap gap-5 text-sm text-texto-largo"><span>Por {post.byline}</span><time dateTime={post.publishedAt ?? post.publishAt}>{new Date(post.publishedAt ?? post.publishAt).toLocaleDateString('es-CO')}</time></div>
    </header>
    {post.coverImageUrl ? <figure className="mx-auto max-w-7xl px-6"><img src={post.coverImageUrl} alt={post.coverImageAlt} className="max-h-[720px] w-full border border-borde object-cover"/><figcaption className="mt-3 text-xs text-texto-largo">{post.coverCaption} {post.credits}</figcaption></figure> : null}
    <div className="mx-auto grid max-w-5xl gap-10 px-6 py-14 lg:grid-cols-[1fr_220px]">
      <div className="space-y-7 text-lg leading-8 text-texto-largo">{post.bodyBlocks.map(renderBodyBlock)}</div>
      <aside className="[&_a]:block [&_a]:border-b [&_a]:border-borde [&_a]:py-2 [&_button]:my-1 [&_button]:w-full [&_button]:py-2"><ShareButtons title={post.shareTitle || post.title} url={canonicalUrl}/></aside>
    </div>
    {post.isSponsored && post.sponsorshipDisclosure ? <p className="mx-auto mb-14 max-w-5xl border-t border-borde px-6 pt-6 text-sm text-texto-largo">{post.sponsorshipDisclosure}</p> : null}
  </article></main>;
}

function renderBodyBlock(block: EditorialBodyBlock) {
  switch (block.type) {
    case 'paragraph': return <p key={block.id}>{block.text}</p>;
    case 'subtitle': return <h2 key={block.id} className="pt-5 text-3xl font-bold text-texto-principal">{block.text}</h2>;
    case 'quote': return <blockquote key={block.id} className="border-l-4 border-rojo-base pl-6 text-2xl text-texto-principal">{block.text}</blockquote>;
    case 'image': return <figure key={block.id}><img src={block.url} alt={block.alt} loading="lazy" className="w-full border border-borde"/><figcaption className="text-sm text-texto-largo">{block.caption}</figcaption></figure>;
    case 'list': return <ul key={block.id} className="list-disc space-y-2 pl-6">{block.items.map((item,index)=><li key={index}>{item}</li>)}</ul>;
    case 'video': {
      const uploadedVideo = /\.(mp4|webm)(?:\?|$)/i.test(block.url);
      return uploadedVideo
        ? <video key={block.id} src={block.url} controls preload="metadata" className="w-full border border-borde bg-tinta">Tu navegador no puede reproducir este video.</video>
        : <a key={block.id} href={block.url} target="_blank" rel="noreferrer" className="block border border-borde p-5 text-texto-principal">{block.label || 'Ver video'}</a>;
    }
    default: return <a key={block.id} href={block.url} className="inline-flex border border-borde bg-rojo-base px-5 py-3 font-bold text-hueso">{block.label}</a>;
  }
}
