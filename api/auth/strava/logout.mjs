import { clearAuthCookie, clearOauthCookie, redirect } from "../../_lib/strava.mjs";

export default async function handler(_req, res) {
  clearAuthCookie(res);
  clearOauthCookie(res);
  return redirect(res, "/");
}
