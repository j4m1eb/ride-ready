const TABLE = "ride_ready_athletes";

function cfg() {
  return {
    url: process.env.SUPABASE_URL || "",
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || ""
  };
}

function ensureConfig() {
  const { url, serviceRoleKey } = cfg();
  if (!url || !serviceRoleKey) {
    throw new Error("Missing Supabase configuration. Add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
  }
  return { url, serviceRoleKey };
}

function headers() {
  const { serviceRoleKey } = ensureConfig();
  return {
    apikey: serviceRoleKey,
    Authorization: `Bearer ${serviceRoleKey}`,
    "Content-Type": "application/json"
  };
}

async function request(pathname, init = {}) {
  const { url } = ensureConfig();
  const response = await fetch(`${url}/rest/v1/${pathname}`, {
    ...init,
    headers: {
      ...headers(),
      ...(init.headers || {})
    }
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Supabase request failed (${response.status}): ${body}`);
  }
  if (response.status === 204) return null;
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

export async function getAthleteRecord(athleteId) {
  const rows = await request(`${TABLE}?athlete_id=eq.${encodeURIComponent(String(athleteId))}&select=*`);
  return rows?.[0] || null;
}

export async function upsertAthleteRecord(record) {
  const rows = await request(`${TABLE}?on_conflict=athlete_id`, {
    method: "POST",
    headers: {
      Prefer: "resolution=merge-duplicates,return=representation"
    },
    body: JSON.stringify(record)
  });
  return rows?.[0] || null;
}

export async function updateAthleteState(athleteId, state) {
  const rows = await request(`${TABLE}?athlete_id=eq.${encodeURIComponent(String(athleteId))}`, {
    method: "PATCH",
    headers: {
      Prefer: "return=representation"
    },
    body: JSON.stringify({
      app_state_json: state,
      updated_at: new Date().toISOString()
    })
  });
  return rows?.[0] || null;
}
