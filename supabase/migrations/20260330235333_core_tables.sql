-- SCHEMA
CREATE SCHEMA app;

-- Dedicated connection role for the API. No login (the connection pool
-- authenticates separately), no BYPASSRLS so all policies are enforced.
CREATE ROLE api LOGIN NOINHERIT NOBYPASSRLS;

REVOKE ALL ON SCHEMA app FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA app REVOKE ALL ON TABLES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA app REVOKE ALL ON FUNCTIONS FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA app REVOKE ALL ON SEQUENCES FROM anon, authenticated;

-- Grant DML but not DDL or TRUNCATE to the API role.
GRANT USAGE ON SCHEMA app TO api;
ALTER DEFAULT PRIVILEGES IN SCHEMA app
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO api;
ALTER DEFAULT PRIVILEGES IN SCHEMA app
  GRANT USAGE ON SEQUENCES TO api;

-- EXTENSIONS
CREATE SCHEMA IF NOT EXISTS extensions;
CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA extensions;

-- FUNCTIONS
--
-- Audit attribution is driven by the per-transaction GUC `app.acting_user_id`,
-- set by the shared `runAs(office_id, user_id, fn)` helper via `set_config(..., true)`.
-- This trigger is attached BEFORE INSERT OR UPDATE to every auditable table,
-- overwriting created_by/updated_by so application code never has to pass
-- them. created_at/created_by are preserved on UPDATE (you cannot rewrite
-- history).
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

CREATE OR REPLACE FUNCTION app.acting_office_id()
RETURNS uuid LANGUAGE sql STABLE
SET search_path = ''
AS $$ SELECT NULLIF(current_setting('app.acting_office_id', true), '')::uuid $$;


CREATE OR REPLACE FUNCTION app.prevent_delete()
RETURNS trigger LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  RAISE EXCEPTION 'Hard DELETE is not permitted on %. Use soft delete (set deleted_at/deleted_by) instead.', TG_TABLE_NAME;
END;
$$;

-- Soft-delete attribution is trigger-owned: inserted rows are forced active,
-- and UPDATE callers set/clear deleted_at while the database stamps deleted_by.
CREATE OR REPLACE FUNCTION app.set_soft_delete_fields()
RETURNS trigger LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  acting UUID;
BEGIN
  IF TG_OP = 'INSERT' THEN
    NEW.deleted_at := NULL;
    NEW.deleted_by := NULL;
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.deleted_at IS DISTINCT FROM OLD.deleted_at THEN
      IF NEW.deleted_at IS NULL THEN
        NEW.deleted_by := NULL;
      ELSE
        acting := NULLIF(current_setting('app.acting_user_id', true), '')::uuid;
        IF acting IS NULL THEN
          RAISE EXCEPTION
            'app.acting_user_id is not set — soft delete attribution for %.% requires runAs(...) or runAsSystem(...)',
            TG_TABLE_SCHEMA, TG_TABLE_NAME
            USING ERRCODE = 'insufficient_privilege';
        END IF;
        NEW.deleted_by := acting;
      END IF;
    ELSE
      -- Prevent callers from changing deleted_by without a delete/restore.
      NEW.deleted_by := OLD.deleted_by;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;


CREATE OR REPLACE FUNCTION app.setup_auditable_table(tbl TEXT)
RETURNS void LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  EXECUTE format(
    'ALTER TABLE app.%I '
    'ADD COLUMN created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), '
    'ADD COLUMN created_by UUID NOT NULL DEFAULT app.acting_user_id() REFERENCES app.user_profiles(user_id), '
    'ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), '
    'ADD COLUMN updated_by UUID NOT NULL DEFAULT app.acting_user_id() REFERENCES app.user_profiles(user_id)',
    tbl
  );
  EXECUTE format(
    'CREATE TRIGGER %I_audit BEFORE INSERT OR UPDATE ON app.%I '
    'FOR EACH ROW EXECUTE FUNCTION app.set_audit_fields()',
    tbl, tbl
  );
  EXECUTE format(
    'CREATE TRIGGER %I_log AFTER INSERT OR UPDATE OR DELETE ON app.%I '
    'FOR EACH ROW EXECUTE FUNCTION app.write_audit_log()',
    tbl, tbl
  );
END;
$$;

CREATE OR REPLACE FUNCTION app.setup_office_rls(tbl TEXT)
RETURNS void LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  EXECUTE format(
    'ALTER TABLE app.%I ENABLE ROW LEVEL SECURITY',
    tbl
  );
  EXECUTE format(
    $sql$
      CREATE POLICY office_scoped_insert_%1$I ON app.%2$I FOR INSERT TO api
      WITH CHECK (app.acting_office_id() IS NOT NULL AND office_id = app.acting_office_id())
    $sql$,
    tbl, tbl
  );
  EXECUTE format(
    $sql$
      CREATE POLICY office_scoped_update_%1$I ON app.%2$I FOR UPDATE TO api
      USING (app.acting_office_id() IS NOT NULL AND office_id = app.acting_office_id())
      WITH CHECK (office_id = app.acting_office_id())
    $sql$,
    tbl, tbl
  );
  EXECUTE format(
    $sql$
      CREATE POLICY office_scoped_delete_%1$I ON app.%2$I FOR DELETE TO api
      USING (app.acting_office_id() IS NOT NULL AND office_id = app.acting_office_id())
    $sql$,
    tbl, tbl
  );
  EXECUTE format(
    $sql$
      CREATE POLICY office_scoped_select_%1$I ON app.%2$I FOR SELECT TO api
      USING (
        (
          app.acting_office_id() IS NULL
          AND office_id IN (SELECT app.permitted_office_ids())
        )
        OR (
          app.acting_office_id() IS NOT NULL
          AND office_id = app.acting_office_id()
        )
      )
    $sql$,
    tbl, tbl
  );
END;
$$;

CREATE OR REPLACE FUNCTION app.setup_office_scoped_table(tbl TEXT)
RETURNS void LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  PERFORM app.setup_auditable_table(tbl);
  PERFORM app.setup_office_rls(tbl);
END;
$$;

-- Adds soft-delete columns, creates active/all views, and attaches
-- soft-delete protection triggers.
-- Call after setup_office_scoped_table so the soft-delete trigger can run before
-- set_audit_fields checks whether the UPDATE is a no-op.
-- Expects the underscored base table to already exist with office_id.
-- Indexes that reference deleted_at must come AFTER this call.
CREATE OR REPLACE FUNCTION app.setup_soft_delete(tbl TEXT)
RETURNS void LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  base_name TEXT := SUBSTRING(tbl, 2);
BEGIN
  EXECUTE format(
    'ALTER TABLE app.%I '
    'ADD COLUMN deleted_at TIMESTAMPTZ, '
    'ADD COLUMN deleted_by UUID REFERENCES app.user_profiles(user_id), '
    'ADD CHECK ((deleted_at IS NULL) = (deleted_by IS NULL))',
    tbl
  );
  EXECUTE format(
    'CREATE TRIGGER %I BEFORE INSERT OR UPDATE ON app.%I '
    'FOR EACH ROW EXECUTE FUNCTION app.set_soft_delete_fields()',
    '00_soft_delete_fields', tbl
  );
  EXECUTE format(
    'CREATE VIEW app.%I WITH (security_invoker = true) '
    'AS SELECT * FROM app.%I WHERE deleted_at IS NULL',
    base_name, tbl
  );
  EXECUTE format(
    'CREATE TRIGGER no_delete INSTEAD OF DELETE ON app.%I '
    'FOR EACH ROW EXECUTE FUNCTION app.prevent_delete()',
    base_name
  );
  EXECUTE format(
    'CREATE VIEW app.%I_all WITH (security_invoker = true) '
    'AS SELECT * FROM app.%I',
    base_name, tbl
  );
  EXECUTE format(
    'CREATE TRIGGER no_delete_all INSTEAD OF DELETE ON app.%I_all '
    'FOR EACH ROW EXECUTE FUNCTION app.prevent_delete()',
    base_name
  );
END;
$$;

-- AUDIT LOG
-- The write_audit_log function is defined here but the audit_log table
-- it writes into is declared further down (after user_profiles, so the
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
    table_schema, table_name, record_pk, op, diff, changed_by, office_id
  ) VALUES (
    TG_TABLE_SCHEMA, TG_TABLE_NAME, record_pk, TG_OP, diff, acting,
    CASE TG_OP
      WHEN 'DELETE' THEN OLD.office_id
      ELSE NEW.office_id
    END
  );

  RETURN NULL;  -- AFTER trigger, return value ignored
END;
$$;

-- USER PROFILES
CREATE TABLE app.user_profiles (
    user_id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE NO ACTION,
    display_name    TEXT NOT NULL,
    email           TEXT NOT NULL UNIQUE,
    phone           TEXT
);


-- Auth-triggered writes to app.user_profiles set app.acting_user_id to
-- the user themselves so the audit trigger attributes the row correctly.
CREATE OR REPLACE FUNCTION app.handle_new_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  PERFORM set_config('app.acting_user_id', NEW.id::text, true);
  INSERT INTO app.user_profiles (user_id, display_name, email, phone)
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
  UPDATE app.user_profiles
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
CREATE TABLE app.offices (
    office_id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        TEXT NOT NULL,
    address     JSONB,
    phone       TEXT,
    email       TEXT,
    website     TEXT,
    logo        TEXT
);


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
    changed_by   UUID NOT NULL REFERENCES app.user_profiles(user_id),
    office_id    UUID NOT NULL REFERENCES app.offices(office_id),
    -- Reference identity, not employment: audit rows must survive employee
    -- deactivation and system-authored writes.
    changed_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX ON app.audit_log (table_schema, table_name, changed_at DESC);
CREATE INDEX ON app.audit_log USING gin (record_pk);
CREATE INDEX ON app.audit_log (changed_by, changed_at DESC);
CREATE INDEX ON app.audit_log (office_id, changed_at DESC);

-- Lock down: only the SECURITY DEFINER trigger function (owned by
-- postgres) can INSERT. api can SELECT (for the audit UI).
-- No role can UPDATE, DELETE, or TRUNCATE.
REVOKE ALL ON app.audit_log FROM PUBLIC, api;
GRANT SELECT ON app.audit_log TO api;



-- EMPLOYEES
CREATE TABLE app._employees (
    user_id             UUID NOT NULL REFERENCES app.user_profiles(user_id),
    office_id           UUID NOT NULL REFERENCES app.offices(office_id),
    full_legal_name     TEXT NOT NULL,
    bar_numbers         JSONB NOT NULL DEFAULT '[]'::jsonb, -- [{state: string, number: string}]
    is_admin            BOOLEAN NOT NULL DEFAULT FALSE,
    PRIMARY KEY (office_id, user_id)
);
SELECT app.setup_soft_delete('_employees'); -- used to deactivate employees from a firm, but they are still in the system for historical purposes and to keep tasks that were assigned to them before they were deactivated etc.
CREATE INDEX ON app._employees(user_id) WHERE deleted_at IS NULL;
CREATE INDEX ON app._employees(office_id) WHERE deleted_at IS NULL;

CREATE OR REPLACE FUNCTION app.permitted_office_ids() 
RETURNS SETOF uuid LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = ''
AS $$
  SELECT office_id 
  FROM app._employees 
  WHERE user_id = (SELECT app.acting_user_id()) AND deleted_at IS NULL;
$$;

-- RLS policy expressions invoke these; api must be able to call them.
GRANT EXECUTE ON FUNCTION app.acting_user_id() TO api;
GRANT EXECUTE ON FUNCTION app.acting_office_id() TO api;
GRANT EXECUTE ON FUNCTION app.permitted_office_ids() TO api;

SELECT app.setup_office_scoped_table('_employees');



-- now that employees table is setup, we can finish setting up the offices table
SELECT app.setup_office_scoped_table('offices');


-- TEAMS
CREATE TABLE app.teams (
    team_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    office_id UUID NOT NULL REFERENCES app.offices(office_id),
    name TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    CONSTRAINT teams_office_uk UNIQUE (office_id, team_id)
);
SELECT app.setup_office_scoped_table('teams');
-- no soft delete because we nothing should be tied to a deleted team and data in the team table is just for display purposes.
-- anything tied to a team will need to be reassigned to a new team before the team can be deleted
CREATE INDEX ON app.teams(office_id);


-- team_roles
CREATE TABLE app.team_roles (
    team_role_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    office_id UUID NOT NULL REFERENCES app.offices(office_id),
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    role_config JSONB NOT NULL DEFAULT '{}'::jsonb,
    -- Per-resource action capability map. Shape:
    --   { <resource>: { <action>: 'self' | 'team', ... }, ... }
    -- Absence of an action key = deny. The action vocabulary is intentionally
    -- left loose at the schema level; it will be finalized during API
    -- development to mirror the actual endpoint set, and may grow finer
    -- (e.g., split 'write' into 'create' / 'update', promote 'delete' /
    -- 'send' / 'void' out of 'write' as gating needs surface). Tentative
    -- starting point:
    --   read, write, assign, close, approve
    -- with per-resource subsets (e.g., matter: read/write/assign/close;
    -- invoice: read/write/approve; entity: read/write).
    --
    -- Scopes are deliberately limited to 'team' and 'self' — there is no
    -- 'office' scope. Users who need cross-team visibility (billing manager,
    -- managing partner, compliance officer, office manager) are modeled by
    -- adding them to every relevant team via team_member_roles. is_admin on
    -- _employees is the only above-team bypass and is reserved for actions
    -- that don't fit the resource/scope model (managing the office record,
    -- defining roles, etc.).
    --
    -- "self" predicates are defined per-resource by the application:
    --   _matters         responsible_attorney_id = user_id
    --   tasks            assigned_to = user_id
    --   leads            assigned_attorney_user_id = user_id
    --   time_entries     user_id = user_id
    --   expenses         user_id = user_id
    --   invoices         (no self — team only)
    --   invoice_payments (no self — team only)
    --
    -- Future: a "default team members" UX (auto-added to every team, optionally
    -- hidden from listings, optionally non-removable) would bolt on as
    -- hidden/locked columns on team_member_roles without changing this shape.
    /*
    {
      matter: {
        read:   'team' | 'self',
        write:  'team' | 'self',
        assign: 'team' | 'self',
        close:  'team' | 'self'
      },
      invoice: {
        read:    'team',
        write:   'team' | 'self',
        approve: 'team' | 'self'
      },
      ...
    }
    */
    CONSTRAINT team_roles_office_uk UNIQUE (office_id, team_role_id)
);
SELECT app.setup_office_scoped_table('team_roles');
CREATE INDEX ON app.team_roles(office_id);


-- TEAM_MEMBER_ROLES
CREATE TABLE app.team_member_roles (
    office_id UUID NOT NULL REFERENCES app.offices(office_id) ON DELETE NO ACTION,
    team_id UUID NOT NULL,
    FOREIGN KEY (office_id, team_id) REFERENCES app.teams(office_id, team_id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    FOREIGN KEY (office_id, user_id) REFERENCES app._employees(office_id, user_id) ON DELETE CASCADE,
    team_role_id UUID NOT NULL,
    FOREIGN KEY (office_id, team_role_id) REFERENCES app.team_roles(office_id, team_role_id) ON DELETE CASCADE,
    PRIMARY KEY (office_id, team_id, user_id, team_role_id)
);
SELECT app.setup_office_scoped_table('team_member_roles');
CREATE INDEX ON app.team_member_roles(office_id);
CREATE INDEX ON app.team_member_roles(office_id, team_id);
CREATE INDEX ON app.team_member_roles(office_id, user_id);
CREATE INDEX ON app.team_member_roles(office_id, team_id, team_role_id);


-- MATTERS
CREATE TABLE app._matters (
    matter_id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    office_id   UUID NOT NULL REFERENCES app.offices(office_id),
    team_id     UUID NOT NULL,
    FOREIGN KEY (office_id, team_id) REFERENCES app.teams(office_id, team_id),
    responsible_attorney_id UUID NOT NULL,
    FOREIGN KEY (office_id, responsible_attorney_id) REFERENCES app._employees(office_id, user_id),
    supervising_attorney_id UUID NOT NULL,
    FOREIGN KEY (office_id, supervising_attorney_id) REFERENCES app._employees(office_id, user_id),
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
    archived_by                  UUID,
    FOREIGN KEY (office_id, archived_by) REFERENCES app._employees(office_id, user_id),


    CONSTRAINT matters_office_uk UNIQUE (office_id, matter_id),
    CONSTRAINT matters_team_uk UNIQUE (office_id, matter_id, team_id),
    CONSTRAINT matters_billing_type_check CHECK (billing_type IN (
        'active', 'active_deferred', 'contingency', 'flat_fee', 'flat_fee_plus_hourly'
    )),
    CONSTRAINT matters_stage_check CHECK (stage IN (
        'consultation', 'setup', 'active', 'closed', 'archived'
    )),
    CONSTRAINT matters_archived_check CHECK ((archived_at IS NULL) = (archived_by IS NULL))
);
SELECT app.setup_office_scoped_table('_matters');
SELECT app.setup_soft_delete('_matters');
CREATE INDEX ON app._matters(office_id)                     WHERE deleted_at IS NULL;
CREATE INDEX ON app._matters(office_id, team_id)            WHERE deleted_at IS NULL;
CREATE INDEX ON app._matters(stage)                         WHERE deleted_at IS NULL;


-- ENTITIES (universal person/organization registry)
CREATE TABLE app.entities (
    entity_id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    office_id       UUID NOT NULL REFERENCES app.offices(office_id),
    full_legal_name TEXT NOT NULL,
    email           TEXT,
    phone           TEXT,
    entity_type     TEXT NOT NULL DEFAULT 'individual',
    metadata        JSONB NOT NULL DEFAULT '{}'::jsonb,

    CONSTRAINT entities_office_uk UNIQUE (office_id, entity_id),
    CONSTRAINT entities_type_check CHECK (entity_type IN ('individual', 'organization'))
);
SELECT app.setup_office_scoped_table('entities');
CREATE INDEX ON app.entities(office_id);
CREATE INDEX ON app.entities(email);
CREATE INDEX ON app.entities(phone);
CREATE INDEX ON app.entities USING gin (full_legal_name gin_trgm_ops);


-- ENTITY_ROLES (links entities to matters with their matter_role)
CREATE TABLE app.entity_roles (
    office_id   UUID NOT NULL REFERENCES app.offices(office_id),
    entity_id   UUID NOT NULL,
    FOREIGN KEY (office_id, entity_id) REFERENCES app.entities(office_id, entity_id),
    matter_id   UUID NOT NULL,
    FOREIGN KEY (office_id, matter_id) REFERENCES app._matters(office_id, matter_id) ON DELETE CASCADE,
    matter_role        TEXT NOT NULL,

    PRIMARY KEY (office_id, entity_id, matter_id, matter_role),
    CONSTRAINT entity_roles_role_check CHECK (matter_role IN (
        'prospective_client', 'client', 'opposing_party', 'witness', 'expert', 'attorney', 'other'
    ))
);
SELECT app.setup_office_scoped_table('entity_roles');
CREATE INDEX ON app.entity_roles(matter_id);


-- LEADS (intake pipeline)
CREATE TABLE app.leads (
    lead_id                         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    office_id                       UUID NOT NULL REFERENCES app.offices(office_id),
    team_id                         UUID NOT NULL,
    FOREIGN KEY (office_id, team_id) REFERENCES app.teams(office_id, team_id),

    full_legal_name                 TEXT,
    phone                           TEXT,
    email                           TEXT,
    lead_source                     TEXT,
    lead_source_data                JSONB NOT NULL DEFAULT '{}'::jsonb,

    stage                           TEXT NOT NULL DEFAULT 'collect_contact_info',

    existing_entity_id              UUID,
    FOREIGN KEY (office_id, existing_entity_id) REFERENCES app.entities(office_id, entity_id),
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
    FOREIGN KEY (office_id, entity_id) REFERENCES app.entities(office_id, entity_id) ON DELETE SET NULL (entity_id),
    matter_id                       UUID,
    FOREIGN KEY (office_id, matter_id) REFERENCES app._matters(office_id, matter_id) ON DELETE SET NULL (matter_id),

    CONSTRAINT leads_office_uk UNIQUE (office_id, lead_id),
    CONSTRAINT leads_team_uk UNIQUE (office_id, lead_id, team_id),

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
SELECT app.setup_office_scoped_table('leads');
CREATE INDEX ON app.leads(office_id);
CREATE INDEX ON app.leads(office_id, team_id);
CREATE INDEX ON app.leads(office_id, stage);
CREATE INDEX ON app.leads(assigned_attorney_user_id)       WHERE assigned_attorney_user_id IS NOT NULL;


-- Tasks
-- team_id consistency with parent matter/lead is enforced by the composite FKs below
-- (MATCH SIMPLE: FK is skipped when matter_id/lead_id is NULL, enforced when set).
CREATE TABLE app.tasks (
    task_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    office_id   UUID NOT NULL REFERENCES app.offices(office_id),
    team_id     UUID NOT NULL,
    FOREIGN KEY (office_id, team_id) REFERENCES app.teams(office_id, team_id) ON DELETE NO ACTION,
    matter_id   UUID,
    FOREIGN KEY (office_id, matter_id, team_id) REFERENCES app._matters(office_id, matter_id, team_id) ON UPDATE CASCADE,
    lead_id     UUID,
    FOREIGN KEY (office_id, lead_id, team_id) REFERENCES app.leads(office_id, lead_id, team_id),
    assigned_to UUID,
    FOREIGN KEY (office_id, assigned_to) REFERENCES app._employees(office_id, user_id),
    name        TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    status      TEXT NOT NULL DEFAULT 'pending',
    due_date    TIMESTAMPTZ,

    billable BOOLEAN NOT NULL DEFAULT FALSE,
    no_charge BOOLEAN NOT NULL DEFAULT FALSE,

    CONSTRAINT tasks_office_uk UNIQUE (office_id, task_id),
    CONSTRAINT tasks_team_uk UNIQUE (office_id, task_id, team_id),
    CONSTRAINT tasks_status_check CHECK (status IN (
        'pending', 'ready', 'active', 'done'
    )),
    CONSTRAINT tasks_context_check CHECK (
      matter_id IS NULL OR lead_id IS NULL
    )

);
SELECT app.setup_office_scoped_table('tasks');
CREATE INDEX ON app.tasks(office_id);
CREATE INDEX ON app.tasks(office_id, team_id);
CREATE INDEX ON app.tasks(matter_id) WHERE matter_id IS NOT NULL;
CREATE INDEX ON app.tasks(lead_id) WHERE lead_id IS NOT NULL;
CREATE INDEX ON app.tasks(assigned_to) WHERE assigned_to IS NOT NULL;
CREATE INDEX ON app.tasks(status);


-- INVOICES
CREATE TABLE app.invoices (
    invoice_id  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    office_id   UUID NOT NULL REFERENCES app.offices(office_id),
    team_id     UUID NOT NULL,
    FOREIGN KEY (office_id, team_id) REFERENCES app.teams(office_id, team_id) ON DELETE NO ACTION,
    matter_id   UUID NOT NULL,
    FOREIGN KEY (office_id, matter_id, team_id) REFERENCES app._matters(office_id, matter_id, team_id) ON UPDATE CASCADE,
    status      TEXT NOT NULL DEFAULT 'new',
    notes       TEXT,
    due_date    TIMESTAMPTZ,
    sent_at     TIMESTAMPTZ,
    billed_amount NUMERIC NOT NULL,
    late_fee_rate NUMERIC NOT NULL,
    late_fee_amount NUMERIC NOT NULL DEFAULT 0, -- billed_amount * late_fee_rate
    total_amount NUMERIC NOT NULL DEFAULT 0, -- billed_amount + late_fee_amount

    -- total_paid from invoice_payments table

    CONSTRAINT invoices_team_uk UNIQUE (office_id, invoice_id, team_id),
    CONSTRAINT invoices_matter_uk UNIQUE (office_id, invoice_id, matter_id),
    CONSTRAINT invoices_late_fee_amount_check CHECK (late_fee_amount >= 0),
    CONSTRAINT invoices_total_amount_check CHECK (total_amount >= 0),
    CONSTRAINT invoices_office_uk UNIQUE (office_id, invoice_id),
    CONSTRAINT invoices_status_check CHECK (status IN (
        'new', 'approved', 'sent', 'paid', 'closed'
    ))
);
SELECT app.setup_office_scoped_table('invoices');
CREATE INDEX ON app.invoices(office_id);
CREATE INDEX ON app.invoices(office_id, team_id);
CREATE INDEX ON app.invoices(matter_id) WHERE matter_id IS NOT NULL;
CREATE INDEX ON app.invoices(office_id, status);


-- TIME_ENTRIES
CREATE TABLE app.time_entries (
    time_entry_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    office_id         UUID NOT NULL REFERENCES app.offices(office_id) ON DELETE NO ACTION,
    -- team_id is denormalized from tasks so the permission plugin can apply
    -- a uniform `team_id = ANY(...)` predicate. The composite FK below
    -- cascades on UPDATE, so a matter (and therefore task, and therefore
    -- time_entry) moving teams propagates automatically — callers never
    -- have to reconcile this column themselves.
    team_id           UUID NOT NULL,
    FOREIGN KEY (office_id, team_id) REFERENCES app.teams(office_id, team_id) ON DELETE NO ACTION,
    task_id           UUID NOT NULL,
    FOREIGN KEY (office_id, task_id, team_id) REFERENCES app.tasks(office_id, task_id, team_id) ON UPDATE CASCADE ON DELETE NO ACTION,
    invoice_id        UUID,
    FOREIGN KEY (office_id, invoice_id) REFERENCES app.invoices(office_id, invoice_id) ON DELETE SET NULL (invoice_id),
    user_id           UUID NOT NULL,
    FOREIGN KEY (office_id, user_id) REFERENCES app._employees(office_id, user_id) ON DELETE NO ACTION,
    start_timestamp   TIMESTAMPTZ NOT NULL,
    end_timestamp     TIMESTAMPTZ NOT NULL,
    duration_seconds  INTEGER NOT NULL GENERATED ALWAYS AS (EXTRACT(EPOCH FROM (end_timestamp - start_timestamp))::INTEGER) STORED,

    description       TEXT,

    CONSTRAINT time_entries_office_uk UNIQUE (office_id, time_entry_id),
    CONSTRAINT time_entries_timestamp_check CHECK (start_timestamp < end_timestamp)
);
SELECT app.setup_office_scoped_table('time_entries');
CREATE INDEX ON app.time_entries(office_id);
CREATE INDEX ON app.time_entries(office_id, team_id);
CREATE INDEX ON app.time_entries(office_id, task_id) WHERE task_id IS NOT NULL;
CREATE INDEX ON app.time_entries(office_id, user_id);
CREATE INDEX ON app.time_entries(office_id, invoice_id) WHERE invoice_id IS NOT NULL;
CREATE INDEX ON app.time_entries(office_id, user_id, start_timestamp DESC);
CREATE INDEX ON app.time_entries(office_id, task_id, start_timestamp DESC);


-- EXPENSES
CREATE TABLE app.expenses (
    expense_id  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    office_id   UUID NOT NULL REFERENCES app.offices(office_id),
    team_id     UUID NOT NULL,
    FOREIGN KEY (office_id, team_id) REFERENCES app.teams(office_id, team_id) ON DELETE NO ACTION,
    matter_id   UUID,
    FOREIGN KEY (office_id, matter_id, team_id) REFERENCES app._matters(office_id, matter_id, team_id) ON UPDATE CASCADE,
    user_id     UUID NOT NULL,
    FOREIGN KEY (office_id, user_id) REFERENCES app._employees(office_id, user_id),
    invoice_id  UUID,
    FOREIGN KEY (office_id, invoice_id) REFERENCES app.invoices(office_id, invoice_id) ON DELETE SET NULL (invoice_id),
    amount      NUMERIC NOT NULL,
    description TEXT,
    is_reimbursable BOOLEAN NOT NULL DEFAULT FALSE,
    billable BOOLEAN NOT NULL DEFAULT TRUE,
    no_charge BOOLEAN NOT NULL DEFAULT FALSE,
    receipt_path TEXT[] NOT NULL DEFAULT '{}',
    external_invoice_data JSONB NOT NULL DEFAULT '{}'::jsonb,

    CONSTRAINT expenses_office_uk UNIQUE (office_id, expense_id)
);
SELECT app.setup_office_scoped_table('expenses');
CREATE INDEX ON app.expenses(office_id);
CREATE INDEX ON app.expenses(matter_id) WHERE matter_id IS NOT NULL;
CREATE INDEX ON app.expenses(invoice_id) WHERE invoice_id IS NOT NULL;


-- INVOICE_PAYMENTS
CREATE TABLE app.invoice_payments (
    invoice_payment_id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    office_id   UUID NOT NULL REFERENCES app.offices(office_id),
    -- team_id is denormalized from _matters via the cascading composite FK
    -- below so the permission plugin can apply `team_id = ANY(...)` directly.
    -- Matter team moves propagate here automatically.
    team_id     UUID NOT NULL,
    FOREIGN KEY (office_id, team_id) REFERENCES app.teams(office_id, team_id) ON DELETE NO ACTION,
    matter_id   UUID NOT NULL,
    FOREIGN KEY (office_id, matter_id, team_id) REFERENCES app._matters(office_id, matter_id, team_id) ON UPDATE CASCADE,
    invoice_id  UUID,
    FOREIGN KEY (office_id, matter_id, invoice_id) REFERENCES app.invoices(office_id, matter_id, invoice_id) ON DELETE NO ACTION,
    amount      NUMERIC NOT NULL CHECK (amount > 0),
    payment_date TIMESTAMPTZ NOT NULL,
    notes TEXT,
    external_id TEXT,
    external_type TEXT,
    external_url TEXT,
    external_data JSONB NOT NULL DEFAULT '{}'::jsonb,

    CONSTRAINT invoice_payments_office_uk UNIQUE (office_id, invoice_payment_id)
);
SELECT app.setup_office_scoped_table('invoice_payments');
CREATE INDEX ON app.invoice_payments(office_id);
CREATE INDEX ON app.invoice_payments(office_id, team_id);
CREATE INDEX ON app.invoice_payments(invoice_id) WHERE invoice_id IS NOT NULL;
CREATE INDEX ON app.invoice_payments(external_id) WHERE external_id IS NOT NULL;



ALTER TABLE app.user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY user_profiles_policy ON app.user_profiles FOR ALL TO api
    USING (
      user_id = app.acting_user_id()
      OR user_id IN (
        SELECT e.user_id
        FROM app._employees e
        WHERE e.office_id IN (SELECT * FROM app.permitted_office_ids())
      )
    )
    WITH CHECK (user_id = app.acting_user_id());

-- SYSTEM USER SEED
-- Unattended writes (cron, migrations, admin scripts) attribute to this
-- user via `runAsSystem(...)` in @makase-law/shared. The auth.users row is
-- deliberately unlogin-able (no password, banned). The on_auth_user_created
-- trigger creates the matching app.user_profiles row.
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