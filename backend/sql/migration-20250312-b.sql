-- Migration: 20250312-b
-- Add extra columns to the "priority_entry" table.

BEGIN TRANSACTION;

ALTER TABLE priority_entry
	ADD COLUMN redmine_project_id INTEGER NOT NULL DEFAULT 0;
ALTER TABLE priority_entry
	ADD COLUMN redmine_issue_subject TEXT NOT NULL DEFAULT "";
ALTER TABLE priority_entry
	ADD COLUMN redmine_activity_name TEXT NOT NULL DEFAULT "";

INSERT INTO migrations(name) VALUES ('20250312-b');

COMMIT;
