FROM node:14-alpine

WORKDIR /opt/governance-watcher
COPY . ./

RUN npm ci

ENTRYPOINT [ "npm", "start" ]
