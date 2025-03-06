FROM node:20.3.0-alpine AS build

USER node
RUN mkdir /home/node/app

# Switch to root user to install git
USER root

# Install git with root privileges
RUN apk update && apk add --no-cache git=2.40.0-r0

# Switch back to the node user
USER node

WORKDIR /home/node
COPY --chown=node:node /frontend/package.json /frontend/package-lock.json ./
RUN npm ci

ENV PATH=/home/node/node_modules/.bin:$PATH

WORKDIR /home/node/app

CMD ["npm", "run", "start"]
