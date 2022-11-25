FROM node:18-slim

WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci
COPY . ./
ENV NODE_ENV=production

CMD [ "npm", "start" ]