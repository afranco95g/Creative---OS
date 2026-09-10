# Creative OS — Remote Database State Audit

Date: 2026-08-10. Supabase ref: `wmzhfuljbrxbzktnsvqp`. Environment classification: **unknown/production-like**. Remote writes: none.

## Evidence boundary

The repository has only a publishable key. Anonymous PostgREST probes can establish API visibility but cannot inspect PostgreSQL catalogs, private row counts, migration metadata, constraints, policies or hidden schemas. The Vercel project name contains “test”, but this does not establish that the Supabase ref is staging.

| Migration | Expected representative objects | Remote API observation | Status | Mismatch/risk | Required action |
|---|---|---|---|---|---|
| 001–004 | profiles, projects, core functions | projects present; other core contracts not admin-verified | UNKNOWN/PARTIAL | Core app works but catalog shape unknown | Direct catalog inspection |
| 011–018 | experiences, registrations, reports, funding | funding opportunity API present; remainder not exhaustively admin-audited | UNKNOWN | API presence cannot prove full migration | Catalog/history matrix |
| 020/022 | project applications/workflows | project_applications present | UNKNOWN/PRESENT | Could be manual or partial | Inspect columns/functions/history |
| 026 | admin audit, ecosystem signals | ecosystem_signals present | UNKNOWN/PRESENT | Audit prerequisites not verified | Inspect catalog |
| 027 | products, ticket types, budget, tax/scenarios | products and project_budget_lines return PGRST205 | UNKNOWN/API-MISSING | 036 prerequisite unavailable | Do not replay; inspect directly/staging |
| 030 | calendar/ticket products | project_calendar_entries PGRST205 | UNKNOWN/API-MISSING | Consistent with missing 027 | No action for 036 |
| 032 | snapshots/knowledge | project_snapshots and knowledge_sources PGRST205 | UNKNOWN/API-MISSING | Migration absent/hidden/partial | Catalog inspection |
| 033 | application fields, reanalysis audits/RPC | project_reanalysis_audits present or RLS-hidden | UNKNOWN/API-PRESENT | Evidence of selective/out-of-order execution | Compare columns/functions/history |
| 034 | knowledge metadata | knowledge_sources PGRST205 | UNKNOWN/API-MISSING | 033 observable while 034 absent | Catalog inspection |
| 035 | knowledge collections/log | not admin-verifiable | UNKNOWN | Prerequisite 034 unavailable | No financial action |
| 036 | proposals/events/budget extensions/RPC | proposals/events and RPC absent | NOT APPLIED/API-MISSING | Expected current state | Apply only after staging gates |

## Forensic answers

### Why can 033 objects exist while earlier objects are missing?

The SQL repository permits individual scripts to be executed manually. Migration 033 depends on 020 and 011 but not on 027, 030 or 032, so selective application is technically possible. The evidence is consistent with manual/selective deployment, but does not prove who or how. A branch, dashboard SQL execution, historical migration renaming or schema-cache exposure difference are also possible.

### Were scripts applied manually?

UNKNOWN. There is no accessible Supabase migration history, audit record or DDL connection. It would be incorrect to claim manual execution as fact.

### Are migrations partially applied?

Likely at the environment-set level, but UNKNOWN per individual migration. PostgREST proves only schema-cache visibility. Direct `pg_class`, `pg_attribute`, `pg_constraint`, `pg_proc`, `pg_trigger`, `pg_policy`, `pg_indexes` and Supabase migration-history queries are required.

### Could equivalent objects have other names?

UNKNOWN. Anonymous REST cannot search other schemas or equivalent table/function names.

### Is real data present?

UNKNOWN. RLS makes anonymous empty results non-evidence of zero rows. No service-level read was used.

## Staging decision

No controlled staging environment has been established. Preferred strategy is a separate clean Supabase staging project rebuilt from ordered migrations. It supports destructive fixture cleanup without risking real users and produces a trustworthy migration history. Database branching or cloning can be considered only when the plan and administrative tooling are confirmed.

## Required administrative access

Configure secrets locally or through an approved secret manager, never source control:

- Supabase CLI access token plus explicit project linking, or a staging `DATABASE_URL` with DDL rights;
- service-role key for private read-only backup/preview;
- two disposable staging auth identities/JWTs.

The operator must set `FINANCIAL_ACTIVATION_ENVIRONMENT=staging` and confirm the project ref before scripts are allowed to produce administrative artifacts.

## Current certification

Remote schema inventory: FAIL. Migration forensics: incomplete. Staging: unavailable. Backup: not executed. Minimal path: defined conditionally. Migration 036: not applied. Production modified: NO.

