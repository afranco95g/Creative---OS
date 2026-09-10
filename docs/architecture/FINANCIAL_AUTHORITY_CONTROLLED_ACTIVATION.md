# Financial Authority V2.4.1 — Controlled Activation

## Safety gate

Keep `NEXT_PUBLIC_FINANCIAL_AUTHORITY_V2` unset or `false` until every gate passes. Migration 036 is additive and transactional, but activation is blocked if schema inspection, backup, migration, RLS tests or divergence preview fails.

## Required administrative access

- `SUPABASE_SERVICE_ROLE_KEY` for complete read-only backup and preview. Never expose it to the browser or commit it.
- A linked Supabase CLI session or `DATABASE_URL` with DDL rights to inspect and apply migration 036.
- Two disposable authenticated test accounts: one project owner and one non-owner. Anonymous tests use no session.

The publishable key is insufficient for DDL, full backup or owner/non-owner verification.

## Pre-migration runbook

1. Run `npm test`, `npm run typecheck`, `npm run build`.
2. Confirm the flag is off.
3. Compare remote migrations, columns, constraints, indexes, functions and policies with migration 036.
4. Run `npm run financial:backup`. It reads Supabase and writes timestamped `projects-graph.json`, `project-budget-lines.json` and `manifest.json` under ignored `out/financial-activation/`.
5. Verify the manifest counts and JSON readability. Copy the directory to approved encrypted storage; it contains private financial data.
6. Apply 036 as one transaction. Record timestamp and output. On any error, stop; do not activate.

## RLS matrix

| Principal | SELECT/INSERT/UPDATE budget | Proposals | Events |
|---|---|---|---|
| Project owner | Allowed | Manage | Read |
| Authenticated non-owner | Denied/empty | Denied/empty | Denied/empty |
| Anonymous | No grants | No grants | No grants |
| Existing admin roles | No new bypass | No new bypass | No new bypass |

Test with real JWTs and disposable rows inside a test project. Do not weaken policies to make the matrix pass. RPCs also verify `projects.owner_id = auth.uid()`.

## Divergence preview

Run `npm run financial:migration-preview`. It is read-only and emits a timestamped JSON report. Graph-only lines become `REVIEW` candidates, never automatic imports, because legacy data lacks direction and stores tax percentages/responsible text differently. Value, status, total, tax and responsible differences are conflicts. Table-only rows are retained/ignored from migration because canonical data already exists.

## Activation and rollback

Activate only for named test projects after zero unresolved destructive conflicts. Set the feature flag in a controlled environment, redeploy, exercise proposal acceptance/retry/concurrent update, then verify canonical row, Knowledge sourceRef, event and graph compatibility projection. Rollback is immediate: unset the flag and redeploy. Do not delete canonical rows or restore the backup unless a separately approved recovery incident requires it.

