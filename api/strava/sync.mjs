import { applyStravaSync, bootstrapPayload, fetchProfile, mapImportedBikes, readAuth, readJson, refreshAccessToken, sendJson, setAuthCookie } from "../_lib/strava.mjs";
import { getAthleteRecord, upsertAthleteRecord, updateAthleteState } from "../_lib/supabase.mjs";

export default async function handler(req, res) {
  try {
    const current = readAuth(req);
    if (!current) return sendJson(res, 401, { error: "Strava not connected." });
    const payload = await readJson(req).catch(() => ({}));
    const record = await getAthleteRecord(current.athlete_id);
    if (!record) return sendJson(res, 401, { error: "Strava account not found." });
    const auth = await refreshAccessToken({
      athlete_id: record.athlete_id,
      athlete: record.profile_json,
      access_token: record.access_token,
      refresh_token: record.refresh_token,
      expires_at: record.expires_at,
      last_sync_at: record.last_sync_at
    });
    const profile = await fetchProfile(auth);
    auth.athlete = profile;
    auth.last_sync_at = new Date().toISOString();
    setAuthCookie(res, { athlete_id: record.athlete_id });
    const importedBikes = mapImportedBikes(profile);
    const baseState = payload?.state || record.app_state_json || null;
    const state = baseState ? applyStravaSync(baseState, importedBikes) : null;
    await upsertAthleteRecord({
      athlete_id: record.athlete_id,
      username: profile.username || "",
      firstname: profile.firstname || "",
      lastname: profile.lastname || "",
      access_token: auth.access_token,
      refresh_token: auth.refresh_token,
      expires_at: auth.expires_at,
      profile_json: profile,
      imported_bikes_json: importedBikes,
      app_state_json: state,
      last_sync_at: auth.last_sync_at,
      created_at: record.created_at,
      updated_at: new Date().toISOString()
    });
    return sendJson(res, 200, bootstrapPayload(auth, profile, importedBikes, state));
  } catch (error) {
    return sendJson(res, 500, { error: error.message || "Strava sync failed" });
  }
}
