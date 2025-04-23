-- Migration: 20250422-a
-- Drop the "settings" table.
-- Recreate the "user_setting" table.

BEGIN TRANSACTION;

DROP TABLE IF EXISTS settings;

DROP TABLE IF EXISTS user_setting;
CREATE TABLE user_setting (
	redmine_user_id INTEGER NOT NULL,
	name TEXT NOT NULL,
	value TEXT,	-- The user's preferred value
			-- for this setting.

	UNIQUE (redmine_user_id, name)
		ON CONFLICT REPLACE
);

INSERT INTO migrations(name) VALUES ('20250422-a');

COMMIT;
