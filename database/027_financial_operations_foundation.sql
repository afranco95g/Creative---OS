-- ============================================================
-- CULTURA ESTA
-- Migracion 027
-- Productos, ticketing, presupuesto y reglas tributarias
-- ============================================================

begin;

create table if not exists public.commercial_policies (
  id uuid primary key default gen_random_uuid(),
  policy_key text not null default 'maximum_product_share_percent',
  scope_type text not null default 'global' check (scope_type in (
    'global','experience_type','product','brand','audience','campaign','price_range'
  )),
  scope_id text,
  numeric_value numeric(12,6) not null check (numeric_value >= 0),
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  is_active boolean not null default false,
  justification text not null,
  approved_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at is null or ends_at > starts_at)
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  owner_actor_type text not null check (owner_actor_type in ('person','space','funder')),
  owner_actor_id uuid not null,
  name text not null,
  description text not null default '',
  category text not null,
  presentation text not null default '',
  commercial_price numeric(14,2) check (commercial_price is null or commercial_price >= 0),
  wholesale_price numeric(14,2) check (wholesale_price is null or wholesale_price >= 0),
  available_quantity integer not null default 0 check (available_quantity >= 0),
  minimum_order integer not null default 1 check (minimum_order > 0),
  production_capacity integer check (production_capacity is null or production_capacity >= 0),
  lead_time_days integer check (lead_time_days is null or lead_time_days >= 0),
  city text,
  logistics_conditions text not null default '',
  storage_requirements text not null default '',
  legal_restrictions text not null default '',
  expires_at timestamptz,
  image_urls text[] not null default '{}',
  compatible_experiences text[] not null default '{}',
  compatible_audiences text[] not null default '{}',
  documentation jsonb not null default '[]'::jsonb,
  validation_status text not null default 'draft' check (validation_status in (
    'draft','proposed','under_review','approved_distribution','approved_activity',
    'approved_period','approved_with_adjustments','documentation_required','rejected','archived'
  )),
  reviewed_by uuid references public.profiles(id) on delete set null,
  review_note text,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists products_owner_idx on public.products(owner_actor_type, owner_actor_id);
create index if not exists products_review_idx on public.products(validation_status, created_at desc);

create table if not exists public.experience_products (
  id uuid primary key default gen_random_uuid(),
  experience_id uuid not null references public.experiences(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete restrict,
  relationship_type text not null check (relationship_type in (
    'paid_sponsorship','barter','sold_product','ticket_included','free_sample','sales_commission','activation','commercial_alliance'
  )),
  participant_quantity integer not null check (participant_quantity > 0),
  committed_quantity integer not null check (committed_quantity >= 0),
  wholesale_unit_cost numeric(14,2) not null check (wholesale_unit_cost >= 0),
  ticket_component_unit_value numeric(14,2) not null check (ticket_component_unit_value >= 0),
  logistics_cost numeric(14,2) not null default 0 check (logistics_cost >= 0),
  storage_cost numeric(14,2) not null default 0 check (storage_cost >= 0),
  expected_loss_cost numeric(14,2) not null default 0 check (expected_loss_cost >= 0),
  other_cost numeric(14,2) not null default 0 check (other_cost >= 0),
  policy_id uuid references public.commercial_policies(id) on delete set null,
  policy_exception boolean not null default false,
  exception_reason text,
  decision_status text not null default 'proposed' check (decision_status in (
    'proposed','approved','rejected','adjustment_requested','negotiation_requested'
  )),
  decided_by uuid references public.profiles(id) on delete set null,
  decided_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(experience_id, product_id)
);

create table if not exists public.ticket_types (
  id uuid primary key default gen_random_uuid(),
  experience_id uuid not null references public.experiences(id) on delete cascade,
  name text not null,
  ticket_kind text not null check (ticket_kind in (
    'general','presale','student','community','sponsor','invitation','bundle','with_product','without_product'
  )),
  capacity integer not null check (capacity >= 0),
  available_units integer not null check (available_units >= 0 and available_units <= capacity),
  base_activity_price numeric(14,2) not null default 0 check (base_activity_price >= 0),
  product_component numeric(14,2) not null default 0 check (product_component >= 0),
  culture_margin numeric(14,2) not null default 0 check (culture_margin >= 0),
  operating_cost numeric(14,2) not null default 0 check (operating_cost >= 0),
  gateway_fee numeric(14,2) not null default 0 check (gateway_fee >= 0),
  estimated_taxes numeric(14,2) not null default 0 check (estimated_taxes >= 0),
  discount numeric(14,2) not null default 0 check (discount >= 0),
  final_price numeric(14,2) generated always as (
    greatest(0, base_activity_price + product_component + culture_margin + operating_cost + gateway_fee + estimated_taxes - discount)
  ) stored,
  sales integer not null default 0 check (sales >= 0),
  refunds integer not null default 0 check (refunds >= 0),
  complimentary integer not null default 0 check (complimentary >= 0),
  sales_start_at timestamptz,
  sales_end_at timestamptz,
  status text not null default 'draft' check (status in ('draft','active','paused','sold_out','closed','archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (sales_end_at is null or sales_start_at is null or sales_end_at > sales_start_at)
);
create index if not exists ticket_types_experience_idx on public.ticket_types(experience_id, status);

create table if not exists public.project_budget_lines (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  direction text not null check (direction in ('expense','income')),
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
  related_income numeric(14,2),
  funding_source text,
  status text not null default 'estimated' check (status in (
    'estimated','quoted','approved','committed','invoiced','paid','cancelled','executed'
  )),
  estimated_date date,
  actual_date date,
  responsible_profile_id uuid references public.profiles(id) on delete set null,
  support_document_url text,
  invoice_url text,
  cost_center text,
  notes text not null default '',
  source_suggestion text check (source_suggestion is null or source_suggestion in ('manual','creative_os')),
  suggestion_confirmed_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists project_budget_lines_project_idx on public.project_budget_lines(project_id, direction, status);

create table if not exists public.tax_rules (
  id uuid primary key default gen_random_uuid(),
  rule_code text not null,
  version integer not null check (version > 0),
  name text not null,
  jurisdiction text not null,
  operation_type text not null,
  ciiu_code text,
  third_party_type text,
  tax_responsibility text,
  tax_name text not null,
  rate numeric(12,8) check (rate is null or rate >= 0),
  minimum_base numeric(16,2),
  taxable_base_expression text,
  treatment text not null check (treatment in ('included','excluded','exempt','different_rate','withholding','informational')),
  starts_on date not null,
  ends_on date,
  official_source text not null,
  official_source_url text not null,
  legal_reference text not null,
  interpretation text not null,
  source_checked_on date not null,
  status text not null default 'draft' check (status in ('draft','active','inactive','superseded','professional_review')),
  requires_professional_review boolean not null default true,
  approved_by uuid references public.profiles(id) on delete set null,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(rule_code, version),
  check (ends_on is null or ends_on >= starts_on)
);

create table if not exists public.financial_scenarios (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  experience_id uuid references public.experiences(id) on delete cascade,
  name text not null check (name in ('conservative','base','optimistic')),
  capacity integer not null check (capacity >= 0),
  expected_occupancy numeric(6,5) not null check (expected_occupancy between 0 and 1),
  average_price numeric(14,2) not null default 0,
  complimentary integer not null default 0,
  expected_refunds integer not null default 0,
  fixed_costs numeric(14,2) not null default 0,
  variable_cost_per_attendee numeric(14,2) not null default 0,
  estimated_taxes numeric(14,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(project_id, experience_id, name)
);

alter table public.commercial_policies enable row level security;
alter table public.products enable row level security;
alter table public.experience_products enable row level security;
alter table public.ticket_types enable row level security;
alter table public.project_budget_lines enable row level security;
alter table public.tax_rules enable row level security;
alter table public.financial_scenarios enable row level security;

create or replace function public.prepare_governed_financial_record()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  new.updated_at := now();
  if tg_table_name = 'tax_rules' and to_jsonb(new)->>'status' = 'active' then
    new.approved_by := auth.uid();
    new.approved_at := coalesce(new.approved_at, now());
  elsif tg_table_name = 'commercial_policies' and new.is_active then
    new.approved_by := auth.uid();
  end if;
  return new;
end;
$$;
drop trigger if exists tax_rules_prepare on public.tax_rules;
create trigger tax_rules_prepare before insert or update on public.tax_rules
for each row execute function public.prepare_governed_financial_record();
drop trigger if exists commercial_policies_prepare on public.commercial_policies;
create trigger commercial_policies_prepare before insert or update on public.commercial_policies
for each row execute function public.prepare_governed_financial_record();

create or replace function public.audit_financial_admin_change()
returns trigger language plpgsql security definer set search_path = '' as $$
declare role_name text; row_id text;
begin
  role_name := public.current_profile_role();
  if role_name not in ('ecosystem_admin','finance_admin','super_admin') then return new; end if;
  row_id := to_jsonb(new)->>'id';
  insert into public.admin_audit_log (
    actor_profile_id, action, entity_type, entity_id, previous_value, new_value
  ) values (
    auth.uid(), lower(tg_op), tg_table_name, row_id,
    case when tg_op = 'UPDATE' then to_jsonb(old) - 'documentation' else null end,
    to_jsonb(new) - 'documentation'
  );
  return new;
end;
$$;
drop trigger if exists tax_rules_admin_audit on public.tax_rules;
create trigger tax_rules_admin_audit after insert or update on public.tax_rules
for each row execute function public.audit_financial_admin_change();
drop trigger if exists commercial_policies_admin_audit on public.commercial_policies;
create trigger commercial_policies_admin_audit after insert or update on public.commercial_policies
for each row execute function public.audit_financial_admin_change();
drop trigger if exists products_admin_audit on public.products;
create trigger products_admin_audit after update on public.products
for each row execute function public.audit_financial_admin_change();
drop trigger if exists ticket_types_admin_audit on public.ticket_types;
create trigger ticket_types_admin_audit after insert or update on public.ticket_types
for each row execute function public.audit_financial_admin_change();

create policy "Super admins manage commercial policies" on public.commercial_policies
for all to authenticated using (public.current_profile_role() = 'super_admin') with check (public.current_profile_role() = 'super_admin');
create policy "Owners and admins view products" on public.products for select to authenticated
using (public.account_manages_actor(auth.uid(), owner_actor_type, owner_actor_id) or public.current_profile_role() in ('ecosystem_admin','super_admin'));
create policy "Owners create products" on public.products for insert to authenticated
with check (public.account_manages_actor(auth.uid(), owner_actor_type, owner_actor_id) and validation_status = 'draft');
create policy "Owners edit draft products" on public.products for update to authenticated
using (public.account_manages_actor(auth.uid(), owner_actor_type, owner_actor_id) and validation_status in ('draft','documentation_required','rejected'))
with check (public.account_manages_actor(auth.uid(), owner_actor_type, owner_actor_id) and validation_status in ('draft','proposed','documentation_required'));
create policy "Ecosystem admins review products" on public.products for update to authenticated
using (public.current_profile_role() in ('ecosystem_admin','super_admin')) with check (public.current_profile_role() in ('ecosystem_admin','super_admin'));
create policy "Experience owners and admins manage product allocations" on public.experience_products for all to authenticated
using (exists (select 1 from public.experiences e where e.id = experience_id and (e.owner_id = auth.uid() or public.current_profile_role() = 'super_admin')))
with check (exists (select 1 from public.experiences e where e.id = experience_id and (e.owner_id = auth.uid() or public.current_profile_role() = 'super_admin')));
create policy "Experience owners and admins manage ticket types" on public.ticket_types for all to authenticated
using (exists (select 1 from public.experiences e where e.id = experience_id and (e.owner_id = auth.uid() or public.current_profile_role() = 'super_admin')))
with check (exists (select 1 from public.experiences e where e.id = experience_id and (e.owner_id = auth.uid() or public.current_profile_role() = 'super_admin')));
create policy "Project owners manage budget" on public.project_budget_lines for all to authenticated
using (exists (select 1 from public.projects p where p.id = project_id and p.owner_id = auth.uid()))
with check (exists (select 1 from public.projects p where p.id = project_id and p.owner_id = auth.uid()));
create policy "Finance and super admins manage tax rules" on public.tax_rules for all to authenticated
using (public.current_profile_role() in ('finance_admin','super_admin')) with check (public.current_profile_role() in ('finance_admin','super_admin'));
create policy "Project owners manage scenarios" on public.financial_scenarios for all to authenticated
using (exists (select 1 from public.projects p where p.id = project_id and p.owner_id = auth.uid()))
with check (exists (select 1 from public.projects p where p.id = project_id and p.owner_id = auth.uid()));

create or replace function public.review_product(
  target_product_id uuid, requested_status text, requested_note text
) returns void language plpgsql security definer set search_path = '' as $$
declare old_row public.products%rowtype; new_row public.products%rowtype;
begin
  if public.current_profile_role() not in ('ecosystem_admin','super_admin') then raise exception 'Sin permisos'; end if;
  if requested_status not in ('approved_distribution','approved_activity','approved_period','approved_with_adjustments','documentation_required','rejected','archived') then raise exception 'Estado invalido'; end if;
  select * into old_row from public.products where id = target_product_id;
  update public.products set validation_status = requested_status,
    review_note = nullif(trim(requested_note),''), reviewed_by = auth.uid(),
    reviewed_at = now(), updated_at = now() where id = target_product_id returning * into new_row;
  if not found then raise exception 'Producto no encontrado'; end if;
  perform public.record_admin_audit('product_review','product',target_product_id::text,
    jsonb_build_object('status',old_row.validation_status),
    jsonb_build_object('status',new_row.validation_status), requested_note);
end;
$$;

create or replace function public.calculate_financial_scenario(target_scenario_id uuid)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare s public.financial_scenarios%rowtype; expected_paid numeric; gross numeric; variable_cost numeric; net_estimate numeric; contribution numeric; break_even numeric;
begin
  select fs.* into s from public.financial_scenarios fs join public.projects p on p.id = fs.project_id
  where fs.id = target_scenario_id and (p.owner_id = auth.uid() or public.current_profile_role() in ('finance_admin','super_admin'));
  if not found then raise exception 'Escenario no disponible'; end if;
  expected_paid := greatest(0, floor(s.capacity * s.expected_occupancy) - s.complimentary - s.expected_refunds);
  gross := expected_paid * s.average_price;
  variable_cost := expected_paid * s.variable_cost_per_attendee;
  net_estimate := gross - s.fixed_costs - variable_cost - s.estimated_taxes;
  contribution := s.average_price - s.variable_cost_per_attendee;
  break_even := case when contribution > 0 then ceil((s.fixed_costs + s.estimated_taxes) / contribution) else null end;
  return jsonb_build_object('expectedPaidAttendance',expected_paid,'grossIncome',gross,
    'variableCosts',variable_cost,'netEstimate',net_estimate,'contributionPerAttendee',contribution,
    'breakEvenAttendance',break_even,'isEstimate',true,
    'warning','Estimacion financiera y tributaria. Validar con contador o asesor tributario');
end;
$$;

grant select, insert, update, delete on public.commercial_policies, public.products,
  public.experience_products, public.ticket_types, public.project_budget_lines,
  public.tax_rules, public.financial_scenarios to authenticated;
revoke all on function public.review_product(uuid,text,text) from public;
revoke all on function public.calculate_financial_scenario(uuid) from public;
grant execute on function public.review_product(uuid,text,text) to authenticated;
grant execute on function public.calculate_financial_scenario(uuid) to authenticated;

commit;
