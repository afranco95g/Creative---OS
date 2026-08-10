# Executive Engine V2.4 — Financial Authority

## Authority

The normalized `project_budget_lines` model is the operational authority. Project Knowledge explains a figure; it does not act as a ledger. `graph.tools.budgetLines` remains available for V1 rollback and becomes a compatibility projection under the feature flag.

## Canonical model

V2.4 adds currency, source, knowledge IDs, proposal, evidence, work-item reference, period, idempotency key and version. Money is represented in TypeScript as `{ amount, currency }`; COP is supported and no FX conversion is implemented.

## Proposal flow

Only confirmed/validated `financial_fact` entities can materialize. Materialization creates a pending proposal, not a budget item. Interpretation confirmation and budget approval remain separate. Accepting through the transactional RPC creates exactly one estimated canonical item, even after retry.

## Reverse flow

Canonical updates require `expectedVersion`. A successful edit creates a domain event and a semantic change summary. Knowledge sync supersedes the prior linked financial fact and creates the current fact with `operationalRef`. Consistency must then be evaluated by the calling project workflow; V1 scores are not recalculated.

## Divergence and migration

The read-only detector reports graph-only, table-only, unit-price, status, total and responsible differences. It always returns `autoMerged: false`. Taxes are explicitly unsafe to auto-map because graph stores rates and the table stores amounts.

## Funding and revenue semantics

Funding gap equals active costs minus confirmed/approved funding, floored at zero. Intended sale price is forecast semantics, not realized income. Cost-to-price difference is called preliminary spread, never profit, because scope, taxes, overhead, fulfillment and realized sales may be unknown.

## Documents and applications

Financial events prepare invalidation with a reason; V2.4 does not regenerate documents. Submitted application snapshots remain immutable and are not joined to the live financial authority.

## Privacy, RLS and observability

Financial rows, proposals and events remain private to project owners under RLS. Development tracing should log stages and identifiers, not complete financial payloads. No external knowledge provider receives financial state.

## Feature flag and rollback

`NEXT_PUBLIC_FINANCIAL_AUTHORITY_V2=true` activates V2 consumers as they are introduced. Off preserves current V1 behavior. The schema is additive and graph data is not deleted.

## Limitations

- No automatic migration or conflict merge.
- No FX, tax advice, accounting ledger, bank reconciliation or cash flow.
- No Work Engine; only a stable optional relationship is reserved.
- Minimal proposal UI integration remains deliberately smaller than Budget V2.
- Team membership beyond project ownership is not widened because the current project authorization model has no canonical member policy.

