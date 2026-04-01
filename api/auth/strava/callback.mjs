import { clearOauthCookie, exchangeCode, readOauth, redirect, setAuthCookie, verifyOauthState } from "../../_lib/strava.mjs";
import { upsertAthleteRecord } from "../../_lib/supabase.mjs";

export default async function handler(req, res) {
  try {
    const origin = `https://${req.headers.host}`;
    const url = new URL(req.url, origin);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const oauth = readOauth(req);
    const signedState = verifyOauthState(state);
    const cookieMatches = oauth?.state && oauth.state === state;
    if (!code || !state || (!signedState && !cookieMatches)) {
      res.statusCode = 400;
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.end("<h1>Ride Ready</h1><p>Strava sign-in failed. The callback state did not match.</p>");
      return;
    }

    const tokenPayload = await exchangeCode(code);
    const now = new Date().toISOString();
    await upsertAthleteRecord({
      athlete_id: tokenPayload.athlete.id,
      username: tokenPayload.athlete.username || "",
      firstname: tokenPayload.athlete.firstname || "",
      lastname: tokenPayload.athlete.lastname || "",
      access_token: tokenPayload.access_token,
      refresh_token: tokenPayload.refresh_token,
      expires_at: tokenPayload.expires_at,
      profile_json: tokenPayload.athlete,
      imported_bikes_json: [],
      app_state_json: null,
      last_sync_at: null,
      created_at: now,
      updated_at: now
    });
    setAuthCookie(res, { athlete_id: tokenPayload.athlete.id });
    clearOauthCookie(res);
    return redirect(res, "/");
  } catch (error) {
    res.statusCode = 500;
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.end(`<h1>Ride Ready</h1><p>${error.message || "Strava callback failed"}</p>`);
  }
}
