FROM node:18-slim

RUN DEBIAN_FRONTEND=noninteractive sed -i 's/bookworm/trixie/g' /etc/apt/sources.list.d/debian.sources \
    && apt-get update \
    && apt-get install -y g++ libvips-dev=8.16.1-1+b1 make python3 \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci
COPY . ./
ENV NODE_ENV=production

CMD [ "npm", "start" ]
