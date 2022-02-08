-- Relational database schema for Urdr, storing the data that is not
-- kept by Redmine by default but that we need to be persistent between
-- sessions.
--
-- We assume that this file is used to initialize a SQLite database.
-- From the command line, this could be done using the following command
-- (which creates the database file "database.db" if it does not already
-- exist):
--
--	sqlite database.db <sql/schema.sql
--
-- See also https://sqlite.org/docs.html


PRAGMA foreign_keys = ON;

BEGIN;

DROP TABLE IF EXISTS preference;
CREATE TABLE preference (
	preference_id INTEGER
		PRIMARY KEY AUTOINCREMENT,
	name TEXT NOT NULL,
	value TEXT,	-- a default value, if applicable

	UNIQUE (preference_id, name)
);

DROP TABLE IF EXISTS user_pref;
CREATE TABLE user_pref (
	user_id	INTEGER NOT NULL,
	preference_id INTEGER NOT NULL,
	value TEXT,

	UNIQUE (user_id, preference_id),

	FOREIGN KEY (preference_id)
		REFERENCES preference (preference_id)
		ON DELETE CASCADE
);

-- Insert default values:

-- "Default days"
-- https://github.com/NBISweden/urdr/issues/22
--
-- A user may have a default report for a day.  The preference entry
-- for a default days has the abbreviated name of the day as "name",
-- and the report for that day as a string that encodes a JSON array
-- with "{ issue: ..., activity: ..., hours: ... }" entries (where
-- "issue" and "activity" are Redmine internal identifiers for issues
-- and activities).

INSERT INTO preference (name, value) VALUES
	("Mon", NULL),
	("Tue", NULL),
	("Wed", NULL),
	("Thu", NULL),
	("Fri", NULL),
	("Sat", NULL),
	("Sun", NULL);

-- "Tabbing behaviour"
-- https://github.com/NBISweden/urdr/issues/4
--
-- Pressing tab to go to the next input field could take you to the next
-- field to the right, or to the next field below.  A user may choose
-- whether to move horizontally or vertically.

INSERT INTO preference (name, value) VALUES
	("tab", "horizontal");	-- or "vertical"

-- "Default input view"
-- https://github.com/NBISweden/urdr/issues/23
--
-- A user's default way of inputting their time log may be "daily" or
-- "weekly".

INSERT INTO preference (name, value) VALUES
	("input", "daily");	-- or "weekly"

COMMIT;
