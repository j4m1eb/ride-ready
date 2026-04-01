import { readAuth, readJson, sendJson } from "./_lib/strava.mjs";
import { updateAthleteState } from "./_lib/supabase.mjs";

export default async function handler(req, res) {
  try {
    const auth = readAuth(req);
    const payload = await readJson(req).catch(() => ({}));
    if (!auth?.athlete_id) return sendJson(res, 200, { ok: true, persisted: false });
    await updateAthleteState(auth.athlete_id, payload.state || null);
    return sendJson(res, 200, { ok: true, persisted: true });
  } catch (error) {
    return sendJson(res, 500, { error: error.message || "State save failed" });
  }
}
