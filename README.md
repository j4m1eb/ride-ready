# Ride Ready

Ride Ready is a local-first web app prototype for tracking:

- chain waxing intervals
- wheelset-specific front and rear tyre service life
- wheelset-specific front and rear tubeless sealant refreshes by month
- chainrings
- cassette wear cycles
- front and rear brake pads
- per-bike mileage and service history
- multiple wheelsets on a single bike
- Strava-first onboarding flow with import selection stubbed in the frontend

## What is built

- Single-page responsive web app
- Bike profiles with bike-level and wheelset-level thresholds
- Multiple wheelsets per bike, including separate mileage for a 50 mm setup vs a 65 mm setup
- Quick service logging for wax, chainrings, cassette, front/rear brake pads, front/rear tyres, front/rear sealant, and ride distance
- Named front/rear tyre and sealant fields on each wheelset so you can see exactly what is installed
- First-run onboarding that starts with Strava import selection, then falls back to manual setup
- Edit/delete controls for bikes, wheelsets, and service events
- Dashboard cards showing due-soon and due-now items
- Local persistence with `localStorage`
- JSON export/import for backup

## Run locally

Because this app is static, you can open `index.html` directly in a browser or serve it locally:

```bash
python3 -m http.server 4173
```

Then open `http://localhost:4173`.

## Strava path

This prototype intentionally keeps Strava as a product boundary, not a fake frontend-only integration.

To add real Strava sync next:

1. Create a Strava app and configure OAuth redirect URIs.
2. Add a small backend to exchange the authorization code for tokens.
3. Store athlete identity, tokens, bikes, and synced activities.
4. Pull activities, use `gear_id` to map rides to bikes, and apply rides to the active or selected wheelset.
5. Handle missing `gear_id` values and ambiguous wheelset choice with a manual correction flow.

## Recommended next build step

Move this into one of these directions:

- Next.js app with a small API/backend for Strava OAuth and sync
- Native SwiftUI app plus a backend for Strava token exchange and ride sync
