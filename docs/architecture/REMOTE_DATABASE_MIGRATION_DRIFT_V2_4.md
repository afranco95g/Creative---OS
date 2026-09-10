# Remote Database Migration Drift — Executive Engine V2.4.1

Date: 2026-08-10. Assessment mode: local SQL inspection plus anonymous PostgREST schema probes. No DDL or remote writes were performed.

## Environment identity

| Signal | Value | Confidence |
|---|---|---|
| Supabase project ref | `wmzhfuljbrxbzktnsvqp` | Confirmed from configured URL |
| Supabase environment label | Unknown | No repository metadata identifies this ref as staging or production |
| Linked Vercel project | `cultura-esta-plataforma-test` (`prj_j16EmBSj8rNB60LqOQdjw2wIk77q`) | Confirmed locally, but does not prove the Supabase database is staging |
| Administrative connection | Unavailable | No linked Supabase CLI, `DATABASE_URL`, service-role key or access token |
| Feature flag | OFF/unset | Confirmed locally only; deployed environment variables cannot be audited with available access |

Because the database label and production status are not established, this environment is treated as **unknown/production-like**. Migration is prohibited until controlled staging is identified.

## Local migration inventory

| Migration | Objects and changes | Dependencies | RLS/RPC/index/data effects | Replay risk |
|---|---|---|---|---|
| 027 Financial operations | Creates `commercial_policies`, `products`, `experience_products`, `ticket_types`, `project_budget_lines`, `tax_rules`, `financial_scenarios` | profiles, projects, experiences, actor-account functions, admin audit | Enables RLS on 7 tables; multiple policies/triggers; product review and scenario RPCs; financial indexes | **High**: not a financial-only prerequisite; policy creation is not uniformly drop-first |
| 028 Media boundary | Restrictive policies and write-block triggers over experiences, registrations, reports, funding | tables/functions from earlier migrations | Replaces/creates security boundaries | Medium/high: changes live authorization behavior |
| 029 Secure operational RPC | Creates five security-definer read RPCs and revokes legacy RPC execution | operational experience/funding tables, roles | Permission changes, no data migration | Medium: assumes legacy functions exist for revoke/signatures |
| 030 Master operations | Alters ticket types; creates ticket-product and project-calendar tables; storage policies/bucket; alerts/calendar/inventory RPCs | **027 tables**, experiences, products, storage, admin audit | RLS, triggers, one bucket upsert, policies, grants | **High**: crosses ticketing, calendar, storage and finance |
| 031 Participant lifecycle | Replaces project workflow triggers and owner delete policy | projects and workflow functions | Authorization/workflow behavior changes | High on a drifted production schema |
| 032 Project sync/knowledge | Vector extension; project snapshots; knowledge sources/chunks/logs | projects, profiles, pgvector | RLS, indexes, grants; no row rewrite | Medium; extension availability required |
| 033 Intake/application routes | Alters project applications; creates reanalysis audits; agenda approval RPC | project applications, projects, profiles, experiences | RLS/policy/grant; schema extensions; operational RPC | Medium/high; API-observable evidence suggests partial/present despite later objects missing |
| 034 Knowledge metadata | Creates or evolves knowledge tables and indexes | projects, vector extension | Replaces policies, adds many columns | Medium; handles some partial states but assumes compatible existing columns |
| 035 Collections/ingestion | Extends knowledge metadata/chunks and creates ingestion log | 034 knowledge objects | Constraints/indexes/RLS; no content ingestion | Medium; fails if knowledge prerequisites absent |
| 036 Financial Authority | Extends `project_budget_lines`; creates proposals/events, RPCs, policies, FK, triggers and idempotency index | detailed below | Additive, transactional, no legacy auto-migration | Blocked until financial prerequisite exists and is verified |

All 027–035 files use transactions. Static inspection found no `DELETE FROM`, truncation or non-policy/non-trigger `DROP` statements. That does not make blind replay safe: policies, triggers, functions, extensions, storage configuration and cross-domain tables can still alter behavior or fail on partial schemas.

## Special audit: migration 027

### Financial prerequisites useful to 036

- `public.project_budget_lines` and its primary/project foreign keys.
- Columns used by 036/RPCs: `id`, `project_id`, `direction`, `category`, `concept`, `description`, `quantity`, `unit`, `unit_value`, `status`, `notes`, `total`, `source_suggestion`, `suggestion_confirmed_by`, `created_at`, `updated_at`.
- RLS enablement and owner policy.
- Supporting references: `public.projects`, `public.profiles` and `auth.uid()`.

### Other operational domains bundled into 027

- Commercial policies and governed-change triggers.
- Product catalog/review workflows.
- Experience-product allocation.
- Ticket types.
- Tax rules.
- Financial scenarios and scenario calculation RPC.
- Admin audit integrations and seven groups of RLS policies/grants.

Conclusion: replaying 027 merely to obtain `project_budget_lines` is not justified on an unknown remote database.

## Dependency graph for migration 036

```text
auth.uid() ───────────────┐
public.profiles ──────────┼─> financial_proposals / financial_domain_events
public.projects ──────────┤             │
public.set_updated_at() ──┤             └─> proposal trigger
gen_random_uuid() ────────┤
public.project_budget_lines (027) ──────> columns + status constraint + idempotency index
                                      ├─> proposal FK
                                      ├─> accept_financial_proposal RPC
                                      └─> update_financial_item_v2 RPC
```

### Required before 036

- `public.project_budget_lines` with the columns listed above.
- `public.projects(id, owner_id)`.
- `public.profiles(id)`.
- `public.set_updated_at()`.
- `auth.uid()`, `gen_random_uuid()`, PL/pgSQL and normal catalog access (`to_regclass`, `pg_constraint`).
- Compatible existing budget status constraint and generated `total` expression.

### Created by 036

- Budget columns: currency, work-item reference placeholder, period, evidence, source, Knowledge IDs, proposal ID, idempotency key and version.
- Expanded status constraint and unique `(project_id,idempotency_key)` index.
- `financial_proposals`, `financial_domain_events`.
- Proposal FK, timestamp trigger, owner policies and table grants.
- Acceptance and optimistic-update RPCs.

### Optional/not enforced in V2.4.1

- `related_work_item_id` has no FK because Work Engine is outside scope.
- No FX, tax reasoning, member-role expansion or legacy data migration.

## API-observable remote schema

These observations describe PostgREST schema-cache visibility, not direct PostgreSQL catalog truth.

| Object | API observation | Matrix state |
|---|---|---|
| `projects` | Present; anonymous read returns empty under RLS | History unknown + present |
| `project_applications` | Present or hidden by RLS | History unknown + present |
| `funding_opportunities` | Present or hidden by RLS | History unknown + present |
| `ecosystem_signals` | Present or hidden by RLS | History unknown + present |
| `project_reanalysis_audits` | Present or hidden; introduced by 033 | History unknown + present |
| `project_budget_lines` | `PGRST205` | History unknown + API-missing |
| `products` | `PGRST205` | History unknown + API-missing |
| `project_calendar_entries` | `PGRST205` | History unknown + API-missing |
| `project_snapshots` | `PGRST205` | History unknown + API-missing |
| `knowledge_sources` | `PGRST205` | History unknown + API-missing |
| `financial_proposals` | `PGRST205` | Not applied + API-missing |
| `financial_domain_events` | `PGRST205` | Not applied + API-missing |

Evidence is consistent with out-of-sequence/selective application: a 033 object is visible while representative 027, 030, 032 and 034 objects are not. Direct catalog access is required to distinguish truly absent objects from schema-cache/exposure issues.

## Remote migration history

Unavailable. No administrative connection can query Supabase migration metadata. Therefore no object can honestly be classified as `RECORDED + PRESENT`, `RECORDED + MISSING`, `NOT RECORDED + PRESENT` or `NOT RECORDED + MISSING`; only `history unknown + API observation` is currently supported.

## Drift and remediation decision

### 027 decision

**D — BLOCKED: insufficient evidence.**

Do not apply 027 unchanged to the configured unknown environment. Do not rewrite historical 027. Once direct schema/history inspection is available:

- choose **A** only for a clean, disposable staging database rebuilt in order;
- choose **B** if the complete compatible financial prerequisite already exists outside PostgREST;
- choose **C**, a new additive forward reconciliation migration, if staging cloned from the remote schema is partial/divergent.

### Recommended staging strategy

Prefer **A: clean staging rebuilt from ordered migrations**, because current history is unknown and observable schema is internally inconsistent. This yields reproducible migration history and avoids normalizing production drift by guesswork. Use strategy B only if organizational tooling provides a trustworthy staging clone and direct catalog comparison.

## Exact next gates

1. Label the Supabase ref and prove it is staging; otherwise create a separate staging project.
2. Configure approved administrative secrets outside git.
3. Query PostgreSQL catalogs and Supabase migration history directly.
4. Run `npm run financial:backup`; verify environment label, counts, files and SHA-256 manifest, then move to approved encrypted storage.
5. Run `npm run financial:migration-preview`; confirm read-only output.
6. In clean staging, apply the ordered migration set using the repository-supported migration mechanism.
7. Verify `project_budget_lines`, then run 036 preflight and migration.
8. Execute owner/non-owner/anonymous RLS and remote RPC tests.
9. Keep the feature flag off after readiness work.

## Readiness conclusion

**V2.4 REMOTE DATABASE NOT READY.** Missing capabilities: confirmed staging identity, DDL, direct private database read, verified backup, migration-history access and authenticated RLS test identities. Production modifications: none.

