import type { MetadataRoute } from 'next';
const siteUrl=process.env.NEXT_PUBLIC_SITE_URL||'https://creative-os-beta-cyan.vercel.app';
export default function robots():MetadataRoute.Robots{return{rules:[{userAgent:'*',allow:'/',disallow:['/admin/','/revision-editorial/','/revision-ecosistema/','/revision-actores/','/studio/','/workspace/','/mi-ecosistema/']}],sitemap:`${siteUrl}/sitemap.xml`,host:siteUrl}}
