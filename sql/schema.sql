-- A proposed relational database schema for Urdr, storing the data that
-- is not kept by Redmine by default but that we need to be persistent
-- between sessions.
--
-- We assume that this file is used to initialize a SQLite database.
-- From the command line, this could be done using the following command
-- (which creates the database file "database.db" if it does not already
-- exist):
--
--      sqlite3 database.db <sql/schema.sql
--
-- See also:
--      https://sqlite.org/docs.html
--      https://sqlite.org/cli.html
--
-- The `sqlite3` command line utility is part of the `sqlite3` package
-- on Ubuntu.  The utility is part of the macOS base system and does not
-- need to be installed separately.

-- FIXME:
-- The datatype for the fields whose names start with "redmine_" are
-- currently unknown, so we assume that they are INTEGER in the schema
-- below.

PRAGMA foreign_keys = ON;

BEGIN;

-- Preferences.
-- A "preference" is a "name" and a "value".  The "name" is the name of
-- the preference, for example "tab" for specifying the wanted movement
-- when pressing the tab key.  The "value" is the default value of the
-- preference, for example "horizontal" for the "tab" preference.  A
-- preference without a default value has the value NULL.

DROP TABLE IF EXISTS preference;
CREATE TABLE preference (
	preference_id INTEGER
		PRIMARY KEY AUTOINCREMENT,
	name TEXT NOT NULL,
	value TEXT,	-- a default value, if applicable

	UNIQUE (preference_id, name)
);

-- User preferences.
-- A table connecting users with sets of preferences.

DROP TABLE IF EXISTS user_pref;
CREATE TABLE user_pref (
	redmine_user_id	INTEGER NOT NULL,
	preference_id INTEGER NOT NULL,
	value TEXT,

	UNIQUE (redmine_user_id, preference_id)
		ON CONFLICT REPLACE,

	FOREIGN KEY (preference_id)
		REFERENCES preference (preference_id)
		ON DELETE CASCADE
);

-- Favorites.
-- https://github.com/NBISweden/urdr/issues/11
-- https://github.com/NBISweden/urdr/issues/19
--
-- A "favorite" is a combination of a Redmine issue and a Redmine
-- activity that a particular user has marked as a favorite.  We also
-- store a priority, which determines the relative positioning in the
-- user interface (it's essentially a sorting key).
--
-- NOTE:
-- The "redmine_activity_id" may be NULL.  This would mean that only
-- the Redmine issue was picked as a favorite without specifying a
-- particular activity.  The time logging interface would need to
-- provide a way to select an activity in this case.  It is unknown if
-- this would be useful or not (we might want "NOT NULL", or a default
-- value instead).

DROP TABLE IF EXISTS favorite;
CREATE TABLE favorite (
	favorite_id INTEGER
		PRIMARY KEY AUTOINCREMENT,
	redmine_user_id INTEGER NOT NULL,
	redmine_issue_id INTEGER NOT NULL,
	redmine_activity_id INTEGER,
	priority INTEGER NOT NULL,

	UNIQUE (redmine_user_id, redmine_issue_id, redmine_activity_id)
		ON CONFLICT REPLACE
);

COMMIT;
