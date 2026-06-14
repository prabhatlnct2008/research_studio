-- Studio seed — INSERT/UPDATE statements (idempotent via INSERT OR IGNORE).
-- Apply AFTER sql/01_schema.sql:  turso db shell <db> < sql/02_seed.sql
-- Superadmin login: admin@studio.local / ChangeMe!123  (change it after first sign-in)

-- Roles
INSERT OR IGNORE INTO roles (id, name, stage_scope, capabilities, is_builtin, created_at) VALUES ('00000000-0000-4000-8000-000000000001', 'Principal', '[0,1,2,3,4,5,6,7,8]', '{"work_on_stage":true,"advance_stage":true,"review_stage":true,"create_gates":true,"create_tasks":true,"assign_tasks":true,"create_clients":true,"create_studies":true,"create_roles":true,"manage_users":true}', 1, 1781414479835);
INSERT OR IGNORE INTO roles (id, name, stage_scope, capabilities, is_builtin, created_at) VALUES ('00000000-0000-4000-8000-000000000002', 'Researcher', '[0,1,2,4,5,6,7]', '{"work_on_stage":true,"create_tasks":true,"review_stage":true}', 0, 1781414479835);

-- Superadmin (password auth)
INSERT OR IGNORE INTO users (id, name, email, password_hash, must_change_password, role_id, status, invited_by, created_at) VALUES ('00000000-0000-4000-8000-000000000010', 'Principal Admin', 'admin@studio.local', '$2a$10$UWp9kzxRImw1i74oAbdAxey6UchVo4pFi1aom1f9tg0nr2VJPT4w2', 0, '00000000-0000-4000-8000-000000000001', 'active', NULL, 1781414479835);

-- Gate templates (seed future studies)
INSERT OR IGNORE INTO gate_template_items (id, stage_index, label, "order", created_at) VALUES ('00000000-0000-4000-8000-000000000300', 0, 'Brief received & logged', 0, 1781414479835);
INSERT OR IGNORE INTO gate_template_items (id, stage_index, label, "order", created_at) VALUES ('00000000-0000-4000-8000-000000000301', 0, 'Client objectives captured', 1, 1781414479835);
INSERT OR IGNORE INTO gate_template_items (id, stage_index, label, "order", created_at) VALUES ('00000000-0000-4000-8000-000000000302', 0, 'Feasibility confirmed', 2, 1781414479835);
INSERT OR IGNORE INTO gate_template_items (id, stage_index, label, "order", created_at) VALUES ('00000000-0000-4000-8000-000000000303', 1, 'Methodology drafted', 0, 1781414479835);
INSERT OR IGNORE INTO gate_template_items (id, stage_index, label, "order", created_at) VALUES ('00000000-0000-4000-8000-000000000304', 1, 'Budget estimated', 1, 1781414479835);
INSERT OR IGNORE INTO gate_template_items (id, stage_index, label, "order", created_at) VALUES ('00000000-0000-4000-8000-000000000305', 1, 'Timeline agreed internally', 2, 1781414479835);
INSERT OR IGNORE INTO gate_template_items (id, stage_index, label, "order", created_at) VALUES ('00000000-0000-4000-8000-000000000306', 2, 'Proposal document written', 0, 1781414479835);
INSERT OR IGNORE INTO gate_template_items (id, stage_index, label, "order", created_at) VALUES ('00000000-0000-4000-8000-000000000307', 2, 'Internal pricing review', 1, 1781414479835);
INSERT OR IGNORE INTO gate_template_items (id, stage_index, label, "order", created_at) VALUES ('00000000-0000-4000-8000-000000000308', 2, 'Proposal sent to client', 2, 1781414479835);
INSERT OR IGNORE INTO gate_template_items (id, stage_index, label, "order", created_at) VALUES ('00000000-0000-4000-8000-000000000309', 3, 'Client sign-off received', 0, 1781414479835);
INSERT OR IGNORE INTO gate_template_items (id, stage_index, label, "order", created_at) VALUES ('00000000-0000-4000-8000-000000000310', 3, 'Contract / PO logged', 1, 1781414479835);
INSERT OR IGNORE INTO gate_template_items (id, stage_index, label, "order", created_at) VALUES ('00000000-0000-4000-8000-000000000311', 3, 'Kick-off scheduled', 2, 1781414479835);
INSERT OR IGNORE INTO gate_template_items (id, stage_index, label, "order", created_at) VALUES ('00000000-0000-4000-8000-000000000312', 4, 'Questionnaire / discussion guide built', 0, 1781414479835);
INSERT OR IGNORE INTO gate_template_items (id, stage_index, label, "order", created_at) VALUES ('00000000-0000-4000-8000-000000000313', 4, 'Sample & quotas defined', 1, 1781414479835);
INSERT OR IGNORE INTO gate_template_items (id, stage_index, label, "order", created_at) VALUES ('00000000-0000-4000-8000-000000000314', 4, 'Fieldwork tools set up', 2, 1781414479835);
INSERT OR IGNORE INTO gate_template_items (id, stage_index, label, "order", created_at) VALUES ('00000000-0000-4000-8000-000000000315', 5, 'Recruitment screener live', 0, 1781414479835);
INSERT OR IGNORE INTO gate_template_items (id, stage_index, label, "order", created_at) VALUES ('00000000-0000-4000-8000-000000000316', 5, 'Quotas filled', 1, 1781414479835);
INSERT OR IGNORE INTO gate_template_items (id, stage_index, label, "order", created_at) VALUES ('00000000-0000-4000-8000-000000000317', 5, 'Fieldwork QA passed', 2, 1781414479835);
INSERT OR IGNORE INTO gate_template_items (id, stage_index, label, "order", created_at) VALUES ('00000000-0000-4000-8000-000000000318', 6, 'Data cleaned & coded', 0, 1781414479835);
INSERT OR IGNORE INTO gate_template_items (id, stage_index, label, "order", created_at) VALUES ('00000000-0000-4000-8000-000000000319', 6, 'Analysis plan executed', 1, 1781414479835);
INSERT OR IGNORE INTO gate_template_items (id, stage_index, label, "order", created_at) VALUES ('00000000-0000-4000-8000-000000000320', 6, 'Key findings drafted', 2, 1781414479835);
INSERT OR IGNORE INTO gate_template_items (id, stage_index, label, "order", created_at) VALUES ('00000000-0000-4000-8000-000000000321', 7, 'Report drafted', 0, 1781414479835);
INSERT OR IGNORE INTO gate_template_items (id, stage_index, label, "order", created_at) VALUES ('00000000-0000-4000-8000-000000000322', 7, 'Internal review complete', 1, 1781414479835);
INSERT OR IGNORE INTO gate_template_items (id, stage_index, label, "order", created_at) VALUES ('00000000-0000-4000-8000-000000000323', 7, 'Report delivered to client', 2, 1781414479835);
INSERT OR IGNORE INTO gate_template_items (id, stage_index, label, "order", created_at) VALUES ('00000000-0000-4000-8000-000000000324', 8, 'Debrief held', 0, 1781414479835);
INSERT OR IGNORE INTO gate_template_items (id, stage_index, label, "order", created_at) VALUES ('00000000-0000-4000-8000-000000000325', 8, 'Invoice raised', 1, 1781414479835);
INSERT OR IGNORE INTO gate_template_items (id, stage_index, label, "order", created_at) VALUES ('00000000-0000-4000-8000-000000000326', 8, 'Project archived', 2, 1781414479835);

-- Demo client + study
INSERT OR IGNORE INTO clients (id, name, sector, location, status, owner_id, created_at) VALUES ('00000000-0000-4000-8000-000000000100', 'Northwind Foods', 'FMCG', 'London, UK', 'active', '00000000-0000-4000-8000-000000000010', 1781414479835);
INSERT OR IGNORE INTO studies (id, client_id, name, type, lead_id, start_date, expected_end_date, actual_end_date, current_stage, status, created_at) VALUES ('00000000-0000-4000-8000-000000000200', '00000000-0000-4000-8000-000000000100', 'Brand Tracker 2026', 'Quantitative', '00000000-0000-4000-8000-000000000010', 1781414479835, 1789190479835, NULL, 0, 'active', 1781414479835);

-- Stage instances
INSERT OR IGNORE INTO stage_instances (id, study_id, stage_index, state, entered_at, created_at) VALUES ('00000000-0000-4000-8000-000000000400', '00000000-0000-4000-8000-000000000200', 0, 'in_progress', 1781414479835, 1781414479835);
INSERT OR IGNORE INTO stage_instances (id, study_id, stage_index, state, entered_at, created_at) VALUES ('00000000-0000-4000-8000-000000000401', '00000000-0000-4000-8000-000000000200', 1, 'not_started', NULL, 1781414479835);
INSERT OR IGNORE INTO stage_instances (id, study_id, stage_index, state, entered_at, created_at) VALUES ('00000000-0000-4000-8000-000000000402', '00000000-0000-4000-8000-000000000200', 2, 'not_started', NULL, 1781414479835);
INSERT OR IGNORE INTO stage_instances (id, study_id, stage_index, state, entered_at, created_at) VALUES ('00000000-0000-4000-8000-000000000403', '00000000-0000-4000-8000-000000000200', 3, 'not_started', NULL, 1781414479835);
INSERT OR IGNORE INTO stage_instances (id, study_id, stage_index, state, entered_at, created_at) VALUES ('00000000-0000-4000-8000-000000000404', '00000000-0000-4000-8000-000000000200', 4, 'not_started', NULL, 1781414479835);
INSERT OR IGNORE INTO stage_instances (id, study_id, stage_index, state, entered_at, created_at) VALUES ('00000000-0000-4000-8000-000000000405', '00000000-0000-4000-8000-000000000200', 5, 'not_started', NULL, 1781414479835);
INSERT OR IGNORE INTO stage_instances (id, study_id, stage_index, state, entered_at, created_at) VALUES ('00000000-0000-4000-8000-000000000406', '00000000-0000-4000-8000-000000000200', 6, 'not_started', NULL, 1781414479835);
INSERT OR IGNORE INTO stage_instances (id, study_id, stage_index, state, entered_at, created_at) VALUES ('00000000-0000-4000-8000-000000000407', '00000000-0000-4000-8000-000000000200', 7, 'not_started', NULL, 1781414479835);
INSERT OR IGNORE INTO stage_instances (id, study_id, stage_index, state, entered_at, created_at) VALUES ('00000000-0000-4000-8000-000000000408', '00000000-0000-4000-8000-000000000200', 8, 'not_started', NULL, 1781414479835);

-- Stage 0 gate items (seeded from template)
INSERT OR IGNORE INTO gate_items (id, study_id, stage_index, label, "order", status, created_at) VALUES ('00000000-0000-4000-8000-000000000500', '00000000-0000-4000-8000-000000000200', 0, 'Brief received & logged', 0, 'open', 1781414479835);
INSERT OR IGNORE INTO gate_items (id, study_id, stage_index, label, "order", status, created_at) VALUES ('00000000-0000-4000-8000-000000000501', '00000000-0000-4000-8000-000000000200', 0, 'Client objectives captured', 1, 'open', 1781414479835);
INSERT OR IGNORE INTO gate_items (id, study_id, stage_index, label, "order", status, created_at) VALUES ('00000000-0000-4000-8000-000000000502', '00000000-0000-4000-8000-000000000200', 0, 'Feasibility confirmed', 2, 'open', 1781414479835);
