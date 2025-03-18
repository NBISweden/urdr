#!/bin/sh

if [ -f /home/node/git.env ]; then
	. /home/node/git.env
fi

exec "$@"
