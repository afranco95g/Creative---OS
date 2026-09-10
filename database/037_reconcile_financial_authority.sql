-- Creative OS — Financial Authority V2 schema reconciliation
-- Forward-only migration for a remote schema without application migration history.
-- Supersedes database/036_financial_authority_v2.sql for remote execution.
begin;

-- Preflight: only prerequisites that this bounded migration actually uses.
do $preflight$
begin
  if to_regclass('public.projects') is null then
    raise exception 'Financial Authority preflight failed: public.projects is missing';
  end if;
  if to_regclass('public.profiles') is null then
    raise exception 'Financial Authority preflight failed: public.profiles is missing';
  end if;
  if to_regprocedure('public.set_updated_at()') is null then
    raise exception 'Financial Authority preflight failed: public.set_updated_at() is missing';
  end if;
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'projects'
      and column_name = 'owner_id' and udt_name = 'uuid'
  ) then
    raise exception 'Financial Authority preflight failed: projects.owner_id uuid is missing';
  end if;
end
$preflight$;

create table if not exists public.project_budget_lines (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  direction text not null constraint project_budget_lines_direction_check
    check (direction in ('income', 'expense')),
  category text not null,
  subcategory text,
  concept text not null,
  description text not null default '',
  provider_name text,
  third_party_type text,
  quantity numeric(14,3) not null default 1 check (quantity >= 0),
  unit text not null default 'unidad',
  unit_value numeric(14,2) not null default 0,
  discount numeric(14,2) not null default 0,
  vat numeric(14,2) not null default 0,
  withholding numeric(14,2) not null default 0,
  ica numeric(14,2) not null default 0,
  other_taxes numeric(14,2) not null default 0,
  total numeric(14,2) generated always as (
    greatest(0, quantity * unit_value - discount + vat - withholding - ica + other_taxes)
  ) stored,
  currency text not null default 'COP',
  related_income numeric(14,2),
  funding_source text,
  status text not null default 'estimated'
    constraint project_budget_lines_status_check check (status in (
      'proposed', 'estimated', 'quoted', 'approved', 'committed',
      'invoiced', 'executed', 'paid', 'cancelled'
    )),
  estimated_date date,
  actual_date date,
  responsible_profile_id uuid references public.profiles(id) on delete set null,
  related_work_item_id uuid,
  period text,
  notes text not null default '',
  evidence jsonb not null default '[]'::jsonb check (jsonb_typeof(evidence) = 'array'),
  support_document_url text,
  invoice_url text,
  cost_center text,
  source text not null default 'manual' check (source in (
    'manual', 'conversation', 'document', 'import', 'system'
  )),
  source_knowledge_ids uuid[] not null default '{}',
  proposal_id uuid,
  idempotency_key text,
  version integer not null default 1 check (version > 0),
  source_suggestion text check (source_suggestion is null or source_suggestion in ('manual', 'creative_os')),
  suggestion_confirmed_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.financial_proposals (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  source_knowledge_ids uuid[] not null default '{}',
  direction text not null check (direction in ('income', 'expense')),
  concept text not null,
  quantity numeric(14,3) not null default 1 check (quantity >= 0),
  unit text not null default 'unidad',
  unit_price numeric(14,2) not null,
  calculated_total numeric(14,2) not null,
  currency text not null default 'COP',
  proposed_status text not null default 'estimated' check (proposed_status in (
    'proposed', 'estimated', 'quoted', 'approved', 'committed',
    'invoiced', 'executed', 'paid', 'cancelled'
  )),
  confidence numeric(4,3) not null check (confidence between 0 and 1),
  reason text not null default '',
  status text not null default 'pending' check (status in (
    'pending', 'accepted', 'edited', 'rejected', 'expired'
  )),
  idempotency_key text not null,
  created_by uuid not null default auth.uid() references public.profiles(id) on delete restrict,
  accepted_financial_item_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.financial_domain_events (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  entity_id uuid not null,
  event_type text not null check (event_type in (
    'financial_item_created', 'financial_item_updated', 'financial_item_status_changed',
    'financial_item_cancelled', 'financial_proposal_created', 'financial_proposal_accepted',
    'financial_proposal_rejected', 'financial_item_linked_to_knowledge'
  )),
  actor_id uuid references public.profiles(id) on delete set null,
  before_state jsonb,
  after_state jsonb,
  reason text,
  idempotency_key text not null,
  happened_at timestamptz not null default now()
);

-- Fail loudly if pre-existing same-name tables do not provide the contract.
do $compatibility$
declare
  missing_columns text;
begin
  select string_agg(required.column_name, ', ' order by required.column_name)
  into missing_columns
  from (values
    ('project_budget_lines','id'), ('project_budget_lines','project_id'),
    ('project_budget_lines','direction'), ('project_budget_lines','category'),
    ('project_budget_lines','concept'), ('project_budget_lines','quantity'),
    ('project_budget_lines','unit'), ('project_budget_lines','unit_value'),
    ('project_budget_lines','discount'), ('project_budget_lines','vat'),
    ('project_budget_lines','withholding'), ('project_budget_lines','ica'),
    ('project_budget_lines','other_taxes'), ('project_budget_lines','total'),
    ('project_budget_lines','currency'), ('project_budget_lines','status'),
    ('project_budget_lines','source'), ('project_budget_lines','source_knowledge_ids'),
    ('project_budget_lines','proposal_id'), ('project_budget_lines','idempotency_key'),
    ('project_budget_lines','version'), ('project_budget_lines','created_at'),
    ('project_budget_lines','updated_at'),
    ('financial_proposals','id'), ('financial_proposals','project_id'),
    ('financial_proposals','source_knowledge_ids'), ('financial_proposals','unit_price'),
    ('financial_proposals','calculated_total'), ('financial_proposals','proposed_status'),
    ('financial_proposals','status'), ('financial_proposals','idempotency_key'),
    ('financial_proposals','accepted_financial_item_id'),
    ('financial_domain_events','id'), ('financial_domain_events','project_id'),
    ('financial_domain_events','entity_id'), ('financial_domain_events','event_type'),
    ('financial_domain_events','idempotency_key')
  ) as required(table_name, column_name)
  where not exists (
    select 1 from information_schema.columns c
    where c.table_schema = 'public' and c.table_name = required.table_name
      and c.column_name = required.column_name
  );
  if missing_columns is not null then
    raise exception 'Financial Authority compatibility failed; missing columns: %', missing_columns;
  end if;
end
$compatibility$;

do $foreign_keys$
begin
  if not exists (select 1 from pg_constraint where conname = 'project_budget_lines_proposal_fk') then
    alter table public.project_budget_lines
      add constraint project_budget_lines_proposal_fk foreign key (proposal_id)
      references public.financial_proposals(id) on delete set null;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'financial_proposals_accepted_item_fk') then
    alter table public.financial_proposals
      add constraint financial_proposals_accepted_item_fk foreign key (accepted_financial_item_id)
      references public.project_budget_lines(id) on delete set null;
  end if;
end
$foreign_keys$;

create unique index if not exists project_budget_lines_idempotency_idx
  on public.project_budget_lines(project_id, idempotency_key)
  where idempotency_key is not null;
create unique index if not exists financial_proposals_idempotency_idx
  on public.financial_proposals(project_id, idempotency_key);
create unique index if not exists financial_domain_events_idempotency_idx
  on public.financial_domain_events(project_id, idempotency_key);
create index if not exists project_budget_lines_project_status_direction_idx
  on public.project_budget_lines(project_id, status, direction);
create index if not exists project_budget_lines_expected_date_idx
  on public.project_budget_lines(project_id, estimated_date) where estimated_date is not null;
create index if not exists financial_proposals_project_status_idx
  on public.financial_proposals(project_id, status);
create index if not exists financial_domain_events_project_created_idx
  on public.financial_domain_events(project_id, happened_at desc);

drop trigger if exists project_budget_lines_set_updated_at on public.project_budget_lines;
create trigger project_budget_lines_set_updated_at before update on public.project_budget_lines
for each row execute function public.set_updated_at();
drop trigger if exists financial_proposals_set_updated_at on public.financial_proposals;
create trigger financial_proposals_set_updated_at before update on public.financial_proposals
for each row execute function public.set_updated_at();

create or replace function public.accept_financial_proposal(target_proposal_id uuid, command_key text)
returns public.project_budget_lines
language plpgsql security definer set search_path = ''
as $function$
declare
  requester uuid := auth.uid();
  proposal public.financial_proposals%rowtype;
  item public.project_budget_lines%rowtype;
begin
  if requester is null then raise exception 'Authentication required' using errcode = '42501'; end if;
  if command_key is null or btrim(command_key) = '' then raise exception 'command_key is required' using errcode = '22023'; end if;

  select fp.* into proposal
  from public.financial_proposals fp
  join public.projects p on p.id = fp.project_id
  where fp.id = target_proposal_id and p.owner_id = requester
  for update of fp;
  if not found then raise exception 'Financial proposal unavailable' using errcode = '42501'; end if;

  if proposal.status = 'accepted' and proposal.accepted_financial_item_id is not null then
    select * into item from public.project_budget_lines where id = proposal.accepted_financial_item_id;
    if found then return item; end if;
    raise exception 'Accepted proposal references a missing financial item';
  end if;

  select * into item from public.project_budget_lines
  where project_id = proposal.project_id and idempotency_key = command_key;
  if found then
    update public.financial_proposals set status = 'accepted', accepted_financial_item_id = item.id
    where id = proposal.id;
    return item;
  end if;
  if proposal.status not in ('pending', 'edited') then
    raise exception 'Financial proposal cannot be accepted from status %', proposal.status using errcode = '22023';
  end if;

  insert into public.project_budget_lines (
    project_id, direction, category, concept, description, quantity, unit, unit_value,
    status, currency, source, source_knowledge_ids, proposal_id, idempotency_key,
    source_suggestion, suggestion_confirmed_by
  ) values (
    proposal.project_id, proposal.direction, 'Por clasificar', proposal.concept,
    proposal.reason, proposal.quantity, proposal.unit, proposal.unit_price,
    proposal.proposed_status, proposal.currency, 'conversation', proposal.source_knowledge_ids,
    proposal.id, command_key, 'creative_os', requester
  ) returning * into item;

  update public.financial_proposals
  set status = 'accepted', accepted_financial_item_id = item.id
  where id = proposal.id;

  insert into public.financial_domain_events
    (project_id, entity_id, event_type, actor_id, after_state, idempotency_key)
  values
    (proposal.project_id, proposal.id, 'financial_proposal_accepted', requester,
      to_jsonb(proposal), 'event:' || command_key || ':proposal'),
    (proposal.project_id, item.id, 'financial_item_created', requester,
      to_jsonb(item), 'event:' || command_key || ':item'),
    (proposal.project_id, item.id, 'financial_item_linked_to_knowledge', requester,
      jsonb_build_object('sourceKnowledgeIds', proposal.source_knowledge_ids),
      'event:' || command_key || ':link')
  on conflict (project_id, idempotency_key) do nothing;
  return item;
end
$function$;

create or replace function public.update_financial_item_v2(
  target_item_id uuid, expected_version integer, patch jsonb, command_key text
)
returns public.project_budget_lines
language plpgsql security definer set search_path = ''
as $function$
declare
  requester uuid := auth.uid();
  old_item public.project_budget_lines%rowtype;
  new_item public.project_budget_lines%rowtype;
  prior_event public.financial_domain_events%rowtype;
  next_status text;
begin
  if requester is null then raise exception 'Authentication required' using errcode = '42501'; end if;
  if command_key is null or btrim(command_key) = '' then raise exception 'command_key is required' using errcode = '22023'; end if;
  if patch is null or jsonb_typeof(patch) <> 'object' then raise exception 'patch must be an object' using errcode = '22023'; end if;
  if patch - array['unitPrice','quantity','status','notes','reason']::text[] <> '{}'::jsonb then
    raise exception 'patch contains unsupported fields' using errcode = '22023';
  end if;

  select b.* into old_item
  from public.project_budget_lines b
  join public.projects p on p.id = b.project_id
  where b.id = target_item_id and p.owner_id = requester
  for update of b;
  if not found then raise exception 'Financial item unavailable' using errcode = '42501'; end if;

  select * into prior_event from public.financial_domain_events
  where project_id = old_item.project_id and idempotency_key = command_key;
  if found then
    if prior_event.entity_id <> target_item_id then
      raise exception 'command_key was already used for another entity' using errcode = '23505';
    end if;
    return old_item;
  end if;
  if old_item.version <> expected_version then
    raise exception using errcode = '40001', message = 'El presupuesto cambió desde que lo abriste.';
  end if;

  next_status := coalesce(patch ->> 'status', old_item.status);
  if next_status not in ('proposed','estimated','quoted','approved','committed','invoiced','executed','paid','cancelled') then
    raise exception 'Unsupported financial status: %', next_status using errcode = '22023';
  end if;

  update public.project_budget_lines set
    quantity = case when patch ? 'quantity' then (patch ->> 'quantity')::numeric else quantity end,
    unit_value = case when patch ? 'unitPrice' then (patch ->> 'unitPrice')::numeric else unit_value end,
    status = next_status,
    notes = case when patch ? 'notes' then patch ->> 'notes' else notes end,
    version = version + 1
  where id = target_item_id and version = expected_version
  returning * into new_item;
  if not found then
    raise exception using errcode = '40001', message = 'El presupuesto cambió desde que lo abriste.';
  end if;

  insert into public.financial_domain_events (
    project_id, entity_id, event_type, actor_id, before_state, after_state, reason, idempotency_key
  ) values (
    new_item.project_id, new_item.id,
    case when old_item.status <> new_item.status then 'financial_item_status_changed'
         else 'financial_item_updated' end,
    requester, to_jsonb(old_item), to_jsonb(new_item), patch ->> 'reason', command_key
  );
  return new_item;
end
$function$;

alter table public.project_budget_lines enable row level security;
alter table public.financial_proposals enable row level security;
alter table public.financial_domain_events enable row level security;

drop policy if exists "Project owners read budget" on public.project_budget_lines;
drop policy if exists "Project owners create budget" on public.project_budget_lines;
drop policy if exists "Project owners update budget" on public.project_budget_lines;
create policy "Project owners read budget" on public.project_budget_lines for select to authenticated
using (exists (select 1 from public.projects p where p.id = project_id and p.owner_id = auth.uid()));
create policy "Project owners create budget" on public.project_budget_lines for insert to authenticated
with check (exists (select 1 from public.projects p where p.id = project_id and p.owner_id = auth.uid()));
create policy "Project owners update budget" on public.project_budget_lines for update to authenticated
using (exists (select 1 from public.projects p where p.id = project_id and p.owner_id = auth.uid()))
with check (exists (select 1 from public.projects p where p.id = project_id and p.owner_id = auth.uid()));

drop policy if exists "Project owners read financial proposals" on public.financial_proposals;
drop policy if exists "Project owners create financial proposals" on public.financial_proposals;
drop policy if exists "Project owners update financial proposals" on public.financial_proposals;
create policy "Project owners read financial proposals" on public.financial_proposals for select to authenticated
using (exists (select 1 from public.projects p where p.id = project_id and p.owner_id = auth.uid()));
create policy "Project owners create financial proposals" on public.financial_proposals for insert to authenticated
with check (created_by = auth.uid() and exists (
  select 1 from public.projects p where p.id = project_id and p.owner_id = auth.uid()
));
create policy "Project owners update financial proposals" on public.financial_proposals for update to authenticated
using (exists (select 1 from public.projects p where p.id = project_id and p.owner_id = auth.uid()))
with check (created_by = auth.uid() and exists (
  select 1 from public.projects p where p.id = project_id and p.owner_id = auth.uid()
));

drop policy if exists "Project owners read financial events" on public.financial_domain_events;
create policy "Project owners read financial events" on public.financial_domain_events for select to authenticated
using (exists (select 1 from public.projects p where p.id = project_id and p.owner_id = auth.uid()));

revoke all on public.project_budget_lines, public.financial_proposals, public.financial_domain_events from anon;
revoke all on public.project_budget_lines, public.financial_proposals, public.financial_domain_events from authenticated;
grant select, insert, update on public.project_budget_lines, public.financial_proposals to authenticated;
grant select on public.financial_domain_events to authenticated;
revoke all on function public.accept_financial_proposal(uuid, text) from public;
revoke all on function public.update_financial_item_v2(uuid, integer, jsonb, text) from public;
grant execute on function public.accept_financial_proposal(uuid, text) to authenticated;
grant execute on function public.update_financial_item_v2(uuid, integer, jsonb, text) to authenticated;

commit;
