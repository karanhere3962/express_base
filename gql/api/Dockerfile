FROM node:22-slim

WORKDIR /app


RUN apt-get update 
RUN apt-get update && apt-get install -y curl

COPY package*.json ./
COPY tsconfig.json ./

RUN yarn install

COPY . .

EXPOSE 8080

RUN yarn build

CMD ["yarn", "start"]
