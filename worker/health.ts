type HealthEnv = { SUPABASE_URL?: string; SUPABASE_PUBLISHABLE_KEY?: string };

/** Read-only public dependency check. Never include configuration or row data. */
export async function healthResponse(env: HealthEnv, fetcher: typeof fetch = fetch): Promise<Response> {
  const headers = { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' };
  const result = (status: string, http = 503) => Response.json({ service: 'MyWay', status }, { status: http, headers });
  if (!env.SUPABASE_URL || !env.SUPABASE_PUBLISHABLE_KEY) return result('not_configured');
  try {
    const url = new URL('/rest/v1/programme_facts', env.SUPABASE_URL);
    if (url.protocol !== 'https:') return result('not_configured');
    url.search = new URLSearchParams({ select: 'field_key,status', programme_id: 'eq.ft-school-80-primary', field_key: 'in.(tuition,application_deadline,entry_requirement,ranking)', limit: '4' }).toString();
    const response = await fetcher(url, { headers: { apikey: env.SUPABASE_PUBLISHABLE_KEY }, redirect: 'error', signal: AbortSignal.timeout(5000) });
    if (!response.ok) return result([401,403].includes(response.status) ? 'catalogue_access_denied' : 'catalogue_unavailable');
    const rows: unknown = await response.json();
    const expected = ['tuition','application_deadline','entry_requirement','ranking'];
    const valid = Array.isArray(rows) && rows.length === 4 && expected.every(key => rows.some(row => row && row.field_key === key && typeof row.status === 'string'));
    return valid ? result('ok', 200) : result('catalogue_invalid');
  } catch { return result('catalogue_unavailable'); }
}
