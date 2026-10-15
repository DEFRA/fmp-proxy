ARG PARENT_VERSION=2.9.0-node24.10.0

FROM defradigital/node:${PARENT_VERSION} AS build

USER root

WORKDIR /home/node/app

COPY --chown=root:root package*.json .npmrc ./
# The base image sets NODE_ENV=production; webpack is a dev dependency
RUN npm ci --ignore-scripts --include dev

COPY --chown=root:root ./webpack.config.js ./index.js ./
COPY --chown=root:root ./server ./server

RUN npm run build

FROM defradigital/node:${PARENT_VERSION} AS production

USER root

# set -xe : -e abort on error : -x verbose output
RUN set -xe \
  && apk update && apk upgrade \
  && rm -rf /var/cache/apk/* \
  && mkdir -p /home/node/app

WORKDIR /home/node/app

# The webpack bundle is self-contained, so node_modules is not needed at runtime
COPY --from=build --chown=root:root /home/node/app/build ./build

ARG PORT=3000
ENV FMPPROXYPORT=${PORT}

USER node
EXPOSE ${PORT}/tcp
CMD [ "node", "build/index.js" ]
