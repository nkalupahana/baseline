FROM node:18-slim

RUN DEBIAN_FRONTEND=noninteractive apt-get update && \
    apt-get install -y libvips && \
    apt-get clean

WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci
COPY . ./
ENV NODE_ENV=production

CMD [ "npm", "start" ]