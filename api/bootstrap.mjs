import { bootstrapPayload, fetchProfile, mapImportedBikes, readAuth, refreshAccessToken, sendJson, setAuthCookie } from "./_lib/strava.mjs";

export default async function handler(req, res) {
  try {
    const current = readAuth(req);
    if (!current) {
      return sendJson(res, 200, bootstrapPayload(null, null, [], null));
    }
    const auth = await refreshAccessToken(current);
    const profile = await fetchProfile(auth);
    auth.athlete = profile;
    setAuthCookie(res, auth);
    return sendJson(res, 200, bootstrapPayload(auth, profile, mapImportedBikes(profile), null));
  } catch (error) {
    return sendJson(res, 500, { error: error.message || "Bootstrap failed" });
  }
}
