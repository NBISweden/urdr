-- Migration: 20250414-a
-- Drop the "group_info" table,
-- Add the "user_group_info" table,
-- Recreate the "user_group" table.
-- Data is dropped from the affected tables.

BEGIN TRANSACTION;

DROP TABLE IF EXISTS group_info;
DROP TABLE IF EXISTS user_group_info;
CREATE TABLE user_group_info (
	redmine_id INTEGER PRIMARY KEY,
	redmine_name TEXT NOT NULL,
	redmine_type TEXT CHECK (redmine_type IN ('User', 'Group'))
);
DROP TABLE IF EXISTS user_group;
CREATE TABLE user_group (
	redmine_user_id INTEGER NOT NULL,
	redmine_group_id INTEGER NOT NULL,

	UNIQUE (redmine_user_id, redmine_group_id)
		ON CONFLICT REPLACE,

	FOREIGN KEY (redmine_user_id)
		REFERENCES user_group_info (redmine_id)
		ON DELETE CASCADE,
	FOREIGN KEY (redmine_group_id)
		REFERENCES user_group_info (redmine_id)
		ON DELETE CASCADE
);

INSERT INTO migrations(name) VALUES ('20250414-a');

COMMIT;
