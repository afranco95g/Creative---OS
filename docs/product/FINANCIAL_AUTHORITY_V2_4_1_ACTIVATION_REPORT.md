# Executive Engine V2.4.1 — Controlled Financial Activation Report

Date: 2026-08-10. Environment: configured remote Supabase URL. Activation status: **BLOCKED — no remote changes made**.

## Baseline and final regression gate

- `NEXT_PUBLIC_FINANCIAL_AUTHORITY_V2`: unset, therefore off.
- Tests: PASS, 6/6 executable suites.
- Typecheck: PASS.
- Financial administration script compilation: PASS.
- Production build: PASS. The sandbox attempt produced `spawn EPERM`; the permitted Windows build completed successfully.
- Build warnings are pre-existing lint warnings concerning `<img>`, explicit `any`, hook dependencies and unused values; no functional/build errors.

## Migration 036 audit

Migration 036 is additive and wrapped in a transaction. It now has an explicit migration-027 prerequisite, re-runnable policy creation, proposal FK, proposal timestamp trigger, event taxonomy constraint, unique idempotency indexes, optimistic locking and owner checks inside security-definer RPCs. It does not delete or merge budget data.

## Remote schema finding

Anonymous PostgREST schema probes (no writes) found:

- `projects`: present (RLS returned an empty collection).
- `project_applications`, `funding_opportunities`, `ecosystem_signals`, `project_reanalysis_audits`: present or hidden by RLS.
- `project_budget_lines`, `products`, `project_calendar_entries`, `project_snapshots`, `knowledge_sources`: missing from schema cache (`PGRST205`).
- `financial_proposals`, `financial_domain_events`: missing as expected before 036.

The remote migration history is selective/out of sequence. Migration 036 cannot be applied because its required table from migration 027 is absent.

## Credentials and backup gate

The local environment contains only the public Supabase URL and publishable key. It has no `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL`, linked Supabase CLI project or DDL credential. Consequently:

- a complete export of private `projects.graph` and `project_budget_lines` cannot be verified;
- administrative schema comparison cannot be completed;
- migration 036 cannot be applied;
- owner/non-owner JWT RLS tests cannot be executed;
- real divergence analysis cannot be represented as complete.

No partial backup was created and no public-key result was mislabeled as a complete report.

## Tooling delivered

- `npm run financial:backup`: remote read-only export with an administrative service key.
- `npm run financial:migration-preview`: remote read-only divergence report.
- Outputs are timestamped under ignored `out/financial-activation/`.
- Graph-only candidates remain `REVIEW` with warnings; no auto-merge exists.

## Corrections during certification

- Migration 036 now fails early with a clear prerequisite error when migration 027 is absent.
- Policy creation is re-runnable; proposal FK, timestamp trigger and financial-event taxonomy were added.
- Divergence detection now reports tax differences independently from total differences.
- Approximate-language certification exposed and corrected the singular phrase `Necesito 5 artistas`; the value remains proposed/estimated and requires confirmation.

## Certification result

**V2.4 ACTIVATION NOT CERTIFIED.** Local contracts and regression gates pass, but the mandatory database, backup, RLS, real-data divergence, controlled flag-on and rollback exercises cannot pass without the missing prerequisite schema and controlled administrative environment.

## Required next controlled action

1. Provide administrative access through an approved local secret mechanism.
2. Establish why migrations 027/030/032/034 are absent while 033 appears present.
3. Review and apply the missing prerequisite migration set in a staging environment; do not apply 027 blindly because it creates multiple operational domains.
4. Run and verify backup.
5. Apply 036 transactionally.
6. Execute the four-principal RLS matrix.
7. Generate real divergence preview.
8. Activate the feature flag only for named test projects.

Rollback remains immediate because the flag is still off and no remote data changed.
