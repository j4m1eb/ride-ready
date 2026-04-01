import { clearOauthCookie, exchangeCode, fetchProfile, mapImportedBikes, readOauth, redirect, setAuthCookie, verifyOauthState } from "../../_lib/strava.mjs";
import { upsertAthleteRecord } from "../../_lib/supabase.mjs";

export default async function handler(req, res) {
  try {
    const origin = `https://${req.headers.host}`;
    const url = new URL(req.url, origin);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const oauth = readOauth(req);
    const signedState = state ? verifyOauthState(state) : null;
    const cookieMatches = oauth?.state && oauth.state === state;
    if (!code) {
      res.statusCode = 400;
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.end("<h1>Ride Ready</h1><p>Strava sign-in failed. No authorization code was returned.</p>");
      return;
    }

    const tokenPayload = await exchangeCode(code);
    const profile = await fetchProfile({
      access_token: tokenPayload.access_token
    });
    const importedBikes = mapImportedBikes(profile);
    const now = new Date().toISOString();
    await upsertAthleteRecord({
      athlete_id: profile.id,
      username: profile.username || "",
      firstname: profile.firstname || "",
      lastname: profile.lastname || "",
      access_token: tokenPayload.access_token,
      refresh_token: tokenPayload.refresh_token,
      expires_at: tokenPayload.expires_at,
      profile_json: profile,
      imported_bikes_json: importedBikes,
      app_state_json: null,
      last_sync_at: null,
      created_at: now,
      updated_at: now
    });
    setAuthCookie(res, { athlete_id: profile.id });
    clearOauthCookie(res);
    return redirect(res, "/");
  } catch (error) {
    res.statusCode = 500;
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.end(`<h1>Ride Ready</h1><p>${error.message || "Strava callback failed"}</p>`);
  }
}
