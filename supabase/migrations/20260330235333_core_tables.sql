-- SCHEMA
CREATE SCHEMA app;

REVOKE ALL ON SCHEMA app FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA app REVOKE ALL ON TABLES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA app REVOKE ALL ON FUNCTIONS FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA app REVOKE ALL ON SEQUENCES FROM anon, authenticated;

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

    IF NEW.deleted_at IS NOT NULL
       AND OLD.deleted_at IS NULL
       AND NEW.deleted_by IS NULL THEN
      NEW.deleted_by := acting;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION app.prevent_delete()
RETURNS trigger LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  RAISE EXCEPTION 'Hard DELETE is not permitted on %. Use soft delete (set deleted_at/deleted_by) instead.', TG_TABLE_NAME;
END;
$$;

-- USER PROFILES
CREATE TABLE app._user_profiles (
    user_id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE NO ACTION,
    display_name    TEXT NOT NULL,
    email           TEXT NOT NULL UNIQUE,
    phone           TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by      UUID NOT NULL REFERENCES app._user_profiles(user_id),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by      UUID NOT NULL REFERENCES app._user_profiles(user_id),
    deleted_at      TIMESTAMPTZ,
    deleted_by      UUID REFERENCES app._user_profiles(user_id),
    CHECK ((deleted_at IS NULL) = (deleted_by IS NULL))
);
CREATE VIEW app.user_profiles WITH (security_invoker = true)
AS SELECT * FROM app._user_profiles WHERE deleted_at IS NULL;

CREATE TRIGGER user_profiles_audit BEFORE INSERT OR UPDATE ON app._user_profiles
FOR EACH ROW EXECUTE FUNCTION app.set_audit_fields();

CREATE TRIGGER no_delete INSTEAD OF DELETE ON app.user_profiles
FOR EACH ROW EXECUTE FUNCTION app.prevent_delete();

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


-- OFFICES
CREATE TABLE app._offices (
    office_id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        TEXT NOT NULL,
    address     JSONB,
    phone       TEXT,
    email       TEXT,
    website     TEXT,
    logo        TEXT,
    role_config JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by  UUID NOT NULL REFERENCES app._user_profiles(user_id),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by  UUID NOT NULL REFERENCES app._user_profiles(user_id),
    deleted_at  TIMESTAMPTZ,
    deleted_by  UUID REFERENCES app._user_profiles(user_id),
    CHECK ((deleted_at IS NULL) = (deleted_by IS NULL))
);
CREATE VIEW app.offices WITH (security_invoker = true)
AS SELECT * FROM app._offices WHERE deleted_at IS NULL;

CREATE TRIGGER offices_audit BEFORE INSERT OR UPDATE ON app._offices
FOR EACH ROW EXECUTE FUNCTION app.set_audit_fields();

CREATE TRIGGER no_delete INSTEAD OF DELETE ON app.offices
FOR EACH ROW EXECUTE FUNCTION app.prevent_delete();


-- EMPLOYEES
CREATE TABLE app._employees (
    user_id             UUID NOT NULL REFERENCES app._user_profiles(user_id),
    office_id           UUID NOT NULL REFERENCES app._offices(office_id),
    full_legal_name     TEXT NOT NULL,
    bar_numbers         JSONB NOT NULL DEFAULT '[]'::jsonb, -- [{state: string, number: string}]
    dashboard_roles     TEXT[] NOT NULL DEFAULT '{}',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by          UUID NOT NULL REFERENCES app._user_profiles(user_id),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by          UUID NOT NULL REFERENCES app._user_profiles(user_id),
    deleted_at          TIMESTAMPTZ,
    deleted_by          UUID REFERENCES app._user_profiles(user_id),

    CHECK ((deleted_at IS NULL) = (deleted_by IS NULL)),
    PRIMARY KEY (office_id, user_id)
);
CREATE INDEX ON app._employees(user_id) WHERE deleted_at IS NULL;

CREATE VIEW app.employees WITH (security_invoker = true)
AS SELECT * FROM app._employees WHERE deleted_at IS NULL;

CREATE TRIGGER employees_audit BEFORE INSERT OR UPDATE ON app._employees
FOR EACH ROW EXECUTE FUNCTION app.set_audit_fields();

CREATE TRIGGER no_delete INSTEAD OF DELETE ON app.employees
FOR EACH ROW EXECUTE FUNCTION app.prevent_delete();


-- MATTERS
CREATE TABLE app._matters (
    matter_id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    office_id   UUID NOT NULL REFERENCES app._offices(office_id),
    title       TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    stage      TEXT NOT NULL DEFAULT 'consultation',
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
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by  UUID NOT NULL REFERENCES app._user_profiles(user_id),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by  UUID NOT NULL REFERENCES app._user_profiles(user_id),
    deleted_at  TIMESTAMPTZ,
    deleted_by  UUID REFERENCES app._user_profiles(user_id),
    CHECK ((deleted_at IS NULL) = (deleted_by IS NULL)), 

    CONSTRAINT matters_office_uk UNIQUE (office_id, matter_id),
    CONSTRAINT matters_billing_type_check CHECK (billing_type IN (
        'active', 'active_deferred', 'contingency', 'flat_fee', 'flat_fee_plus_hourly'
    )),
    CONSTRAINT matters_stage_check CHECK (stage IN (
        'consultation', 'setup', 'active', 'closed', 'archived'
    ))
);
CREATE VIEW app.matters WITH (security_invoker = true)
AS SELECT * FROM app._matters WHERE deleted_at IS NULL;

CREATE INDEX ON app._matters(office_id)                     WHERE deleted_at IS NULL;
CREATE INDEX ON app._matters(stage)                         WHERE deleted_at IS NULL;

CREATE TRIGGER matters_audit BEFORE INSERT OR UPDATE ON app._matters
FOR EACH ROW EXECUTE FUNCTION app.set_audit_fields();

CREATE TRIGGER no_delete INSTEAD OF DELETE ON app.matters
FOR EACH ROW EXECUTE FUNCTION app.prevent_delete();


-- MATTER STAFF (links firm employees to matters with their staffing role)
CREATE TABLE app._matter_staff (
    office_id   UUID NOT NULL REFERENCES app._offices(office_id),
    matter_id   UUID NOT NULL,
    user_id     UUID NOT NULL,
    FOREIGN KEY (office_id, matter_id) REFERENCES app._matters(office_id, matter_id),
    FOREIGN KEY (office_id, user_id)   REFERENCES app._employees(office_id, user_id),
    role        TEXT NOT NULL DEFAULT 'support',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by  UUID NOT NULL REFERENCES app._user_profiles(user_id),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by  UUID NOT NULL REFERENCES app._user_profiles(user_id),
    deleted_at  TIMESTAMPTZ,
    deleted_by  UUID REFERENCES app._user_profiles(user_id),
    CHECK ((deleted_at IS NULL) = (deleted_by IS NULL)),

    PRIMARY KEY (office_id, matter_id, user_id, role),
    CONSTRAINT matter_staff_role_check CHECK (role IN (
        'responsible', 'supervising', 'lead', 'counsel', 'support'
    ))
);
CREATE VIEW app.matter_staff WITH (security_invoker = true)
AS SELECT * FROM app._matter_staff WHERE deleted_at IS NULL;

CREATE INDEX ON app._matter_staff(office_id, matter_id) WHERE deleted_at IS NULL;
CREATE INDEX ON app._matter_staff(office_id, user_id)   WHERE deleted_at IS NULL;

-- Enforce exactly one 'responsible' attorney per active matter
CREATE UNIQUE INDEX ON app._matter_staff (office_id, matter_id)
  WHERE role = 'responsible' AND deleted_at IS NULL;

CREATE TRIGGER matter_staff_audit BEFORE INSERT OR UPDATE ON app._matter_staff
FOR EACH ROW EXECUTE FUNCTION app.set_audit_fields();

CREATE TRIGGER no_delete INSTEAD OF DELETE ON app.matter_staff
FOR EACH ROW EXECUTE FUNCTION app.prevent_delete();


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
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by      UUID NOT NULL REFERENCES app._user_profiles(user_id),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by      UUID NOT NULL REFERENCES app._user_profiles(user_id),
    deleted_at      TIMESTAMPTZ,
    deleted_by      UUID REFERENCES app._user_profiles(user_id),
    CHECK ((deleted_at IS NULL) = (deleted_by IS NULL)),

    CONSTRAINT entities_office_uk UNIQUE (office_id, entity_id),
    CONSTRAINT entities_type_check CHECK (entity_type IN ('individual', 'organization'))
);
CREATE VIEW app.entities WITH (security_invoker = true)
AS SELECT * FROM app._entities WHERE deleted_at IS NULL;
CREATE INDEX ON app._entities(office_id)                    WHERE deleted_at IS NULL;
CREATE INDEX ON app._entities(user_id)                      WHERE user_id IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX ON app._entities(email)                        WHERE deleted_at IS NULL;
CREATE INDEX ON app._entities(phone)                        WHERE deleted_at IS NULL;
CREATE INDEX ON app._entities USING gin (full_legal_name gin_trgm_ops) WHERE deleted_at IS NULL;

CREATE TRIGGER entities_audit BEFORE INSERT OR UPDATE ON app._entities
FOR EACH ROW EXECUTE FUNCTION app.set_audit_fields();

CREATE TRIGGER no_delete INSTEAD OF DELETE ON app.entities
FOR EACH ROW EXECUTE FUNCTION app.prevent_delete();


-- ENTITY_ROLES (links entities to matters with their role)
CREATE TABLE app._entity_roles (
    office_id   UUID NOT NULL REFERENCES app._offices(office_id),
    entity_id   UUID NOT NULL,
    FOREIGN KEY (office_id, entity_id) REFERENCES app._entities(office_id, entity_id),
    matter_id   UUID NOT NULL,
    FOREIGN KEY (office_id, matter_id) REFERENCES app._matters(office_id, matter_id),
    role        TEXT NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by  UUID NOT NULL REFERENCES app._user_profiles(user_id),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by  UUID NOT NULL REFERENCES app._user_profiles(user_id),
    deleted_at  TIMESTAMPTZ,
    deleted_by  UUID REFERENCES app._user_profiles(user_id),
    CHECK ((deleted_at IS NULL) = (deleted_by IS NULL)),

    PRIMARY KEY (office_id, entity_id, matter_id, role),
    CONSTRAINT entity_roles_unique UNIQUE (entity_id, matter_id, role),
    CONSTRAINT entity_roles_role_check CHECK (role IN (
        'prospective_client', 'client', 'opposing_party', 'witness', 'expert', 'attorney', 'other'
    ))
);
CREATE VIEW app.entity_roles WITH (security_invoker = true)
AS SELECT * FROM app._entity_roles WHERE deleted_at IS NULL;
CREATE INDEX ON app._entity_roles(matter_id)                WHERE deleted_at IS NULL;

CREATE TRIGGER entity_roles_audit BEFORE INSERT OR UPDATE ON app._entity_roles
FOR EACH ROW EXECUTE FUNCTION app.set_audit_fields();

CREATE TRIGGER no_delete INSTEAD OF DELETE ON app.entity_roles
FOR EACH ROW EXECUTE FUNCTION app.prevent_delete();


-- LEADS (intake pipeline)
CREATE TABLE app._leads (
    lead_id                         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    office_id                       UUID NOT NULL REFERENCES app._offices(office_id),

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

    created_at                      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by                      UUID NOT NULL REFERENCES app._user_profiles(user_id),
    updated_at                      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by                      UUID NOT NULL REFERENCES app._user_profiles(user_id),
    deleted_at                      TIMESTAMPTZ,
    deleted_by                      UUID REFERENCES app._user_profiles(user_id),
    CHECK ((deleted_at IS NULL) = (deleted_by IS NULL)),

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
CREATE VIEW app.leads WITH (security_invoker = true)
AS SELECT * FROM app._leads WHERE deleted_at IS NULL;

CREATE INDEX ON app._leads(office_id)                       WHERE deleted_at IS NULL;
CREATE INDEX ON app._leads(stage)                           WHERE deleted_at IS NULL;
CREATE INDEX ON app._leads(assigned_attorney_user_id)       WHERE assigned_attorney_user_id IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX ON app._leads(existing_entity_id)              WHERE existing_entity_id IS NOT NULL AND deleted_at IS NULL;

CREATE TRIGGER leads_audit BEFORE INSERT OR UPDATE ON app._leads
FOR EACH ROW EXECUTE FUNCTION app.set_audit_fields();

CREATE TRIGGER no_delete INSTEAD OF DELETE ON app.leads
FOR EACH ROW EXECUTE FUNCTION app.prevent_delete();


-- Tasks
CREATE TABLE app._tasks (
    task_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    office_id   UUID NOT NULL REFERENCES app._offices(office_id),
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

    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by  UUID NOT NULL REFERENCES app._user_profiles(user_id),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by  UUID NOT NULL REFERENCES app._user_profiles(user_id),
    deleted_at  TIMESTAMPTZ,
    deleted_by  UUID REFERENCES app._user_profiles(user_id),
    CHECK ((deleted_at IS NULL) = (deleted_by IS NULL)),

    CONSTRAINT tasks_office_uk UNIQUE (office_id, task_id),
    CONSTRAINT tasks_status_check CHECK (status IN (
        'pending', 'ready', 'active', 'done'
    ))
);
CREATE VIEW app.tasks WITH (security_invoker = true)
AS SELECT * FROM app._tasks WHERE deleted_at IS NULL;

CREATE INDEX ON app._tasks(office_id)                       WHERE deleted_at IS NULL;
CREATE INDEX ON app._tasks(matter_id)                       WHERE matter_id IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX ON app._tasks(lead_id)                         WHERE lead_id IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX ON app._tasks(assigned_to)                     WHERE assigned_to IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX ON app._tasks(status)                          WHERE deleted_at IS NULL;

CREATE TRIGGER tasks_audit BEFORE INSERT OR UPDATE ON app._tasks
FOR EACH ROW EXECUTE FUNCTION app.set_audit_fields();

CREATE TRIGGER no_delete INSTEAD OF DELETE ON app.tasks
FOR EACH ROW EXECUTE FUNCTION app.prevent_delete();


-- INVOICES
CREATE TABLE app._invoices (
    invoice_id  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    office_id   UUID NOT NULL REFERENCES app._offices(office_id),
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
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by  UUID NOT NULL REFERENCES app._user_profiles(user_id),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by  UUID NOT NULL REFERENCES app._user_profiles(user_id),
    deleted_at  TIMESTAMPTZ,
    deleted_by  UUID REFERENCES app._user_profiles(user_id),
    CHECK ((deleted_at IS NULL) = (deleted_by IS NULL)),

    CONSTRAINT invoices_late_fee_amount_check CHECK (late_fee_amount >= 0),
    CONSTRAINT invoices_total_amount_check CHECK (total_amount >= 0),
    CONSTRAINT invoices_office_uk UNIQUE (office_id, invoice_id),
    CONSTRAINT invoices_status_check CHECK (status IN (
        'new', 'approved', 'sent', 'paid', 'closed'
    ))
);
CREATE VIEW app.invoices WITH (security_invoker = true)
AS SELECT * FROM app._invoices WHERE deleted_at IS NULL;

CREATE INDEX ON app._invoices(office_id)                    WHERE deleted_at IS NULL;
CREATE INDEX ON app._invoices(matter_id)                    WHERE matter_id IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX ON app._invoices(status)                       WHERE deleted_at IS NULL;

CREATE TRIGGER invoices_audit BEFORE INSERT OR UPDATE ON app._invoices
FOR EACH ROW EXECUTE FUNCTION app.set_audit_fields();

CREATE TRIGGER no_delete INSTEAD OF DELETE ON app.invoices
FOR EACH ROW EXECUTE FUNCTION app.prevent_delete();


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
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by        UUID NOT NULL REFERENCES app._user_profiles(user_id),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by        UUID NOT NULL REFERENCES app._user_profiles(user_id),
    deleted_at        TIMESTAMPTZ,
    deleted_by        UUID REFERENCES app._user_profiles(user_id),
    CHECK ((deleted_at IS NULL) = (deleted_by IS NULL)),

    CONSTRAINT time_entries_office_uk UNIQUE (office_id, time_entry_id)
);
CREATE VIEW app.time_entries WITH (security_invoker = true)
AS SELECT * FROM app._time_entries WHERE deleted_at IS NULL;

CREATE INDEX ON app._time_entries(office_id)                WHERE deleted_at IS NULL;
CREATE INDEX ON app._time_entries(task_id)                  WHERE task_id IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX ON app._time_entries(user_id)                  WHERE deleted_at IS NULL;
CREATE INDEX ON app._time_entries(invoice_id)               WHERE invoice_id IS NOT NULL AND deleted_at IS NULL;

CREATE TRIGGER time_entries_audit BEFORE INSERT OR UPDATE ON app._time_entries
FOR EACH ROW EXECUTE FUNCTION app.set_audit_fields();

CREATE TRIGGER no_delete INSTEAD OF DELETE ON app.time_entries
FOR EACH ROW EXECUTE FUNCTION app.prevent_delete();


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
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by  UUID NOT NULL REFERENCES app._user_profiles(user_id),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by  UUID NOT NULL REFERENCES app._user_profiles(user_id),
    deleted_at  TIMESTAMPTZ,
    deleted_by  UUID REFERENCES app._user_profiles(user_id),
    CHECK ((deleted_at IS NULL) = (deleted_by IS NULL)),

    CONSTRAINT expenses_office_uk UNIQUE (office_id, expense_id)
);
CREATE VIEW app.expenses WITH (security_invoker = true)
AS SELECT * FROM app._expenses WHERE deleted_at IS NULL;

CREATE INDEX ON app._expenses(office_id)                    WHERE deleted_at IS NULL;
CREATE INDEX ON app._expenses(matter_id)                    WHERE matter_id IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX ON app._expenses(invoice_id)                   WHERE invoice_id IS NOT NULL AND deleted_at IS NULL;

CREATE TRIGGER expenses_audit BEFORE INSERT OR UPDATE ON app._expenses
FOR EACH ROW EXECUTE FUNCTION app.set_audit_fields();

CREATE TRIGGER no_delete INSTEAD OF DELETE ON app.expenses
FOR EACH ROW EXECUTE FUNCTION app.prevent_delete();


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
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by  UUID NOT NULL REFERENCES app._user_profiles(user_id),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by  UUID NOT NULL REFERENCES app._user_profiles(user_id),
    deleted_at  TIMESTAMPTZ,
    deleted_by  UUID REFERENCES app._user_profiles(user_id),
    CHECK ((deleted_at IS NULL) = (deleted_by IS NULL)),

    CONSTRAINT invoice_payments_office_uk UNIQUE (office_id, invoice_payment_id)
);
CREATE VIEW app.invoice_payments WITH (security_invoker = true)
AS SELECT * FROM app._invoice_payments WHERE deleted_at IS NULL;

CREATE INDEX ON app._invoice_payments(office_id)            WHERE deleted_at IS NULL;
CREATE INDEX ON app._invoice_payments(invoice_id)           WHERE invoice_id IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX ON app._invoice_payments(external_id)          WHERE external_id IS NOT NULL AND deleted_at IS NULL;

CREATE TRIGGER invoice_payments_audit BEFORE INSERT OR UPDATE ON app._invoice_payments
FOR EACH ROW EXECUTE FUNCTION app.set_audit_fields();

CREATE TRIGGER no_delete INSTEAD OF DELETE ON app.invoice_payments
FOR EACH ROW EXECUTE FUNCTION app.prevent_delete();


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
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by  UUID NOT NULL REFERENCES app._user_profiles(user_id),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by  UUID NOT NULL REFERENCES app._user_profiles(user_id),
    deleted_at  TIMESTAMPTZ,
    deleted_by  UUID REFERENCES app._user_profiles(user_id),
    CHECK ((deleted_at IS NULL) = (deleted_by IS NULL)),

    CONSTRAINT forms_office_uk UNIQUE (office_id, form_id),
    CONSTRAINT forms_status_check CHECK (status IN ('draft', 'submitted', 'reviewed', 'filed'))
);
CREATE VIEW app.forms WITH (security_invoker = true)
AS SELECT * FROM app._forms WHERE deleted_at IS NULL;

CREATE INDEX ON app._forms(form_type)                       WHERE deleted_at IS NULL;
CREATE INDEX ON app._forms(entity_id)                       WHERE deleted_at IS NULL;
CREATE INDEX ON app._forms(office_id)                       WHERE deleted_at IS NULL;
CREATE INDEX ON app._forms(matter_id)                       WHERE matter_id IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX ON app._forms(status)                          WHERE deleted_at IS NULL;

CREATE TRIGGER forms_audit BEFORE INSERT OR UPDATE ON app._forms
FOR EACH ROW EXECUTE FUNCTION app.set_audit_fields();

CREATE TRIGGER no_delete INSTEAD OF DELETE ON app.forms
FOR EACH ROW EXECUTE FUNCTION app.prevent_delete();


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
