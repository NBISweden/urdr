-- The relational database schema for Urdr, storing the data that is not
-- kept by Redmine by default but that we need to be persistent between
-- sessions.  We also store some data here for efficiency reasons.
--
-- We assume that this file is used to initialize a SQLite database.
-- The Go code does thes automatically, but you may also do so from the
-- command line, using the following command (which creates the database
-- file "database.db" if it does not already exist):
--
--	sqlite3 database.db <sql/schema.sql
--
-- See also:
--	https://sqlite.org/docs.html
--	https://sqlite.org/cli.html
--
-- The "sqlite3" command line utility is part of the "sqlite3" package
-- on Ubuntu.  The utility is part of the macOS base system and does not
-- need to be installed separately.

PRAGMA auto_vacuum = FULL;
PRAGMA foreign_keys = ON;

-- Settings.
-- A "setting" is a "name" and a "value".  The "name" is the name of
-- the setting, for example "tab" for specifying the wanted movement
-- when pressing the tab key.  The "value" is the default value of the
-- setting, for example "horizontal" for the "tab" setting.  A setting
-- without a default value has the value NULL.

DROP TABLE IF EXISTS setting;
CREATE TABLE setting (
	setting_id INTEGER PRIMARY KEY AUTOINCREMENT,
	name TEXT NOT NULL,
	value TEXT,	-- A default value, if applicable.

	UNIQUE (name)
		ON CONFLICT ROLLBACK
);

-- User settings.
-- A table connecting users with sets of settings.

DROP TABLE IF EXISTS user_setting;
CREATE TABLE user_setting (
	redmine_user_id INTEGER NOT NULL,
	setting_id INTEGER NOT NULL,
	value TEXT,	-- The user's preferred value
			-- for this setting.

	UNIQUE (redmine_user_id, setting_id)
		ON CONFLICT REPLACE,

	FOREIGN KEY (setting_id)
		REFERENCES setting (setting_id)
		ON DELETE CASCADE
);

-- Priority entries.
-- https://github.com/NBISweden/urdr/issues/11
-- https://github.com/NBISweden/urdr/issues/19
--
-- A "priority entry" is a combination of a Redmine issue and a Redmine
-- activity that a particular user has marked as either a favorite or as
-- a hidden entry.  We also store a sorting priority, which determines
-- the relative positioning in the user interface (it's essentially a
-- sorting key).
--
-- For reasons of efficiency, we additionally store the Redmine project
-- ID and name, the Redmine issue subject, and the Redmine activity
-- name.  This is not strictly necessary, but it makes it easier to
-- display the data in the user interface without having to query the
-- Redmine API for each entry.

DROP TABLE IF EXISTS priority_entry;
CREATE TABLE priority_entry (
	redmine_user_id INTEGER NOT NULL,
	redmine_project_id INTEGER NOT NULL DEFAULT 0,
	redmine_issue_id INTEGER NOT NULL,
	redmine_issue_subject TEXT NOT NULL DEFAULT "",
	redmine_activity_id INTEGER NOT NULL,
	redmine_activity_name TEXT NOT NULL DEFAULT "",
	name TEXT,
	is_hidden BOOLEAN,
	priority INTEGER NOT NULL,

	UNIQUE (redmine_user_id, redmine_issue_id, redmine_activity_id)
		ON CONFLICT REPLACE
);

-- Invalid entries.
-- https://github.com/NBISweden/urdr/issues/338
--
-- Not all activities can be used together with every issue.  Some
-- activities are not "active" for certain projects.  This is
-- configurable for projects in Redmine, not issues.
--
-- This table stores the combinations of issue IDs and activity IDs that
-- are explicitly inactivated.  Any combination not listed is active by
-- default.  An activity listed with a zero issue ID is deactivated for
-- all projects (zero is used rather than NULL to avoid issues with the
-- UNIQUE constraint).

DROP TABLE IF EXISTS invalid_entry;
CREATE TABLE invalid_entry (
	redmine_issue_id INTEGER NOT NULL,
	redmine_activity_id INTEGER NOT NULL,

	UNIQUE (redmine_issue_id, redmine_activity_id)
		ON CONFLICT REPLACE
);

-- Groups.
--
-- A table to store Redmine group data.  A group in this sense is a
-- Redmine group ID and the group's name.

DROP TABLE IF EXISTS group_info;
CREATE TABLE group_info (
	redmine_group_id INTEGER PRIMARY KEY,
	redmine_group_name TEXT NOT NULL,

	UNIQUE (redmine_group_name)
		ON CONFLICT ROLLBACK
);

-- User group mapping.
--
-- The table maps a user to a group.  A user belonging to several groups
-- will have multiple entries in this table.

DROP TABLE IF EXISTS user_group;
CREATE TABLE user_group (
	redmine_user_id INTEGER NOT NULL,
	redmine_group_id INTEGER NOT NULL,

	UNIQUE (redmine_user_id, redmine_group_id)
		ON CONFLICT REPLACE,

	FOREIGN KEY (redmine_group_id)
		REFERENCES group_info (redmine_group_id)
		ON DELETE CASCADE
);

-- Migrations.
--
-- The "migrations" table is used to keep track of the schema version.
-- Here, we create the table and initialise it with the migrations that
-- have already been applied (above).

DROP TABLE IF EXISTS migrations;
CREATE TABLE migrations (
	name TEXT NOT NULL,
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	UNIQUE (name) ON CONFLICT ROLLBACK
);

INSERT INTO migrations(name) VALUES
	('20250312-a'),
	('20250312-b');
