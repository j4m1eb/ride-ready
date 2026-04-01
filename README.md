# Ride Ready

Ride Ready is a web app for tracking:

- chain waxing intervals
- wheelset-specific front and rear tyre service life
- wheelset-specific front and rear tubeless sealant refreshes by month
- chainrings
- cassette wear cycles
- front and rear brake pads
- per-bike mileage and service history
- multiple wheelsets on a single bike
- Strava-connected bike import and mileage sync

## What is built

- Single-page responsive frontend
- Local Node backend with SQLite persistence
- Bike profiles with bike-level and wheelset-level thresholds
- Multiple wheelsets per bike, including separate mileage for a 50 mm setup vs a 65 mm setup
- Quick service logging for wax, chainrings, cassette, front/rear brake pads, front/rear tyres, front/rear sealant, and ride distance
- Named front/rear tyre and sealant fields on each wheelset so you can see exactly what is installed
- First-run onboarding that starts with Strava import selection, then falls back to manual setup
- Edit/delete controls for bikes, wheelsets, and service events
- Dashboard cards showing due-soon and due-now items
- Backend persistence with SQLite when run through `server.mjs`
- `localStorage` fallback when opened as a purely static page
- JSON export/import for backup
- Real Strava OAuth route and token exchange
- Real Strava athlete/bike import
- Strava bike-distance sync into tracked bikes using stored `stravaGearId`

## Run locally

1. Copy the example env file:

```bash
cp .env.example .env
```

2. Fill in your Strava app values in `.env`:

- `STRAVA_CLIENT_ID`
- `STRAVA_CLIENT_SECRET`
- `SESSION_SECRET`
- `BASE_URL=http://localhost:4173`

3. Start the real app:

```bash
npm run dev
```

Then open `http://localhost:4173`.

## Strava app setup

Create a Strava API application and set:

- Authorization callback domain: `localhost`
- Authorization callback URL: `http://localhost:4173/auth/strava/callback`

Then put the client ID and client secret into `.env`.

## Deploy on Vercel

This repo now includes Vercel serverless routes for live Strava auth and sync, with shared state stored in Supabase:

- `/api/bootstrap`
- `/api/state`
- `/api/strava/sync`
- `/auth/strava`
- `/auth/strava/callback`

Set these environment variables in Vercel:

- `BASE_URL=https://ride-ready-tracker.vercel.app`
- `STRAVA_CLIENT_ID`
- `STRAVA_CLIENT_SECRET`
- `SESSION_SECRET`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

Create the Supabase table first by running:

- [supabase/schema.sql](/Users/jamiebishop/Bike%20Maintenance/supabase/schema.sql)

Then update the Strava app settings to:

- Authorization callback domain: `ride-ready-tracker.vercel.app`
- Authorization callback URL: `https://ride-ready-tracker.vercel.app/auth/strava/callback`

The live Vercel version uses:

- signed auth cookies
- Supabase for Strava tokens and shared app state

That means your bikes, wheelsets, and service history can stay in sync across devices once you connect Strava on the live site.

## How sync works now

- Strava OAuth signs you into your own Ride Ready session
- Strava bikes are fetched from the authenticated athlete profile
- Imported bikes are stored with a `stravaGearId`
- On sync, Ride Ready updates the bike distance from Strava
- Any new synced bike distance is added to the currently active wheelset for that bike

That last point is the main compromise in this first real version:

- Strava can identify the bike
- Strava cannot identify your current wheelset
- so Ride Ready applies new synced distance to the active wheelset you have selected

## Important limits

- New Strava apps start with athlete capacity `1` until Strava approves wider use
- If you want clubmates to use their own Strava accounts, you will need Strava approval
- If other people use this, you should add a privacy policy and terms page before sharing it publicly

## Recommended next build step

Move this from the current local-first real build into one of these directions:

- real user accounts instead of Strava-cookie-only auth
- Strava webhook support for automatic background sync
- privacy policy and terms
