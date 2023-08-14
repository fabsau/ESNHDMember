# Use an official Node.js runtime as the parent image
FROM node:lts-alpine as build

# Set the working directory in the Docker container
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
ARG IMAGE_VERSION=1.0.4

ENV APP_VERSION=$IMAGE_VERSION
LABEL maintainer="github@sauna.re"
LABEL org.opencontainers.image.title="ESN-HD-Member"
LABEL org.opencontainers.image.version=$IMAGE_VERSION
LABEL org.opencontainers.image.created=$BUILD_DATE
LABEL org.opencontainers.image.revision=$VCS_REF
LABEL org.opencontainers.image.source="https://github.com/fabsau/ESNHDMember"
LABEL org.opencontainers.image.documentation="https://github.com/fabsau/ESNHDMember/blob/master/README.md"

# Create app directory and specify the "working directory"
RUN mkdir -p /usr/src/app && chown -R node:node /usr/src/app
WORKDIR /usr/src/app
COPY --from=build --chown=node:node /usr/src/app .

# Switch to non-root user "node"
USER node

# The service listens on port 3000.
EXPOSE 3000

# Define command to start your app
CMD [ "node", "bin/www" ]
