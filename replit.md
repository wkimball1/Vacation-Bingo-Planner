# Date Bingo - Couples Edition

## Overview

A mobile-first couples bingo web app where players can create custom bingo games, get AI-powered square suggestions, track game history with winners, use pre-built templates, and manage multiple games. The app supports two players ("him" and "her"), each with their own progress tracking, PIN authentication, card sharing controls, and secret bonus squares. The tone is playful, flirty, and R-rated but public-safe. No scoring automation — it runs on the honor system.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

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
  - `LoginScreen` — PIN authentication flow
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
  - `POST /api/auth/setup` — set PIN for a player
  - `POST /api/auth/login` — authenticate with PIN
  - `GET /api/auth/status/:player` — get auth/sharing status
  - `PATCH /api/auth/share/:player` — toggle card sharing
- **AI Integration**: Uses Replit AI Integrations (OpenAI gpt-5-nano) for generating bingo square suggestions based on themes
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
  - `player_auth` — PIN authentication and sharing settings per player
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
- **PIN authentication**: Simple PIN-based auth stored per player, no sessions
- **Card sharing**: Players can toggle whether their partner can view their card
- **Templates as games**: Templates are stored as regular games with isTemplate=true flag
- **Winner tracking**: Winner can be "him", "her", or "tie" — marks game as completed
- **AI suggestions**: OpenAI gpt-5-nano generates themed bingo squares based on user-provided theme
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
- **openai** — OpenAI API client (via Replit AI Integrations)

### Replit-Specific
- **Replit AI Integrations** — OpenAI integration for AI-powered bingo square suggestions (no API key required)
- **@replit/vite-plugin-runtime-error-modal** — shows runtime errors in dev
- **@replit/vite-plugin-cartographer** — Replit dev tooling (dev only)
- **@replit/vite-plugin-dev-banner** — Replit dev banner (dev only)
