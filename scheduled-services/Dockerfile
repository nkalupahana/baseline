FROM node:18

WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci
COPY . ./
ENV NODE_ENV=production
RUN apt update \
    && apt install ffmpeg -y \
    && rm -rf /var/lib/apt/lists/* /var/cache/apt/archives/*

CMD [ "npm", "start" ]