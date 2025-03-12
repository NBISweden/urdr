#!/bin/sh

# This script applies all avilable migrations to the database
# given in the first argument.

mydir=$(dirname "$0")

database=$1
if [ ! -f "$database" ]; then
	printf 'Error: database file "%s" not found.\n' "$database" >&2
	printf 'Usage: %s <database>\n' "$0" >&2
	exit 1
fi

# For each of the available migrations, apply it to the database
# if it has not been applied yet.
for pathname in "$mydir"/migration-*.sql
do
	migration=$(basename "$pathname" .sql)
	migration=${migration#migration-}

	applied=$(
		sqlite3 \
			-cmd ".parameter set :name '$migration'" \
			"$database" \
			'SELECT COUNT(*) FROM migrations WHERE name = :name;'
	)

	if [ "$applied" != 1 ]; then
		printf 'Applying migration "%s"...\n' "$migration"
		sqlite3 "$database" <"$pathname"
	else
		printf 'Migration "%s" has already been applied.\n' "$migration"
	fi
done
