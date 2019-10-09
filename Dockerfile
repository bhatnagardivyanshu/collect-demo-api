FROM node:10-alpine

RUN mkdir -p /usr/src/collect

WORKDIR /usr/src/collect

RUN /bin/sh

RUN npm install -g pm2

COPY package*.json ./

RUN npm install

COPY . .

VOLUME /collect

CMD ["pm2-runtime", "index.js"]