-- Mock users and groups, for use with the mock Redmine.
--
-- Thes replaces update-users-groups.sh in the mock
--
-- The IDs and names have to match the roster in
-- backend/cmd/mock-redmine/main.go, because the vacation overview
-- takes the members from these tables and then asks Redmine for each
-- one's absences by ID.
--
-- Load this into a database of its own and not into one holding real
-- data; see the mock Redmine section of README.md.

-- Redmine stores users and groups in a single table, so the two share
-- one ID space.  The group is numbered well clear of the users.

INSERT OR REPLACE INTO user_group_info (redmine_id, redmine_name, redmine_type)
VALUES
	(100, 'Mock Development Team', 'Group');

INSERT OR REPLACE INTO user_group_info (redmine_id, redmine_name, redmine_type)
VALUES
	(1, 'Dev User', 'User'),
	(2, 'Ada Lindgren', 'User'),
	(3, 'Björn Castillo', 'User'),
	(4, 'Carmen Dahl', 'User'),
	(5, 'Elias Nyqvist', 'User');

INSERT INTO user_group (redmine_user_id, redmine_group_id)
VALUES
	(1, 100),
	(2, 100),
	(3, 100),
	(4, 100),
	(5, 100);
