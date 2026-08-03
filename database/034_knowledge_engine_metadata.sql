-- Knowledge Engine autocontenido e idempotente. Puede ejecutarse aunque 032 no haya sido aplicada.
begin;
create schema if not exists extensions;
create extension if not exists vector with schema extensions;

create table if not exists public.knowledge_sources (
  id uuid primary key default gen_random_uuid(), title text not null, institution text not null default 'Creative OS',
  author text, publication_date date, year integer, language text not null default 'es', topic text not null default 'Creative OS',
  subcategory text[] not null default '{}', jurisdiction text not null default 'global', source_type text not null default 'local',
  license text not null default 'Uso interno pendiente de revisión', source text, canonical_url text not null,
  file text, checksum text, retrieved_at timestamptz not null default now(), version text not null default 'knowledge-engine-1',
  status text not null default 'active' check(status in('active','processing','error','inactive')),
  is_active boolean not null default true, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique(canonical_url,version)
);
create unique index if not exists knowledge_sources_file_checksum_idx on public.knowledge_sources(file,checksum) where file is not null;

create table if not exists public.knowledge_chunks (
  id uuid primary key default gen_random_uuid(), source_id uuid not null references public.knowledge_sources(id) on delete cascade,
  heading text not null default 'Documento', section text, page integer, content text not null, tokens integer not null default 0,
  embedding extensions.vector(1536), topic_tags text[] not null default '{}', keywords text[] not null default '{}',
  project_types text[] not null default '{}', project_stages text[] not null default '{}', jurisdictions text[] not null default '{}'
);
create index if not exists knowledge_chunks_keywords_idx on public.knowledge_chunks using gin(keywords);
create index if not exists knowledge_chunks_topics_idx on public.knowledge_chunks using gin(topic_tags);

create table if not exists public.knowledge_retrieval_logs (
  id uuid primary key default gen_random_uuid(), provider text not null default 'local_library', query text not null,
  topic text, source_ids text[] not null default '{}', chunk_ids text[] not null default '{}', used_document_ids text[] not null default '{}',
  project_id uuid references public.projects(id) on delete set null, purpose text not null, elapsed_ms integer,
  created_at timestamptz not null default now()
);

-- Compatibilidad con instalaciones que ya tenían las tablas de 032.
alter table public.knowledge_sources add column if not exists year integer;
alter table public.knowledge_sources add column if not exists subcategory text[] not null default '{}';
alter table public.knowledge_sources add column if not exists file text;
alter table public.knowledge_sources add column if not exists checksum text;
alter table public.knowledge_sources add column if not exists status text not null default 'active';
alter table public.knowledge_sources add column if not exists source text;
alter table public.knowledge_sources add column if not exists created_at timestamptz not null default now();
alter table public.knowledge_sources add column if not exists updated_at timestamptz not null default now();
alter table public.knowledge_chunks add column if not exists section text;
alter table public.knowledge_chunks add column if not exists page integer;
alter table public.knowledge_chunks add column if not exists tokens integer not null default 0;
alter table public.knowledge_chunks add column if not exists keywords text[] not null default '{}';
alter table public.knowledge_retrieval_logs add column if not exists provider text not null default 'local_library';
alter table public.knowledge_retrieval_logs add column if not exists topic text;
alter table public.knowledge_retrieval_logs add column if not exists used_document_ids text[] not null default '{}';
alter table public.knowledge_retrieval_logs add column if not exists elapsed_ms integer;

alter table public.knowledge_sources enable row level security;
alter table public.knowledge_chunks enable row level security;
alter table public.knowledge_retrieval_logs enable row level security;
drop policy if exists "Authenticated users read active knowledge" on public.knowledge_sources;
create policy "Authenticated users read active knowledge" on public.knowledge_sources for select to authenticated using(is_active and status='active');
drop policy if exists "Authenticated users read knowledge chunks" on public.knowledge_chunks;
create policy "Authenticated users read knowledge chunks" on public.knowledge_chunks for select to authenticated using(exists(select 1 from public.knowledge_sources s where s.id=source_id and s.is_active and s.status='active'));
drop policy if exists "Owners create retrieval logs" on public.knowledge_retrieval_logs;
create policy "Owners create retrieval logs" on public.knowledge_retrieval_logs for insert to authenticated with check(project_id is null or exists(select 1 from public.projects p where p.id=project_id and p.owner_id=auth.uid()));
drop policy if exists "Owners read retrieval logs" on public.knowledge_retrieval_logs;
create policy "Owners read retrieval logs" on public.knowledge_retrieval_logs for select to authenticated using(project_id is null or exists(select 1 from public.projects p where p.id=project_id and p.owner_id=auth.uid()));
grant select on public.knowledge_sources,public.knowledge_chunks to authenticated;
grant select,insert on public.knowledge_retrieval_logs to authenticated;
commit;
