FROM node:20.3.0-alpine as build

USER node
RUN mkdir /home/node/app

WORKDIR /home/node
COPY --chown=node:node /frontend/package.json /frontend/package-lock.json ./
RUN npm ci

ENV PATH=/home/node/node_modules/.bin:$PATH

WORKDIR /home/node/app

CMD ["npm", "run", "start"]
