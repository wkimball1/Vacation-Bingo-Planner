# Deployment Guide

This guide provides step-by-step instructions for deploying the Vacation Bingo Planner to various hosting platforms.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Railway Deployment](#railway-deployment)
- [Render Deployment](#render-deployment)
- [Heroku Deployment](#heroku-deployment)
- [DigitalOcean App Platform](#digitalocean-app-platform)
- [Docker Deployment](#docker-deployment)

## Prerequisites

Before deploying, ensure you have:

1. **PostgreSQL Database** - Set up on:
   - [Supabase](https://supabase.com/) (Free tier available)
   - [Neon](https://neon.tech/) (Free tier available)
   - Railway/Render/Heroku Postgres
   - Your own PostgreSQL instance

2. **OpenID Connect Provider** - Configure authentication on:
   - [Auth0](https://auth0.com/) (Free tier available)
   - [Okta](https://www.okta.com/)
   - [Keycloak](https://www.keycloak.org/) (Self-hosted)
   - Any OIDC-compatible provider

3. **OpenAI API Key** - Get from [OpenAI Platform](https://platform.openai.com/api-keys)

## Railway Deployment

Railway is a modern platform that makes deployment simple and provides a free tier.

### Steps:

1. **Create Railway Account**
   - Sign up at [railway.app](https://railway.app)

2. **Create New Project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Connect your repository

3. **Add PostgreSQL Database**
   - In your project, click "New"
   - Select "Database" > "Add PostgreSQL"
   - Railway automatically creates a database and sets `DATABASE_URL`

4. **Configure Environment Variables**
   - Go to your service's "Variables" tab
   - Add the following:
     ```
     SESSION_SECRET=<generate-random-string>
     OIDC_ISSUER_URL=<your-oidc-provider-url>
     OIDC_CLIENT_ID=<your-oidc-client-id>
     OPENAI_API_KEY=<your-openai-api-key>
     NODE_ENV=production
     ```

5. **Configure OIDC Callback URLs**
   - In your OIDC provider, set callback URL to:
     `https://your-app.up.railway.app/api/callback`
   - Set logout URL to: `https://your-app.up.railway.app`

6. **Deploy**
   - Railway automatically detects Node.js and deploys
   - Build command: `npm run build`
   - Start command: `npm start`

7. **Initialize Database**
   - After first deployment, run in Railway's terminal:
     ```bash
     npm run db:push
     ```

## Render Deployment

Render provides free tier hosting for web services and PostgreSQL databases.

### Steps:

1. **Create Render Account**
   - Sign up at [render.com](https://render.com)

2. **Create PostgreSQL Database**
   - Click "New +" > "PostgreSQL"
   - Choose a name and region
   - Select free tier
   - Copy the "Internal Database URL"

3. **Create Web Service**
   - Click "New +" > "Web Service"
   - Connect your repository
   - Configure:
     - **Name**: Your app name
     - **Environment**: Node
     - **Build Command**: `npm install && npm run build`
     - **Start Command**: `npm start`

4. **Add Environment Variables**
   - In the "Environment" tab, add:
     ```
     DATABASE_URL=<your-render-postgres-url>
     SESSION_SECRET=<generate-random-string>
     OIDC_ISSUER_URL=<your-oidc-provider-url>
     OIDC_CLIENT_ID=<your-oidc-client-id>
     OPENAI_API_KEY=<your-openai-api-key>
     NODE_ENV=production
     ```

5. **Configure OIDC Callback URLs**
   - Set callback URL: `https://your-app.onrender.com/api/callback`
   - Set logout URL: `https://your-app.onrender.com`

6. **Deploy**
   - Click "Create Web Service"
   - Render automatically builds and deploys

7. **Initialize Database**
   - After deployment, open Render's shell and run:
     ```bash
     npm run db:push
     ```

## Heroku Deployment

Heroku is a traditional platform-as-a-service with a free tier.

### Steps:

1. **Install Heroku CLI**
   ```bash
   curl https://cli-assets.heroku.com/install.sh | sh
   ```

2. **Login to Heroku**
   ```bash
   heroku login
   ```

3. **Create Heroku App**
   ```bash
   heroku create your-app-name
   ```

4. **Add PostgreSQL**
   ```bash
   heroku addons:create heroku-postgresql:essential-0
   ```

5. **Set Environment Variables**
   ```bash
   heroku config:set SESSION_SECRET=$(openssl rand -base64 32)
   heroku config:set OIDC_ISSUER_URL=your-oidc-provider-url
   heroku config:set OIDC_CLIENT_ID=your-oidc-client-id
   heroku config:set OPENAI_API_KEY=your-openai-api-key
   heroku config:set NODE_ENV=production
   ```

6. **Configure OIDC**
   - Set callback URL: `https://your-app.herokuapp.com/api/callback`
   - Set logout URL: `https://your-app.herokuapp.com`

7. **Deploy**
   ```bash
   git push heroku main
   ```

8. **Initialize Database**
   ```bash
   heroku run npm run db:push
   ```

## DigitalOcean App Platform

DigitalOcean App Platform provides managed hosting with a generous free tier.

### Steps:

1. **Create DigitalOcean Account**
   - Sign up at [digitalocean.com](https://www.digitalocean.com/)

2. **Create App**
   - Go to "App Platform"
   - Click "Create App"
   - Connect your GitHub repository

3. **Configure Resources**
   - Add a PostgreSQL database (optional, or use external)
   - Configure web service:
     - Build Command: `npm run build`
     - Run Command: `npm start`

4. **Set Environment Variables**
   - In App settings > Components > your-app > Environment Variables
   - Add all required variables

5. **Configure OIDC**
   - Set callback URL: `https://your-app.ondigitalocean.app/api/callback`

6. **Deploy**
   - DigitalOcean automatically builds and deploys

## Docker Deployment

Deploy using Docker for maximum portability.

### Dockerfile

Create a `Dockerfile` in your project root:

```dockerfile
FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy application code
COPY . .

# Build the application
RUN npm run build

# Expose port
EXPOSE 5000

# Start the application
CMD ["npm", "start"]
```

### docker-compose.yml

For local development with PostgreSQL:

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "5000:5000"
    environment:
      DATABASE_URL: postgresql://postgres:password@db:5432/vacation_bingo
      SESSION_SECRET: your-session-secret
      OIDC_ISSUER_URL: your-oidc-url
      OIDC_CLIENT_ID: your-client-id
      OPENAI_API_KEY: your-openai-key
      NODE_ENV: production
    depends_on:
      - db

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
      POSTGRES_DB: vacation_bingo
    volumes:
      - postgres-data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

volumes:
  postgres-data:
```

### Deploy to any Docker host:

```bash
# Build image
docker build -t vacation-bingo-planner .

# Run container
docker run -d \
  -p 5000:5000 \
  -e DATABASE_URL=your-database-url \
  -e SESSION_SECRET=your-secret \
  -e OIDC_ISSUER_URL=your-oidc-url \
  -e OIDC_CLIENT_ID=your-client-id \
  -e OPENAI_API_KEY=your-openai-key \
  -e NODE_ENV=production \
  vacation-bingo-planner
```

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `SESSION_SECRET` | Yes | Secret for encrypting sessions (use `openssl rand -base64 32`) |
| `OIDC_ISSUER_URL` | Yes | OpenID Connect provider URL |
| `OIDC_CLIENT_ID` | Yes | OIDC application client ID |
| `OPENAI_API_KEY` | Yes | OpenAI API key for AI features |
| `NODE_ENV` | No | Set to `production` for production |
| `PORT` | No | Port to run server on (default: 5000) |
| `OPENAI_BASE_URL` | No | Custom OpenAI API endpoint |

## Post-Deployment

After deploying to any platform:

1. **Initialize Database**
   ```bash
   npm run db:push
   ```
   This creates tables and seeds initial game templates.

2. **Test Authentication**
   - Visit your deployed site
   - Click "Login" to test OIDC flow
   - Verify you can create and play games

3. **Test AI Features**
   - Create a new game
   - Click "Generate Suggestions" to test OpenAI integration

## Troubleshooting

### Database Connection Issues
- Verify `DATABASE_URL` is correctly formatted
- Ensure database accepts connections from your host
- Check firewall rules and SSL requirements

### Authentication Issues
- Verify callback URLs match exactly (including https/http)
- Check OIDC provider configuration
- Ensure `SESSION_SECRET` is set and persistent

### Build Failures
- Check Node.js version (requires v20+)
- Verify all dependencies are installed
- Check build logs for specific errors

### API/AI Issues
- Verify `OPENAI_API_KEY` is valid
- Check OpenAI account has available credits
- Review API rate limits

## Support

For additional help:
- Check the main [README.md](README.md)
- Open an issue on GitHub
- Review deployment platform documentation
