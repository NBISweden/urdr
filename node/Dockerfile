FROM node:17.6-slim
RUN npm install --global npm@8.5.1

RUN mkdir -p /home/node/app && chown -R node:node /home/node/app
COPY /frontend/ /home/node/app/
WORKDIR /home/node/app
RUN chown node:node package*.json && rm -rf node_modules

USER node
RUN npm install && npm run build
VOLUME /home/node/app/node_modules

CMD ["npm", "run", "start"]
