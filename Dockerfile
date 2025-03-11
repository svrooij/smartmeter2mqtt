FROM node:22-bookworm-slim AS node-original
FROM node-original AS install
WORKDIR /usr/src/app
COPY package*.json ./
RUN apt-get update && \
  apt-get install -y make python3 udev gcc g++
RUN npm install --omit=dev

FROM install AS compile
#RUN npm install
COPY ./src/ ./src/
COPY tsconfig.json ./
RUN npm run prepack

FROM node-original AS combiner
WORKDIR /usr/src/app
COPY --from=install /usr/src/app/node_modules /usr/src/app/node_modules
COPY --from=install /usr/src/app/package.json /usr/src/app/package.json
COPY bin/run /usr/src/app/bin/run
COPY --from=compile /usr/src/app/dist /usr/src/app/dist

FROM node-original AS production
ARG BUILD_DATE=unknown
ARG BUILD_VERSION=0.0.0-development
ARG VCS_REF=not-set
WORKDIR /usr/src/app
COPY --from=combiner /usr/src/app /usr/src/app

LABEL org.label-schema.build-date=$BUILD_DATE \
      org.label-schema.description="Parsing data from your smartmeter and sending it to various outputs." \
      org.label-schema.name=smartmeter \
      org.label-schema.schema-version=1.0 \
      org.label-schema.url=https://github.com/svrooij/smartmeter2mqtt/ \
      org.label-schema.version=$BUILD_VERSION \
      org.label-schema.vcs-ref=$VCS_REF

CMD ["node", "./bin/run"]
