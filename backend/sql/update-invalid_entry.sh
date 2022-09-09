#!/bin/sh

# This script updates the "invalid_entry" table in the backend database.
# It does this by querying the Redmine instance's PostgreSQL database
# and inserting the values directly into the Urdr database.

# Arguments:
#
# 1:	The pathname for the docker-compose.yml file for the ops-redmine
#	repository.
#
# 2:	The pathname to the Urdr database file.  This file is assumed to
#	have at least the schema loaded from "backend/sql/schema.sql".

unset -v err

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

{
	docker-compose -f "$1" exec -T -- postgres \
		psql -U redmine |
	sqlite3 "$2" \
		'DELETE FROM invalid_entry' \
		'.import /dev/stdin invalid_entry' \
		'VACUUM'
} <<'END_COPY'
COPY (
	(
		SELECT	0, e.id
		FROM	enumerations AS e
		WHERE	e.type = 'TimeEntryActivity'
		AND	e.name = 'Design'
		AND	e.project_id IS NULL
	)
	UNION
	(
		SELECT DISTINCT
			i.id, e.parent_id
		FROM	issues AS i
		JOIN	enumerations AS e USING (project_id)
		WHERE	e.type = 'TimeEntryActivity'
		AND NOT	e.active
	)
)
TO	STDOUT
WITH	csv
	DELIMITER '|'
END_COPY

echo 'Done.'

