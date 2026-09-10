# Creative OS — Database Migration Dependency Graph

Date: 2026-08-10. Scope: static inspection of every `database/*.sql` migration, 001–036. Historical migrations were not rewritten.

## Ordered local inventory

“Re-run” means against an unknown/partially drifted database, not a clean database. `Conditional` requires direct schema comparison because `CREATE TABLE IF NOT EXISTS` does not reconcile incompatible columns and several policies are not drop-first.

| Migration | Purpose | Tables created / altered | Functions / RPC | RLS | Primary dependencies | Domains | Re-run | Required for FA |
|---|---|---|---|---|---|---|---|---|
| 001 | Profiles/auth bootstrap | profiles | handle_new_user, set_updated_at | profile policies | auth.users | Identity | Conditional | **Yes**: profiles, timestamp function |
| 002 | People | people | — | owner/public policies | profiles | Identity/ecosystem | Conditional | No |
| 003 | Actor accounts | spaces, funders, memberships; people/profiles | roles, slugs, owner membership | 19 policies | profiles, people | Identity/access | Unsafe blind | **Yes**: current role helpers used by 027, not by 036 core |
| 004 | Projects | projects | enforce_project_workflow | 9 policies | profiles, role helper, set_updated_at | Projects | Conditional | **Yes** |
| 005 | Public projects | — | public project queries | — | projects | Public read | Replace-safe functions | No |
| 006 | Editorial profile | project_editorial_profiles | editorial lifecycle | 4 policies | projects, profiles | Editorial | Unsafe blind | No |
| 007 | Project slugs | — | published project reference | — | projects/editorial | Public read | Replace-safe function | No |
| 008 | Project-actor links | project_actor_links | editor/public actor mapping | 2 policies | projects, actors, profiles | Ecosystem | Conditional; function deletes/replaces links | No |
| 009 | Public ecosystem | — | public ecosystem queries | — | actors/projects | Public ecosystem | Replace-safe functions | No |
| 010 | Actor publication admin | — | review/update actor publication | — | actors/roles | Admin/ecosystem | Replace-safe functions | No |
| 011 | Experiences | experiences | manage/list/review experience | 6 policies | profiles, projects, spaces | Agenda | Conditional | **027 prerequisite** |
| 012 | Experience images | storage objects/bucket | — | storage policies | storage, experiences | Media | Unsafe blind | No |
| 013 | Experience editing | experiences relations | relation validation/options | — | experiences/actors | Agenda | Conditional | No |
| 014 | Public experience | — | published experience detail | — | experiences | Public agenda | Replace-safe function | No |
| 015 | Registrations | experience_registrations | ticket/register/attendance | 2 policies | experiences, profiles | Ticketing | Conditional | No |
| 016 | Impact reports | experience_reports | save/review/report RPCs | 6 policies | experiences, projects, profiles | Impact | Conditional | No |
| 017 | Funding opportunities | funding_opportunities | save/review/list funding | 6 policies | profiles | Funding | Conditional | No |
| 018 | Funding applications | funding_applications | eligibility/application/report RPCs | 3 policies | funding, projects, reports, profiles | Funding | Conditional | No |
| 019 | Account registration | profiles | handle_new_user replacement | — | auth/profiles | Identity | Replace-safe with behavior risk | No |
| 020 | Project applications | project_applications | snapshots/submission/review | 5 policies | projects, profiles, actor ownership | Applications | Conditional | No |
| 021 | Actor ownership | existing project ownership | — | — | projects/actors | Projects | Needs content-specific review | No |
| 022 | MVP workflows | project applications/projects | ownership/workflow/editorial RPCs | 4 policies | projects, profiles, actor tables | Workflow | Unsafe blind | **027 helper**: account_manages_actor |
| 023 | Editorial CMS | posts, assets, homepage | editorial/homepage RPCs | 17 policies | projects, profiles, experiences, storage | Editorial | Unsafe blind; draft functions replace rows | No |
| 024 | Media hardening | editorial_media_assets | audit/permission functions | — | 023, admin audit | Editorial/security | Conditional | No |
| 025 | Brand rename | editorial_posts | — | — | 023 | Editorial data | Conditional data update | No |
| 026 | Superadmin foundation | admin_audit_log, ecosystem_signals; profiles | audit/access/signals/overview | 2 policies | profiles, projects, roles | Admin/audit | Conditional | **027 prerequisite**: record_admin_audit |
| 027 | Financial operations foundation | 7 tables including project_budget_lines | governance, audit, product review, scenarios | 10 policies | 001,003,004,011,022,026 | Finance + products + ticketing | **Unsafe blind** | **Creates core prerequisite** |
| 028 | Media admin boundary | policies/triggers on agenda/funding | write blocker | 14 policies | 011,015–018, roles | Security | Unsafe blind | No |
| 029 | Secure operational RPC | — | 5 secure RPCs; revokes legacy execution | earlier RPCs/roles | grants | Security/operations | Conditional | No |
| 030 | Master operations | ticket_type_products, project_calendar_entries; ticket_types | inventory/calendar/alerts | 4 policies | **027**, projects, experiences, storage | Ticketing/calendar/finance | Unsafe blind | No for 036 |
| 031 | Participant lifecycle | project workflow triggers | allow_owner_project_lifecycle | 1 policy | 004/022 | Projects | Unsafe blind | No |
| 032 | Sync and knowledge | snapshots + 3 knowledge tables | — | 6 policies | projects, profiles, vector | Sync/knowledge | Conditional | No |
| 033 | Intake/application routes | reanalysis audits; project_applications | approve_application_for_agenda | 1 policy | 020,011, projects/profiles | Applications/agenda | Conditional | No |
| 034 | Knowledge metadata | creates/evolves 3 knowledge tables | — | 4 policies | projects, vector; overlaps 032 | Knowledge | Conditional | No |
| 035 | Collections/ingestion | ingestion logs; knowledge columns | — | RLS on log | 034 | Knowledge ingestion | Conditional | No |
| 036 | Financial Authority V2 | proposals/events; budget extensions | accept/update RPCs | 2 owner policies | project_budget_lines, projects, profiles, set_updated_at | Financial Authority | Conditional after preflight | Target |

## Major domain graph

```text
auth.users
  └─001 profiles + set_updated_at
      ├─003 roles / spaces / funders
      ├─004 projects
      │   ├─020/022 project applications and workflows
      │   ├─026 audit + ecosystem signals
      │   └─032 snapshots / knowledge
      └─011 experiences
          ├─015 registrations
          ├─016 impact reports
          └─017/018 funding

027 financial operations
  requires profiles + projects + experiences
  requires account_manages_actor (022), current_profile_role (003), record_admin_audit (026)
  creates project_budget_lines
  also creates products, ticket types, tax rules, scenarios and commercial policies
      └─030 calendar/ticket master operations

036 Financial Authority
  requires only the compatible financial subset plus core identity/project functions
  creates proposals/events/RPCs and extends project_budget_lines
```

## Exact 036 object dependency graph

| Referenced contract | Source | Required? | Verification |
|---|---|---|---|
| `public.project_budget_lines` | 027 | Required | `to_regclass`, columns, PK/FK, generated total, RLS |
| `projects(id,owner_id)` | 004 | Required | catalog columns/FK target |
| `profiles(id)` | 001 | Required | catalog/FK target |
| `set_updated_at()` | 001 | Required | `pg_proc` signature |
| `auth.uid()` | Supabase auth | Required | function exists |
| `gen_random_uuid()` | PostgreSQL/Supabase | Required | function exists |
| PL/pgSQL/catalog access | PostgreSQL | Required | functions and preflight compile |
| Work item table | Future | Optional | `related_work_item_id` deliberately has no FK |

The required V1 budget columns are `id`, `project_id`, `direction`, `category`, `concept`, `description`, `quantity`, `unit`, `unit_value`, `status`, `notes`, `total`, `source_suggestion`, `suggestion_confirmed_by`, `created_at`, and `updated_at`.

## Minimal migration path decision

### Clean disposable staging

Apply migrations in their repository order through 027 because 027 references functions and domains established earlier. Then apply 036. Migrations 028–035 are not prerequisites for Financial Authority, although the full application may require them for unrelated routes.

### Clone of current drifted remote database

Do not replay 027. First use direct catalog inspection. If `project_budget_lines` is truly absent while unrelated 027 domains are partial or intentionally excluded, prefer a new additive **037 financial-prerequisite reconciliation migration** containing only a compatible `project_budget_lines`, owner RLS/grants and necessary index. It must be created only after direct evidence confirms exact existing objects and naming.

No 037 is created now because remote catalog evidence is unavailable. Creating it from PostgREST observations alone would guess at schema state.

