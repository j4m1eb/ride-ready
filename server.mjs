import { createServer } from "node:http";
import { readFile, mkdir } from "node:fs/promises";
import { readFileSync } from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { DatabaseSync } from "node:sqlite";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const env = loadEnv();
const PORT = Number(env.PORT || 4173);
const BASE_URL = env.BASE_URL || `http://localhost:${PORT}`;
const COOKIE_NAME = "ride_ready_session";
const SESSION_SECRET = env.SESSION_SECRET || "ride-ready-dev-secret";

await mkdir(path.join(__dirname, "data"), { recursive: true });
const db = new DatabaseSync(path.join(__dirname, "data", "ride-ready.sqlite"));
db.exec(`
  PRAGMA journal_mode = WAL;
  CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    athlete_id INTEGER,
    app_state_json TEXT,
    oauth_state TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS athletes (
    id INTEGER PRIMARY KEY,
    username TEXT,
    firstname TEXT,
    lastname TEXT,
    access_token TEXT NOT NULL,
    refresh_token TEXT NOT NULL,
    expires_at INTEGER NOT NULL,
    profile_json TEXT,
    imported_bikes_json TEXT,
    app_state_json TEXT,
    last_sync_at TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
`);

const getSessionStmt = db.prepare("SELECT * FROM sessions WHERE id = ?");
const insertSessionStmt = db.prepare(`
  INSERT INTO sessions (id, athlete_id, app_state_json, oauth_state, created_at, updated_at)
  VALUES (?, NULL, NULL, NULL, ?, ?)
`);
const updateSessionStmt = db.prepare(`
  UPDATE sessions
  SET athlete_id = ?, app_state_json = ?, oauth_state = ?, updated_at = ?
  WHERE id = ?
`);
const getAthleteStmt = db.prepare("SELECT * FROM athletes WHERE id = ?");
const upsertAthleteStmt = db.prepare(`
  INSERT INTO athletes (
    id, username, firstname, lastname, access_token, refresh_token, expires_at,
    profile_json, imported_bikes_json, app_state_json, last_sync_at, created_at, updated_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  ON CONFLICT(id) DO UPDATE SET
    username = excluded.username,
    firstname = excluded.firstname,
    lastname = excluded.lastname,
    access_token = excluded.access_token,
    refresh_token = excluded.refresh_token,
    expires_at = excluded.expires_at,
    profile_json = excluded.profile_json,
    imported_bikes_json = excluded.imported_bikes_json,
    app_state_json = COALESCE(excluded.app_state_json, athletes.app_state_json),
    last_sync_at = COALESCE(excluded.last_sync_at, athletes.last_sync_at),
    updated_at = excluded.updated_at
`);
const updateAthleteStateStmt = db.prepare(`
  UPDATE athletes
  SET app_state_json = ?, updated_at = ?
  WHERE id = ?
`);
const updateAthleteSyncStmt = db.prepare(`
  UPDATE athletes
  SET access_token = ?, refresh_token = ?, expires_at = ?, profile_json = ?, imported_bikes_json = ?, app_state_json = ?, last_sync_at = ?, updated_at = ?
  WHERE id = ?
`);

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url || "/", BASE_URL);
    const session = ensureSession(req, res);

    if (req.method === "GET" && url.pathname === "/api/bootstrap") {
      return json(res, 200, await bootstrapPayload(session));
    }

    if (req.method === "POST" && url.pathname === "/api/state") {
      const payload = await readJson(req);
      await saveStateForSession(session, payload.state);
      return json(res, 200, { ok: true });
    }

    if (req.method === "POST" && url.pathname === "/api/strava/sync") {
      if (!session.athlete_id) return json(res, 401, { error: "Strava not connected." });
      const payload = await readJson(req).catch(() => ({}));
      await syncAthlete(session.athlete_id, payload.state || null);
      return json(res, 200, await bootstrapPayload(session));
    }

    if (req.method === "GET" && url.pathname === "/auth/strava") {
      if (!env.STRAVA_CLIENT_ID || !env.STRAVA_CLIENT_SECRET) {
        return html(res, 500, renderError("Add your Strava client ID and secret to .env before connecting."));
      }
      const oauthState = crypto.randomUUID();
      session.oauth_state = oauthState;
      persistSession(session);
      const redirect = new URL("https://www.strava.com/oauth/authorize");
      redirect.searchParams.set("client_id", env.STRAVA_CLIENT_ID);
      redirect.searchParams.set("response_type", "code");
      redirect.searchParams.set("redirect_uri", `${BASE_URL}/auth/strava/callback`);
      redirect.searchParams.set("approval_prompt", "auto");
      redirect.searchParams.set("scope", "profile:read_all,activity:read_all");
      redirect.searchParams.set("state", oauthState);
      return redirectTo(res, redirect.toString());
    }

    if (req.method === "GET" && url.pathname === "/auth/strava/callback") {
      const stateParam = url.searchParams.get("state");
      const code = url.searchParams.get("code");
      if (!code || !stateParam || stateParam !== session.oauth_state) {
        return html(res, 400, renderError("Strava sign-in failed. The callback state did not match."));
      }

      const tokenPayload = await exchangeCode(code);
      const athlete = tokenPayload.athlete;
      const now = isoNow();
      const existing = getAthleteStmt.get(athlete.id);
      const anonymousState = session.app_state_json || null;

      upsertAthleteStmt.run(
        athlete.id,
        athlete.username || "",
        athlete.firstname || "",
        athlete.lastname || "",
        tokenPayload.access_token,
        tokenPayload.refresh_token,
        Number(tokenPayload.expires_at),
        JSON.stringify(athlete),
        existing?.imported_bikes_json || "[]",
        existing?.app_state_json || anonymousState,
        existing?.last_sync_at || null,
        existing?.created_at || now,
        now
      );

      session.athlete_id = athlete.id;
      session.oauth_state = null;
      persistSession(session);
      await syncAthlete(athlete.id);
      return redirectTo(res, "/");
    }

    if (req.method === "GET" && url.pathname === "/auth/strava/logout") {
      session.athlete_id = null;
      persistSession(session);
      return redirectTo(res, "/");
    }

    return await serveStatic(url.pathname, res);
  } catch (error) {
    console.error(error);
    return json(res, 500, { error: error.message || "Server error" });
  }
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`Ride Ready running on ${BASE_URL}`);
});

function loadEnv() {
  const envPath = path.join(__dirname, ".env");
  const loaded = { ...process.env };
  try {
    const contents = readFileSync(envPath, "utf8");
    contents.split(/\r?\n/).forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) return;
      const index = trimmed.indexOf("=");
      if (index === -1) return;
      const key = trimmed.slice(0, index).trim();
      const value = trimmed.slice(index + 1).trim();
      loaded[key] = value;
    });
  } catch {}
  return loaded;
}

async function serveStatic(requestPath, res) {
  const cleaned = requestPath === "/" ? "/index.html" : requestPath;
  const filePath = path.join(__dirname, cleaned);
  if (!filePath.startsWith(__dirname)) {
    return json(res, 403, { error: "Forbidden" });
  }
  try {
    const file = await readFile(filePath);
    const ext = path.extname(filePath);
    res.writeHead(200, { "Content-Type": mimeType(ext) });
    res.end(file);
  } catch {
    json(res, 404, { error: "Not found" });
  }
}

function mimeType(ext) {
  return {
    ".html": "text/html; charset=utf-8",
    ".js": "application/javascript; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".svg": "image/svg+xml"
  }[ext] || "text/plain; charset=utf-8";
}

function ensureSession(req, res) {
  const cookies = parseCookies(req.headers.cookie || "");
  const sessionId = cookies[COOKIE_NAME];
  const found = sessionId ? getSessionStmt.get(sessionId) : null;
  if (found) return found;

  const id = signSessionId(crypto.randomUUID());
  const now = isoNow();
  insertSessionStmt.run(id, now, now);
  const created = getSessionStmt.get(id);
  res.setHeader("Set-Cookie", `${COOKIE_NAME}=${id}; Path=/; HttpOnly; SameSite=Lax`);
  return created;
}

function parseCookies(cookieHeader) {
  return Object.fromEntries(
    cookieHeader
      .split(";")
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const [name, ...rest] = part.split("=");
        return [name, decodeURIComponent(rest.join("="))];
      })
  );
}

function signSessionId(value) {
  const signature = crypto.createHmac("sha256", SESSION_SECRET).update(value).digest("hex").slice(0, 12);
  return `${value}.${signature}`;
}

function persistSession(session) {
  updateSessionStmt.run(
    session.athlete_id || null,
    session.app_state_json || null,
    session.oauth_state || null,
    isoNow(),
    session.id
  );
}

async function bootstrapPayload(session) {
  const athlete = session.athlete_id ? getAthleteStmt.get(session.athlete_id) : null;
  const savedState = athlete?.app_state_json || session.app_state_json || null;
  const importedBikes = athlete?.imported_bikes_json ? JSON.parse(athlete.imported_bikes_json) : [];

  return {
    backend: true,
    stravaConnected: Boolean(athlete),
    athlete: athlete
      ? {
          id: athlete.id,
          username: athlete.username,
          name: [athlete.firstname, athlete.lastname].filter(Boolean).join(" ")
        }
      : null,
    lastSyncAt: athlete?.last_sync_at || null,
    importedBikes,
    state: savedState ? JSON.parse(savedState) : null
  };
}

async function saveStateForSession(session, nextState) {
  const serialized = JSON.stringify(nextState || null);
  if (session.athlete_id) {
    updateAthleteStateStmt.run(serialized, isoNow(), session.athlete_id);
  } else {
    session.app_state_json = serialized;
    persistSession(session);
  }
}

async function exchangeCode(code) {
  const response = await fetch("https://www.strava.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: env.STRAVA_CLIENT_ID,
      client_secret: env.STRAVA_CLIENT_SECRET,
      code,
      grant_type: "authorization_code"
    })
  });
  if (!response.ok) throw new Error(`Strava token exchange failed (${response.status})`);
  return response.json();
}

async function refreshAccessToken(athlete) {
  if (Number(athlete.expires_at) > Math.floor(Date.now() / 1000) + 300) return athlete;
  const response = await fetch("https://www.strava.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: env.STRAVA_CLIENT_ID,
      client_secret: env.STRAVA_CLIENT_SECRET,
      grant_type: "refresh_token",
      refresh_token: athlete.refresh_token
    })
  });
  if (!response.ok) throw new Error(`Strava token refresh failed (${response.status})`);
  const payload = await response.json();
  athlete.access_token = payload.access_token;
  athlete.refresh_token = payload.refresh_token;
  athlete.expires_at = payload.expires_at;
  athlete.profile_json = JSON.stringify(payload.athlete || JSON.parse(athlete.profile_json || "{}"));
  return athlete;
}

async function syncAthlete(athleteId, stateOverride = null) {
  let athlete = getAthleteStmt.get(athleteId);
  if (!athlete) throw new Error("Athlete not found.");
  athlete = await refreshAccessToken({ ...athlete });

  const response = await fetch("https://www.strava.com/api/v3/athlete", {
    headers: { Authorization: `Bearer ${athlete.access_token}` }
  });
  if (!response.ok) throw new Error(`Strava athlete fetch failed (${response.status})`);
  const profile = await response.json();
  const importedBikes = (profile.bikes || []).map((bike) => ({
    key: String(bike.id),
    gearId: String(bike.id),
    name: bike.name,
    category: frameTypeLabel(bike.frame_type),
    distance: metersToDisplayDistance(bike.distance || 0)
  }));

  const state = stateOverride || (athlete.app_state_json ? JSON.parse(athlete.app_state_json) : null);
  const syncedState = state ? applyStravaSync(state, importedBikes) : state;

  updateAthleteSyncStmt.run(
    athlete.access_token,
    athlete.refresh_token,
    athlete.expires_at,
    JSON.stringify(profile),
    JSON.stringify(importedBikes),
    syncedState ? JSON.stringify(syncedState) : athlete.app_state_json,
    isoNow(),
    isoNow(),
    athleteId
  );
}

function applyStravaSync(state, importedBikes) {
  const nextState = structuredClone(state);
  const bikeMap = new Map(importedBikes.map((bike) => [bike.gearId, bike]));
  const today = isoNow().slice(0, 10);

  nextState.bikes = (nextState.bikes || []).map((bike) => {
    if (!bike.stravaGearId) return bike;
    const imported = bikeMap.get(String(bike.stravaGearId));
    if (!imported) return bike;
    const previousDistance = Number(bike.distance || 0);
    const nextDistance = Number(imported.distance || previousDistance);
    const delta = Math.max(0, nextDistance - previousDistance);
    bike.distance = nextDistance;
    if (delta > 0 && Array.isArray(bike.wheelsets) && bike.wheelsets.length) {
      const active = bike.wheelsets.find((wheelset) => wheelset.id === bike.activeWheelsetId) || bike.wheelsets[0];
      if (active) active.distance = Number(active.distance || 0) + delta;
      nextState.activity = nextState.activity || [];
      nextState.activity.unshift({
        id: crypto.randomUUID(),
        bikeId: bike.id,
        bikeName: bike.name,
        wheelsetId: active?.id || "",
        wheelsetName: active?.name || "",
        type: "syncRide",
        distance: delta,
        notes: "Synced from Strava",
        date: today
      });
    }
    return bike;
  });

  return nextState;
}

function frameTypeLabel(frameType) {
  return {
    1: "Road",
    2: "Mountain",
    3: "Cross",
    4: "Gravel",
    5: "Time Trial"
  }[Number(frameType)] || "Bike";
}

function metersToDisplayDistance(meters) {
  return Math.round((Number(meters || 0) / 1000) * 10) / 10;
}

function isoNow() {
  return new Date().toISOString();
}

async function readJson(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return chunks.length ? JSON.parse(Buffer.concat(chunks).toString("utf8")) : {};
}

function json(res, statusCode, payload) {
  res.writeHead(statusCode, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(payload));
}

function html(res, statusCode, markup) {
  res.writeHead(statusCode, { "Content-Type": "text/html; charset=utf-8" });
  res.end(markup);
}

function redirectTo(res, location) {
  res.writeHead(302, { Location: location });
  res.end();
}

function renderError(message) {
  return `<!doctype html><html><body style="font-family:sans-serif;padding:24px"><h1>Ride Ready</h1><p>${message}</p></body></html>`;
}
