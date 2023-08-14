# Use an official Node.js runtime as the parent image
FROM node:18

# Declare the user and group identifiers as build arguments with default values
ARG PUID=501
ARG PGID=500

# Create a group using the PGID and a user using the PUID
RUN groupadd -r nodeuser -g ${PGID} && \
    useradd --no-log-init -r -g nodeuser -u ${PUID} nodeuser

# Set the working directory in the Docker container
WORKDIR /usr/src/app

# Change ownership to created user
RUN chown -R ${PUID}:${PGID} /usr/src/app

# Copy package*.json to the Docker container
COPY package*.json ./

# Install application dependencies in the Docker container
RUN npm install

# Copy the application files into the Docker container
COPY . .

# Change ownership of all the files to new user and group
RUN chown -R ${PUID}:${PGID} /usr/src/app

# Expose application on port 3000
EXPOSE 3000

# Switch to non-root user
USER nodeuser

# Run the application when the Docker container is started
CMD [ "node", "bin/www" ]
