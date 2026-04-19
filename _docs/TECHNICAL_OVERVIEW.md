# Makase Law -- Technical Overview

## 1. System Architecture

```mermaid
flowchart TB
    %% Layout Group 1: Apps side-by-side
    subgraph apps ["Applications"]
        direction TB
        ClientApp["Client Web App: React 19 + Vite"]
        OfficeApp["Law Office Web App: React 19 + Vite"]
    end

    %% Layout Group 2: Core Infrastructure
    subgraph backend ["Backend & Database"]
        direction LR
        API["REST API: Bun + Hono"]
        Supabase["Supabase: Auth + Postgres 17"]
    end

    %% Layout Group 3: External stacked vertically
    subgraph external ["External Services"]
        direction TB
        Stripe["Stripe: Payments + Invoicing"]
        Google["Google Workspace"]
        LeadSources["Lead Sources: AVVO, Ads"]
        OneLegal["OneLegal: E-Filing"]
    end

    %% Connections
    ClientApp --> API
    OfficeApp ---> API
    API <--> Supabase
    
    %% Connections to external
    API -.-> Stripe
    API -.-> Google
    API -.-> LeadSources
    API -.-> OneLegal

```




| Layer    | Technology                            |
| -------- | ------------------------------------- |
| Runtime  | Bun                                   |
| API      | Hono v4                               |
| Database | Postgres 17 (Supabase)                |
| ORM      | Kysely + kysely-postgres-js           |
| Auth     | Supabase Auth (JWT, OTP)              |
| Frontend | React 19, Vite 8, Tailwind v4, wouter |
| UI       | Base UI + shadcn-style primitives     |
| PDF      | pdf-lib                               |
| Types    | kysely-codegen                        |


### Multi-Office Scoping

Tresp operates two firms (Tresp Law, APC and Tresp, Day & Associates). Each is a row in `offices`. Every domain table carries an `office_id` FK that scopes all data per firm. Users link to offices via `employees` with a composite PK `(user_id, office_id)`, each carrying a `role` and `permissions[]` array. A single user can belong to both offices with different roles.

---

## 2. Data Model

```mermaid
erDiagram
    users {
        uuid id PK
        text name
        text email UK
        text phone
    }
    offices {
        uuid id PK
        text name
        jsonb address
        text phone
        text email
        text website
    }
    employees {
        uuid user_id PK_FK
        uuid office_id PK_FK
        text role
        text_arr permissions
    }
    entities {
        uuid id PK
        uuid office_id FK
        uuid user_id FK "nullable"
        text full_legal_name
        text email
        text phone
        text entity_type
        jsonb address
        jsonb metadata
    }
    matters {
        uuid id PK
        uuid office_id FK
        text title
        text status
        text type
        jsonb data
    }
    entity_roles {
        uuid id PK
        uuid entity_id FK
        uuid matter_id FK
        text role
    }
    leads {
        uuid id PK
        uuid office_id FK
        text full_legal_name
        text phone
        text email
        text stage
        uuid existing_entity_id FK
        text matter_type
        jsonb matter_data
        numeric score
        uuid assigned_attorney_user_id
        text fee_agreement_status
        uuid entity_id FK
        uuid matter_id FK
    }
    time_entries {
        uuid id PK
        uuid office_id FK
        uuid matter_id FK
        uuid user_id FK
        uuid invoice_id
        int actual_duration
        int billable_duration
    }
    forms {
        uuid id PK
        uuid office_id FK
        uuid matter_id FK
        text form_type
        jsonb form_data
        text status
    }

    users ||--o{ employees : ""
    offices ||--o{ employees : ""
    offices ||--o{ entities : ""
    offices ||--o{ matters : ""
    offices ||--o{ leads : ""
    offices ||--o{ time_entries : ""
    offices ||--o{ forms : ""
    users |o--o{ entities : ""
    entities ||--o{ entity_roles : ""
    matters ||--o{ entity_roles : ""
    matters ||--o{ time_entries : ""
    matters ||--o{ forms : ""
    entities ||--o{ forms : ""
    entities |o--o{ leads : "existing_entity"
    entities |o--o{ leads : "resolved_entity"
    matters |o--o{ leads : "created_matter"
    employees ||--o{ time_entries : ""
```



### Design Decisions

- `**entities` as universal registry.** Everyone -- clients, opposing parties, witnesses, experts, attorneys -- is an `entity`. Their role in a specific matter is defined by `entity_roles`. This powers the conflict check system from a single table.
- `**pg_trgm` fuzzy search.** GIN index on `entities.full_legal_name` enables similarity-based name matching during conflict checks.
- `**leads` as a state machine.** The `stage` column (15 valid stages via CHECK constraint) drives the entire intake pipeline. All intermediate data (search results, conflict data, scores) lives on the lead row.
- **Generic JSONB forms.** `forms.form_data` stores arbitrary form payloads keyed by `form_type`. New form types require no schema migration.
- **Soft deletes.** All tables carry `deleted_at` / `deleted_by`. A shared `update_updated_at()` trigger keeps timestamps current.

---

## 3. Lead Intake Pipeline

```mermaid
stateDiagram-v2
    [*] --> collect_contact_info

    collect_contact_info --> search_entities_for_lead : Name + phone + email collected

    search_entities_for_lead --> collect_others_involved : Exact + fuzzy entity search done

    collect_others_involved --> search_entities_for_others_involved : Matter type + opposing parties provided

    search_entities_for_others_involved --> existing_entity_check : Opposing party search done

    state entity_decision <<choice>>
    existing_entity_check --> entity_decision
    entity_decision --> manual_existing_entity_check : Ambiguous matches
    entity_decision --> conflict_check : Confirmed or new

    manual_existing_entity_check --> conflict_check : Human validates

    state conflict_decision <<choice>>
    conflict_check --> conflict_decision
    conflict_decision --> manual_conflict_check : Conflicts detected
    conflict_decision --> pre_consultation : Clear

    state conflict_outcome <<choice>>
    manual_conflict_check --> conflict_outcome
    conflict_outcome --> pre_consultation : Cleared
    conflict_outcome --> declined_conflict : Confirmed conflict

    pre_consultation --> manually_assign_attorney : Scored + suggested attorney

    manually_assign_attorney --> schedule_consultation : Assigned

    schedule_consultation --> collect_fee_agreement : Booked

    state fee_decision <<choice>>
    collect_fee_agreement --> fee_decision
    fee_decision --> retained : Accepted
    fee_decision --> declined_fee_agreement : Declined

    retained --> [*]
    declined_fee_agreement --> [*]
    declined_conflict --> [*]
```



### Stage Detail


| Stage                                 | Type              | What Happens                                                                                                                                 | Tables                                            |
| ------------------------------------- | ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| `collect_contact_info`                | Automated + wait  | Collect name, phone, email. Notify firm on arrival.                                                                                          | W: `leads`                                        |
| `search_entities_for_lead`            | Automated         | Exact match on phone/email, fuzzy match on name via `pg_trgm`. Load `entity_roles` for each match.                                           | R: `entities`, `entity_roles` / W: `leads`        |
| `collect_others_involved`             | Wait for input    | Collect `matter_type`, `opposing_party_names`, `other_entity_names`. Ethically constrained -- no confidential details before conflict check. | W: `leads`                                        |
| `search_entities_for_others_involved` | Automated         | Same entity search for each opposing party / other entity. Store in `conflict_search_results`.                                               | R: `entities`, `entity_roles` / W: `leads`        |
| `existing_entity_check`               | Automated         | Route: exact match + no fuzzy ambiguity -> pass. Ambiguous matches -> manual. No matches -> pass (new person).                               | W: `leads`                                        |
| `manual_existing_entity_check`        | Human gate        | Staff picks existing entity or confirms new person. Sets `existing_entity_check_passed_by`.                                                  | W: `leads`                                        |
| `conflict_check`                      | Automated         | Check if lead's entity has non-client roles in prior matters. Check if opposing parties have roles in prior matters. Any hit -> manual.      | W: `leads`                                        |
| `manual_conflict_check`               | Human gate        | Staff reviews flagged conflicts. Clear -> proceed. True conflict -> `declined_conflict`.                                                     | W: `leads`                                        |
| `pre_consultation`                    | Wait for input    | Collect matter-type-specific data (confidential, post-conflict-check). Score lead, suggest attorney.                                         | W: `leads`                                        |
| `manually_assign_attorney`            | Human gate        | Confirm/override attorney assignment. Send scheduling link.                                                                                  | W: `leads`                                        |
| `schedule_consultation`               | Wait for booking  | Per-attorney Google Calendar link sent. Fee agreement auto-sent on booking.                                                                  | W: `leads`                                        |
| `collect_fee_agreement`               | Wait for response | Accepted -> `retained` (create entity + matter + entity_role). Declined -> `declined_fee_agreement`.                                         | W: `leads`, `entities`, `matters`, `entity_roles` |


---

## 4. Client Lifecycle

```mermaid
flowchart TD
    A["Lead Arrives"] --> B["Intake Pipeline"]
    B -->|"retained"| C["Activation"]
    B -->|"declined"| X["Closed"]

    C --> D["Create entity + matter + entity_role"]
    D --> E["Deploy task template by matter type"]
    E --> F["Auto-assign tasks by role"]
    F --> G["Active Client"]

    G --> H["Case Work"]
    H --> I["Time entries + invoicing"]
    I --> J{"A/R vs deposit"}
    J -->|"< 80%"| H
    J -->|">= 80%"| K["Alert attorney + client"]
    J -->|">= 100%"| L["Pause services"]

    H --> M["Close-Out"]
    M --> N["Closing letter + refund + archive"]
```



**Activation trigger:** Fee agreement signed AND payment received (via Stripe). At that point: create `entities` row (or link existing), create `matters` row with type from fee agreement, create `entity_roles` with `role = 'client'`, deploy task template, auto-assign tasks, send notification.

**Close-out:** AI-drafted closing letter (attorney reviews), deposit refund calculated from billing record, refund via original payment method, matter status -> `archived`.

---

## 5. Module Map

### Lead Capture & Intake


|            |                                                                                  |
| ---------- | -------------------------------------------------------------------------------- |
| **Tables** | `leads`, `entities`, `entity_roles`, `matters`                                   |
| **Routes** | Planned: CRUD + stage transitions on `/office/leads`                             |
| **Apps**   | Client (intake forms, AI assistant) + Office (review queue, conflict resolution) |


24/7 AI intake assistant (SMS + web). Multi-source auto-capture with source tagging (AVVO, SDCBA, Google LSA/Ads, referrals). Automated conflict check via `pg_trgm` fuzzy search + exact match. Lead scoring with auto-send scheduling link above threshold. Google conversion tracking by source.

### Scheduling & Consultations


|            |                                                      |
| ---------- | ---------------------------------------------------- |
| **Tables** | `leads`, `forms`                                     |
| **Routes** | Planned                                              |
| **Apps**   | Client (booking) + Office (notes, transcript review) |


Per-attorney Google Calendar links auto-sent on qualification. Consult agreement auto-sent on booking. AI transcription for in-person + Google Meet (summary + full transcript, attorney-editable before save).

### Fee Agreements


|            |                                      |
| ---------- | ------------------------------------ |
| **Tables** | `leads`, `forms`                     |
| **Routes** | Planned                              |
| **Apps**   | Office (drafting) + Client (signing) |


13 template variants. Required fields: firm entity (TDA vs TL), matter type, billing type, start date, referral source, deposit, scope, office location, assigned attorney. Matter type drives task template deployment. E-signatures via Google Drive (replaces Adobe Sign). Future: AI auto-suggest template from consult transcript.

### Payment & Activation


|            |                                                |
| ---------- | ---------------------------------------------- |
| **Tables** | `leads`, `entities`, `matters`, `entity_roles` |
| **Routes** | Planned: Stripe webhooks, activation endpoint  |
| **Apps**   | Client (payment page) + Office (confirmation)  |


Stripe integration (Apple Pay, Google Pay, Stripe Link). Auto-redirect to payment after signing. Automated reminders via text + email. Client ID assigned only when signed + paid. On activation: create entity/matter/entity_role, deploy task template, assign tasks, notify.

### Case Management


|            |                                                                                          |
| ---------- | ---------------------------------------------------------------------------------------- |
| **Tables** | `matters`, `entity_roles`, `entities`, `forms`                                           |
| **Routes** | `GET/POST /office/matters`, `GET/PATCH /office/matters/:id` (exist); task routes planned |
| **Apps**   | Office                                                                                   |


7-stage Kanban pipeline. Task templates per matter type deployed on activation. Attorney portfolio view with financial health (color-coded A/R). `matters.data` JSONB stores type-specific fields. Google Chat for matter-linked messaging (replaces Flock). Weekly AI case summaries. AI meeting notes. Call tracking with recording + transcript (TCPA compliant). Calendar + deadline tracking (replaces Deadlines.com).

### Time Tracking


|            |                                                            |
| ---------- | ---------------------------------------------------------- |
| **Tables** | `time_entries`, `employees`, `matters`                     |
| **Routes** | Planned: CRUD on `/office/time-entries`, approval workflow |
| **Apps**   | Office                                                     |


Start/stop timer + manual entry. `actual_duration` vs `billable_duration` (rounding to next minute). `(user_id, office_id)` FK to `employees` enforces office membership. `invoice_id` FK links to invoices once billed. Rate card by role (Principal, Paralegal, Associate, Admin) -- needs new table or config. Submit + approve workflow. Future: AI-suggested timesheet from platform activity.

### Billing & Invoicing


|            |                                                                         |
| ---------- | ----------------------------------------------------------------------- |
| **Tables** | `time_entries`; planned: `invoices`, `invoice_line_items`, `rate_cards` |
| **Routes** | Planned                                                                 |
| **Apps**   | Office                                                                  |


Two-stage approval: Lisa reviews -> Elizabeth final approval. Internal invoices every 2 weeks, client-facing every 4 weeks (independent cadences). Flat fee matters excluded. 5 billing states: Rendered / No Charge / Deferred / Invoiced-Unpaid / Invoiced-Paid. Line-item write-off, deferral, and waiver on a single invoice. Two-firm invoicing (TDA vs TL). A/R monitoring: alert at 80% deposit, pause at 100%. Stripe for client-facing payment. Bill dispute workflow. New tables needed for invoices, line items, rate cards, billing states.

### Client Portal


|            |                                                 |
| ---------- | ----------------------------------------------- |
| **Tables** | `matters`, `entities`, `time_entries`, `forms`  |
| **Routes** | `/client/`* (partially exist); auth/scoping TBD |
| **Apps**   | Client                                          |


Read-only: case status, documents, billing. View unbilled time since last invoice. Secure document upload to Google Drive. Needs separate auth flow (client tokens vs employee tokens) -- current `/client` routes have no auth middleware.

### Probate Workflow


|            |                                                                                                     |
| ---------- | --------------------------------------------------------------------------------------------------- |
| **Tables** | `matters`, `forms`, `entities`                                                                      |
| **Routes** | `POST/GET /client/forms/form_de_{111,121,140}` (exist); `GET/PATCH /office/forms/form_de_`* (exist) |
| **Apps**   | Client (form wizards) + Office (review, PDF generation)                                             |


Most built-out module. Multi-step form wizards for DE-111, DE-121, DE-140 with PDF generation via pdf-lib. Planned: DE-160, DE-165, DE-295, DE-310. Small estate flag (< $184,500 -> Summary Administration). 8-milestone California Probate Code checklist. Statutory deadline auto-tracking. Attorney review routing for prefilled forms. Future: AI doc summarization for wills/trusts.

### Platform, Security & Data


|            |                                                                                 |
| ---------- | ------------------------------------------------------------------------------- |
| **Tables** | `users`, `offices`, `employees`; planned: `audit_log`, `notifications`          |
| **Routes** | `GET /auth/me`, `POST /auth/offices` (exist); audit/notification routes planned |
| **Apps**   | All                                                                             |


Mobile-first (non-negotiable). RBAC via `employees.permissions[]` -- API must enforce per route. Notification center (new lead, payment, invoice, A/R). Immutable audit log (3-year retention, append-only). Supabase Auth with MFA. TLS 1.2+ / AES-256. California State Bar compliance (Rule 1.6). TCPA compliance for call recording. Automated contact dedup via `pg_trgm` with review queue. Two-firm architecture already modeled. Data export in CSV/PDF/JSON.

---

## 6. Build Status

### Built


| Component       | Details                                                       |
| --------------- | ------------------------------------------------------------- |
| Database schema | 9 tables, indexes, triggers, RLS, `pg_trgm`                   |
| Supabase Auth   | JWT auth, OTP login, user bootstrapping                       |
| Auth API        | `GET /auth/me`, `POST /auth/offices`                          |
| Matter CRUD     | Create, list, get, update (both `/client` and `/office`)      |
| Probate forms   | DE-111, DE-121, DE-140 wizards (client) + review/PDF (office) |
| Frontend        | Auth flow, routing, session management in both apps           |


### Designed, Not Implemented


| Component            | Details                                                            |
| -------------------- | ------------------------------------------------------------------ |
| Lead intake pipeline | `leads` table + stage CHECK constraint in place. No API routes.    |
| Conflict checking    | `entities` + `entity_roles` + `pg_trgm` index ready. No API logic. |
| Intake pseudocode    | `lead-intake-plan.txt` documents full state machine.               |


### Needs Design + Implementation

Lead intake API, notification system, time tracking, billing/invoicing (new tables needed), scheduling (Google Calendar API), fee agreements (templates, e-sig), payment (Stripe webhooks, activation), client portal auth, task management (table, templates, Kanban), Google integrations (Chat, Drive, Meet), audit log, close-out workflow, AI features (transcription, summaries, meeting notes), additional probate forms (DE-160, DE-165, DE-295, DE-310).

### Known Issues

1. **No auth on `/client` and `/office` routes.** Only `/auth/`* uses `authMiddleware`. Must be fixed before production.
2. `**created_by`/`updated_by` missing in form inserts.** Client POST handlers omit these NOT NULL fields.
3. **Stale `api/README.md`.** References Deno but project runs on Bun.

---

## 7. External Integrations

```mermaid
flowchart LR
    subgraph makase ["Makase"]
        API["API Server"]
    end

    subgraph google ["Google Workspace"]
        GCal["Calendar"]
        GChat["Chat"]
        GDrive["Drive"]
        GMeet["Meet"]
    end

    subgraph payments ["Payments"]
        Stripe["Stripe"]
    end

    subgraph leads ["Lead Sources"]
        AVVO["AVVO"]
        SDCBA["SDCBA"]
        GLSA["Google LSA"]
        GAds["Google Ads"]
    end

    subgraph legal ["Legal Tools"]
        OneLegal["OneLegal"]
    end

    API <--> GCal
    API <--> GChat
    API <--> GDrive
    API <--> GMeet
    API <--> Stripe
    AVVO --> API
    SDCBA --> API
    GLSA --> API
    GAds --> API
    API <--> OneLegal
```




| Integration                    | Purpose                                | Connection              | Status    |
| ------------------------------ | -------------------------------------- | ----------------------- | --------- |
| Supabase Auth                  | Auth, JWT, MFA                         | SDK                     | **Built** |
| Supabase Postgres              | Primary DB                             | Kysely                  | **Built** |
| Stripe                         | Payments, invoicing, Apple/Google Pay  | REST + Webhooks         | Planned   |
| Google Calendar                | Per-attorney scheduling, deadlines     | Calendar API v3         | Planned   |
| Google Chat                    | Matter-linked messaging                | Chat API                | Planned   |
| Google Drive                   | Doc storage, e-signatures              | Drive API v3            | Planned   |
| Google Meet                    | Consultation recording + transcription | Meet API                | Planned   |
| Google Ads                     | Conversion tracking, attribution       | Ads API                 | Planned   |
| AVVO / SDCBA                   | Lead capture                           | Email parsing / Webhook | Planned   |
| Google LSA                     | Lead capture                           | Ads API                 | Planned   |
| OneLegal                       | Court e-filing                         | Filing API              | Planned   |
| CEB / Westlaw / Wealth Counsel | Research tools                         | iframe / OAuth link     | Planned   |


## 8. Plan of Attack

1. leads, matters, tasks, and time tracking (asana + hubspot + big time)
2. migrate data and release v1
3. data pipeline, lead data pulled into matter, matter data used to auto generated forms (start with probate)
4. full automation of lead intake
5. fill in gaps and add nice to haves

