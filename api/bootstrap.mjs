import { bootstrapPayload, fetchProfile, mapImportedBikes, readAuth, refreshAccessToken, sendJson, setAuthCookie } from "./_lib/strava.mjs";
import { getAthleteRecord, upsertAthleteRecord } from "./_lib/supabase.mjs";

export default async function handler(req, res) {
  try {
    const current = readAuth(req);
    if (!current) {
      return sendJson(res, 200, bootstrapPayload(null, null, [], null));
    }
    const record = await getAthleteRecord(current.athlete_id);
    if (!record) {
      return sendJson(res, 200, bootstrapPayload(null, null, [], null));
    }
    const auth = await refreshAccessToken({
      athlete_id: record.athlete_id,
      athlete: record.profile_json,
      access_token: record.access_token,
      refresh_token: record.refresh_token,
      expires_at: record.expires_at,
      last_sync_at: record.last_sync_at
    });
    const profile = record.profile_json || await fetchProfile(auth);
    const importedBikes = Array.isArray(record.imported_bikes_json) ? record.imported_bikes_json : [];
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
      app_state_json: record.app_state_json || null,
      last_sync_at: record.last_sync_at || null,
      created_at: record.created_at,
      updated_at: new Date().toISOString()
    });
    setAuthCookie(res, { athlete_id: record.athlete_id });
    return sendJson(res, 200, bootstrapPayload({ athlete: profile, last_sync_at: record.last_sync_at }, profile, importedBikes, record.app_state_json || null));
  } catch (error) {
    return sendJson(res, 500, { error: error.message || "Bootstrap failed" });
  }
}
