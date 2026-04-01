import crypto from "node:crypto";

const COOKIE_AUTH = "ride_ready_auth";
const COOKIE_OAUTH = "ride_ready_oauth";

export function env() {
  return {
    BASE_URL: process.env.BASE_URL || "http://localhost:4173",
    STRAVA_CLIENT_ID: process.env.STRAVA_CLIENT_ID || "",
    STRAVA_CLIENT_SECRET: process.env.STRAVA_CLIENT_SECRET || "",
    SESSION_SECRET: process.env.SESSION_SECRET || "ride-ready-dev-secret"
  };
}

export function parseCookies(cookieHeader = "") {
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

function sign(value, secret) {
  return crypto.createHmac("sha256", secret).update(value).digest("hex");
}

function encodeSigned(payload, secret) {
  const json = JSON.stringify(payload);
  const value = Buffer.from(json, "utf8").toString("base64url");
  const signature = sign(value, secret);
  return `${value}.${signature}`;
}

function decodeSigned(value, secret) {
  if (!value || !value.includes(".")) return null;
  const [encoded, signature] = value.split(".");
  if (sign(encoded, secret) !== signature) return null;
  try {
    return JSON.parse(Buffer.from(encoded, "base64url").toString("utf8"));
  } catch {
    return null;
  }
}

function appendSetCookie(res, cookie) {
  const current = res.getHeader("Set-Cookie");
  if (!current) {
    res.setHeader("Set-Cookie", cookie);
    return;
  }
  if (Array.isArray(current)) {
    res.setHeader("Set-Cookie", [...current, cookie]);
    return;
  }
  res.setHeader("Set-Cookie", [current, cookie]);
}

function cookieBase(maxAgeSeconds) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSeconds}${secure}`;
}

export function setAuthCookie(res, payload) {
  const { SESSION_SECRET } = env();
  const value = encodeSigned(payload, SESSION_SECRET);
  appendSetCookie(res, `${COOKIE_AUTH}=${encodeURIComponent(value)}; ${cookieBase(60 * 60 * 24 * 30)}`);
}

export function clearAuthCookie(res) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  appendSetCookie(res, `${COOKIE_AUTH}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure}`);
}

export function setOauthCookie(res, state) {
  const { SESSION_SECRET } = env();
  const value = encodeSigned({ state }, SESSION_SECRET);
  appendSetCookie(res, `${COOKIE_OAUTH}=${encodeURIComponent(value)}; ${cookieBase(60 * 10)}`);
}

export function clearOauthCookie(res) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  appendSetCookie(res, `${COOKIE_OAUTH}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure}`);
}

export function readAuth(req) {
  const { SESSION_SECRET } = env();
  const cookies = parseCookies(req.headers.cookie || "");
  return decodeSigned(cookies[COOKIE_AUTH], SESSION_SECRET);
}

export function readOauth(req) {
  const { SESSION_SECRET } = env();
  const cookies = parseCookies(req.headers.cookie || "");
  return decodeSigned(cookies[COOKIE_OAUTH], SESSION_SECRET);
}

export async function readJson(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return chunks.length ? JSON.parse(Buffer.concat(chunks).toString("utf8")) : {};
}

export function sendJson(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(payload));
}

export function redirect(res, location) {
  res.statusCode = 302;
  res.setHeader("Location", location);
  res.end();
}

export async function exchangeCode(code) {
  const { STRAVA_CLIENT_ID, STRAVA_CLIENT_SECRET } = env();
  const response = await fetch("https://www.strava.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: STRAVA_CLIENT_ID,
      client_secret: STRAVA_CLIENT_SECRET,
      code,
      grant_type: "authorization_code"
    })
  });
  if (!response.ok) throw new Error(`Strava token exchange failed (${response.status})`);
  return response.json();
}

export async function refreshAccessToken(auth) {
  const { STRAVA_CLIENT_ID, STRAVA_CLIENT_SECRET } = env();
  if (Number(auth.expires_at) > Math.floor(Date.now() / 1000) + 300) return auth;
  const response = await fetch("https://www.strava.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: STRAVA_CLIENT_ID,
      client_secret: STRAVA_CLIENT_SECRET,
      grant_type: "refresh_token",
      refresh_token: auth.refresh_token
    })
  });
  if (!response.ok) throw new Error(`Strava token refresh failed (${response.status})`);
  const payload = await response.json();
  return {
    ...auth,
    athlete: payload.athlete || auth.athlete,
    access_token: payload.access_token,
    refresh_token: payload.refresh_token,
    expires_at: payload.expires_at
  };
}

export async function fetchProfile(auth) {
  const response = await fetch("https://www.strava.com/api/v3/athlete", {
    headers: { Authorization: `Bearer ${auth.access_token}` }
  });
  if (!response.ok) throw new Error(`Strava athlete fetch failed (${response.status})`);
  return response.json();
}

export function mapImportedBikes(profile) {
  return (profile.bikes || []).map((bike) => ({
    key: String(bike.id),
    gearId: String(bike.id),
    name: bike.name,
    category: frameTypeLabel(bike.frame_type),
    distance: metersToDisplayDistance(bike.distance || 0)
  }));
}

export function applyStravaSync(state, importedBikes) {
  const nextState = structuredClone(state || {});
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

export function bootstrapPayload(auth, profile, importedBikes, state = null) {
  return {
    backend: true,
    stravaConnected: Boolean(auth),
    athlete: profile || auth?.athlete
      ? {
          id: (profile || auth.athlete).id,
          username: (profile || auth.athlete).username,
          name: [(profile || auth.athlete).firstname, (profile || auth.athlete).lastname].filter(Boolean).join(" ")
        }
      : null,
    lastSyncAt: auth?.last_sync_at || null,
    importedBikes,
    state
  };
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
