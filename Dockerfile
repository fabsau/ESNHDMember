# Use an official Node.js runtime as the parent image
FROM node:18

# Set the working directory in the Docker container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json into the Docker container
COPY package*.json ./

# Install application dependencies in the Docker container
RUN npm install

# Copy the application files into the Docker container
COPY . .

# Expose application on port 3000
EXPOSE 3000

# Run the application when the Docker container is started
CMD [ "node", "bin/www" ]