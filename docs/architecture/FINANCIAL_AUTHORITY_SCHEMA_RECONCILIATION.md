# Financial Authority Schema Reconciliation Report

## Remote Facts Used

The confirmed remote schema has `projects`, `profiles`, the ecosystem/application/editorial domains, `set_updated_at()`, and project ownership through `projects.owner_id`. It has no application migration-history table and none of `project_budget_lines`, `financial_proposals`, or `financial_domain_events`. This design treats those observations as facts and makes no remote changes.

## Why 027 Is Not Used

Migration 027 bundles products, ticketing, tax rules, commercial policies, scenarios, admin functions, and broad operational policies. Applying it would install unrelated domains and recreate assumptions that were not verified remotely. Migration 037 extracts only the financial-line storage contract needed by V2.4 and adds the V2.4 proposal/event/RPC contracts.

## Canonical Tables

- `project_budget_lines` is the canonical operational ledger. It retains the established persisted names consumed by the UI and migration tooling: `unit_value`, `provider_name`, `responsible_profile_id`, and `estimated_date`.
- `financial_proposals` stores unaccepted suggestions separately. Acceptance never implies financial approval; it copies `proposed_status` (normally `estimated`).
- `financial_domain_events` is an immutable-by-privilege operational audit stream, not a general event-sourcing system.

All project FKs use `on delete cascade`, matching project-owned tables. Profile attribution uses `set null` or `restrict` according to whether history or proposal authorship must remain valid.

## Calculation Policy

The persisted formula is the existing 027/UI contract:

```text
subtotal = quantity × unit_value
total = max(0, subtotal − discount + vat − withholding − ica + other_taxes)
```

Tax fields are monetary amounts, not rates. The V2.4 update RPC changes only quantity, unit value, status, and notes; PostgreSQL recalculates the generated total using the same persisted formula. There is no FX conversion.

## RLS Model

Every policy resolves ownership through `projects.id → projects.owner_id = auth.uid()`. Financial rows do not duplicate owner IDs. Lines and proposals allow owner SELECT/INSERT/UPDATE; events allow owner SELECT only. There is no authenticated DELETE grant and no role-based exception for journalist, media_admin, ecosystem_admin, finance_admin, or super_admin.

## RPC Model

Both RPCs are `SECURITY DEFINER` with an empty search path, fully qualified objects, mandatory authentication, and project ownership validation. `accept_financial_proposal` locks the proposal, creates exactly one line, records the accepted item, writes three bounded events, and returns the canonical row. `update_financial_item_v2` accepts only the five keys used by the service, locks the row, checks the expected version, increments version, and records one event. Neither RPC writes ProjectGraph.

## Idempotency

Proposal creation is unique on `(project_id, idempotency_key)`, matching the Supabase `upsert(... onConflict: 'project_id,idempotency_key')`. Accepted budget items are unique on the same pair and use `financial-command:<projectId>:<proposalId>:accept`. Domain commands/events are unique on `(project_id, idempotency_key)`. A repeated acceptance returns the linked item; a repeated update command returns the current item without another mutation.

## Concurrency

`project_budget_lines.version` starts at 1. Updates lock the owned row and require `version = expected_version`; stale writes raise SQLSTATE `40001`, which the frontend already maps to its controlled conflict message. Successful writes increment version exactly once.

## Delete Semantics

Authenticated clients receive no DELETE privilege or policy. Financial lines that should no longer participate are changed to `cancelled` through the versioned update RPC, preserving event history. Physical deletion is limited to a verified unused rollback or project cascade deletion.

## 036/037 Decision

**Decision A: 036 is superseded and must not be executed remotely.** Migration 037 integrates the necessary V2.4 additions from 036 but creates the missing base table directly against the confirmed remote prerequisites. Running 036 afterward would duplicate contracts and reintroduce its dependency on 027.

## Code ↔ SQL Contract Matrix

| CODE EXPECTS | SQL PROVIDES | MATCH |
|---|---|---|
| `project_budget_lines` | `public.project_budget_lines` | PASS |
| `financial_proposals` upsert conflict `project_id,idempotency_key` | unique index on those columns | PASS |
| `financial_domain_events` | bounded event table | PASS |
| `unitPrice` mapped from `unit_value` | `unit_value numeric(14,2)` | PASS |
| `provider` mapped from `provider_name` | `provider_name text` | PASS |
| `responsibleId` mapped from `responsible_profile_id` | profile FK | PASS |
| `expectedDate` mapped from `estimated_date` | `estimated_date date` | PASS |
| `sourceKnowledgeIds` | `source_knowledge_ids uuid[]` | PASS |
| `acceptedFinancialItemId` | `accepted_financial_item_id` FK | PASS |
| item statuses: proposed through cancelled | identical CHECK taxonomy | PASS |
| proposal statuses: pending/accepted/edited/rejected/expired | identical CHECK taxonomy | PASS |
| eight V2.4 event types | identical CHECK taxonomy | PASS |
| `accept_financial_proposal(target_proposal_id,command_key)` | exact RPC signature | PASS |
| `update_financial_item_v2(target_item_id,expected_version,patch,command_key)` | exact RPC signature | PASS |
| stale update surfaced as conflict | SQLSTATE `40001` | PASS |
| owner-private financial data | ownership-based RLS without admin exceptions | PASS |

`ica` remains a persisted monetary component because the existing BudgetManager and 027 formula require it, although `CanonicalFinancialItem` currently omits it. No new TypeScript-facing naming convention is introduced.

## Manual Execution Blocks

The executable migration is transactional. The manual review sequence and checkpoint boundaries are documented in `docs/database/FINANCIAL_AUTHORITY_MANUAL_SUPABASE_RUNBOOK.md`: preflight, three tables, RPCs, RLS, then indexes/triggers. The source SQL remains authoritative if copying blocks into Supabase SQL Editor.

## Verification Queries

The runbook verifies prerequisites, columns and generated expressions, constraints/FKs, function security and search path, routine privileges, RLS policies, indexes, triggers, and zero install-time data. It never treats “Success. No rows returned” as schema proof.

## Rollback

Before real data, rollback removes RPCs, policies, triggers, and tables in dependency order and only after confirming all three tables are empty. After activation, rollback is application feature disablement with tables/events preserved.

## Tests

Required local gates are `npm test`, `npm run typecheck`, and `npm run build`. No test in this reconciliation connects to Supabase or executes the migration remotely.

## GO / NO-GO

**NO-GO for remote execution until** a human completes BLOCK 0, reviews the migration as a single transaction, confirms the target project, and prepares Owner A/User B accounts for post-install RLS testing. **GO for manual staged execution** only when every verification checkpoint matches this report. Migration 027 and 036 remain NO-GO remotely.
