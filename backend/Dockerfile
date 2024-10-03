FROM node:18-slim

RUN DEBIAN_FRONTEND=noninteractive apt-get update && \
    apt-get install -y g++ libvips libvips-dev make pkg-config && \
    apt-get clean

WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install --build-from-source sharp@0.32.6
RUN npm ci
COPY . ./
ENV NODE_ENV=production

CMD [ "npm", "start" ]
