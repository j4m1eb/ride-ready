import { applyStravaSync, bootstrapPayload, fetchProfile, mapImportedBikes, readAuth, readJson, refreshAccessToken, sendJson, setAuthCookie } from "../_lib/strava.mjs";

export default async function handler(req, res) {
  try {
    const current = readAuth(req);
    if (!current) return sendJson(res, 401, { error: "Strava not connected." });
    const payload = await readJson(req).catch(() => ({}));
    const auth = await refreshAccessToken(current);
    const profile = await fetchProfile(auth);
    auth.athlete = profile;
    auth.last_sync_at = new Date().toISOString();
    setAuthCookie(res, auth);
    const importedBikes = mapImportedBikes(profile);
    const state = payload?.state ? applyStravaSync(payload.state, importedBikes) : null;
    return sendJson(res, 200, bootstrapPayload(auth, profile, importedBikes, state));
  } catch (error) {
    return sendJson(res, 500, { error: error.message || "Strava sync failed" });
  }
}
