-- Extiende el Knowledge Engine existente para colecciones, trazabilidad e ingesta incremental.
begin;

alter table public.knowledge_sources add column if not exists collection_id text not null default 'creative_os_general_library';
alter table public.knowledge_sources add column if not exists collection_ids text[] not null default array['creative_os_general_library']::text[];
alter table public.knowledge_sources add column if not exists file_name text;
alter table public.knowledge_sources add column if not exists file_size bigint not null default 0;
alter table public.knowledge_sources add column if not exists page_count integer;
alter table public.knowledge_sources add column if not exists document_type text;
alter table public.knowledge_sources add column if not exists processing_status text not null default 'metadata_registered';
alter table public.knowledge_sources add column if not exists processing_error text;
alter table public.knowledge_sources add column if not exists indexed_at timestamptz;
alter table public.knowledge_sources add column if not exists metadata jsonb not null default '{}'::jsonb;
alter table public.knowledge_sources drop constraint if exists knowledge_sources_status_check;
alter table public.knowledge_sources add constraint knowledge_sources_status_check check(status in('active','processing','error','inactive','missing'));
alter table public.knowledge_sources add constraint knowledge_sources_processing_status_check check(processing_status in('discovered','metadata_registered','parsed','chunked','indexed','failed','skipped_duplicate'));

alter table public.knowledge_chunks add column if not exists collection_id text not null default 'creative_os_general_library';
alter table public.knowledge_chunks add column if not exists heading_path text[] not null default '{}';
alter table public.knowledge_chunks add column if not exists section_title text;
alter table public.knowledge_chunks add column if not exists page_start integer;
alter table public.knowledge_chunks add column if not exists page_end integer;
alter table public.knowledge_chunks add column if not exists reasoning_modes text[] not null default '{}';
alter table public.knowledge_chunks add column if not exists decision_contexts text[] not null default '{}';
alter table public.knowledge_chunks add column if not exists language text not null default 'es';
alter table public.knowledge_chunks add column if not exists checksum text;
alter table public.knowledge_chunks add column if not exists case_data jsonb;

create index if not exists knowledge_sources_collections_idx on public.knowledge_sources using gin(collection_ids);
create index if not exists knowledge_chunks_collection_idx on public.knowledge_chunks(collection_id);
create index if not exists knowledge_chunks_reasoning_modes_idx on public.knowledge_chunks using gin(reasoning_modes);
create unique index if not exists knowledge_chunks_source_checksum_idx on public.knowledge_chunks(source_id,checksum) where checksum is not null;

create table if not exists public.knowledge_ingestion_logs (
  id uuid primary key default gen_random_uuid(),
  file text not null,
  checksum text,
  result text not null check(result in('discovered','metadata_registered','parsed','chunked','indexed','failed','skipped_duplicate')),
  chunks integer not null default 0,
  replaced_chunks integer not null default 0,
  pages integer not null default 0,
  duration_ms integer,
  message text,
  created_at timestamptz not null default now()
);

alter table public.knowledge_ingestion_logs enable row level security;
-- La escritura de ingesta se realiza exclusivamente con service role desde scripts administrativos.

comment on column public.knowledge_sources.collection_ids is 'Una fuente canónica puede pertenecer a varias colecciones sin duplicar chunks.';
comment on column public.knowledge_chunks.case_data is 'Representación parcial de caso; solo contiene campos documentados y revisables.';
comment on table public.knowledge_ingestion_logs is 'Trazabilidad administrativa de procesos offline; no contiene documentos completos.';

commit;
