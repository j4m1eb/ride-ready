import { createOauthState, env, redirect, setOauthCookie } from "../_lib/strava.mjs";

export default async function handler(_req, res) {
  const { STRAVA_CLIENT_ID, STRAVA_CLIENT_SECRET, BASE_URL } = env();
  if (!STRAVA_CLIENT_ID || !STRAVA_CLIENT_SECRET) {
    res.statusCode = 500;
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.end("<h1>Ride Ready</h1><p>Add Strava env vars before connecting.</p>");
    return;
  }

  const oauthState = createOauthState();
  setOauthCookie(res, oauthState);

  const redirectUrl = new URL("https://www.strava.com/oauth/authorize");
  redirectUrl.searchParams.set("client_id", STRAVA_CLIENT_ID);
  redirectUrl.searchParams.set("response_type", "code");
  redirectUrl.searchParams.set("redirect_uri", `${BASE_URL}/auth/strava/callback`);
  redirectUrl.searchParams.set("approval_prompt", "auto");
  redirectUrl.searchParams.set("scope", "profile:read_all,activity:read_all");
  redirectUrl.searchParams.set("state", oauthState);
  return redirect(res, redirectUrl.toString());
}
