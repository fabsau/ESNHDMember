# ESN Heidelberg Member Portal
The ESN Heidelberg Member Portal is a Node.js web application running on the `Express.js` framework. It's been crafted for the members of ESN Heidelberg to manage their membership payments and integrate with Google Oauth and Stripe. They can handle their membership plans and personal information, while also enabling non-members to join.

## Key Functionality

1. **Authentication**: The application configures Google OAuth for user authentication, allowing users to sign in securely using their ESN Heidelberg Google profiles. It retrieves the email from the user's Google profile and designates it as a Stripe customer.

2. **Secure Payments and Subscriptions**: Leveraging `Stripe` integration, this application facilitates management and handling of payments and subscriptions. Users can comfortably create, change, or cancel their subscriptions via the Stripe Portal.

3. **Security**: Standard security measures are incorporated into the platform, including HTTP header, Content Security Policy (CSP), and Cross-Site Request Forgery (CSRF) protections. Importantly, the server doesn't retain any data, user information is dynamically fetched from Google and Stripe and stored on the users Browser Session.

[![Overview of Functions](https://screen.sauna.re/pora0/yazariJi80.mp4/raw)](https://screen.sauna.re/pora0/yazariJi80.mp4/raw)

## Table of Contents

1. [Docker](#docker)
    - [Docker Run](#docker-run)
    - [Docker Compose](#docker-compose)
    - [Docker Build](#docker-build)
2. [Running locally without Docker](#getting-started)
    - [Prerequisites](#prerequisites)
    - [Installation](#installation)

## Docker<a name="docker"></a>
### Docker Run
1. To start with Docker, ensure you have Docker installed on your machine. For installation instructions, check: Docker: https://docs.docker.com/install/

2. Pull the Docker image from Docker Hub:

```bash
docker pull fabsau/esn-hd-member:latest
```
3. Run the Docker image:

```bash
docker run -d --name esnmember -p 3000:3000 --env-file .env --restart unless-stopped fabsau/esn-hd-member:latest
```
Replace the `.env` in the `--env-file .env` command with the name of your environment configuration file. You can find the variables below or in the environment_template file

### Docker Compose

1. Ensure you have Docker Compose installed on your machine. For installation instructions, check: Docker Compose: https://docs.docker.com/compose/install/

2. Create your `docker-compose.yml` file with the following content:

```YAML
version: '3'
services:
  esnmember:  
    image: fabsau/esn-hd-member:latest
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

### Build Docker Image <a name="docker-build"></a>

If you want to build the Docker image yourself, follow these steps:

1. Clone the repository

```bash
git clone https://github.com/fabsau/ESNHDMember.git
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

### Prerequisites <a name="prerequisites"></a>

1. You need to have Node.js and npm installed in your system. You can download Node.js from here: https://nodejs.org/

2. You would also need to create a `.env` file in your project directory and use these variables:

```
# rename this file to .env
GOOGLE_CLIENT_ID=              # google cloud credential client id
GOOGLE_CLIENT_SECRET=          # google cloud credential oauth secret
SESSION_SECRET=                # generate long secret
STRIPE_API_KEY=                # your stripe key
BASE_URL=                      # example.com
PROTOCOL=                      # http or https
COOKIE_SECURE=                 # TRUE or FALSE sets cookie source to HTTPS
COOKIE_SAMESITE_STRICT=        # TRUE or FALSE sets cookie sameSite to strict
SUBSCRIPTION_PRICE_ID_MEMBER=  # price id of a subscription
SUBSCRIPTION_PRICE_ID_ALUMNI=  # second price id
```

### Installation <a name="install"></a>

To get this project running on your local machine for development and testing, follow these instructions:

1. Clone the repository

```bash
git clone https://github.com/fabsau/ESNHDMember.git
```

2. Navigate into the repository

```bash
cd ESNHDMember
```

3. Install all the dependencies

```bash
npm install
```

4. Start the application

```bash
npm start
```
