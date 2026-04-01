import { clearOauthCookie, env, exchangeCode, readOauth, redirect, setAuthCookie } from "../../_lib/strava.mjs";

export default async function handler(req, res) {
  try {
    const url = new URL(req.url, env().BASE_URL);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const oauth = readOauth(req);
    if (!code || !state || !oauth || oauth.state !== state) {
      res.statusCode = 400;
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.end("<h1>Ride Ready</h1><p>Strava sign-in failed. The callback state did not match.</p>");
      return;
    }

    const tokenPayload = await exchangeCode(code);
    setAuthCookie(res, {
      athlete: tokenPayload.athlete,
      access_token: tokenPayload.access_token,
      refresh_token: tokenPayload.refresh_token,
      expires_at: tokenPayload.expires_at,
      last_sync_at: null
    });
    clearOauthCookie(res);
    return redirect(res, "/");
  } catch (error) {
    res.statusCode = 500;
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.end(`<h1>Ride Ready</h1><p>${error.message || "Strava callback failed"}</p>`);
  }
}
