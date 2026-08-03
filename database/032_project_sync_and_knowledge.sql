begin;

create extension if not exists vector with schema extensions;

create table if not exists public.project_snapshots (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  client_updated_at timestamptz not null,
  graph jsonb not null,
  messages jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists project_snapshots_recovery_idx on public.project_snapshots(project_id, created_at desc);
alter table public.project_snapshots enable row level security;
create policy "Owners read project snapshots" on public.project_snapshots for select to authenticated using (owner_id = auth.uid());
create policy "Owners create project snapshots" on public.project_snapshots for insert to authenticated with check (
  owner_id = auth.uid() and exists (select 1 from public.projects p where p.id = project_id and p.owner_id = auth.uid())
);

create table if not exists public.knowledge_sources (
  id uuid primary key default gen_random_uuid(), title text not null, institution text not null,
  author text, publication_date date, language text not null default 'es', topic text not null,
  jurisdiction text not null default 'global', source_type text not null, license text not null,
  canonical_url text not null, retrieved_at timestamptz not null default now(), version text not null,
  is_active boolean not null default true, unique(canonical_url, version)
);
create table if not exists public.knowledge_chunks (
  id uuid primary key default gen_random_uuid(), source_id uuid not null references public.knowledge_sources(id) on delete cascade,
  heading text not null, content text not null, embedding extensions.vector(1536), topic_tags text[] not null default '{}',
  project_types text[] not null default '{}', project_stages text[] not null default '{}', jurisdictions text[] not null default '{}'
);
create table if not exists public.knowledge_retrieval_logs (
  id uuid primary key default gen_random_uuid(), query text not null, source_ids uuid[] not null default '{}',
  chunk_ids uuid[] not null default '{}', project_id uuid references public.projects(id) on delete set null,
  purpose text not null, created_at timestamptz not null default now()
);
alter table public.knowledge_sources enable row level security;
alter table public.knowledge_chunks enable row level security;
alter table public.knowledge_retrieval_logs enable row level security;
create policy "Authenticated users read active knowledge" on public.knowledge_sources for select to authenticated using (is_active);
create policy "Authenticated users read knowledge chunks" on public.knowledge_chunks for select to authenticated using (exists (select 1 from public.knowledge_sources s where s.id = source_id and s.is_active));
create policy "Owners create retrieval logs" on public.knowledge_retrieval_logs for insert to authenticated with check (project_id is null or exists (select 1 from public.projects p where p.id = project_id and p.owner_id = auth.uid()));
create policy "Owners read retrieval logs" on public.knowledge_retrieval_logs for select to authenticated using (project_id is null or exists (select 1 from public.projects p where p.id = project_id and p.owner_id = auth.uid()));

grant select, insert on public.project_snapshots to authenticated;
grant select on public.knowledge_sources, public.knowledge_chunks to authenticated;
grant select, insert on public.knowledge_retrieval_logs to authenticated;
commit;
