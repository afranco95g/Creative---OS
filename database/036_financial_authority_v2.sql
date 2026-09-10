-- Executive Engine V2.4 — Financial Authority (aditive and reversible)
begin;

do $$ begin
  if to_regclass('public.project_budget_lines') is null then
    raise exception 'Prerequisite missing: public.project_budget_lines. Apply and validate migration 027 before 036.';
  end if;
end $$;

alter table public.project_budget_lines
  add column if not exists currency text not null default 'COP',
  add column if not exists related_work_item_id uuid,
  add column if not exists period text,
  add column if not exists evidence jsonb not null default '[]'::jsonb,
  add column if not exists source text not null default 'manual'
    check (source in ('manual','conversation','document','import','system')),
  add column if not exists source_knowledge_ids uuid[] not null default '{}',
  add column if not exists proposal_id uuid,
  add column if not exists idempotency_key text,
  add column if not exists version integer not null default 1 check (version > 0);

alter table public.project_budget_lines drop constraint if exists project_budget_lines_status_check;
alter table public.project_budget_lines add constraint project_budget_lines_status_check check (status in (
  'proposed','estimated','quoted','approved','committed','invoiced','executed','paid','cancelled'
));
create unique index if not exists project_budget_lines_idempotency_idx on public.project_budget_lines(project_id,idempotency_key) where idempotency_key is not null;

create table if not exists public.financial_proposals (
  id uuid primary key default gen_random_uuid(), project_id uuid not null references public.projects(id) on delete cascade,
  source_knowledge_ids uuid[] not null default '{}', direction text not null check(direction in ('income','expense')),
  concept text not null, quantity numeric(14,3) not null default 1, unit text not null default 'unidad',
  unit_price numeric(14,2) not null, calculated_total numeric(14,2) not null, currency text not null default 'COP',
  proposed_status text not null default 'estimated', confidence numeric(4,3) not null check(confidence between 0 and 1),
  reason text not null default '', status text not null default 'pending' check(status in ('pending','accepted','edited','rejected','expired')),
  idempotency_key text not null, created_by uuid not null default auth.uid() references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(project_id,idempotency_key)
);

create table if not exists public.financial_domain_events (
  id uuid primary key default gen_random_uuid(), project_id uuid not null references public.projects(id) on delete cascade,
  entity_id uuid not null, event_type text not null check(event_type in (
    'financial_item_created','financial_item_updated','financial_item_status_changed','financial_item_cancelled',
    'financial_proposal_created','financial_proposal_accepted','financial_proposal_rejected','financial_item_linked_to_knowledge'
  )), actor_id uuid references public.profiles(id) on delete set null,
  happened_at timestamptz not null default now(), before_state jsonb, after_state jsonb, reason text,
  idempotency_key text not null, unique(project_id,idempotency_key)
);

alter table public.financial_proposals enable row level security;
alter table public.financial_domain_events enable row level security;
drop policy if exists "Project owners manage financial proposals" on public.financial_proposals;
drop policy if exists "Project owners read financial events" on public.financial_domain_events;
create policy "Project owners manage financial proposals" on public.financial_proposals for all to authenticated
using(exists(select 1 from public.projects p where p.id=project_id and p.owner_id=auth.uid()))
with check(exists(select 1 from public.projects p where p.id=project_id and p.owner_id=auth.uid()));
create policy "Project owners read financial events" on public.financial_domain_events for select to authenticated
using(exists(select 1 from public.projects p where p.id=project_id and p.owner_id=auth.uid()));

do $$ begin
  if not exists(select 1 from pg_constraint where conname='project_budget_lines_proposal_fk') then
    alter table public.project_budget_lines add constraint project_budget_lines_proposal_fk
      foreign key(proposal_id) references public.financial_proposals(id) on delete set null;
  end if;
end $$;

drop trigger if exists financial_proposals_set_updated_at on public.financial_proposals;
create trigger financial_proposals_set_updated_at before update on public.financial_proposals
for each row execute function public.set_updated_at();

create or replace function public.accept_financial_proposal(target_proposal_id uuid, command_key text)
returns public.project_budget_lines language plpgsql security definer set search_path='' as $$
declare proposal public.financial_proposals%rowtype; item public.project_budget_lines%rowtype;
begin
  select fp.* into proposal from public.financial_proposals fp join public.projects p on p.id=fp.project_id
  where fp.id=target_proposal_id and p.owner_id=auth.uid() for update;
  if not found then raise exception 'Propuesta no disponible'; end if;
  select * into item from public.project_budget_lines where project_id=proposal.project_id and idempotency_key=command_key;
  if found then return item; end if;
  if proposal.status not in ('pending','edited') then raise exception 'Propuesta no aceptable en estado %',proposal.status; end if;
  insert into public.project_budget_lines(project_id,direction,category,concept,description,quantity,unit,unit_value,status,currency,source,source_knowledge_ids,proposal_id,idempotency_key,source_suggestion,suggestion_confirmed_by)
  values(proposal.project_id,proposal.direction,'Por clasificar',proposal.concept,proposal.reason,proposal.quantity,proposal.unit,proposal.unit_price,proposal.proposed_status,proposal.currency,'conversation',proposal.source_knowledge_ids,proposal.id,command_key,'creative_os',auth.uid()) returning * into item;
  update public.financial_proposals set status='accepted',updated_at=now() where id=proposal.id;
  insert into public.financial_domain_events(project_id,entity_id,event_type,actor_id,after_state,idempotency_key)
  values(proposal.project_id,item.id,'financial_item_created',auth.uid(),to_jsonb(item),'event:'||command_key) on conflict do nothing;
  return item;
end $$;

create or replace function public.update_financial_item_v2(target_item_id uuid, expected_version integer, patch jsonb, command_key text)
returns public.project_budget_lines language plpgsql security definer set search_path='' as $$
declare old_item public.project_budget_lines%rowtype; new_item public.project_budget_lines%rowtype;
begin
  select b.* into old_item from public.project_budget_lines b join public.projects p on p.id=b.project_id
  where b.id=target_item_id and p.owner_id=auth.uid() for update;
  if not found then raise exception 'Línea financiera no disponible'; end if;
  if old_item.version<>expected_version then raise exception using errcode='40001',message='El presupuesto cambió desde que lo abriste.'; end if;
  update public.project_budget_lines set
    quantity=coalesce((patch->>'quantity')::numeric,quantity), unit_value=coalesce((patch->>'unitPrice')::numeric,unit_value),
    status=coalesce(patch->>'status',status), notes=coalesce(patch->>'notes',notes), version=version+1,updated_at=now()
  where id=target_item_id returning * into new_item;
  insert into public.financial_domain_events(project_id,entity_id,event_type,actor_id,before_state,after_state,reason,idempotency_key)
  values(new_item.project_id,new_item.id,case when old_item.status<>new_item.status then 'financial_item_status_changed' else 'financial_item_updated' end,auth.uid(),to_jsonb(old_item),to_jsonb(new_item),patch->>'reason',command_key) on conflict do nothing;
  return new_item;
end $$;

revoke all on function public.accept_financial_proposal(uuid,text),public.update_financial_item_v2(uuid,integer,jsonb,text) from public;
grant execute on function public.accept_financial_proposal(uuid,text),public.update_financial_item_v2(uuid,integer,jsonb,text) to authenticated;
grant select,insert,update on public.financial_proposals to authenticated;
grant select on public.financial_domain_events to authenticated;
commit;
