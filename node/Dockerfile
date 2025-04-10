FROM node:20.19.0-alpine AS build

RUN apk add --no-cache git=~2
COPY .git /tmp/.git

ARG GIT_BRANCH
ARG GIT_HASH

ENV GIT_BRANCH=$GIT_BRANCH
ENV GIT_HASH=$GIT_HASH

RUN <<END
if [ -z "$GIT_BRANCH" ]; then
	printf 'export GIT_BRANCH="%s"\n' "$(git -C /tmp/.git rev-parse --abbrev-ref HEAD)"
else
	printf 'export GIT_BRANCH="%s"\n' "$GIT_BRANCH"
fi >/home/node/git.env
if [ -z "$GIT_HASH" ]; then
	printf 'export GIT_HASH="%s"\n' "$(git -C /tmp/.git rev-parse --short HEAD)"
else
	printf 'export GIT_HASH="%s"\n' "$GIT_HASH"
fi >>/home/node/git.env

rm -r /tmp/.git
apk del git
END

USER node
RUN mkdir /home/node/app

WORKDIR /home/node
COPY --chown=node:node frontend/package.json frontend/package-lock.json ./
COPY --chown=node:node,--chmod=755 node/entrypoint.sh ./

RUN npm ci

ENV PATH=/home/node/node_modules/.bin:$PATH

WORKDIR /home/node/app

ENTRYPOINT ["/home/node/entrypoint.sh"]
CMD ["npm", "run", "start"]
