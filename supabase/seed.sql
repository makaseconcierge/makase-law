-- Local dev seed for Makase Law.
--
-- Creates two offices. dev@makase.dev has access to both.
-- Office A (Test Law Firm): dev + jane, two teams, two roles, sample matter/tasks/lead.
-- Office B (Second Law Firm): dev only, one team, Partner role.
--
-- Login: open http://127.0.0.1:54324 (Inbucket) after requesting a magic
-- link from the office-web login page for one of the seeded emails:
--   dev@makase.dev   (admin at both offices; Partner role)
--   jane@makase.dev  (Litigation team, Associate role — Test Law Firm only)

BEGIN;

-- 1. Auth users. The on_auth_user_created trigger inserts the matching
--    app.user_profiles row and sets app.acting_user_id to the new user
--    for that insert, so we don't need acting_user_id set yet.
-- GoTrue scans several auth.users columns as non-nullable Go strings
-- (confirmation_token, recovery_token, email_change_token_new, email_change)
-- and 500s if any are NULL. They have no DB-level default, so seed them
-- as '' explicitly.
INSERT INTO auth.users (
    instance_id, id, aud, role, email, email_confirmed_at,
    raw_user_meta_data, created_at, updated_at,
    confirmation_token, recovery_token, email_change_token_new, email_change
) VALUES
    ('00000000-0000-0000-0000-000000000000',
     '11111111-1111-1111-1111-111111111111',
     'authenticated', 'authenticated',
     'dev@makase.dev', NOW(),
     '{"name": "Dev User"}'::jsonb, NOW(), NOW(),
     '', '', '', ''),
    ('00000000-0000-0000-0000-000000000000',
     '22222222-2222-2222-2222-222222222222',
     'authenticated', 'authenticated',
     'jane@makase.dev', NOW(),
     '{"name": "Jane Doe"}'::jsonb, NOW(), NOW(),
     '', '', '', '')
ON CONFLICT (id) DO NOTHING;

-- 2. SYSTEM bootstraps the office and employee rows. The auth trigger
--    above left app.acting_user_id set to the last user inserted; reset
--    it to SYSTEM so audit attribution matches the runAsSystem path.
SET LOCAL app.acting_user_id = '00000000-0000-0000-0000-000000000001';

INSERT INTO app.offices (office_id, slug, name, email, phone, website)
VALUES (
    '00000000-0000-0000-0000-00000000aaaa',
    'test-law-firm',
    'Test Law Firm',
    'hello@testlaw.dev',
    '555-0100',
    'https://testlaw.dev'
)
ON CONFLICT (office_id) DO NOTHING;

-- Office-scoped tables require app.acting_office_id (see RLS + composite
-- FK setup in setup_office_scoped_table).
SET LOCAL app.acting_office_id = '00000000-0000-0000-0000-00000000aaaa';

INSERT INTO app._employees (user_id, office_id, full_legal_name, is_admin, bar_numbers)
VALUES
    ('11111111-1111-1111-1111-111111111111',
     '00000000-0000-0000-0000-00000000aaaa',
     'Dev User', TRUE,
     '[{"state":"CA","number":"123456"}]'::jsonb),
    ('22222222-2222-2222-2222-222222222222',
     '00000000-0000-0000-0000-00000000aaaa',
     'Jane Doe', FALSE,
     '[{"state":"CA","number":"234567"}]'::jsonb)
ON CONFLICT (office_id, user_id) DO NOTHING;

-- 3. Patrick takes over for the rest of the seed so the rows look like
--    realistic admin-authored content (created_by/updated_by → Patrick).
SET LOCAL app.acting_user_id = '11111111-1111-1111-1111-111111111111';

INSERT INTO app.teams (team_id, office_id, name, description) VALUES
    ('00000000-0000-0000-0000-0000000000b1',
     '00000000-0000-0000-0000-00000000aaaa',
     'Litigation', 'Trial and dispute work'),
    ('00000000-0000-0000-0000-0000000000b2',
     '00000000-0000-0000-0000-00000000aaaa',
     'Transactional', 'Contracts and corporate')
ON CONFLICT (office_id, name) DO NOTHING;

INSERT INTO app.employee_teams (office_id, user_id, team_id) VALUES
    ('00000000-0000-0000-0000-00000000aaaa',
     '11111111-1111-1111-1111-111111111111',
     '00000000-0000-0000-0000-0000000000b1'),
    ('00000000-0000-0000-0000-00000000aaaa',
     '11111111-1111-1111-1111-111111111111',
     '00000000-0000-0000-0000-0000000000b2'),
    ('00000000-0000-0000-0000-00000000aaaa',
     '22222222-2222-2222-2222-222222222222',
     '00000000-0000-0000-0000-0000000000b1')
ON CONFLICT (office_id, team_id, user_id) DO NOTHING;

INSERT INTO app.roles (role_id, office_id, name, description, permissions) VALUES
    ('00000000-0000-0000-0000-0000000000c1',
     '00000000-0000-0000-0000-00000000aaaa',
     'Partner', 'Full firm-wide access',
     '{
        "matter":  {"read":"office","write":"office","assign":"office","close":"office"},
        "invoice": {"read":"office","write":"office","approve":"office"},
        "task":    {"read":"office","write":"office"},
        "lead":    {"read":"office","write":"office"},
        "entity":  {"read":"office","write":"office"}
      }'::jsonb),
    ('00000000-0000-0000-0000-0000000000c2',
     '00000000-0000-0000-0000-00000000aaaa',
     'Associate', 'Team-scoped access',
     '{
        "matter":  {"read":"team","write":"team"},
        "invoice": {"read":"team","write":"team"},
        "task":    {"read":"team","write":"team"},
        "lead":    {"read":"team","write":"team"},
        "entity":  {"read":"team","write":"team"}
      }'::jsonb)
ON CONFLICT (role_id) DO NOTHING;

INSERT INTO app.employee_roles (office_id, user_id, role_id) VALUES
    ('00000000-0000-0000-0000-00000000aaaa',
     '11111111-1111-1111-1111-111111111111',
     '00000000-0000-0000-0000-0000000000c1'),
    ('00000000-0000-0000-0000-00000000aaaa',
     '22222222-2222-2222-2222-222222222222',
     '00000000-0000-0000-0000-0000000000c2')
ON CONFLICT (office_id, role_id, user_id) DO NOTHING;

-- Entities: an org client and an opposing individual.
INSERT INTO app.entities (entity_id, office_id, full_legal_name, email, phone, entity_type) VALUES
    ('00000000-0000-0000-0000-0000000000d1',
     '00000000-0000-0000-0000-00000000aaaa',
     'Acme Corp', 'legal@acme.com', '555-1000', 'organization'),
    ('00000000-0000-0000-0000-0000000000d2',
     '00000000-0000-0000-0000-00000000aaaa',
     'John Smith', 'john@example.com', '555-2000', 'individual')
ON CONFLICT (entity_id) DO NOTHING;

-- Matter: Acme v. Smith, owned by Litigation, Patrick is responsible.
INSERT INTO app._matters (
    matter_id, office_id, team_id,
    responsible_attorney_id, title, description,
    stage, type, billing_type, started_representation_at
) VALUES (
    '00000000-0000-0000-0000-0000000000e1',
    '00000000-0000-0000-0000-00000000aaaa',
    '00000000-0000-0000-0000-0000000000b1',
    '11111111-1111-1111-1111-111111111111',
    'Acme v. Smith',
    'Contract dispute over Q1 deliverables.',
    'active', 'litigation', 'active',
    NOW() - INTERVAL '14 days'
)
ON CONFLICT (matter_id) DO NOTHING;

INSERT INTO app.entity_roles (office_id, entity_id, matter_id, matter_role) VALUES
    ('00000000-0000-0000-0000-00000000aaaa',
     '00000000-0000-0000-0000-0000000000d1',
     '00000000-0000-0000-0000-0000000000e1',
     'client'),
    ('00000000-0000-0000-0000-00000000aaaa',
     '00000000-0000-0000-0000-0000000000d2',
     '00000000-0000-0000-0000-0000000000e1',
     'opposing_party')
ON CONFLICT DO NOTHING;

INSERT INTO app.tasks (
    task_id, office_id, team_id, matter_id, assigned_to,
    name, description, status, billable, due_date
) VALUES
    ('00000000-0000-0000-0000-0000000000f1',
     '00000000-0000-0000-0000-00000000aaaa',
     '00000000-0000-0000-0000-0000000000b1',
     '00000000-0000-0000-0000-0000000000e1',
     '11111111-1111-1111-1111-111111111111',
     'Draft motion to dismiss',
     'Initial draft due end of week.',
     'active', TRUE, NOW() + INTERVAL '5 days'),
    ('00000000-0000-0000-0000-0000000000f2',
     '00000000-0000-0000-0000-00000000aaaa',
     '00000000-0000-0000-0000-0000000000b1',
     '00000000-0000-0000-0000-0000000000e1',
     '22222222-2222-2222-2222-222222222222',
     'Review discovery requests',
     '', 'pending', TRUE, NOW() + INTERVAL '10 days'),
    ('00000000-0000-0000-0000-0000000000f3',
     '00000000-0000-0000-0000-00000000aaaa',
     '00000000-0000-0000-0000-0000000000b2',
     NULL,
     '11111111-1111-1111-1111-111111111111',
     'Quarterly billing review',
     'Non-matter admin task.', 'pending', FALSE, NULL)
ON CONFLICT (task_id) DO NOTHING;

-- Intake lead in the Transactional pipeline.
INSERT INTO app.leads (
    lead_id, office_id, team_id,
    full_legal_name, email, phone, lead_source, matter_type, stage
) VALUES (
    '00000000-0000-0000-0000-000000000091',
    '00000000-0000-0000-0000-00000000aaaa',
    '00000000-0000-0000-0000-0000000000b2',
    'Beta LLC', 'founder@beta.test', '555-3000',
    'website_form', 'corporate_formation',
    'collect_contact_info'
)
ON CONFLICT (lead_id) DO NOTHING;

-- 4. Second office — SYSTEM bootstraps it, dev authors the structure.
SET LOCAL app.acting_user_id = '00000000-0000-0000-0000-000000000001';

INSERT INTO app.offices (office_id, slug, name, email, phone, website)
VALUES (
    '00000000-0000-0000-0000-00000000bbbb',
    'second-law-firm',
    'Second Law Firm',
    'hello@secondlaw.dev',
    '555-0200',
    'https://secondlaw.dev'
)
ON CONFLICT (office_id) DO NOTHING;

SET LOCAL app.acting_office_id = '00000000-0000-0000-0000-00000000bbbb';

INSERT INTO app._employees (user_id, office_id, full_legal_name, is_admin, bar_numbers)
VALUES (
    '11111111-1111-1111-1111-111111111111',
    '00000000-0000-0000-0000-00000000bbbb',
    'Dev User', TRUE,
    '[{"state":"CA","number":"123456"}]'::jsonb
)
ON CONFLICT (office_id, user_id) DO NOTHING;

SET LOCAL app.acting_user_id = '11111111-1111-1111-1111-111111111111';

INSERT INTO app.teams (team_id, office_id, name, description) VALUES
    ('00000000-0000-0000-0000-000000000ba1',
     '00000000-0000-0000-0000-00000000bbbb',
     'General', 'General practice')
ON CONFLICT (office_id, name) DO NOTHING;

INSERT INTO app.employee_teams (office_id, user_id, team_id) VALUES
    ('00000000-0000-0000-0000-00000000bbbb',
     '11111111-1111-1111-1111-111111111111',
     '00000000-0000-0000-0000-000000000ba1')
ON CONFLICT (office_id, team_id, user_id) DO NOTHING;

INSERT INTO app.roles (role_id, office_id, name, description, permissions) VALUES
    ('00000000-0000-0000-0000-000000000bc1',
     '00000000-0000-0000-0000-00000000bbbb',
     'Partner', 'Full firm-wide access',
     '{
        "matter":  {"read":"office","write":"office","assign":"office","close":"office"},
        "invoice": {"read":"office","write":"office","approve":"office"},
        "task":    {"read":"office","write":"office"},
        "lead":    {"read":"office","write":"office"},
        "entity":  {"read":"office","write":"office"}
      }'::jsonb)
ON CONFLICT (role_id) DO NOTHING;

INSERT INTO app.employee_roles (office_id, user_id, role_id) VALUES
    ('00000000-0000-0000-0000-00000000bbbb',
     '11111111-1111-1111-1111-111111111111',
     '00000000-0000-0000-0000-000000000bc1')
ON CONFLICT (office_id, role_id, user_id) DO NOTHING;

COMMIT;
