import test from 'node:test';
import assert from 'node:assert/strict';
import { checkMyWay, alertTransition, deliverAlert } from '../scripts/monitor-myway.mjs';

const healthyFetch = async url => url.includes('/api/auth-config') ? Response.json({ url: 'https://ubwzcyuptksovboyzncz.supabase.co', publishableKey: 'test-public-key' }) : url.includes('/rest/v1/') ? Response.json(['tuition','application_deadline','entry_requirement','ranking'].map(field_key => ({ field_key, status: 'verified' }))) : new Response('<title>MyWay</title>', { headers: { 'content-type': 'text/html' } });
test('monitor validates the page and actual public fact response without logging keys', async () => {
  const result = await checkMyWay(healthyFetch);
  assert.equal(result.healthy, true);
  assert.doesNotMatch(JSON.stringify(result), /test-public-key/);
});
test('monitor distinguishes access denial and rejects empty catalogue responses', async () => {
  const denied = await checkMyWay(async () => new Response('', { status: 403 }));
  assert.equal(denied.checks[0].status, 'access_denied');
  const empty = await checkMyWay(async url => url.includes('/rest/v1/') ? Response.json([]) : healthyFetch(url));
  assert.equal(empty.healthy, false);
  assert.equal(empty.checks[2].status, 'invalid_response');
});
test('monitor reports timeouts without copying exception details', async () => {
  const result = await checkMyWay(async () => { throw new DOMException('secret URL', 'TimeoutError'); });
  assert.equal(result.checks[0].status, 'timeout');
  assert.doesNotMatch(JSON.stringify(result), /secret/);
});
test('alert transitions notify failure and recovery and suppress unchanged state', () => {
  const good = { healthy: true, checks: [{ status: 'ok' }] };
  const bad = { healthy: false, checks: [{ status: 'timeout' }] };
  assert.equal(alertTransition(null,good),null);
  assert.equal(alertTransition(null,bad),'failure');
  assert.equal(alertTransition(good,bad),'failure');
  assert.equal(alertTransition(bad,bad),null);
  assert.equal(alertTransition(bad,good),'recovery');
});
test('alert delivery validates HTTPS and fails on a non-success response', async () => {
  await assert.rejects(deliverAlert('http://example.com','failure',{}),/HTTPS/);
  await assert.rejects(deliverAlert('https://example.com','failure',{},async () => new Response('',{status:500})),/delivery failed/);
  let body;
  await deliverAlert('https://example.com','recovery',{healthy:true},async (_, options) => {body=JSON.parse(options.body); return new Response('');});
  assert.equal(body.event,'recovery');
});
