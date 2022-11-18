FROM node:18-slim

WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci
COPY . ./

CMD [ "npm", "start" ]