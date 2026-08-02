-- ============================================================
-- CULTURA ESTA
-- Migracion 030
-- Calendario maestro, productos por ticket y alertas operativas
-- ============================================================

begin;

alter table public.ticket_types
  add column if not exists policy_exception boolean not null default false,
  add column if not exists exception_reason text,
  add column if not exists exception_approved_by uuid references public.profiles(id) on delete set null;

create table if not exists public.ticket_type_products (
  id uuid primary key default gen_random_uuid(),
  ticket_type_id uuid not null references public.ticket_types(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete restrict,
  units_per_ticket integer not null default 1 check (units_per_ticket > 0),
  unit_cost numeric(14,2) not null check (unit_cost >= 0),
  unit_ticket_value numeric(14,2) not null check (unit_ticket_value >= 0),
  created_at timestamptz not null default now(),
  unique(ticket_type_id, product_id)
);

create table if not exists public.project_calendar_entries (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  experience_id uuid references public.experiences(id) on delete cascade,
  budget_line_id uuid references public.project_budget_lines(id) on delete set null,
  owner_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  title text not null,
  entry_type text not null check (entry_type in (
    'milestone','task','payment','production','delivery','editorial','campaign','ticket_open','ticket_close','deadline'
  )),
  starts_at timestamptz not null,
  ends_at timestamptz,
  status text not null default 'planned' check (status in ('planned','confirmed','completed','cancelled','overdue')),
  visibility text not null default 'private' check (visibility in ('private','ecosystem')),
  responsible_profile_id uuid references public.profiles(id) on delete set null,
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at is null or ends_at >= starts_at)
);
create index if not exists project_calendar_entries_date_idx on public.project_calendar_entries(starts_at, status);

alter table public.ticket_type_products enable row level security;
alter table public.project_calendar_entries enable row level security;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('product-assets','product-assets',true,10485760,array['image/jpeg','image/png','image/webp'])
on conflict(id) do update set public=true,file_size_limit=10485760,
allowed_mime_types=array['image/jpeg','image/png','image/webp'];
drop policy if exists "Owners upload product assets" on storage.objects;
create policy "Owners upload product assets" on storage.objects for insert to authenticated
with check(bucket_id='product-assets' and (storage.foldername(name))[1]=auth.uid()::text);
drop policy if exists "Owners update product assets" on storage.objects;
create policy "Owners update product assets" on storage.objects for update to authenticated
using(bucket_id='product-assets' and (storage.foldername(name))[1]=auth.uid()::text)
with check(bucket_id='product-assets' and (storage.foldername(name))[1]=auth.uid()::text);

create policy "Ticket owners manage ticket products" on public.ticket_type_products for all to authenticated
using (exists (select 1 from public.ticket_types t join public.experiences e on e.id=t.experience_id where t.id=ticket_type_id and (e.owner_id=auth.uid() or public.current_profile_role()='super_admin')))
with check (exists (select 1 from public.ticket_types t join public.experiences e on e.id=t.experience_id where t.id=ticket_type_id and (e.owner_id=auth.uid() or public.current_profile_role()='super_admin')));
create policy "Project owners manage calendar entries" on public.project_calendar_entries for all to authenticated
using (owner_id=auth.uid() or (public.current_profile_role()='super_admin' and visibility='ecosystem'))
with check (owner_id=auth.uid() or (public.current_profile_role()='super_admin' and visibility='ecosystem'));

create or replace function public.enforce_ticket_product_policy()
returns trigger language plpgsql security definer set search_path = '' as $$
declare policy_percent numeric; allowed_component numeric;
begin
  select cp.numeric_value into policy_percent from public.commercial_policies cp
  where cp.policy_key='maximum_product_share_percent' and cp.scope_type='global'
    and cp.is_active and cp.starts_at<=now() and (cp.ends_at is null or cp.ends_at>now())
  order by cp.starts_at desc limit 1;
  if policy_percent is not null then
    allowed_component := new.base_activity_price * policy_percent;
    if new.product_component > allowed_component and not new.policy_exception then
      raise exception 'El componente de producto supera la politica comercial activa';
    end if;
    if new.policy_exception and nullif(trim(new.exception_reason),'') is null then
      raise exception 'La excepcion comercial exige justificacion';
    end if;
    if new.policy_exception and public.current_profile_role()<>'super_admin' then
      raise exception 'Solo el superadministrador puede aprobar una excepcion comercial';
    end if;
    if new.policy_exception then new.exception_approved_by:=auth.uid(); end if;
  end if;
  new.updated_at:=now();
  return new;
end;
$$;
drop trigger if exists ticket_types_enforce_policy on public.ticket_types;
create trigger ticket_types_enforce_policy before insert or update on public.ticket_types
for each row execute function public.enforce_ticket_product_policy();
drop trigger if exists budget_lines_admin_audit on public.project_budget_lines;
create trigger budget_lines_admin_audit after insert or update on public.project_budget_lines
for each row execute function public.audit_financial_admin_change();
drop trigger if exists scenarios_admin_audit on public.financial_scenarios;
create trigger scenarios_admin_audit after insert or update on public.financial_scenarios
for each row execute function public.audit_financial_admin_change();
drop trigger if exists calendar_entries_admin_audit on public.project_calendar_entries;
create trigger calendar_entries_admin_audit after insert or update on public.project_calendar_entries
for each row execute function public.audit_financial_admin_change();

create or replace function public.list_master_calendar(
  requested_from timestamptz, requested_to timestamptz
) returns table (
  entry_id text, source text, title text, entry_type text, starts_at timestamptz,
  ends_at timestamptz, status text, project_id uuid, experience_id uuid,
  city text, actor_name text, is_own boolean
) language plpgsql stable security definer set search_path = '' as $$
begin
  if public.current_profile_role() not in ('ecosystem_admin','super_admin') then raise exception 'Sin permisos'; end if;
  return query
  select 'experience:'||e.id::text, 'experience', e.title, e.experience_type,
    e.starts_at,e.ends_at,e.status,e.project_id,e.id,e.city,
    coalesce(p.full_name,p.email,'Cuenta'),e.owner_id=auth.uid()
  from public.experiences e left join public.profiles p on p.id=e.owner_id
  where e.starts_at<requested_to and coalesce(e.ends_at,e.starts_at)>=requested_from
  union all
  select 'project:'||c.id::text,'project',c.title,c.entry_type,c.starts_at,c.ends_at,
    c.status,c.project_id,c.experience_id,null,coalesce(p.full_name,p.email,'Cuenta'),c.owner_id=auth.uid()
  from public.project_calendar_entries c left join public.profiles p on p.id=c.owner_id
  where c.starts_at<requested_to and coalesce(c.ends_at,c.starts_at)>=requested_from
    and (c.owner_id=auth.uid() or c.visibility='ecosystem')
  union all
  select 'editorial:'||ep.id::text,'editorial',ep.title,'editorial',coalesce(ep.publish_at,ep.created_at),
    null,ep.status,ep.related_project_id,ep.related_experience_id,ep.location,ep.byline,ep.created_by=auth.uid()
  from public.editorial_posts ep
  where coalesce(ep.publish_at,ep.created_at)<requested_to and coalesce(ep.publish_at,ep.created_at)>=requested_from
    and ep.status in ('scheduled','published')
  order by 5;
end;
$$;

create or replace function public.adjust_ticket_inventory(
  target_ticket_type_id uuid, sales_delta integer default 0,
  refunds_delta integer default 0, complimentary_delta integer default 0
) returns void language plpgsql security definer set search_path = '' as $$
declare ticket public.ticket_types%rowtype; owner_id uuid; next_sales integer; next_refunds integer; next_complimentary integer; next_available integer; product_link record; product_delta integer;
begin
  select t.* into ticket from public.ticket_types t where t.id=target_ticket_type_id for update;
  if ticket.id is null then raise exception 'Tipo de ticket inexistente'; end if;
  select e.owner_id into owner_id from public.ticket_types t join public.experiences e on e.id=t.experience_id where t.id=target_ticket_type_id;
  if owner_id<>auth.uid() and public.current_profile_role()<>'super_admin' then raise exception 'Sin permisos'; end if;
  next_sales:=ticket.sales+sales_delta;next_refunds:=ticket.refunds+refunds_delta;next_complimentary:=ticket.complimentary+complimentary_delta;
  if least(next_sales,next_refunds,next_complimentary)<0 or next_refunds>next_sales then raise exception 'Movimiento de inventario invalido'; end if;
  next_available:=ticket.capacity-(next_sales-next_refunds)-next_complimentary;
  if next_available<0 then raise exception 'No hay capacidad suficiente'; end if;
  for product_link in
    select tp.product_id,tp.units_per_ticket,p.available_quantity
    from public.ticket_type_products tp join public.products p on p.id=tp.product_id
    where tp.ticket_type_id=target_ticket_type_id for update of p
  loop
    product_delta:=(sales_delta-refunds_delta+complimentary_delta)*product_link.units_per_ticket;
    if product_link.available_quantity-product_delta<0 then raise exception 'Inventario de producto insuficiente'; end if;
    update public.products set available_quantity=available_quantity-product_delta,updated_at=now()
    where id=product_link.product_id;
  end loop;
  update public.ticket_types set sales=next_sales,refunds=next_refunds,complimentary=next_complimentary,
    available_units=next_available,status=case when next_available=0 then 'sold_out' else status end
  where id=target_ticket_type_id;
end;
$$;

create or replace function public.get_operational_alerts()
returns table (severity text, alert_type text, title text, detail text, target_url text)
language plpgsql stable security definer set search_path = '' as $$
begin
  if public.current_profile_role()<>'super_admin' then raise exception 'Sin permisos'; end if;
  return query
  select 'high','application_overdue','Aplicacion pendiente',a.public_summary,
    '/revision-ecosistema' from public.project_applications a
  where a.status in ('submitted','under_review') and a.submitted_at<now()-interval '7 days'
  union all
  select 'medium','capacity_mismatch','Producto por confirmar',e.title,
    '/admin/ticketing' from public.experience_products ep join public.experiences e on e.id=ep.experience_id
  where ep.decision_status='proposed' or ep.committed_quantity<>ep.participant_quantity
  union all
  select 'high','budget_unapproved','Presupuesto sin aprobar',b.concept,
    '/admin/presupuesto' from public.project_budget_lines b join public.projects p on p.id=b.project_id
  where p.owner_id=auth.uid() and b.status in ('estimated','quoted') and b.estimated_date<=current_date+7
  union all
  select 'medium','low_occupancy','Ocupacion proyectada baja',e.title,
    '/admin/ticketing' from public.financial_scenarios s join public.experiences e on e.id=s.experience_id
  join public.projects p on p.id=s.project_id where p.owner_id=auth.uid() and s.name='base' and s.expected_occupancy<0.4;
end;
$$;

grant select,insert,update,delete on public.ticket_type_products,public.project_calendar_entries to authenticated;
revoke all on function public.list_master_calendar(timestamptz,timestamptz) from public;
revoke all on function public.get_operational_alerts() from public;
revoke all on function public.adjust_ticket_inventory(uuid,integer,integer,integer) from public;
grant execute on function public.list_master_calendar(timestamptz,timestamptz) to authenticated;
grant execute on function public.get_operational_alerts() to authenticated;
grant execute on function public.adjust_ticket_inventory(uuid,integer,integer,integer) to authenticated;

commit;
