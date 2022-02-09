-- Default data for the "preference" table.

-- To load from the command line:
--
--      sqlite3 database.db <preference-defaults.sql

PRAGMA foreign_keys = ON;

BEGIN;

-- "Default days"
-- https://github.com/NBISweden/urdr/issues/22
--
-- A user may have a default report for a day.  The preference entry
-- for a default day has the abbreviated name of the day as "name",
-- and the report for that day as a string that encodes a JSON array
-- with entries like {"issue":1234,"activity":56,"hours":7} (where the
-- values used for the keys "issue" and "activity" are Redmine internal
-- identifiers for issues and activities).

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

-- "Default input view (or behavior)"
-- https://github.com/NBISweden/urdr/issues/23
--
-- A user's default way of inputting their time log may be "daily" or
-- "weekly".

INSERT INTO preference (name, value) VALUES
	("input", "daily");	-- or "weekly"

COMMIT;
