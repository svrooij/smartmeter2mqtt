FROM node:current-alpine as build
WORKDIR /usr/src/app
COPY package*.json ./
RUN apk update &&\
  apk add --no-cache make gcc g++ python linux-headers udev
RUN npm ci --only=production
COPY index.js ./
COPY ./lib/ ./lib/ 

FROM node:current-alpine
WORKDIR /usr/src/app
COPY --from=build /usr/src/app /usr/src/app
EXPOSE 6329
CMD ["node", "./index.js"]