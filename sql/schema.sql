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

-- FIXME: The "user_id" datatype is currently unknown, so we assume that
--        it is INTEGER in the schema below.

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
