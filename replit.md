# Date Bingo - Couples Trip Edition

## Overview

A mobile-first couples bingo web app designed for a 3-night trip (Thursday, Friday, Saturday). Each night has its own themed bingo card with tappable squares that players can check off. The app supports two players ("him" and "her"), each with their own progress tracking and secret bonus squares. The tone is playful, flirty, and R-rated but public-safe. No scoring automation — it runs on the honor system.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Framework**: React 18 with TypeScript, bundled by Vite
- **Routing**: Wouter (lightweight client-side router) — single page app with a home page and 404 fallback
- **State/Data Fetching**: TanStack React Query for server state management, with a custom `apiRequest` helper for mutations
- **UI Components**: shadcn/ui (new-york style) built on Radix UI primitives, styled with Tailwind CSS and CSS variables for theming
- **Styling**: Tailwind CSS with a custom color system using HSL CSS variables; supports light and dark mode via class-based toggling
- **Key Components**:
  - `BingoCard` — renders the grid of squares for a given night
  - `BingoSquareCell` — individual tappable square with tap-to-toggle and long-press-for-details
  - `NightTabs` — switch between Thursday/Friday/Saturday
  - `PlayerTabs` — switch between "His Card" and "Her Card"
  - `ThemeToggle` — dark/light mode toggle
- **Path Aliases**: `@/` maps to `client/src/`, `@shared/` maps to `shared/`

### Backend
- **Framework**: Express 5 on Node.js with TypeScript (run via `tsx`)
- **API Pattern**: RESTful JSON API under `/api/` prefix
- **Key Endpoints**:
  - `GET /api/progress/:player/:nightId` — fetch checked squares for a player/night
  - `POST /api/progress` — upsert a square's checked state
  - `GET /api/secrets/:player/:nightId` — fetch secret bonus squares
  - `PATCH /api/secrets/:id` — toggle a secret square's checked state
- **Validation**: Zod schemas (generated from Drizzle schemas via `drizzle-zod`) validate all incoming request data
- **Dev Server**: Vite dev server is integrated as middleware for HMR during development
- **Production**: Client is built to `dist/public`, server is bundled with esbuild to `dist/index.cjs`

### Data Layer
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Database**: PostgreSQL (connection via `DATABASE_URL` environment variable)
- **Schema** (in `shared/schema.ts`):
  - `bingo_progress` — tracks which squares each player has checked (player, nightId, squareIndex, checked)
  - `secret_squares` — bonus secret squares per player per night (player, nightId, text, description, checked)
- **Static Game Data**: `BINGO_NIGHTS` array is defined in the shared schema file and contains all night themes, grid sizes, square texts, and bet descriptions — shared between client and server
- **Migrations**: Use `drizzle-kit push` (`npm run db:push`) to sync schema to database
- **Seeding**: `server/seed.ts` seeds default secret squares on startup if they don't already exist

### Build System
- **Dev**: `npm run dev` — runs the Express server with Vite middleware for HMR
- **Build**: `npm run build` — builds the Vite client to `dist/public` and bundles the server with esbuild to `dist/index.cjs`
- **Start**: `npm start` — runs the production build
- **Type Check**: `npm run check` — runs TypeScript compiler checks
- **DB Push**: `npm run db:push` — pushes Drizzle schema to PostgreSQL

### Design Decisions
- **Shared schema between client and server**: The `shared/` directory contains both database schemas and game data constants, ensuring type safety across the full stack
- **No authentication**: The app is designed for two known players; player identity is selected via UI tabs rather than login
- **Upsert pattern for progress**: Progress is stored per-square so toggling is idempotent — the server checks for existing records before inserting
- **Mobile-first design**: The UI is optimized for phone screens with touch interactions (tap to toggle, long-press for details)

## External Dependencies

### Database
- **PostgreSQL** — required, connection string provided via `DATABASE_URL` environment variable
- **connect-pg-simple** — session store (available but sessions are not currently used for auth)

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
- **embla-carousel-react** — carousel component
- **recharts** — charting library (available but not actively used)

### Replit-Specific
- **@replit/vite-plugin-runtime-error-modal** — shows runtime errors in dev
- **@replit/vite-plugin-cartographer** — Replit dev tooling (dev only)
- **@replit/vite-plugin-dev-banner** — Replit dev banner (dev only)