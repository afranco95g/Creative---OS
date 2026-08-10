# ADR — Financial Authority V2

Status: Accepted for V2.4. Date: 2026-08-09.

## Decision

`public.project_budget_lines` is the sole operational financial authority. Project Knowledge owns semantic meaning, confidence and provenance and links to the canonical item through `operationalRef`. The budget module is a V1 narrative projection. Documents and application snapshots are immutable projections, never authorities.

`graph.tools.budgetLines` is retained for rollback. With `NEXT_PUBLIC_FINANCIAL_AUTHORITY_V2=false` it keeps current behavior. With V2 enabled, it is a compatibility snapshot/read projection and cannot win conflicts against the table.

## Why this authority

The table already supports income/expense, professional lifecycle states, provider, funding, dates, evidence URLs, cost center, normalized querying, RLS, reports and calendar relations. The graph model lacks direction, several states and operational metadata. Choosing the graph would make the richer production model a lossy projection.

## Roles

| Layer | Responsibility |
|---|---|
| Project Knowledge | Meaning, evidence, confidence, semantic supersession |
| `project_budget_lines` | Current operational amount/status/version |
| `graph.tools.budgetLines` | Reversible V1 compatibility snapshot |
| budget module | Narrative compatibility projection |
| documents/applications | Versioned export/snapshot |

## Mapping

| Graph `ProjectBudgetLine` | Canonical column | Notes |
|---|---|---|
| id | id | Preserve only when migration is explicitly approved |
| — | direction | Graph has no equivalent; conflict/manual choice |
| category | category | Direct |
| — | subcategory | Canonical only |
| concept | concept | Direct; normalized concept is fallback matching only |
| quantity | quantity | Direct |
| unit | unit | Direct |
| unitValue | unit_value | COP assumed only for legacy data |
| vatRate | vat | Graph stores percentage; table stores amount: conversion required |
| withholdingRate | withholding | Graph percentage vs table amount |
| otherTaxes | other_taxes | Amount |
| calculated | total | Compare; canonical generated total wins |
| status proposed | proposed | Direct after V2.4 migration |
| status approved | approved | Direct |
| status committed | committed | Direct |
| status paid | paid | Direct |
| responsible string | responsible_profile_id | Cannot auto-map names safely |
| provider | provider_name | Direct text |
| estimatedDate | estimated_date | Direct |
| actualDate | actual_date | Direct |
| source manual/creative-os | source manual/system | Conversation proposals use conversation |
| — | currency/version/idempotency_key/source_knowledge_ids | Canonical only |

## States

`proposed`, `estimated`, `quoted`, `approved`, `committed`, `invoiced`, `executed`, `paid`, `cancelled`.

Normal path is proposed → estimated → quoted → approved → committed → invoiced → paid, with executed before or after invoiced depending on operating policy. Valid business shortcuts are allowed; cancellation is terminal. Confirmation of an interpretation creates/updates knowledge; accepting a proposal creates an `estimated` item. It never implies `approved`.

## Commands and events

Commands: materialize knowledge, create/edit/reject/accept proposal, update/cancel item. Events include proposal created/accepted/rejected, item created/updated/status changed/cancelled and knowledge linked. Events contain project, entity, actor, time, before/after, reason and idempotency key. Production logs must not print full financial payloads.

## Idempotency and concurrency

Proposal identity derives from project + sorted knowledge IDs. Acceptance derives from project + proposal + command. Unique database indexes and an RPC transaction prevent retry duplication. Updates require an expected integer version; stale versions raise a serialization conflict instead of overwriting.

## Migration

1. Deploy additive schema, flag off.
2. Run read-only divergence reports.
3. Produce migration previews; never infer direction/responsible/tax conversion silently.
4. Migrate only admin/user-approved, conflict-free lines.
5. Turn on canonical reads per cohort.
6. Keep graph snapshots until rollback window closes.

There is no automatic merge in V2.4.

## RLS, privacy and snapshots

Existing budget RLS permits project owners only. V2 proposals and events use the same owner boundary. It is intentionally not widened to ecosystem or public roles. Financial data is not sent to OpenAlex/global knowledge/ecosystem. Submitted applications retain their stored snapshot; live budget changes do not mutate it.

## Rollback

Disable `NEXT_PUBLIC_FINANCIAL_AUTHORITY_V2`. No legacy graph lines are deleted and the migration is additive. Canonical rows remain available for later recovery. Do not drop V2 tables/columns as an operational rollback.

## Conflict resolution

Canonical table wins after V2 activation. Divergent graph data is reported, never overwritten automatically. A human chooses keep canonical, migrate legacy as a distinct line, or amend canonical through a versioned command.

