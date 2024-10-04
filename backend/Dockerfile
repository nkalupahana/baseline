FROM node:18-slim

RUN DEBIAN_FRONTEND=noninteractive sed -i 's/bookworm/trixie/g' /etc/apt/sources.list.d/debian.sources \
    && apt update \
    && apt install -y g++ libvips-dev=8.15.3-1 make python3 \
    && apt clean

WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci
COPY . ./
ENV NODE_ENV=production

CMD [ "npm", "start" ]
