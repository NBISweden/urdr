#!/bin/sh

# This script fetches data about the available Redmine users and groups
# and updates the local Urdr database with the group information and
# the users' group memberships. It does this by querying the Redmine
# instance's PostgreSQL database and inserting the values directly into
# the Urdr database.

# Arguments:
#
# 1:  The pathname for the docker-compose.yml file for the ops-redmine
#     repository.
#
# 2:  The pathname to the Urdr database file.  This file is assumed to
#     have at least the schema loaded from "backend/sql/schema.sql".

if [ ! -f "$1" ] || [ "${1%.yml}" = "$1" ]; then
	cat >&2 <<-'END_ERROR'
	ERROR: The first argument is supposed to be a the pathname to
	       the ops-redmine repository's docker-compose.yml file.
	END_ERROR
	err=1
fi

if [ ! -f "$2" ] || [ "${2%.db}" = "$2" ]; then
	cat >&2 <<-'END_ERROR'
	ERROR: The second argument is supposed to be the pathname to the
	       Urdr backend SQLite3 database file.
	END_ERROR
	err=1
fi

[ "${err+set}" = set ] && exit 1

# Copy user info.
{
	docker-compose -f "$1" exec -T -- postgres \
		psql -U redmine |
	sqlite3 "$2" \
		"DELETE FROM user_group_info WHERE redmine_type = 'User'" \
		'.import /dev/stdin user_group_info' \
		'VACUUM'
} <<'END_COPY'
COPY (
	SELECT	id AS redmine_id,
		CONCAT(firstname, ' ', lastname) AS redmine_name,
		type AS redmine_type
	FROM	users
	WHERE	type = 'User'
)
TO	STDOUT
WITH	csv
	DELIMITER '|'
END_COPY
# Copy group info.
{
	docker-compose -f "$1" exec -T -- postgres \
		psql -U redmine |
	sqlite3 "$2" \
		"DELETE FROM user_group_info WHERE redmine_type = 'Group'" \
		'.import /dev/stdin user_group_info' \
		'VACUUM'
} <<'END_COPY'
COPY (
	SELECT	id AS redmine_id,
		lastname AS redmine_name,
		type AS redmine_type
	FROM	users
	WHERE	type = 'Group'
	AND	lastname != 'Anonymous Watchers'
)
TO	STDOUT
WITH	csv
	DELIMITER '|'
END_COPY

# Copy group-user relations.
{
	docker-compose -f "$1" exec -T -- postgres \
		psql -U redmine |
	sqlite3 "$2" \
		'DELETE FROM user_group' \
		'.import /dev/stdin user_group' \
		'VACUUM'
} <<'END_COPY'
COPY (
	SELECT	u.id AS redmine_user_id,
		g.id AS redmine_group_id
	FROM	users AS u
	JOIN	groups_users AS gu ON (gu.user_id = u.id)
	JOIN	users AS g ON (g.id = gu.group_id)
	WHERE	g.lastname != 'Anonymous Watchers'
)
TO	STDOUT
WITH	csv
	DELIMITER '|'
END_COPY

echo 'Done.'
