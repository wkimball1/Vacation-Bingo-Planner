# Vacation Bingo Planner

A mobile-first bingo web app for couples and friend groups. Players can create custom bingo games with AI-powered square suggestions, track game history with winners, use pre-built templates, and manage multiple games.

## Features

- **Game Modes**: Couples, Friends Trip, Party, and Custom
- **AI-Powered Suggestions**: Generate bingo squares with controllable mood/spice levels
- **Templates**: Pre-built game templates to get started quickly
- **Multi-Player**: Share games with partners/friends, track progress separately
- **Game History**: Track completed games and winner statistics
- **Mobile-First Design**: Optimized for touch interactions on phones

## Tech Stack

- **Frontend**: React 18 with TypeScript, Vite, TailwindCSS, shadcn/ui
- **Backend**: Express 5, Node.js, TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: OpenID Connect (OIDC) - compatible with Auth0, Okta, Keycloak, etc.
- **AI**: OpenAI API for generating bingo squares and suggestions

## Deployment

### Deployment Options

This application can be deployed on various platforms. Here are the recommended options:

#### Option 1: Traditional Node.js Hosting (Recommended)

Platforms like **Heroku**, **Railway**, **Render**, or **DigitalOcean App Platform** are well-suited for this full-stack Express application.

**Example deployment on Render:**

1. Create a new Web Service on Render
2. Connect your repository
3. Set build command: `npm run build`
4. Set start command: `npm start`
5. Configure environment variables (see below)
6. Deploy!

**Example deployment on Railway:**

1. Create a new project from your repository
2. Railway auto-detects the Node.js app
3. Configure environment variables
4. Deploy automatically

#### Option 2: Netlify (Static Frontend + Separate Backend)

Since Netlify is primarily designed for static sites and serverless functions, you have two approaches:

**Approach A: Separate Backend Deployment**
1. Deploy the frontend (static build) to Netlify
2. Deploy the backend (Express server) to Railway, Render, or Heroku
3. Update API calls in the frontend to point to your backend URL
4. Configure CORS on your backend to allow requests from your Netlify domain

**Approach B: Use Netlify Dev (Local Development Only)**
- Use `netlify dev` for local development
- For production, deploy backend elsewhere and connect via API

#### Environment Variables

Configure these environment variables in your hosting platform:

**Required:**
- `DATABASE_URL`: PostgreSQL connection string
- `SESSION_SECRET`: Random secret for session encryption (generate with `openssl rand -base64 32`)
- `OIDC_ISSUER_URL`: Your OIDC provider's issuer URL
- `OIDC_CLIENT_ID`: Your OIDC client ID
- `OPENAI_API_KEY`: Your OpenAI API key

**Optional:**
- `NODE_ENV`: Set to `production`
- `PORT`: Port number (default: 5000)
- `OPENAI_BASE_URL`: Custom OpenAI base URL if using a proxy

#### Authentication Setup

This app uses OpenID Connect for authentication. You can use any OIDC-compatible provider:

**Auth0:**
1. Create an Auth0 application
2. Set callback URL: `https://your-site.netlify.app/api/callback`
3. Set logout URL: `https://your-site.netlify.app`
4. Set `OIDC_ISSUER_URL` to `https://YOUR_DOMAIN.auth0.com`
5. Set `OIDC_CLIENT_ID` to your Auth0 client ID

**Okta:**
1. Create an Okta application
2. Set redirect URI: `https://your-site.netlify.app/api/callback`
3. Set `OIDC_ISSUER_URL` to `https://YOUR_DOMAIN.okta.com/oauth2/default`
4. Set `OIDC_CLIENT_ID` to your Okta client ID

**Netlify Identity (Alternative):**
If deploying the backend separately and using Netlify for the frontend only, you can optionally integrate Netlify Identity on the frontend and modify the backend authentication accordingly.

#### Prerequisites

1. **PostgreSQL Database**: Set up a PostgreSQL database (Supabase, Neon, Railway Postgres, etc.)
2. **OpenID Connect Provider**: Configure an OIDC provider for authentication (Auth0, Okta, Keycloak)
3. **OpenAI API Key**: Obtain an API key from [OpenAI](https://platform.openai.com/)

#### Database Setup
After deploying your application and configuring the database connection:

```bash
npm run db:push
```

This creates the necessary tables and seeds initial templates.

### Build and Start Commands

The application uses standard Node.js build and start commands:

- **Build**: `npm run build` - Builds both client and server
- **Start**: `npm start` - Runs the production server
- **Dev**: `npm run dev` - Runs development server with hot reload

## Local Development

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   - Copy `.env.example` to `.env`
   - Fill in your configuration values

3. **Set up database:**
   ```bash
   npm run db:push
   ```

4. **Start development server:**
   ```bash
   npm run dev
   ```
   - This runs the Express server with Vite HMR middleware
   - Server runs on http://localhost:5000

5. **Type checking:**
   ```bash
   npm run check
   ```

## Project Structure

```
.
├── client/              # React frontend
│   ├── src/
│   │   ├── components/  # Reusable UI components
│   │   ├── pages/       # Page components
│   │   ├── hooks/       # Custom React hooks
│   │   └── lib/         # Utilities
│   └── replit_integrations/  # Audio/voice utilities
├── server/              # Express backend
│   ├── index.ts         # Server entry point
│   ├── routes.ts        # API routes
│   ├── storage.ts       # Database operations
│   └── replit_integrations/  # Auth, AI, audio integrations
├── shared/              # Shared code between client and server
│   ├── schema.ts        # Database schema (Drizzle)
│   └── models/          # Type definitions
├── script/              # Build scripts
├── netlify.toml         # Netlify configuration
└── package.json
```

## API Endpoints

### Authentication
- `GET /api/login` - Initiate OIDC login
- `GET /api/callback` - OIDC callback
- `GET /api/logout` - Logout
- `GET /api/auth/user` - Get current user

### Games
- `GET /api/games` - List user's games
- `GET /api/games/templates` - List game templates
- `GET /api/games/:id` - Get specific game
- `POST /api/games` - Create new game
- `PATCH /api/games/:id` - Update game
- `DELETE /api/games/:id` - Delete game
- `POST /api/games/:id/duplicate` - Duplicate game
- `POST /api/games/:id/join` - Join game as partner
- `PATCH /api/games/:id/winner` - Declare winner

### AI
- `POST /api/ai/suggestions` - Generate AI-powered bingo squares
- `POST /api/ai/bet-suggestion` - Generate bet suggestions

### Game Progress
- `GET /api/progress/:player/:nightId` - Get player's progress
- `POST /api/progress` - Update square progress
- `GET /api/secrets/:player/:nightId` - Get secret bonus squares
- `PATCH /api/secrets/:id` - Update secret square

## Database Schema

### Tables
- `bingo_games` - Game definitions and metadata
- `bingo_progress` - Player progress tracking
- `secret_squares` - Bonus secret squares
- `users` - User accounts
- `sessions` - Session storage

### Migrations

Use Drizzle Kit to manage database schema:
```bash
npm run db:push  # Push schema changes to database
```

## License

MIT

## Support

For issues and questions, please open an issue on GitHub.
