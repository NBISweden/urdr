-- Default data for the "setting" table.

-- To load from the command line:
--
--	sqlite3 database.db <setting-defaults.sql

PRAGMA auto_vacuum = FULL;
PRAGMA foreign_keys = ON;

-- "Default days"
-- https://github.com/NBISweden/urdr/issues/22
--
-- A user may have a default report for a day.  The setting entry
-- for a default day has the abbreviated name of the day as its
-- setting "name".  There are no default values.  When a user adds
-- a default day, that day will be written to the "user_setting"
-- table as a string that encodes a JSON array with entries like
-- {"issue":1234,"activity":56,"hours":7} (where the values used for
-- the keys "issue" and "activity" are Redmine internal identifiers for
-- issues and activities).

INSERT INTO setting (name, value) VALUES
	('Mon', NULL),
	('Tue', NULL),
	('Wed', NULL),
	('Thu', NULL),
	('Fri', NULL),
	('Sat', NULL),
	('Sun', NULL);

-- "Tabbing behaviour"
-- https://github.com/NBISweden/urdr/issues/4
--
-- Pressing tab to go to the next input field could take you to the next
-- field to the right, or to the next field below.  A user may choose
-- whether to move horizontally or vertically.  The default value is
-- "horizontal".

INSERT INTO setting (name, value) VALUES
	('tab', 'horizontal');	-- or 'vertical'

-- "Default input view (or behavior)"
-- https://github.com/NBISweden/urdr/issues/23
--
-- A user's default way of inputting their time log may be "daily" or
-- "weekly".  The default value is "daily".

INSERT INTO setting (name, value) VALUES
	('input', 'daily');	-- or 'weekly'
