# Financial Authority V2.4 — Production Migration Plan

This is a release plan, not authorization to modify production. Production remains unchanged and the feature flag remains off.

## Decision gates

1. Staging identity, administrative access and test users certified.
2. Direct schema and migration-history audit complete.
3. Backup created, hashed, readable and moved to approved secure storage.
4. Minimal prerequisite path approved.
5. 036 and all RLS/RPC/E2E tests pass in staging.
6. Controlled Activation Certification passes separately.
7. Named release owner approves production window.

## Preflight

- Record Supabase project ref/host and deployment ID; independently confirm environment label.
- Confirm `NEXT_PUBLIC_FINANCIAL_AUTHORITY_V2` is unset/false.
- Run tests, typecheck and build.
- Query catalog objects, migration history, database size and active connections.
- Verify required functions and V1 budget contract.
- Stop on unexpected schema, incompatible generated total/status, or unresolved partial migration.

## Backup

Run `npm run financial:backup` with service-level read access. In production, extend the approved database backup process to include at least profiles, projects, project-related tables and every altered table. Verify manifest counts and SHA-256. Store outside git in encrypted, access-controlled storage. A backup file on the developer workstation alone is not a release recovery point.

## Exact migration decision and order

Do not replay 027 on production.

- If direct inspection proves a complete compatible 027 financial schema: apply 036 only.
- If the financial prerequisite is absent/partial: apply a separately reviewed additive forward reconciliation migration (potential 037) first, then 036.
- Never mark 027 applied without matching objects/contracts.

The exact production list cannot be finalized until staging forensics chooses between these branches.

## Expected post-036 schema

- Extended `project_budget_lines` with currency, source, evidence, Knowledge IDs, proposal, idempotency and version.
- `financial_proposals` and `financial_domain_events`.
- Proposal FK and timestamp trigger.
- Unique budget/proposal/event idempotency contracts.
- `accept_financial_proposal(uuid,text)` and `update_financial_item_v2(uuid,integer,jsonb,text)`.
- Owner-only RLS; no anon/global-auth/admin expansion.

## Verification queries

Use direct catalog queries for tables/columns, `pg_constraint`, `pg_indexes`, `pg_proc`, `pg_trigger`, `pg_policy` and `relrowsecurity`. Verify RPC signatures and execute behavioral tests with owner/non-owner/anonymous sessions. Keep query output free of sensitive row values.

## Data safety and divergence

- Run read-only migration preview before flag activation.
- Report graph-only/table-only/value/status/tax/responsible conflicts.
- Require human review for every graph-only candidate because legacy direction, tax representation and responsible identity are ambiguous.
- No automatic import or conflict resolution.

## Feature flag rollout

1. Deploy schema with flag off.
2. Observe errors, RPC latency, RLS denials and duplicate-key/version conflicts.
3. Run a smoke test on an approved non-sensitive production test project only after certification.
4. Enable a separately approved named cohort; never global-on initially.

## Monitoring

- RPC error/latency rate.
- idempotency constraint conflicts distinguished from unexpected failures.
- optimistic concurrency conflicts.
- proposal-to-item counts and duplicate business effects.
- RLS authorization anomalies.
- divergence counts and graph/canonical projection failures.
- no full financial payloads in production logs.

## Rollback

Unset the feature flag and redeploy. Preserve canonical rows and legacy graph data. Do not drop V2 tables or restore backups merely to roll back UI behavior. Database restoration requires a separately declared data-corruption incident and release-owner approval.

## Decision points

- UNKNOWN environment → stop.
- Backup unverified → stop.
- Any staging RLS leakage → stop.
- Migration/RPC failure → transaction rollback and stop.
- Divergence conflict → human review, never merge.
- Staging certification incomplete → no production migration.

