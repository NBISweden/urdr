#!/bin/sh

if [ -f /home/node/git.env ]; then
	# shellcheck disable=SC1091
	. /home/node/git.env
fi

exec "$@"
