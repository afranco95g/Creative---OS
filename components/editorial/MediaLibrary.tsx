'use client';

import { useEffect, useState } from 'react';
import { listEditorialMedia, uploadEditorialMedia } from '@/services/editorial/editorialCmsService';
import type { EditorialMediaAsset } from '@/types/editorial';

export function MediaLibrary() {
  const [assets, setAssets] = useState<EditorialMediaAsset[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [alt, setAlt] = useState('');
  const [credit, setCredit] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  function load() {
    return listEditorialMedia().then(setAssets).catch((error) => setMessage(error.message));
  }

  useEffect(() => { void load(); }, []);

  async function upload() {
    if (!file || (file.type.startsWith('image/') && !alt.trim())) {
      setMessage('Selecciona un archivo y añade texto alternativo a las imágenes.');
      return;
    }
    setLoading(true);
    try {
      await uploadEditorialMedia(file, { altText: alt, credit, description: '' });
      setFile(null); setAlt(''); setCredit(''); setMessage('Archivo cargado.');
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No fue posible subir.');
    } finally { setLoading(false); }
  }

  return <main className="min-h-screen bg-superficie text-texto-largo"><div className="mx-auto max-w-7xl px-6 py-10">
    <h1 className="text-4xl font-bold">Biblioteca multimedia</h1>
    <p className="mt-3 text-texto-largo">Imágenes JPG, PNG o WebP hasta 10 MB. Videos MP4 o WebM hasta 100 MB.</p>
    <div className="mt-8 grid gap-3 border border-borde/10 bg-superficie-elevada p-5 md:grid-cols-[1fr_1fr_1fr_auto]">
      <input type="file" accept="image/jpeg,image/png,image/webp,video/mp4,video/webm" onChange={(event) => setFile(event.target.files?.[0] ?? null)} />
      <input className="bg-superficie-elevada p-3" placeholder="Texto alternativo para imágenes" value={alt} onChange={(event) => setAlt(event.target.value)} />
      <input className="bg-superficie-elevada p-3" placeholder="Crédito" value={credit} onChange={(event) => setCredit(event.target.value)} />
      <button onClick={() => void upload()} disabled={loading} className="bg-rojo-base px-5 font-bold text-hueso">{loading ? 'Subiendo...' : 'Subir'}</button>
    </div>
    {message ? <p className="mt-4 text-sm text-texto-largo">{message}</p> : null}
    <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{assets.map((asset) => <article key={asset.id} className="border border-borde/10 bg-superficie-elevada p-3">
      {asset.mimeType.startsWith('video/') ? <video src={asset.publicUrl} controls preload="metadata" className="aspect-video w-full bg-superficie-elevada" /> : <img src={asset.publicUrl} alt={asset.altText} loading="lazy" className="aspect-video w-full object-cover" />}
      <p className="mt-3 truncate text-sm font-semibold">{asset.fileName}</p><p className="mt-1 text-xs text-texto-largo">{asset.altText || asset.mimeType}</p>
      <button onClick={() => void navigator.clipboard.writeText(asset.publicUrl).then(() => setMessage('URL copiada.'))} className="mt-3 text-xs text-texto-principal">Copiar URL</button>
    </article>)}</div>
  </div></main>;
}
