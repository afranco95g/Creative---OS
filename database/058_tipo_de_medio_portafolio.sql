-- ============================================================
-- CULTURA ESTA (EL CULEBREO)
-- Migración 058
-- Tipo de medio explícito en portfolio_items, para la Vitrina
-- Pública Adaptada por Rol (reproductor de audio, visor de
-- documentos, etc.) — hoy portfolio_items solo guarda URLs sin
-- decir si son foto, video, audio o documento.
-- Ver claude/EL CULEBREO - Diseño UX y Componentes, Wizard +
-- Vacantes + Vitrina por Rol (versión Claude), sección 3.1.
-- ============================================================

begin;

alter table public.portfolio_items
  add column if not exists media_type text not null default 'image'
    check (media_type in ('image', 'video', 'audio', 'document'));

comment on column public.portfolio_items.media_type is
  'Tipo de los archivos en media_urls para este ítem: image, video, audio o document. Un ítem es homogéneo (todas sus URLs son del mismo tipo) — una galería de fotos es un ítem "image" con varias URLs, no se mezclan tipos dentro de un mismo ítem.';

-- Amplía el bucket de Storage para permitir audio y PDF, que hoy
-- no están en la lista de tipos permitidos (solo imagen y video).
update storage.buckets
set allowed_mime_types = array[
  'image/jpeg', 'image/png', 'image/webp',
  'video/mp4', 'video/quicktime',
  'audio/mpeg', 'audio/mp4', 'audio/wav',
  'application/pdf'
]
where id = 'portfolio-media';

commit;
