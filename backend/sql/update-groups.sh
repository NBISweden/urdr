#!/bin/sh

# This script fetches data about the available Redmine groups and
# updates the local Urdr database with the group information and the
# users' group memberships.  Data is fetched using the Redmine REST API.

# Arguments:
#
# 1:	The redmine api key of an admin
# 2:    The redmine api endpoint
# 3:    The database.db file path

tmp_groups=$(mktemp)
trap 'rm -rf -- "$tmp_groups"' EXIT

api_key=$1
redmine_url=$2
database_path=$3

if [ ! -f "$database_path" ] || [ "${database_path%.db}" = "$database_path" ]
then
	cat >&2 <<-'END_ERROR'
	ERROR: The third argument is supposed to be the pathname to the
	       Urdr backend SQLite3 database file.
	END_ERROR
	exit 1
fi

# Fetch basic group info.

curl --silent --header "X-Redmine-API-Key: $api_key" \
	"$redmine_url/groups.json" >"$tmp_groups"

# Import group IDs and their names into our "group" table.

jq -r '.groups[] | [.id, .name] | @csv' "$tmp_groups" |
sqlite3 "$database_path" \
	'DELETE FROM "group"' \
	'.separator ","' \
	'.import /dev/stdin "group"' \
	'VACUUM'

# Get users for each group.

set --

jq -r '.groups[].id' "$tmp_groups" |
{
	while IFS= read -r group_id; do
		set -- "$@" "$redmine_url/groups/$group_id.json?include=users"
	done

	curl --silent --header "X-Redmine-API-Key: $api_key" "$@" |
	jq -r '.group | .id as $gid | .users[] | [ .id, $gid ] | @csv' |
	sqlite3 "$database_path" \
		'DELETE FROM user_group' \
		'.separator ","' \
		'.import /dev/stdin user_group' \
		'VACUUM'
}

echo 'Done.'
