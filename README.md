# ESN Heidelberg Membership Management

This repository contains the code for the ESN Heidelberg Membership Management system. This application is developed using Node.js, Express.js, and Pug frames. With Google account support, the application provides the user signin feature with Google OAuth 2.0. All the data including user profiles, customers, and subscriptions are managed by using the Stripe API.

## Table of Contents

1. [Docker Run and Compose](#docker-run-compose)
2. [Docker Build](#docker-build)
3. [Getting Started](#getting-started)
4. [Prerequisites](#prerequisites)
5. [Installation](#install)
6. [Usage](#usage)
7. [Contributing](#contributing)
8. [License](#license)

## Docker Run and Compose <a name="docker-run-compose"></a>

Running this application with Docker simplifies the installation process and provides better scalability.

1. To start with Docker, ensure you have Docker installed on your machine. For installation instructions, check: Docker: https://docs.docker.com/install/

2. Pull the Docker image from Docker Hub:

```bash
docker pull fabsau/esn-hd-member:v1
```
3. Run the Docker image:

```bash
docker run -d --name esnmember -p 3000:3000 --env-file .env --restart unless-stopped fabsau/esn-hd-member:v1
```
Replace the `.env` in the `--env-file .env` command with the name of your environment configuration file. You can find the variables below or in the environment_template file

### Docker Compose

1. Ensure you have Docker Compose installed on your machine. For installation instructions, check: Docker Compose: https://docs.docker.com/compose/install/

2. Create your `docker-compose.yml` file with the following content:

```YAML
version: '3'
services:
  esnmember:  
    image: fabsau/esn-hd-member:v1
    container_name: esnmember
    hostname: esnmember
    restart: unless-stopped
    env_file: .env 
    ports: 
      - 3000:3000
```
Replace the `.env` in the `--env-file .env` command with the name of your environment configuration file. You can find the variables below or in the environment_template file

3. To start the Docker container, run:

```bash
docker-compose up -d
```

## Build Docker Image <a name="docker-build"></a>

If you want to build the Docker image yourself, follow these steps:

1. Clone the repository

```bash
git clone https://github.com/fabsau24/membership-management.git
```

2. Navigate into the directory

```bash
cd membership-management
```

3. Build the Docker image

```bash
docker build -t <your-name>/<your-image-name>:<tag> .
```

## Running localy without Docker <a name="getting-started"></a>

Follow these instructions to get a copy of the project up and running on your local machine for development and testing purposes.

## Prerequisites <a name="prerequisites"></a>

1. You need to have Node.js and npm installed in your system. You can download Node.js from here: https://nodejs.org/

2. You would also need to create a `.env` file in your project directory and use these variables:

```
GOOGLE_CLIENT_ID=<Obtain Google Client Id via Google Cloud>
GOOGLE_CLIENT_SECRET=<Obtain Google Client Secret>
SESSION_SECRET=<For the session Cookie generate a Secret Key>
STRIPE_API_KEY=<Your Stripe API Key>
SUBSCRIPTION_PRICE_ID_1=<Stripe Subscription Price Id>
PROTOCOL=<'http' or 'https'>
BASE_URL=<Your Website Base URL>
NODE_ENV=<'development' or 'production'>
```

## Installation <a name="install"></a>

To get this project running on your local machine for development and testing, follow these instructions:

1. Clone the repository

```bash
git clone https://github.com/fabsau24/membership-management.git
```

2. Navigate into the repository

```bash
cd membership-management
```

3. Install all the dependencies

```bash
npm install
```

4. Start the application

```bash
npm start
```

## Usage <a name="usage"></a>

The main entry point for the application is the `app.js` file. This file handles the main setup for the Express.js app - setting up middleware, routes, and error handling. The majority of functionality resides within named routes for user signup/login, session handling, as well as Stripe's subscription handling.

## Contributing <a name="contributing"></a>

Contributions of all sizes are welcome. Please read the contribution guideline for instructions on how to contribute to the codebase.

## License <a name="license"></a>

This project is licensed under the MIT License - see the LICENSE.md file for details.