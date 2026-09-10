# Financial Authority V2 — Manual Supabase Runbook

This runbook is for manual execution only. Do not run migrations 027 or 036. Use `database/037_reconcile_financial_authority.sql` as the canonical source and execute it in one transaction; the block boundaries below are review and verification checkpoints. Never continue after a failed verification.

## BLOCK 0 — Preflight (read only)

```sql
select to_regclass('public.projects') as projects,
       to_regclass('public.profiles') as profiles,
       to_regprocedure('public.set_updated_at()') as set_updated_at;

select table_name
from information_schema.tables
where table_schema = 'public'
  and table_name in ('project_budget_lines','financial_proposals','financial_domain_events')
order by table_name;

select column_name, udt_name, is_nullable
from information_schema.columns
where table_schema = 'public' and table_name = 'projects'
  and column_name in ('id','owner_id');
```

Expected: prerequisites are non-null, `projects.id` and `projects.owner_id` are UUIDs, and the three target tables are absent. If any target table exists, inspect it and allow 037's compatibility guard to decide; do not patch it ad hoc.

## BLOCK 1 — `project_budget_lines`

Execute the corresponding table definition from 037.

### VERIFY 1

```sql
select column_name, data_type, udt_name, is_nullable, column_default, is_generated, generation_expression
from information_schema.columns
where table_schema='public' and table_name='project_budget_lines'
order by ordinal_position;

select conname, pg_get_constraintdef(oid)
from pg_constraint where conrelid='public.project_budget_lines'::regclass
order by conname;
```

Confirm `version default 1`, numeric money columns, `currency default 'COP'`, the project cascade FK, direction/status checks, and generated `total`.

## BLOCK 2 — `financial_proposals`

Execute the corresponding table definition and the two cross-table FKs from 037.

### VERIFY 2

```sql
select column_name, data_type, udt_name, is_nullable, column_default
from information_schema.columns
where table_schema='public' and table_name='financial_proposals'
order by ordinal_position;

select conname, pg_get_constraintdef(oid)
from pg_constraint where conrelid='public.financial_proposals'::regclass
order by conname;
```

Confirm `accepted_financial_item_id` references `project_budget_lines(id)` and status accepts only pending, accepted, edited, rejected, or expired.

## BLOCK 3 — `financial_domain_events`

Execute its table definition from 037.

### VERIFY 3

```sql
select column_name, data_type, udt_name, is_nullable, column_default
from information_schema.columns
where table_schema='public' and table_name='financial_domain_events'
order by ordinal_position;

select conname, pg_get_constraintdef(oid)
from pg_constraint where conrelid='public.financial_domain_events'::regclass
order by conname;
```

## BLOCK 4 — Functions/RPC

Execute `accept_financial_proposal` and `update_financial_item_v2`, including revokes/grants.

### VERIFY 4

```sql
select n.nspname, p.proname, pg_get_function_identity_arguments(p.oid) as arguments,
       p.prosecdef as security_definer, p.proconfig
from pg_proc p join pg_namespace n on n.oid=p.pronamespace
where n.nspname='public'
  and p.proname in ('accept_financial_proposal','update_financial_item_v2')
order by p.proname;

select routine_name, grantee, privilege_type
from information_schema.routine_privileges
where specific_schema='public'
  and routine_name in ('accept_financial_proposal','update_financial_item_v2')
order by routine_name, grantee;
```

Both RPCs must be `SECURITY DEFINER`, have `search_path=""`, and expose execution only to `authenticated` (plus object owners/platform roles).

## BLOCK 5 — RLS

Execute the RLS and grants section from 037.

### VERIFY 5

```sql
select relname, relrowsecurity, relforcerowsecurity
from pg_class where oid in (
  'public.project_budget_lines'::regclass,
  'public.financial_proposals'::regclass,
  'public.financial_domain_events'::regclass
)
order by relname;

select tablename, policyname, cmd, roles, qual, with_check
from pg_policies
where schemaname='public'
  and tablename in ('project_budget_lines','financial_proposals','financial_domain_events')
order by tablename, cmd, policyname;
```

Expected: owner-only SELECT/INSERT/UPDATE for lines and proposals; owner-only SELECT for events. No policy grants journalist, media_admin, ecosystem_admin, finance_admin, or super_admin access.

## BLOCK 6 — Indexes and triggers

Execute the index and trigger statements from 037.

### FINAL VERIFY

```sql
select tablename, indexname, indexdef
from pg_indexes
where schemaname='public'
  and tablename in ('project_budget_lines','financial_proposals','financial_domain_events')
order by tablename, indexname;

select event_object_table, trigger_name, action_timing, event_manipulation, action_statement
from information_schema.triggers
where trigger_schema='public'
  and event_object_table in ('project_budget_lines','financial_proposals','financial_domain_events')
order by event_object_table, trigger_name;

select count(*) as rows_written_during_install from (
  select id from public.project_budget_lines
  union all select id from public.financial_proposals
  union all select id from public.financial_domain_events
) rows_created;
```

For a fresh install, `rows_written_during_install` must be zero.

## RLS manual test plan

Use two normal authenticated test accounts, never a service-role session.

1. Owner A creates a private test project owned by A.
2. As A, insert/select/update a proposed budget line and insert/select a pending proposal for that project. All should succeed.
3. As A, call `accept_financial_proposal`; verify one line, one accepted proposal link, and three events. Repeat with the same command key; verify no duplicate line/event.
4. As A, call `update_financial_item_v2` with version 1; verify version 2 and one event. Retry the same command key; verify no second update. Use stale version 1 with a new command key; expect SQLSTATE `40001`.
5. As Unauthorized User B, SELECT/INSERT/UPDATE against A's lines and proposals must return no rows or fail RLS. Event SELECT must return no rows. Both RPCs against A's IDs must fail.
6. Confirm neither user can physically delete financial rows through the frontend role.

## Rollback (documented only; do not execute)

Once real data exists, do not drop schema. Disable the feature through the application feature flag and preserve all financial tables/events.

Only for an unused installation with verified zero rows, execute in this order inside a transaction:

```sql
begin;
drop function if exists public.update_financial_item_v2(uuid,integer,jsonb,text);
drop function if exists public.accept_financial_proposal(uuid,text);
drop policy if exists "Project owners read financial events" on public.financial_domain_events;
drop policy if exists "Project owners update financial proposals" on public.financial_proposals;
drop policy if exists "Project owners create financial proposals" on public.financial_proposals;
drop policy if exists "Project owners read financial proposals" on public.financial_proposals;
drop policy if exists "Project owners update budget" on public.project_budget_lines;
drop policy if exists "Project owners create budget" on public.project_budget_lines;
drop policy if exists "Project owners read budget" on public.project_budget_lines;
drop trigger if exists financial_proposals_set_updated_at on public.financial_proposals;
drop trigger if exists project_budget_lines_set_updated_at on public.project_budget_lines;
drop table if exists public.financial_domain_events;
drop table if exists public.financial_proposals;
drop table if exists public.project_budget_lines;
commit;
```
