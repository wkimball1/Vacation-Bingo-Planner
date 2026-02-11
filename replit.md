# Date Bingo

## Overview

A mobile-first bingo web app for couples AND friend groups. Players can create custom bingo games with AI-powered square suggestions (controllable spice levels PG to NC-17), track game history with winners, use pre-built templates, and manage multiple games. Supports game modes: Couples, Friends Trip, Party, and Custom. Players have customizable labels (default "Him"/"Her" for couples, "Team A"/"Team B" for friends, etc.). Features AI-generated bet suggestions, confetti celebrations, collaborative editing, and share-to-play links. No scoring automation — it runs on the honor system.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

- **2026-02-11**: **BREAKING: Migrated away from Replit-specific dependencies for platform independence.** Removed Replit Vite plugins, updated authentication to generic OIDC (replitAuth → oidcAuth), changed OpenAI integration to use standard API keys instead of Replit AI Integrations. Added comprehensive deployment documentation for Railway, Render, Heroku, and other platforms. See README.md and DEPLOYMENT.md for details. Environment variables changed: Use `OIDC_ISSUER_URL`, `OIDC_CLIENT_ID`, and `OPENAI_API_KEY` instead of Replit-specific variables.
- **2026-02-11**: Removed old PIN authentication system (player_pins table, login-screen component, auth/setup/login/status/share routes). Replit Auth is now the sole authentication method.
- **2026-02-11**: Added mood-aware spice levels (Sweet/Flirty/Steamy/After Dark for couples, Chill/Bold/Wild/No Limits for friends, etc.), bingo detection with "1 away" highlights, stamp animation on square check, progress race bar showing both players' progress side-by-side, winner celebration screen with stats.
- **2026-02-11**: Added game modes (couples/friends-trip/party/custom), custom player labels, AI bet suggestions with cycling UI, confetti animation on winner, share-to-play button. New columns: mood, player1_label, player2_label on bingo_games. New endpoint: POST /api/ai/bet-suggestion.
- **2026-02-11**: Added partner linking — game owner can share play link, partner signs in and clicks "Join" to link their account. Game then appears in both users' game lists, wins/losses count for both. partnerId column on bingo_games, POST /api/games/:id/join endpoint.
- **2026-02-11**: Added user authentication via Replit Auth (OpenID Connect). Games now belong to logged-in users (userId column). Protected game list/create/delete API routes. Landing page for logged-out users. Shared edit/play links remain public.
- **2026-02-11**: Added spice level picker (PG/PG-13/R/NC-17) for AI suggestions and share-to-edit feature for collaborative game building.
- **2026-02-11**: Major feature expansion — replaced hardcoded nights with database-backed games system. Added game CRUD, AI suggestions (OpenAI gpt-5-nano), templates, game history/winners, stats tracking.

## System Architecture

### Frontend
- **Framework**: React 18 with TypeScript, bundled by Vite
- **Routing**: Wouter — routes: `/` (game list), `/create` (new game), `/edit/:id` (edit game), `/play/:id` (play game)
- **State/Data Fetching**: TanStack React Query for server state management, with a custom `apiRequest` helper for mutations
- **UI Components**: shadcn/ui (new-york style) built on Radix UI primitives, styled with Tailwind CSS and CSS variables for theming
- **Styling**: Tailwind CSS with a custom color system using HSL CSS variables; supports light and dark mode via class-based toggling
- **Key Pages**:
  - `GameList` (`/`) — active games, templates, completed games history, win stats
  - `GameBuilder` (`/create`, `/edit/:id`) — create/edit games with AI-powered square generation
  - `GamePlay` (`/play/:id`) — play a game with bingo card, progress tracking, sharing, winner declaration
- **Key Components**:
  - `BingoCard` — renders the grid of squares for a given game
  - `BingoSquareCell` — individual tappable square with tap-to-toggle and long-press-for-details
  - `PlayerTabs` — switch between "His Card" and "Her Card"
  - `ThemeToggle` — dark/light mode toggle
- **Path Aliases**: `@/` maps to `client/src/`, `@shared/` maps to `shared/`

### Backend
- **Framework**: Express 5 on Node.js with TypeScript (run via `tsx`)
- **API Pattern**: RESTful JSON API under `/api/` prefix
- **Key Endpoints**:
  - `GET /api/games` — list games (optional `?status=active|completed`)
  - `GET /api/games/templates` — list template games
  - `GET /api/games/stats` — win counts per player
  - `GET /api/games/:id` — get single game
  - `POST /api/games` — create game
  - `PATCH /api/games/:id` — update game
  - `DELETE /api/games/:id` — delete game
  - `POST /api/games/:id/duplicate` — duplicate a game or template
  - `PATCH /api/games/:id/winner` — declare winner and complete game
  - `POST /api/ai/suggestions` — AI-generated bingo square suggestions (OpenAI gpt-5-nano)
  - `GET /api/progress/:player/:nightId` — fetch checked squares for a player/game
  - `POST /api/progress` — upsert a square's checked state
  - `GET /api/secrets/:player/:nightId` — fetch secret bonus squares
  - `PATCH /api/secrets/:id` — toggle a secret square's checked state
- **AI Integration**: Uses OpenAI API for generating bingo square suggestions based on themes (configurable via `OPENAI_API_KEY` environment variable)
- **Validation**: Zod schemas (generated from Drizzle schemas via `drizzle-zod`) validate all incoming request data
- **Dev Server**: Vite dev server is integrated as middleware for HMR during development
- **Production**: Client is built to `dist/public`, server is bundled with esbuild to `dist/index.cjs`

### Data Layer
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Database**: PostgreSQL (connection via `DATABASE_URL` environment variable)
- **Schema** (in `shared/schema.ts`):
  - `bingo_games` — game definitions with id (UUID), title, theme, gridSize, squares (jsonb array), betDescription, status (active/completed), winner, isTemplate flag, timestamps
  - `bingo_progress` — tracks which squares each player has checked (player, nightId referencing game id, squareIndex, checked)
  - `secret_squares` — bonus secret squares per player per game (player, nightId referencing game id, text, description, checked)
- **Game Templates**: 4 pre-built templates (Date Night In, Road Trip, Beach Vacation, Stay-at-Home Weekend) defined in schema and seeded on startup
- **Migrations**: Use `drizzle-kit push` (`npm run db:push`) to sync schema to database
- **Seeding**: `server/seed.ts` seeds templates and initial games from hardcoded BINGO_NIGHTS on startup

### Build System
- **Dev**: `npm run dev` — runs the Express server with Vite middleware for HMR
- **Build**: `npm run build` — builds the Vite client to `dist/public` and bundles the server with esbuild to `dist/index.cjs`
- **Start**: `npm start` — runs the production build
- **Type Check**: `npm run check` — runs TypeScript compiler checks
- **DB Push**: `npm run db:push` — pushes Drizzle schema to PostgreSQL

### Design Decisions
- **Database-backed games**: Games stored in PostgreSQL with squares as jsonb for flexibility
- **UUID game IDs**: Games use UUIDs; progress/secrets reference games via nightId field
- **Authentication**: OpenID Connect (OIDC) for user identity - works with Auth0, Okta, Keycloak, etc.
- **Templates as games**: Templates are stored as regular games with isTemplate=true flag
- **Winner tracking**: Winner can be "him", "her", or "tie" — marks game as completed
- **AI suggestions**: OpenAI API generates themed bingo squares based on user-provided theme
- **Upsert pattern for progress**: Progress is stored per-square so toggling is idempotent
- **Mobile-first design**: The UI is optimized for phone screens with touch interactions (tap to toggle, long-press for details)
- **Default query fetcher**: Joins queryKey array with "/" so parameterized queries like ["/api/games", id] work correctly

## External Dependencies

### Database
- **PostgreSQL** — required, connection string provided via `DATABASE_URL` environment variable

### Key NPM Packages
- **drizzle-orm** + **drizzle-kit** — ORM and migration tooling for PostgreSQL
- **express** v5 — HTTP server framework
- **@tanstack/react-query** — client-side data fetching and caching
- **wouter** — lightweight client-side routing
- **zod** + **drizzle-zod** — schema validation
- **shadcn/ui components** — extensive set of Radix UI-based components (dialog, tabs, badges, cards, tooltips, etc.)
- **tailwindcss** — utility-first CSS framework
- **lucide-react** — icon library
- **vaul** — drawer component
- **openai** — OpenAI API client

### Previously Replit-Specific (Removed for Platform Independence)
- ~~**Replit AI Integrations**~~ — Now uses standard OpenAI API with `OPENAI_API_KEY`
- ~~**@replit/vite-plugin-runtime-error-modal**~~ — Removed in favor of standard error handling
- ~~**@replit/vite-plugin-cartographer**~~ — Removed (Replit dev tooling)
- ~~**@replit/vite-plugin-dev-banner**~~ — Removed (Replit dev banner)
