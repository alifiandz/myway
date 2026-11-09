import { readFile, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

const site = 'https://alif-pathway.smalhi2025.chatgpt.site';
export async function checkMyWay(fetcher = fetch) {
  const checks = [];
  async function check(name, url, validate, headers = {}) {
    try {
      const response = await fetcher(url, { headers, redirect: 'error', signal: AbortSignal.timeout(10000) });
      if (!response.ok) {
        checks.push({ name, status: [401, 403].includes(response.status) ? 'access_denied' : 'http_error', http: response.status });
        return null;
      }
      const result = await validate(response);
      checks.push({ name, status: result ? 'ok' : 'invalid_response' });
      return result;
    } catch (error) {
      checks.push({ name, status: ['TimeoutError', 'AbortError'].includes(error.name) ? 'timeout' : 'network_or_invalid_response' });
      return null;
    }
  }
  await check('page', site, async r => /^text\/html\b/i.test(r.headers.get('content-type') ?? '') && /<title>MyWay<\/title>/i.test(await r.text()));
  const config = await check('account_config', `${site}/api/auth-config`, async r => {
    const c = await r.json();
    return c.url === 'https://ubwzcyuptksovboyzncz.supabase.co' && typeof c.publishableKey === 'string' && c.publishableKey.length > 0 ? c : null;
  });
  if (config) {
    await check('catalogue', `${config.url}/rest/v1/programme_facts?select=field_key,status&programme_id=eq.ft-school-80-primary&field_key=in.(tuition,application_deadline,entry_requirement,ranking)`, async r => {
      const rows = await r.json();
      return Array.isArray(rows) && ['tuition', 'application_deadline', 'entry_requirement', 'ranking'].every(key => rows.some(row => row.field_key === key && typeof row.status === 'string'));
    }, { apikey: config.publishableKey });
  } else checks.push({ name: 'catalogue', status: 'blocked_by_config' });
  return { site, healthy: checks.every(c => c.status === 'ok'), checks };
}

export function alertTransition(previous, current) {
  if (!previous) return current.healthy ? null : 'failure';
  if (previous.healthy && !current.healthy) return 'failure';
  if (!previous.healthy && current.healthy) return 'recovery';
  if (!current.healthy && JSON.stringify(previous.checks) !== JSON.stringify(current.checks)) return 'failure_changed';
  return null;
}

export async function deliverAlert(url, event, result, fetcher = fetch) {
  if (new URL(url).protocol !== 'https:') throw new Error('Alert destination must use HTTPS');
  const response = await fetcher(url, { method: 'POST', redirect: 'error', signal: AbortSignal.timeout(10000), headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ event, ...result }) });
  if (!response.ok) throw new Error('Alert delivery failed');
}

async function main() {
  const result = await checkMyWay();
  const statePath = process.env.MYWAY_MONITOR_STATE;
  const webhook = process.env.MYWAY_ALERT_WEBHOOK;
  let previous = null;
  if (statePath) {
    try { previous = JSON.parse(await readFile(statePath, 'utf8')); }
    catch (error) { if (error.code !== 'ENOENT') throw new Error('Monitor state could not be read'); }
  }
  if (webhook && !statePath) throw new Error('Alert delivery requires durable MYWAY_MONITOR_STATE');
  const event = alertTransition(previous, result);
  if (event && webhook) await deliverAlert(webhook, event, result);
  // Keep the prior state when delivery fails so the next scheduled run retries.
  if (statePath) await writeFile(statePath, JSON.stringify(result), { mode: 0o600 });
  console.log(JSON.stringify({ ...result, alert_delivery_configured: Boolean(webhook), event }));
  if (!result.healthy) process.exitCode = 1;
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main().catch(() => { console.error('Monitor failed; check configuration, state storage, or alert delivery.'); process.exitCode = 2; });
