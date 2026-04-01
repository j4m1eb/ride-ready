import { sendJson } from "./_lib/strava.mjs";

export default async function handler(_req, res) {
  return sendJson(res, 200, { ok: true });
}
