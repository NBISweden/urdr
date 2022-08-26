#!/bin/sh

# This script fetches data about the available redmine groups and pushes
# the user and user_groups to the urdr local db

# Arguments:
#
# 1:	The redmine api key of an admin
# 2:    The redmine api endpoint
# 3:    The database.db file path

unset -v err

curl --silent --header "X-Redmine-API-Key: $1" "$2/groups.json" | jq .groups | jq -c '.[]' |

while IFS= read -r obj; do
g_id=$(echo "$obj" | jq '.id')
g_name=$(echo "$obj" | jq '.name')
echo $g_name $g_id

## Insert groups in database
##sqlite3 "$3" "insert into group values ($g_id, $g_name)"
##

group=$(curl --silent --header "X-Redmine-API-Key: $1" "$2/groups/$g_id.json?include=users" | jq .group | jq -c '.')

g_id=$(echo "$group" | jq '.id')
users=$(echo "$group" | jq '.users' | jq -c '.[]')

echo $users | while IFS= read -r obj; do
u_id=$(echo $obj | jq -c .id)

## Insert user_groups in database
##sqlite3 "$3" "insert into user_group values ($u_id, $g_id)"
##

done
done

echo 'Done.'
