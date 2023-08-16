# Use an official Node.js runtime as the parent image
FROM node:lts-alpine as build

# Set the working directory in the Docker container and other steps
RUN mkdir -p /usr/src/app && chown -R node:node /usr/src/app

# Switch to non-root user "node"
USER node

# Specify the "working directory" for the rest of the Dockerfile
WORKDIR /usr/src/app

# Install app dependencies
COPY --chown=node:node package*.json ./
RUN npm ci --only=production

# Copy app source to /usr/src/app
COPY --chown=node:node . .

# Start from a clean image
FROM node:lts-alpine as esn-hd-member

# Define arguments for labels
ARG BUILD_VERSION
ARG BUILD_DATE
ARG VCS_REF

# Set environment variable for port with a default value
ENV APP_VERSION=$BUILD_VERSION
ENV PORT=3000

LABEL maintainer="github@sauna.re" \
      org.opencontainers.image.title="ESN-HD-Member" \
      org.opencontainers.image.version=$BUILD_VERSION \
      org.opencontainers.image.created=$BUILD_DATE \
      org.opencontainers.image.revision=$VCS_REF \
      org.opencontainers.image.source="https://github.com/fabsau/ESNHDMember" \
      org.opencontainers.image.documentation="https://github.com/fabsau/ESNHDMember/blob/master/README.md"

# Create app directory and specify the "working directory"
RUN mkdir -p /usr/src/app/cert && chown -R node:node /usr/src/app && apk --no-cache add curl
WORKDIR /usr/src/app
COPY --from=build --chown=node:node /usr/src/app .

# Define healthcheck command
COPY healthcheck.sh /healthcheck.sh
RUN chmod +x /healthcheck.sh
HEALTHCHECK --interval=10s --timeout=3s CMD /healthcheck.sh

# Switch to non-root user "node"
USER node

# The service listens on port 3000.
EXPOSE $PORT

# Define command to start your app
CMD [ "node", "bin/www" ]
