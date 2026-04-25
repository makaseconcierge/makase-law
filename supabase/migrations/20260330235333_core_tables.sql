-- SCHEMA
CREATE SCHEMA app;

REVOKE ALL ON SCHEMA app FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA app REVOKE ALL ON TABLES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA app REVOKE ALL ON FUNCTIONS FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA app REVOKE ALL ON SEQUENCES FROM anon, authenticated;

-- service_role is the API's connection role. Grant DML but not DDL or TRUNCATE.
GRANT USAGE ON SCHEMA app TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA app
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA app
  GRANT USAGE ON SEQUENCES TO service_role;

-- EXTENSIONS
CREATE SCHEMA IF NOT EXISTS extensions;
CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA extensions;

-- FUNCTIONS
--
-- Audit attribution is driven by the per-transaction GUC `app.acting_user_id`,
-- set by the shared `runAs(user_id, fn)` helper via `set_config(..., true)`.
-- This trigger is attached BEFORE INSERT OR UPDATE to every app._* table,
-- overwriting created_by/updated_by so application code never has to pass
-- them. created_at/created_by are preserved on UPDATE (you cannot rewrite
-- history). deleted_by is auto-filled on soft-delete transitions if the
-- caller only sets deleted_at.
CREATE OR REPLACE FUNCTION app.set_audit_fields()
RETURNS trigger LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  acting UUID;
BEGIN
  acting := NULLIF(current_setting('app.acting_user_id', true), '')::uuid;
  IF acting IS NULL THEN
    RAISE EXCEPTION
      'app.acting_user_id is not set — every write to %.% must run inside runAs(...) or runAsSystem(...)',
      TG_TABLE_SCHEMA, TG_TABLE_NAME
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  IF TG_OP = 'INSERT' THEN
    NEW.created_at := NOW();
    NEW.created_by := acting;
    NEW.updated_at := NEW.created_at;
    NEW.updated_by := acting;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Preserve creation metadata; history is not rewritable.
    NEW.created_at := OLD.created_at;
    NEW.created_by := OLD.created_by;

    -- Restore updated_at/by to OLD values so the no-op check below compares
    -- the caller's real intent against the old row. If we stamped fresh
    -- values first, every UPDATE would look non-no-op.
    NEW.updated_at := OLD.updated_at;
    NEW.updated_by := OLD.updated_by;

    -- Return NULL to cancel a no-op UPDATE: zero rows written, no AFTER
    -- triggers, no audit_log entry, updated_at stays truthful as
    -- "last time this row actually changed."
    IF NEW IS NOT DISTINCT FROM OLD THEN
      RETURN NULL;
    END IF;

    NEW.updated_at := NOW();
    NEW.updated_by := acting;

    -- deleted_by is fully trigger-owned, same as updated_by: the caller
    -- cannot attribute a deletion (or undeletion) to anyone but themselves,
    -- and cannot change deleted_by in isolation without flipping deleted_at.
    IF NEW.deleted_at IS DISTINCT FROM OLD.deleted_at THEN
      NEW.deleted_by := CASE WHEN NEW.deleted_at IS NULL THEN NULL ELSE acting END;
    ELSE
      NEW.deleted_by := OLD.deleted_by;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Column DEFAULT so kysely-codegen / kanel marks created_by / updated_by as
-- Generated<> (optional on insert). The BEFORE trigger still overwrites the
-- value; the DEFAULT just makes the column optional in TypeScript insert types.
-- Evaluates to NULL when the GUC is unset — the trigger fires after DEFAULTs
-- and will RAISE before the NOT NULL constraint is ever checked.
CREATE OR REPLACE FUNCTION app.acting_user_id()
RETURNS uuid LANGUAGE sql STABLE
SET search_path = ''
AS $$ SELECT NULLIF(current_setting('app.acting_user_id', true), '')::uuid $$;

CREATE OR REPLACE FUNCTION app.prevent_delete()
RETURNS trigger LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  RAISE EXCEPTION 'Hard DELETE is not permitted on %. Use soft delete (set deleted_at/deleted_by) instead.', TG_TABLE_NAME;
END;
$$;

-- Adds the standard audit / soft-delete columns, creates the active-record
-- view, and attaches all standard triggers.
-- Call as: SELECT app.setup_auditable_table('offices');
-- Expects app._offices to already exist with only domain columns.
-- Indexes that reference deleted_at must come AFTER this call.
CREATE OR REPLACE FUNCTION app.setup_auditable_table(base_name TEXT)
RETURNS void LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  tbl TEXT := '_' || base_name;
BEGIN
  EXECUTE format(
    'ALTER TABLE app.%I '
    'ADD COLUMN created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), '
    'ADD COLUMN created_by UUID NOT NULL DEFAULT app.acting_user_id() REFERENCES app._user_profiles(user_id), '
    'ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), '
    'ADD COLUMN updated_by UUID NOT NULL DEFAULT app.acting_user_id() REFERENCES app._user_profiles(user_id), '
    'ADD COLUMN deleted_at TIMESTAMPTZ, '
    'ADD COLUMN deleted_by UUID REFERENCES app._user_profiles(user_id), '
    'ADD CHECK ((deleted_at IS NULL) = (deleted_by IS NULL))',
    tbl
  );
  EXECUTE format(
    'CREATE VIEW app.%I WITH (security_invoker = true) '
    'AS SELECT * FROM app.%I WHERE deleted_at IS NULL',
    base_name, tbl
  );
  EXECUTE format(
    'CREATE TRIGGER %I_audit BEFORE INSERT OR UPDATE ON app.%I '
    'FOR EACH ROW EXECUTE FUNCTION app.set_audit_fields()',
    base_name, tbl
  );
  EXECUTE format(
    'CREATE TRIGGER no_delete INSTEAD OF DELETE ON app.%I '
    'FOR EACH ROW EXECUTE FUNCTION app.prevent_delete()',
    base_name
  );
  EXECUTE format(
    'CREATE TRIGGER %I_log AFTER INSERT OR UPDATE OR DELETE ON app.%I '
    'FOR EACH ROW EXECUTE FUNCTION app.write_audit_log()',
    tbl, tbl
  );
END;
$$;

-- AUDIT LOG
-- The write_audit_log function is defined here but the audit_log table
-- it writes into is declared further down (after _user_profiles, so the
-- changed_by FK resolves). Function bodies are parsed lazily — table
-- references are resolved at execution time. SECURITY DEFINER so the
-- function can INSERT into the locked-down audit_log table.
CREATE OR REPLACE FUNCTION app.write_audit_log()
RETURNS trigger LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  diff       JSONB;
  record_pk  JSONB := '{}'::jsonb;
  pk_cols    TEXT[];
  col        TEXT;
  old_j      JSONB;
  new_j      JSONB;
  acting     UUID;
BEGIN
  IF TG_OP = 'INSERT' THEN
    diff := to_jsonb(NEW);
  ELSIF TG_OP = 'UPDATE' THEN
    old_j := to_jsonb(OLD);
    new_j := to_jsonb(NEW);
    SELECT jsonb_object_agg(
             key,
             jsonb_build_object('from', old_j -> key, 'to', new_j -> key)
           )
      INTO diff
      FROM jsonb_object_keys(new_j) AS key
     WHERE (old_j -> key) IS DISTINCT FROM (new_j -> key);

    -- set_audit_fields already skips true no-ops via RETURN NULL; if
    -- we still got here with no column changes, it means only the
    -- trigger-owned audit columns flipped (e.g., updated_at/by). Skip
    -- so the ledger doesn't record "update: only updated_at changed"
    -- for every write — that's noise.
    IF diff IS NULL OR diff = '{}'::jsonb THEN
      RETURN NULL;
    END IF;
    -- updated_at/by always differ on real writes; drop them from the
    -- diff since they're derivable and would otherwise appear in every
    -- single log row.
    diff := diff - 'updated_at' - 'updated_by';
    IF diff = '{}'::jsonb THEN
      RETURN NULL;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    diff := to_jsonb(OLD);
  END IF;

  SELECT array_agg(a.attname ORDER BY a.attnum)
    INTO pk_cols
    FROM pg_constraint c
    JOIN pg_attribute a
      ON a.attrelid = c.conrelid AND a.attnum = ANY(c.conkey)
   WHERE c.contype = 'p' AND c.conrelid = TG_RELID;

  FOREACH col IN ARRAY pk_cols LOOP
    record_pk := record_pk || jsonb_build_object(
      col,
      CASE TG_OP
        WHEN 'DELETE' THEN to_jsonb(OLD) -> col
        ELSE to_jsonb(NEW) -> col
      END
    );
  END LOOP;

  -- Prefer the per-transaction GUC (set by runAs) so an UPDATE that
  -- only flipped deleted_at still logs the actor who issued it. Fall
  -- back to the row's own updated_by (which set_audit_fields wrote
  -- from the same GUC) so direct-SQL writes without runAs still log.
  acting := COALESCE(
    NULLIF(current_setting('app.acting_user_id', true), '')::uuid,
    CASE TG_OP
      WHEN 'DELETE' THEN (to_jsonb(OLD) ->> 'updated_by')::uuid
      ELSE (to_jsonb(NEW) ->> 'updated_by')::uuid
    END
  );

  INSERT INTO app.audit_log (
    table_schema, table_name, record_pk, op, diff, changed_by
  ) VALUES (
    TG_TABLE_SCHEMA, TG_TABLE_NAME, record_pk, TG_OP, diff, acting
  );

  RETURN NULL;  -- AFTER trigger, return value ignored
END;
$$;

-- USER PROFILES
CREATE TABLE app._user_profiles (
    user_id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE NO ACTION,
    display_name    TEXT NOT NULL,
    email           TEXT NOT NULL UNIQUE,
    phone           TEXT
);
SELECT app.setup_auditable_table('user_profiles');

-- Auth-triggered writes to app._user_profiles set app.acting_user_id to
-- the user themselves so the audit trigger attributes the row correctly.
CREATE OR REPLACE FUNCTION app.handle_new_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  PERFORM set_config('app.acting_user_id', NEW.id::text, true);
  INSERT INTO app._user_profiles (user_id, display_name, email, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'name',  ''),
    NEW.email,
    NEW.phone
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION app.handle_new_auth_user();

CREATE OR REPLACE FUNCTION app.handle_auth_user_updated()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  PERFORM set_config('app.acting_user_id', NEW.id::text, true);
  UPDATE app._user_profiles
  SET email = NEW.email,
      phone = NEW.phone
  WHERE user_id = NEW.id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_updated AFTER UPDATE ON auth.users
FOR EACH ROW
WHEN (OLD.email IS DISTINCT FROM NEW.email OR OLD.phone IS DISTINCT FROM NEW.phone)
EXECUTE FUNCTION app.handle_auth_user_updated();


-- AUDIT LOG
-- Immutable append-only ledger. No underscore prefix because it doesn't
-- follow the _table/view soft-delete pattern — there is no view, no
-- soft delete, and no audit columns. DML is revoked from all roles;
-- only the SECURITY DEFINER trigger function can INSERT.
CREATE TABLE app.audit_log (
    audit_log_id BIGSERIAL PRIMARY KEY,
    table_schema TEXT NOT NULL,
    table_name   TEXT NOT NULL,
    record_pk    JSONB NOT NULL,
    op           TEXT NOT NULL CHECK (op IN ('INSERT', 'UPDATE', 'DELETE')),
    diff         JSONB NOT NULL,
    changed_by   UUID NOT NULL REFERENCES app._user_profiles(user_id),
    changed_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX ON app.audit_log (table_schema, table_name, changed_at DESC);
CREATE INDEX ON app.audit_log USING gin (record_pk);
CREATE INDEX ON app.audit_log (changed_by, changed_at DESC);

-- Lock down: only the SECURITY DEFINER trigger function (owned by
-- postgres) can INSERT. service_role can SELECT (for the audit UI).
-- No role can UPDATE, DELETE, or TRUNCATE.
REVOKE ALL ON app.audit_log FROM PUBLIC, service_role;
GRANT SELECT ON app.audit_log TO service_role;



-- OFFICES
CREATE TABLE app._offices (
    office_id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        TEXT NOT NULL,
    address     JSONB,
    phone       TEXT,
    email       TEXT,
    website     TEXT,
    logo        TEXT
);
SELECT app.setup_auditable_table('offices');


-- EMPLOYEES
CREATE TABLE app._employees (
    user_id             UUID NOT NULL REFERENCES app._user_profiles(user_id),
    office_id           UUID NOT NULL REFERENCES app._offices(office_id),
    full_legal_name     TEXT NOT NULL,
    bar_numbers         JSONB NOT NULL DEFAULT '[]'::jsonb, -- [{state: string, number: string}]
    is_admin            BOOLEAN NOT NULL DEFAULT FALSE,
    PRIMARY KEY (office_id, user_id)
);
SELECT app.setup_auditable_table('employees');
CREATE INDEX ON app._employees(user_id) WHERE deleted_at IS NULL;


-- TEAMS
CREATE TABLE app._teams (
    team_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    office_id UUID NOT NULL REFERENCES app._offices(office_id),
    name TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    CONSTRAINT teams_office_uk UNIQUE (office_id, team_id)
);
SELECT app.setup_auditable_table('teams');
CREATE INDEX ON app._teams(office_id) WHERE deleted_at IS NULL;


-- team_roles
CREATE TABLE app._team_roles (
    team_role_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    office_id UUID NOT NULL REFERENCES app._offices(office_id),
    name TEXT NOT NULL,
    description TEXT NOT NULL
    role_config JSONB NOT NULL DEFAULT '{}'::jsonb -- defines permissions for team owned resources {matter: {read: boolean, write: boolean}, tasks: {read: boolean, write: boolean}...}
    CONSTRAINT team_roles_office_uk UNIQUE (office_id, team_role_id)
);
SELECT app.setup_auditable_table('team_roles');
CREATE INDEX ON app._team_roles(office_id) WHERE deleted_at IS NULL;


-- TEAM_MEMBER_ROLES
CREATE TABLE app._team_member_roles (
    office_id UUID NOT NULL REFERENCES app._offices(office_id),
    team_id UUID NOT NULL,
    FOREIGN KEY (office_id, team_id) REFERENCES app._teams(office_id, team_id),
    user_id UUID NOT NULL,
    FOREIGN KEY (office_id, user_id) REFERENCES app._employees(office_id, user_id),
    team_role_id UUID NOT NULL,
    FOREIGN KEY (office_id, team_role_id) REFERENCES app._team_roles(office_id, team_role_id),
    functional_roles TEXT[] NOT NULL DEFAULT '{}', -- based on position role_config and is_supervisor and is_manager
    PRIMARY KEY (office_id, team_id, user_id, team_role_id)
);
SELECT app.setup_auditable_table('team_member_roles');
CREATE INDEX ON app._team_member_roles(office_id) WHERE deleted_at IS NULL;
CREATE INDEX ON app._team_member_roles(office_id, team_id) WHERE deleted_at IS NULL;
CREATE INDEX ON app._team_member_roles(office_id, user_id) WHERE deleted_at IS NULL;
CREATE INDEX ON app._team_member_roles(office_id, team_id, team_role_id) WHERE deleted_at IS NULL;


-- MATTERS
CREATE TABLE app._matters (
    matter_id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    office_id   UUID NOT NULL REFERENCES app._offices(office_id),
    team_id     UUID NOT NULL,
    FOREIGN KEY (office_id, team_id) REFERENCES app._teams(office_id, team_id),
    title       TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    stage       TEXT NOT NULL DEFAULT 'consultation',
    type        TEXT NOT NULL DEFAULT 'general',
    billing_type TEXT NOT NULL DEFAULT 'active',
    billing_settings JSONB NOT NULL DEFAULT '{}'::jsonb, -- need these here because they could change in settings but once contract is signed they are locked in
    started_representation_at    TIMESTAMPTZ,
    ended_representation_at      TIMESTAMPTZ,
    referral_source TEXT,
    referral_id TEXT,
    referral_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    -- scope TEXT NOT NULL DEFAULT '', -- TODO: this is in matter data, should it be top level?
    preferred_office_location TEXT NOT NULL DEFAULT '',
    data        JSONB NOT NULL DEFAULT '{}'::jsonb,
    archived_at                  TIMESTAMPTZ,
    archived_by                  UUID REFERENCES app._user_profiles(user_id),

    CONSTRAINT matters_office_uk UNIQUE (office_id, matter_id),
    CONSTRAINT matters_billing_type_check CHECK (billing_type IN (
        'active', 'active_deferred', 'contingency', 'flat_fee', 'flat_fee_plus_hourly'
    )),
    CONSTRAINT matters_stage_check CHECK (stage IN (
        'consultation', 'setup', 'active', 'closed', 'archived'
    ))
);
SELECT app.setup_auditable_table('matters');
CREATE INDEX ON app._matters(office_id)                     WHERE deleted_at IS NULL;
CREATE INDEX ON app._matters(office_id, team_id)            WHERE deleted_at IS NULL;
CREATE INDEX ON app._matters(stage)                         WHERE deleted_at IS NULL;


-- MATTER STAFF (links firm employees to matters with their staffing matter_role)
CREATE TABLE app._matter_staff (
    office_id   UUID NOT NULL REFERENCES app._offices(office_id),
    matter_id   UUID NOT NULL,
    user_id     UUID NOT NULL,
    FOREIGN KEY (office_id, matter_id) REFERENCES app._matters(office_id, matter_id),
    FOREIGN KEY (office_id, user_id)   REFERENCES app._employees(office_id, user_id),
    matter_role        TEXT NOT NULL DEFAULT 'support',

    PRIMARY KEY (office_id, matter_id, user_id, matter_role),
    CONSTRAINT matter_staff_role_check CHECK (matter_role IN (
        'responsible_attorney', 'supervising_attorney', 'counsel', 'paralegal', 'support'
    ))
);
SELECT app.setup_auditable_table('matter_staff');
CREATE INDEX ON app._matter_staff(office_id, matter_id) WHERE deleted_at IS NULL;
CREATE INDEX ON app._matter_staff(office_id, user_id)   WHERE deleted_at IS NULL;

-- Enforce exactly one 'responsible' attorney per active matter
CREATE UNIQUE INDEX ON app._matter_staff (office_id, matter_id)
  WHERE matter_role = 'responsible_attorney' AND deleted_at IS NULL;


-- ENTITIES (universal person/organization registry)
CREATE TABLE app._entities (
    entity_id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    office_id       UUID NOT NULL REFERENCES app._offices(office_id),
    user_id         UUID REFERENCES app._user_profiles(user_id),
    full_legal_name TEXT NOT NULL,
    email           TEXT,
    phone           TEXT,
    entity_type     TEXT NOT NULL DEFAULT 'individual',
    metadata        JSONB NOT NULL DEFAULT '{}'::jsonb,

    CONSTRAINT entities_office_uk UNIQUE (office_id, entity_id),
    CONSTRAINT entities_type_check CHECK (entity_type IN ('individual', 'organization'))
);
SELECT app.setup_auditable_table('entities');
CREATE INDEX ON app._entities(office_id)                    WHERE deleted_at IS NULL;
CREATE INDEX ON app._entities(user_id)                      WHERE user_id IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX ON app._entities(email)                        WHERE deleted_at IS NULL;
CREATE INDEX ON app._entities(phone)                        WHERE deleted_at IS NULL;
CREATE INDEX ON app._entities USING gin (full_legal_name gin_trgm_ops) WHERE deleted_at IS NULL;


-- ENTITY_ROLES (links entities to matters with their matter_role)
CREATE TABLE app._entity_roles (
    office_id   UUID NOT NULL REFERENCES app._offices(office_id),
    entity_id   UUID NOT NULL,
    FOREIGN KEY (office_id, entity_id) REFERENCES app._entities(office_id, entity_id),
    matter_id   UUID NOT NULL,
    FOREIGN KEY (office_id, matter_id) REFERENCES app._matters(office_id, matter_id),
    matter_role        TEXT NOT NULL,

    PRIMARY KEY (office_id, entity_id, matter_id, matter_role),
    CONSTRAINT entity_roles_unique UNIQUE (entity_id, matter_id, matter_role),
    CONSTRAINT entity_roles_role_check CHECK (matter_role IN (
        'prospective_client', 'client', 'opposing_party', 'witness', 'expert', 'attorney', 'other'
    ))
);
SELECT app.setup_auditable_table('entity_roles');
CREATE INDEX ON app._entity_roles(matter_id)                WHERE deleted_at IS NULL;


-- LEADS (intake pipeline)
CREATE TABLE app._leads (
    lead_id                         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    office_id                       UUID NOT NULL REFERENCES app._offices(office_id),
    team_id                         UUID NOT NULL,
    FOREIGN KEY (office_id, team_id) REFERENCES app._teams(office_id, team_id),

    full_legal_name                 TEXT,
    phone                           TEXT,
    email                           TEXT,
    lead_source                     TEXT,
    lead_source_data                JSONB NOT NULL DEFAULT '{}'::jsonb,

    stage                           TEXT NOT NULL DEFAULT 'collect_contact_info',

    existing_entity_id              UUID,
    FOREIGN KEY (office_id, existing_entity_id) REFERENCES app._entities(office_id, entity_id),
    entity_search_results           JSONB NOT NULL DEFAULT '[]'::jsonb,

    matter_type                     TEXT,
    opposing_party_names            JSONB NOT NULL DEFAULT '[]'::jsonb,
    other_entity_names              JSONB NOT NULL DEFAULT '[]'::jsonb,

    conflict_search_results         JSONB NOT NULL DEFAULT '[]'::jsonb,

    existing_entity_check_passed_at TIMESTAMPTZ,
    existing_entity_check_passed_by UUID,
    FOREIGN KEY (office_id, existing_entity_check_passed_by) REFERENCES app._employees(office_id, user_id),

    conflict_check_passed_at        TIMESTAMPTZ,
    conflict_check_passed_by        UUID,
    FOREIGN KEY (office_id, conflict_check_passed_by) REFERENCES app._employees(office_id, user_id),

    matter_data                     JSONB NOT NULL DEFAULT '{}'::jsonb,
    score                           NUMERIC,
    suggested_attorney_user_id      UUID,
    FOREIGN KEY (office_id, suggested_attorney_user_id) REFERENCES app._employees(office_id, user_id),
    assigned_attorney_user_id       UUID,
    FOREIGN KEY (office_id, assigned_attorney_user_id) REFERENCES app._employees(office_id, user_id),

    consultation_scheduled_at       TIMESTAMPTZ,

    fee_agreement_status            TEXT,

    entity_id                       UUID,
    FOREIGN KEY (office_id, entity_id) REFERENCES app._entities(office_id, entity_id),
    matter_id                       UUID,
    FOREIGN KEY (office_id, matter_id) REFERENCES app._matters(office_id, matter_id),

    CONSTRAINT leads_office_uk UNIQUE (office_id, lead_id),

    CONSTRAINT leads_stage_check CHECK (stage IN (
        'collect_contact_info',
        'search_entities_for_lead',
        'collect_others_involved',
        'search_entities_for_others_involved',
        'existing_entity_check',
        'manual_existing_entity_check',
        'conflict_check',
        'manual_conflict_check',
        'pre_consultation',
        'manually_assign_attorney',
        'schedule_consultation',
        'collect_fee_agreement',
        'retained',
        'declined_fee_agreement',
        'declined_conflict'
    )),

    CONSTRAINT leads_fee_agreement_check CHECK (
        fee_agreement_status IS NULL OR fee_agreement_status IN ('sent', 'accepted', 'declined')
    )
);
SELECT app.setup_auditable_table('leads');
CREATE INDEX ON app._leads(office_id)                       WHERE deleted_at IS NULL;
CREATE INDEX ON app._leads(office_id, team_id)              WHERE deleted_at IS NULL;
CREATE INDEX ON app._leads(stage)                           WHERE deleted_at IS NULL;
CREATE INDEX ON app._leads(assigned_attorney_user_id)       WHERE assigned_attorney_user_id IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX ON app._leads(existing_entity_id)              WHERE existing_entity_id IS NOT NULL AND deleted_at IS NULL;


-- Tasks
-- team_id must match the parent matter's or lead's team_id when those are set.
-- Enforced in application code, not the DB (cross-table check would need a trigger).
CREATE TABLE app._tasks (
    task_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    office_id   UUID NOT NULL REFERENCES app._offices(office_id),
    team_id     UUID NOT NULL,
    FOREIGN KEY (office_id, team_id) REFERENCES app._teams(office_id, team_id),
    matter_id   UUID,
    FOREIGN KEY (office_id, matter_id) REFERENCES app._matters(office_id, matter_id),
    lead_id     UUID,
    FOREIGN KEY (office_id, lead_id) REFERENCES app._leads(office_id, lead_id),
    assigned_to UUID,
    FOREIGN KEY (office_id, assigned_to) REFERENCES app._employees(office_id, user_id),
    name        TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    status      TEXT NOT NULL DEFAULT 'pending',
    due_date    TIMESTAMPTZ,

    billable BOOLEAN NOT NULL DEFAULT FALSE,
    no_charge BOOLEAN NOT NULL DEFAULT FALSE,

    CONSTRAINT tasks_office_uk UNIQUE (office_id, task_id),
    CONSTRAINT tasks_status_check CHECK (status IN (
        'pending', 'ready', 'active', 'done'
    ))
);
SELECT app.setup_auditable_table('tasks');
CREATE INDEX ON app._tasks(office_id)                       WHERE deleted_at IS NULL;
CREATE INDEX ON app._tasks(office_id, team_id)              WHERE deleted_at IS NULL;
CREATE INDEX ON app._tasks(matter_id)                       WHERE matter_id IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX ON app._tasks(lead_id)                         WHERE lead_id IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX ON app._tasks(assigned_to)                     WHERE assigned_to IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX ON app._tasks(status)                          WHERE deleted_at IS NULL;


-- INVOICES
CREATE TABLE app._invoices (
    invoice_id  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    office_id   UUID NOT NULL REFERENCES app._offices(office_id),
    team_id     UUID NOT NULL,
    FOREIGN KEY (office_id, team_id) REFERENCES app._teams(office_id, team_id),
    matter_id   UUID,
    FOREIGN KEY (office_id, matter_id) REFERENCES app._matters(office_id, matter_id),
    status      TEXT NOT NULL DEFAULT 'new',
    notes       TEXT,
    due_date    TIMESTAMPTZ,
    sent_at     TIMESTAMPTZ,
    billed_amount NUMERIC NOT NULL,
    late_fee_rate NUMERIC NOT NULL,
    late_fee_amount NUMERIC NOT NULL DEFAULT 0, -- billed_amount * late_fee_rate
    total_amount NUMERIC NOT NULL DEFAULT 0, -- billed_amount + late_fee_amount

    -- total_paid from payments table

    CONSTRAINT invoices_late_fee_amount_check CHECK (late_fee_amount >= 0),
    CONSTRAINT invoices_total_amount_check CHECK (total_amount >= 0),
    CONSTRAINT invoices_office_uk UNIQUE (office_id, invoice_id),
    CONSTRAINT invoices_status_check CHECK (status IN (
        'new', 'approved', 'sent', 'paid', 'closed'
    ))
);
SELECT app.setup_auditable_table('invoices');
CREATE INDEX ON app._invoices(office_id)                    WHERE deleted_at IS NULL;
CREATE INDEX ON app._invoices(office_id, team_id)           WHERE deleted_at IS NULL;
CREATE INDEX ON app._invoices(matter_id)                    WHERE matter_id IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX ON app._invoices(status)                       WHERE deleted_at IS NULL;


-- TIME_ENTRIES
CREATE TABLE app._time_entries (
    time_entry_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    office_id         UUID NOT NULL REFERENCES app._offices(office_id),
    task_id           UUID,
    FOREIGN KEY (office_id, task_id) REFERENCES app._tasks(office_id, task_id),
    invoice_id        UUID,
    FOREIGN KEY (office_id, invoice_id) REFERENCES app._invoices(office_id, invoice_id),
    user_id           UUID NOT NULL,
    FOREIGN KEY (user_id, office_id) REFERENCES app._employees(user_id, office_id),
    end_timestamp     TIMESTAMPTZ NOT NULL, -- start_timestamp computed from this + actual_duration
    actual_duration   INTEGER NOT NULL,
    billable_duration INTEGER NOT NULL,
    description       TEXT,

    CONSTRAINT time_entries_office_uk UNIQUE (office_id, time_entry_id)
);
SELECT app.setup_auditable_table('time_entries');
CREATE INDEX ON app._time_entries(office_id)                WHERE deleted_at IS NULL;
CREATE INDEX ON app._time_entries(task_id)                  WHERE task_id IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX ON app._time_entries(user_id)                  WHERE deleted_at IS NULL;
CREATE INDEX ON app._time_entries(invoice_id)               WHERE invoice_id IS NOT NULL AND deleted_at IS NULL;


-- EXPENSES
CREATE TABLE app._expenses (
    expense_id  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    office_id   UUID NOT NULL REFERENCES app._offices(office_id),
    matter_id   UUID,
    FOREIGN KEY (office_id, matter_id) REFERENCES app._matters(office_id, matter_id),
    invoice_id  UUID,
    FOREIGN KEY (office_id, invoice_id) REFERENCES app._invoices(office_id, invoice_id),
    amount      NUMERIC NOT NULL,
    description TEXT,
    is_reimbursable BOOLEAN NOT NULL DEFAULT FALSE,
    is_billable BOOLEAN NOT NULL DEFAULT TRUE,
    receipt_path TEXT[] NOT NULL DEFAULT '{}',
    external_invoice_data JSONB NOT NULL DEFAULT '{}'::jsonb,

    CONSTRAINT expenses_office_uk UNIQUE (office_id, expense_id)
);
SELECT app.setup_auditable_table('expenses');
CREATE INDEX ON app._expenses(office_id)                    WHERE deleted_at IS NULL;
CREATE INDEX ON app._expenses(matter_id)                    WHERE matter_id IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX ON app._expenses(invoice_id)                   WHERE invoice_id IS NOT NULL AND deleted_at IS NULL;


-- INVOICE_PAYMENTS
CREATE TABLE app._invoice_payments (
    invoice_payment_id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    office_id   UUID NOT NULL REFERENCES app._offices(office_id),
    invoice_id  UUID,
    FOREIGN KEY (office_id, invoice_id) REFERENCES app._invoices(office_id, invoice_id),
    amount      NUMERIC NOT NULL,
    payment_date TIMESTAMPTZ NOT NULL,
    notes TEXT,
    external_id TEXT,
    external_type TEXT,
    external_url TEXT,
    external_data JSONB NOT NULL DEFAULT '{}'::jsonb,

    CONSTRAINT invoice_payments_office_uk UNIQUE (office_id, invoice_payment_id)
);
SELECT app.setup_auditable_table('invoice_payments');
CREATE INDEX ON app._invoice_payments(office_id)            WHERE deleted_at IS NULL;
CREATE INDEX ON app._invoice_payments(invoice_id)           WHERE invoice_id IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX ON app._invoice_payments(external_id)          WHERE external_id IS NOT NULL AND deleted_at IS NULL;


-- FORMS
CREATE TABLE app._forms (
    form_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    office_id   UUID NOT NULL REFERENCES app._offices(office_id),
    entity_id   UUID NOT NULL,
    FOREIGN KEY (office_id, entity_id) REFERENCES app._entities(office_id, entity_id),
    matter_id   UUID,
    FOREIGN KEY (office_id, matter_id) REFERENCES app._matters(office_id, matter_id),
    form_type   TEXT NOT NULL,
    form_data   JSONB NOT NULL DEFAULT '{}'::jsonb,
    status      TEXT NOT NULL DEFAULT 'submitted',

    CONSTRAINT forms_office_uk UNIQUE (office_id, form_id),
    CONSTRAINT forms_status_check CHECK (status IN ('draft', 'submitted', 'reviewed', 'filed'))
);
SELECT app.setup_auditable_table('forms');
CREATE INDEX ON app._forms(form_type)                       WHERE deleted_at IS NULL;
CREATE INDEX ON app._forms(entity_id)                       WHERE deleted_at IS NULL;
CREATE INDEX ON app._forms(office_id)                       WHERE deleted_at IS NULL;
CREATE INDEX ON app._forms(matter_id)                       WHERE matter_id IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX ON app._forms(status)                          WHERE deleted_at IS NULL;


-- SYSTEM USER SEED
-- Unattended writes (cron, migrations, admin scripts) attribute to this
-- user via `runAsSystem(...)` in @makase-law/shared. The auth.users row is
-- required because app._user_profiles.user_id FKs into it; the row is
-- deliberately unlogin-able (no password, banned). The on_auth_user_created
-- trigger will create the matching app._user_profiles row and the
-- set_audit_fields trigger will self-attribute created_by/updated_by via
-- app.acting_user_id that handle_new_auth_user sets to NEW.id.
INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    email_confirmed_at,
    raw_user_meta_data,
    created_at,
    updated_at,
    banned_until
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000001',
    'authenticated',
    'authenticated',
    'system@makase.internal',
    NOW(),
    '{"name": "SYSTEM"}'::jsonb,
    NOW(),
    NOW(),
    'infinity'
);
